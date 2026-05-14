/**
 * FCM / In-App Notification → Screen Mapping
 *
 * Maps every FCMNotificationType to:
 *   - the screen to navigate to
 *   - the params extractor (from NotificationData)
 *   - the roles that can receive / handle this notification type
 *
 * ⚠️ Keep FCMNotificationType in types.ts in sync with NotificationType
 *    enum in demi-service/src/common/enums/index.ts.
 *
 * Role set reference (frontend UserRole — no OWNER):
 *   SUPER_ADMIN | SUPER | DISTRIBUTOR | RETAILER
 *
 * Usage:
 *   const mapping = getFCMScreenMapping(notification.type, userRole);
 *   if (mapping) navigation.navigate(mapping.screen, mapping.getParams(notification.data));
 */

import { UserRole } from '../../api/types';
import {
  ClientScreens,
  CompanyScreens,
  DashboardScreens,
  KeyTransferScreens,
  OrderScreens,
} from '../screens';
import type { FCMScreenMapping, FCMNotificationType } from '../types';

// ─── Mapping ──────────────────────────────────────────────────────────────────

export const fcmScreenMapping: FCMScreenMapping = {

  // ── Orders ────────────────────────────────────────────────────────────────
  // order_placed → SUPER placed an order; only SUPER_ADMIN needs to action it
  order_placed: {
    screen: OrderScreens.Detail,
    getParams: (data) => ({ orderId: data.orderId }),
    roles: [UserRole.SUPER_ADMIN],
  },
  // order_approved / order_rejected → notify the SUPER who placed the order
  order_approved: {
    screen: OrderScreens.Detail,
    getParams: (data) => ({ orderId: data.orderId }),
    roles: [UserRole.SUPER],
  },
  order_rejected: {
    screen: OrderScreens.Detail,
    getParams: (data) => ({ orderId: data.orderId }),
    roles: [UserRole.SUPER],
  },

  // ── Key Transfers ─────────────────────────────────────────────────────────
  // Receiver gets a direct transfer notification
  key_transfer_received: {
    screen: KeyTransferScreens.Detail,
    getParams: (data) => ({ transferId: data.transferId }),
    roles: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  },
  // Parent (sender) is notified when downstream user requests keys
  key_transfer_requested: {
    screen: KeyTransferScreens.Detail,
    getParams: (data) => ({ transferId: data.transferId }),
    roles: [UserRole.SUPER, UserRole.DISTRIBUTOR],
  },
  // Both sender + receiver notified on completion
  key_transfer_completed: {
    screen: KeyTransferScreens.Detail,
    getParams: (data) => ({ transferId: data.transferId }),
    roles: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  },
  // Requester notified on rejection
  key_transfer_rejected: {
    screen: KeyTransferScreens.Detail,
    getParams: (data) => ({ transferId: data.transferId }),
    roles: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  },

  // ── Device Command Read Receipts ──────────────────────────────────────────
  // Retailer who issued the command gets an ACK when device executes/fails it.
  // Navigate to the client detail so they can see the updated device state.
  command_ack: {
    screen: ClientScreens.Detail,
    getParams: (data) => ({ clientId: data.clientId }),
    roles: [UserRole.RETAILER, UserRole.SUPER, UserRole.DISTRIBUTOR],
  },

  // ── System ────────────────────────────────────────────────────────────────
  // SystemScreens.Health not yet in any navigator — navigate to the SA home tab
  system_alert: {
    screen: DashboardScreens.SuperAdminHome,
    getParams: () => ({}),
    roles: [UserRole.SUPER_ADMIN],
  },

  // ── Client lifecycle (legacy / future) ───────────────────────────────────
  client_payment_due: {
    screen: ClientScreens.Detail,
    getParams: (data) => ({ clientId: data.clientId }),
    roles: [UserRole.RETAILER, UserRole.SUPER, UserRole.DISTRIBUTOR],
  },
  client_payment_overdue: {
    screen: ClientScreens.Detail,
    getParams: (data) => ({ clientId: data.clientId }),
    roles: [UserRole.RETAILER, UserRole.SUPER, UserRole.DISTRIBUTOR],
  },
  // ClientScreens.QRCode not registered — navigate to client detail instead
  client_registered: {
    screen: ClientScreens.Detail,
    getParams: (data) => ({ clientId: data.clientId }),
    roles: [UserRole.RETAILER, UserRole.SUPER, UserRole.DISTRIBUTOR],
  },
  // device_locked/unlocked — navigate to the client that owns the device
  device_locked: {
    screen: ClientScreens.Detail,
    getParams: (data) => ({ clientId: data.clientId }),
    roles: [UserRole.RETAILER, UserRole.SUPER, UserRole.DISTRIBUTOR],
  },
  device_unlocked: {
    screen: ClientScreens.Detail,
    getParams: (data) => ({ clientId: data.clientId }),
    roles: [UserRole.RETAILER, UserRole.SUPER, UserRole.DISTRIBUTOR],
  },
  company_created: {
    screen: CompanyScreens.Detail,
    getParams: (data) => ({ companyId: data.companyId }),
    roles: [UserRole.SUPER_ADMIN],
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Get screen mapping for a notification type and user role.
 * Returns undefined if the type has no mapping or the role can't handle it.
 */
export function getFCMScreenMapping(type: FCMNotificationType, userRole: UserRole) {
  const mapping = fcmScreenMapping[type];

  if (!mapping) {
    console.warn(`[FCM] No mapping found for notification type: ${type}`);
    return undefined;
  }

  if (!mapping.roles.includes(userRole)) {
    console.warn(`[FCM] Role "${userRole}" cannot handle notification type: ${type}`);
    return undefined;
  }

  return mapping;
}

/**
 * Check if a user role can handle a given notification type.
 */
export function canHandleNotification(
  type: FCMNotificationType,
  userRole: UserRole,
): boolean {
  const mapping = fcmScreenMapping[type];
  return mapping ? mapping.roles.includes(userRole) : false;
}
