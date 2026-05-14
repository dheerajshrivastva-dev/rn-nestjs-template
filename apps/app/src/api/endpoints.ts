/**
 * API Endpoint Constants
 * Based on Duetech-service backend routes
 */
import Config from 'react-native-config';

// Base API URL — set API_URL in .env (dev) or .env.production (release build)
export const API_BASE_URL = __DEV__ ? 'http://192.168.1.10:3000' : 'https://api.duetech.in'; // Default to production URL if not set

// ============================================================================
// Authentication Endpoints (prefix: /auth)
// ============================================================================

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
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

// ============================================================================
// OTP Endpoints (prefix: /otp)
// ============================================================================

export const OTP_ENDPOINTS = {
  VERIFY: '/otp/verify',
  RESEND: '/otp/resend',
} as const;

// ============================================================================
// Company Endpoints (prefix: /companies)
// ============================================================================

export const COMPANY_ENDPOINTS = {
  GET_ALL: '/companies',
  GET_ME: '/companies/me',
  GET_BY_ID: (id: string) => `/companies/${id}`,
  CREATE: '/companies',
  UPDATE: (id: string) => `/companies/${id}`,
  DELETE: (id: string) => `/companies/${id}`,
  GET_STATS: (id: string) => `/companies/${id}/stats`,
  ADD_ADMIN: (companyId: string) => `/companies/${companyId}/admins`,
} as const;

// ============================================================================
// User Endpoints (prefix: /users) - NEW
// ============================================================================

export const USER_ENDPOINTS = {
  // User creation by role
  CREATE_SUPER: '/users/super',
  CREATE_DISTRIBUTOR: '/users/distributor',
  CREATE_RETAILER: '/users/retailer',
  CREATE_SUPER_ADMIN: '/users/super-admin',

  // User management
  GET_ALL: '/users',
  GET_ME: '/users/me',
  GET_BY_ID: (userId: string) => `/users/${userId}`,
  UPDATE: (userId: string) => `/users/${userId}`,
  DELETE: (userId: string) => `/users/${userId}`,

  // 2FA management
  GET_2FA_STATUS: '/users/me/2fa/status',
  SETUP_EMAIL_OTP_2FA: '/users/me/2fa/setup/email-otp',
  SETUP_MOBILE_OTP_2FA: '/users/me/2fa/setup/mobile-otp',
  ENABLE_EMAIL_OTP_2FA: '/users/me/2fa/enable/email-otp',
  ENABLE_MOBILE_OTP_2FA: '/users/me/2fa/enable/mobile-otp',
  DISABLE_2FA: '/users/me/2fa',

  // Session management
  GET_SESSIONS: '/auth/sessions',
  REVOKE_SESSION: (sessionId: string) => `/auth/sessions/${sessionId}`,
  LOGOUT_ALL: '/auth/logout-all',

  // Password management
  UPDATE_PASSWORD: '/users/update-password',
  CHANGE_OWN_PASSWORD: '/users/me/change-password',

  // Email verification
  SEND_EMAIL_VERIFICATION: '/users/me/send-email-verification',
  VERIFY_EMAIL: '/users/me/verify-email',
} as const;

// ============================================================================
// Future Endpoints (Stubs in backend)
// ============================================================================

export const TRANSACTIONS_ENDPOINTS = {
  BASE: '/transactions',
} as const;

