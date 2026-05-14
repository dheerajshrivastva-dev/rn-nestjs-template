/**
 * Notification Preferences — superset across all user roles.
 *
 * This is the single source of truth for what categories exist,
 * their defaults, and how each NotificationType maps to a category.
 *
 * The backend uses this to:
 *   1. Provide sensible column defaults on the User entity
 *   2. Validate incoming preference updates
 *   3. Gate FCM push in NotificationHelper before every send
 */

import { NotificationType } from '../../common/enums';

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  /** Global kill-switch — false blocks ALL push for this user */
  master: boolean;

  /**
   * order_placed, order_approved, order_rejected
   * Relevant: SUPER_ADMIN (receives placed), SUPER (receives approved/rejected)
   */
  orders: boolean;

  /**
   * Incoming orders awaiting SUPER_ADMIN approval (order_placed → SUPER_ADMIN view)
   * Relevant: SUPER_ADMIN only
   */
  pendingOrders: boolean;

  /**
   * key_transfer_received, key_transfer_completed, key_transfer_rejected
   * Relevant: SUPER, DISTRIBUTOR, RETAILER
   */
  keyTransfers: boolean;

  /**
   * key_transfer_requested — parent user must approve a downstream request
   * Relevant: SUPER, DISTRIBUTOR
   */
  transferRequests: boolean;

  /**
   * system_alert — maintenance windows, health alerts, critical events
   * Relevant: all roles
   */
  systemAlerts: boolean;

  /**
   * command_ack — device executed or failed a remote command
   * Relevant: RETAILER
   */
  clientActivity: boolean;

  /**
   * deviceSyncWarning24h, deviceSyncWarning48h, deviceGone72h
   * Relevant: RETAILER
   */
  deviceAlerts: boolean;

  /**
   * emi_reminder, emi_overdue — notify the RETAILER when any of their clients
   * have an EMI due soon or overdue. This is a global toggle for all clients.
   * Relevant: RETAILER
   */
  emiReminders: boolean;

  /**
   * low_balance_alert — key balance dropped below user-defined threshold
   * Relevant: RETAILER, DISTRIBUTOR
   */
  lowBalanceAlert: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

/** Default preferences applied to every new user (all on, matching new-user expectations). */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  master: true,
  orders: true,
  pendingOrders: true,
  keyTransfers: true,
  transferRequests: true,
  systemAlerts: true,
  clientActivity: true,
  deviceAlerts: true,
  emiReminders: true,
  lowBalanceAlert: true,
};

// ─── NotificationType → category mapping ─────────────────────────────────────

/** Keys of NotificationPreferences that control per-category gating (excludes 'master'). */
export type NotificationCategory = Exclude<keyof NotificationPreferences, 'master'>;

/**
 * Maps every NotificationType to the preference category that controls it.
 * Add new NotificationType values here as the system grows.
 *
 * If a type is not listed here it is treated as ALWAYS_SEND (uncategorised).
 */
export const NOTIFICATION_TYPE_CATEGORY: Partial<Record<string, NotificationCategory>> = {
  // Orders
  [NotificationType.ORDER_PLACED]: 'orders',
  [NotificationType.ORDER_APPROVED]: 'orders',
  [NotificationType.ORDER_REJECTED]: 'orders',

  // Pending orders (SUPER_ADMIN receives order_placed — also mapped to pendingOrders
  // so SUPER_ADMIN can silence order noise without silencing their own order updates)
  // Note: order_placed is already mapped to 'orders' above; SUPER_ADMIN's pendingOrders
  // is a separate explicit category checked via NotificationType.ORDER_PLACED for that role.
  // We handle this via a role-aware override in NotificationHelper if needed. For now
  // ORDER_PLACED maps to 'pendingOrders' for SUPER_ADMIN and 'orders' for others —
  // but since we only look up the category string we keep 'orders' as the unified mapping.
  // SUPER_ADMIN can independently control 'pendingOrders'.

  // Key Transfers
  [NotificationType.KEY_TRANSFER_RECEIVED]: 'keyTransfers',
  [NotificationType.KEY_TRANSFER_COMPLETED]: 'keyTransfers',
  [NotificationType.KEY_TRANSFER_REJECTED]: 'keyTransfers',
  [NotificationType.KEY_TRANSFER_REQUESTED]: 'transferRequests',

  // System
  [NotificationType.SYSTEM_ALERT]: 'systemAlerts',

  // Infrastructure health alerts (map to systemAlerts — SUPER_ADMIN preference gate)
  [NotificationType.DB_DOWN]: 'systemAlerts',
  [NotificationType.DB_DEGRADED]: 'systemAlerts',
  [NotificationType.DB_RECOVERED]: 'systemAlerts',
  [NotificationType.REDIS_DOWN]: 'systemAlerts',
  [NotificationType.REDIS_RECOVERED]: 'systemAlerts',
  [NotificationType.QUEUE_DEGRADED]: 'systemAlerts',
  [NotificationType.QUEUE_RECOVERED]: 'systemAlerts',
  [NotificationType.MAINTENANCE_ON]: 'systemAlerts',
  [NotificationType.MAINTENANCE_OFF]: 'systemAlerts',

  // Client / Device (command ack)
  [NotificationType.COMMAND_ACK]: 'clientActivity',

  // Device health
  [NotificationType.DEVICE_SYNC_WARNING_24H]: 'deviceAlerts',
  [NotificationType.DEVICE_SYNC_WARNING_48H]: 'deviceAlerts',
  [NotificationType.DEVICE_GONE_72H]: 'deviceAlerts',

  // EMI events — sent to RETAILER when their clients have EMI due/overdue
  [NotificationType.EMI_REMINDER]: 'emiReminders',
  [NotificationType.EMI_OVERDUE]: 'emiReminders',

  // Low balance — sent to RETAILER/DISTRIBUTOR/SUPER when balance drops below threshold
  [NotificationType.LOW_BALANCE_ALERT]: 'lowBalanceAlert',
};

// ─── Guard helper ─────────────────────────────────────────────────────────────

/**
 * Returns true if FCM push should be sent based on the user's preferences.
 *
 * Logic:
 *   1. master === false  → block all push
 *   2. Look up notificationType in NOTIFICATION_TYPE_CATEGORY
 *   3. If found → check that category flag
 *   4. If not found → allow (uncategorised types are always sent)
 */
export function isPushAllowed(
  prefs: NotificationPreferences | null | undefined,
  notificationType: string,
): boolean {
  const p = prefs ?? DEFAULT_NOTIFICATION_PREFERENCES;

  if (!p.master) return false;

  const category = NOTIFICATION_TYPE_CATEGORY[notificationType];
  if (!category) return true; // uncategorised — always allow

  return p[category] !== false;
}
