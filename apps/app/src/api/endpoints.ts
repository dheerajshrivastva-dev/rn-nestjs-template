/**
 * API Endpoint Constants
 * Add domain-specific endpoint groups alongside your feature modules.
 */

export const API_BASE_URL = __DEV__
  ? 'http://192.168.1.12:3000'
  : 'https://ops.bevarc.com';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  COMPLETE_2FA: '/auth/complete-2fa',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  GOOGLE: '/auth/google',
  GOOGLE_CALLBACK: '/auth/google/callback',
  BIOMETRIC_SETUP: '/auth/biometric-setup',
  BIOMETRIC_CHALLENGE: '/auth/biometric-challenge',
  BIOMETRIC_LOGIN: '/auth/biometric-login',
  BIOMETRIC_REVOKE: '/auth/biometric-revoke',
  BIOMETRIC_LIST: '/auth/biometrics',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

// ─── OTP ──────────────────────────────────────────────────────────────────────

export const OTP_ENDPOINTS = {
  VERIFY: '/otp/verify',
  RESEND: '/otp/resend',
} as const;

// ─── Users ────────────────────────────────────────────────────────────────────

export const USER_ENDPOINTS = {
  GET_ME: '/users/me',
  UPDATE_ME: '/users/me',
  GET_BY_ID: (id: string) => `/users/${id}`,
  GET_ALL: '/users',
  UPDATE: (id: string) => `/users/${id}`,
  CREATE: '/users',

  // 2FA
  GET_2FA_STATUS: '/users/me/2fa/status',
  SETUP_EMAIL_OTP_2FA: '/users/me/2fa/setup/email-otp',
  SETUP_MOBILE_OTP_2FA: '/users/me/2fa/setup/mobile-otp',
  ENABLE_EMAIL_OTP_2FA: '/users/me/2fa/enable/email-otp',
  ENABLE_MOBILE_OTP_2FA: '/users/me/2fa/enable/mobile-otp',
  DISABLE_2FA: '/users/me/2fa',

  // Sessions
  GET_SESSIONS: '/auth/sessions',
  REVOKE_SESSION: (id: string) => `/auth/sessions/${id}`,
  LOGOUT_ALL: '/auth/logout-all',

  // Password
  CHANGE_OWN_PASSWORD: '/users/me/change-password',
  UPDATE_PASSWORD: (id: string) => `/users/${id}/password`,

  // Email verification
  SEND_EMAIL_VERIFICATION: '/users/me/send-email-verification',
  VERIFY_EMAIL: '/users/me/verify-email',
} as const;

// ─── Notifications ────────────────────────────────────────────────────────────

export const NOTIFICATIONS_ENDPOINTS = {
  REGISTER_DEVICE: '/notifications/register-device',
  UNREGISTER_DEVICE: '/notifications/register-device',
  GET_ALL: '/notifications',
  GET_BY_ID: (id: string) => `/notifications/${id}`,
  MARK_READ: (id: string) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/read-all',
  UNREAD_COUNT: '/notifications/unread-count',
  PREFERENCES: '/notifications/preferences',
  USER_SETTINGS: '/notifications/user-settings',
} as const;

// ─── Audit ────────────────────────────────────────────────────────────────────

export const AUDIT_ENDPOINTS = {
  GET_ALL: '/audit/logs',
  GET_BY_ID: (id: string) => `/audit/logs/${id}`,
  HEALTH: '/audit/health',
} as const;

// ─── Upload ───────────────────────────────────────────────────────────────────

export const UPLOAD_ENDPOINTS = {
  PROFILE: '/upload/profile',
  DOCUMENT: '/upload/document',
} as const;

// ─── App Release ──────────────────────────────────────────────────────────────

export const APP_RELEASE_ENDPOINTS = {
  LATEST: '/app-release/latest',
  HISTORY: '/app-release/history',
  UPLOAD: '/app-release/upload',
  DOWNLOAD: (id: string) => `/app-release/download/${id}`,
  UPDATE_STATUS: (id: string) => `/app-release/${id}/status`,
  DOWNLOAD_LOGS: '/app-release/download-logs',
} as const;

// TODO: Add domain-specific endpoint groups here
// export const PROJECT_ENDPOINTS = { ... } as const;