export const CLIENTS_ENDPOINTS = {
  BASE: '/clients',
  GET_ALL: '/clients',
  GET_BY_ID: (id: string) => `/clients/${id}`,
  CREATE: '/clients',
  UPDATE: (id: string) => `/clients/${id}`,
  DELETE: (id: string) => `/clients/${id}`,
  QR_CODE: (id: string) => `/clients/${id}/qr-code`,
  LOCK: (id: string) => `/clients/${id}/lock`,
  UNLOCK: (id: string) => `/clients/${id}/unlock`,
  STOLEN_STATUS: (id: string, stolen: boolean) => `/clients/${id}/stolen-status?stolen=${stolen}`,
  REQUEST_LOCATION: (id: string) => `/clients/${id}/request-location`,
  LOCATIONS: (id: string) => `/clients/${id}/locations`,
  LATEST_LOCATION: (id: string) => `/clients/${id}/locations?latest=true`,
  ACTIVITY: (id: string) => `/clients/${id}/activity`,
  SEND_MESSAGE: (id: string) => `/clients/${id}/send-message`,
  MANAGE_APPS: (id: string, action: 'block' | 'unblock') => `/clients/${id}/apps?action=${action}`,
  BLOCKED_APPS: (id: string) => `/clients/${id}/blocked-apps`,
  CAMERA: (id: string, enabled: boolean) => `/clients/${id}/camera?enabled=${enabled}`,
  PLAY_SOUND: (id: string) => `/clients/${id}/play-sound`,
  RESTRICTIONS: (id: string) => `/clients/${id}/restrictions`,
  UNLOCK_REQUEST_OTP: (id: string) => `/clients/${id}/unlock/request-otp`,
  FACTORY_RESET: (id: string) => `/clients/${id}/factory-reset`,
  UNENROLL_REQUEST_OTP: (id: string) => `/clients/${id}/unenroll/request-otp`,
  UNENROLL: (id: string) => `/clients/${id}/unenroll`,
  DEBUG_HUD: (id: string, enabled: boolean) => `/clients/${id}/debug-hud?enabled=${enabled}`,
  COMMANDS: (id: string) => `/clients/${id}/commands`,
  EMIS: (clientId: string) => `/clients/${clientId}/emis`,
  EMI_MARK_PAID: (clientId: string, emiId: string) => `/clients/${clientId}/emis/${emiId}/mark-paid`,
  AGREEMENT: (clientId: string) => `/clients/${clientId}/agreement`,
  AGREEMENT_SIGN: (clientId: string) => `/clients/${clientId}/agreement/sign`,
  AGREEMENT_TEMPLATE: `/agreements/template`,
} as const;

export const BALANCE_SHEET_ENDPOINTS = {
  BASE: '/balance-sheets',
  SUMMARY: '/balance-sheets/summary',
  GET_BY_ID: (id: string) => `/balance-sheets/${id}`,
} as const;

export const KEY_TRANSFER_ENDPOINTS = {
  BASE: '/key-transfers',
  CREATE: '/key-transfers',
  REQUEST: '/key-transfers/request',
  PENDING: '/key-transfers/pending',
  COMPLETE: (id: string) => `/key-transfers/${id}/complete`,
  REJECT: (id: string) => `/key-transfers/${id}/reject`,
  CANCEL: (id: string) => `/key-transfers/${id}/cancel`,
  GET_BY_ID: (id: string) => `/key-transfers/${id}`,
} as const;

export const DEVICES_ENDPOINTS = {
  BASE: '/devices',
} as const;

export const NOTIFICATIONS_ENDPOINTS = {
  BASE: '/notifications',
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

export const LOCATIONS_ENDPOINTS = {
  BASE: '/locations',
} as const;

export const AUDIT_ENDPOINTS = {
  BASE: '/audit',
  GET_ALL: '/audit/logs',
  GET_BY_ID: (id: string) => `/audit/logs/${id}`,
  GET_BY_USER: (userId: string) => `/audit/logs/user/${userId}`,
  GET_BY_ACTION: (action: string) => `/audit/logs/action/${action}`,
  HEALTH: '/audit/health',
} as const;

export const ORDERS_ENDPOINTS = {
  BASE: '/orders',
  GET_ALL: '/orders',
  CREATE: '/orders',
  GET_BY_ID: (id: string) => `/orders/${id}`,
  APPROVE: (id: string) => `/orders/${id}/approve`,
  CANCEL: (id: string) => `/orders/${id}/cancel`,
} as const;

export const REPORTS_ENDPOINTS = {
  BASE: '/reports',
  RECENT_ACTIVITY: '/reports/recent-activity',
} as const;

// ============================================================================
// Upload Endpoints (prefix: /upload)
// ============================================================================

export const UPLOAD_ENDPOINTS = {
  PROFILE: '/upload/profile',
  DOCUMENT: '/upload/document',
} as const;

// ============================================================================
// App Release Endpoints (prefix: /app-release)
// ============================================================================

export const APP_RELEASE_ENDPOINTS = {
  LATEST:        '/app-release/latest',
  HISTORY:       '/app-release/history',
  UPLOAD:        '/app-release/upload',
  DOWNLOAD:      (id: string) => `/app-release/download/${id}`,
  UPDATE_STATUS: (id: string) => `/app-release/${id}/status`,
  DOWNLOAD_LOGS: '/app-release/download-logs',
} as const;


