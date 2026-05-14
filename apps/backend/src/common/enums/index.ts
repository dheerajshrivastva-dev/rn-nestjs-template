// ─── User & Auth ─────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
}

/**
 * Numeric authority level for each role.
 * Higher = more authority. Use this to check if actor can act on target:
 *   ROLE_AUTHORITY[actor.role] > ROLE_AUTHORITY[target.role]
 */
export const ROLE_AUTHORITY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.MANAGER]: 50,
  [UserRole.USER]: 0,
};

// ─── OTP ─────────────────────────────────────────────────────────────────────

export enum OtpType {
  LOGIN_2FA = 'login_2fa',
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_SETUP = 'two_factor_setup',
}

export enum OtpRecipientType {
  USER = 'user',
}

// ─── Notifications ────────────────────────────────────────────────────────────

export enum NotificationStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
  BOUNCED = 'bounced',
  CANCELLED = 'cancelled',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum PushNotificationType {
  GENERAL = 'general',
  SYSTEM_UPDATE = 'system_update',
  // TODO: Add app-specific push notification types here
}

export enum NotificationType {
  SYSTEM_ALERT = 'system_alert',

  // Orders
  ORDER_PLACED = 'order_placed',
  ORDER_APPROVED = 'order_approved',
  ORDER_REJECTED = 'order_rejected',

  // Key transfers
  KEY_TRANSFER_RECEIVED = 'key_transfer_received',
  KEY_TRANSFER_COMPLETED = 'key_transfer_completed',
  KEY_TRANSFER_REJECTED = 'key_transfer_rejected',
  KEY_TRANSFER_REQUESTED = 'key_transfer_requested',

  // Infrastructure health
  DB_DOWN = 'db_down',
  DB_DEGRADED = 'db_degraded',
  DB_RECOVERED = 'db_recovered',
  REDIS_DOWN = 'redis_down',
  REDIS_RECOVERED = 'redis_recovered',
  QUEUE_DEGRADED = 'queue_degraded',
  QUEUE_RECOVERED = 'queue_recovered',
  MAINTENANCE_ON = 'maintenance_on',
  MAINTENANCE_OFF = 'maintenance_off',

  // Device / client
  COMMAND_ACK = 'command_ack',
  DEVICE_SYNC_WARNING_24H = 'device_sync_warning_24h',
  DEVICE_SYNC_WARNING_48H = 'device_sync_warning_48h',
  DEVICE_GONE_72H = 'device_gone_72h',

  // EMI
  EMI_REMINDER = 'emi_reminder',
  EMI_OVERDUE = 'emi_overdue',

  // Balance
  LOW_BALANCE_ALERT = 'low_balance_alert',
}

export enum EmailType {
  OTP = 'otp',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  NOTIFICATION = 'notification',
  SECURITY_ALERT = 'security_alert',
  // TODO: Add app-specific email types here
}

export enum SmsType {
  OTP = 'otp',
  VERIFICATION = 'verification',
  ALERT = 'alert',
  // TODO: Add app-specific SMS types here
}

// ─── Audit ───────────────────────────────────────────────────────────────────
// Canonical source: src/modules/audit/entities/audit-log.entity.ts
// Re-exported here for convenience so consumers import from '@common/enums'
export { AuditAction } from '../../modules/audit/entities/audit-log.entity';

// ─── Device ───────────────────────────────────────────────────────────────────

export enum DevicePlatform {
  ANDROID = 'android',
  IOS = 'ios',
}
