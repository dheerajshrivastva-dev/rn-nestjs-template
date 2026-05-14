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
}

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
  // TODO: Add app-specific notification types here
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

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  // TODO: Add app-specific audit actions here
}

// ─── Device ───────────────────────────────────────────────────────────────────

export enum DevicePlatform {
  ANDROID = 'android',
  IOS = 'ios',
}
