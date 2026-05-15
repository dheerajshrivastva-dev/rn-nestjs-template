/**
 * API Types — mirrors the backend's common enums and shared DTOs.
 * Add domain-specific types alongside your feature modules.
 */

// ============================================================================
// Enums
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SUPER = 'super',
  ADMIN = 'admin',
  MANAGER = 'manager',
  DISTRIBUTOR = 'distributor',
  RETAILER = 'retailer',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum OtpType {
  LOGIN_2FA = 'login_2fa',
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR_SETUP = 'two_factor_setup',
}

// ============================================================================
// Device Info
// ============================================================================

export interface DeviceInfo {
  ipAddress?: string;
  deviceName?: string;
  deviceType?: string;
  deviceFingerprint?: string;
  userAgent?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================================================
// Authentication
// ============================================================================

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AccountExistsError {
  code: 'ACCOUNT_EXISTS';
  field: 'email' | 'phone';
  message: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole;
    status: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: DeviceInfo;
}

export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  tempToken?: string;
  twoFactorRequired?: boolean;
  primaryMethod?: 'email_otp' | 'mobile_otp' | 'totp';
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
  message?: string;
  otpSent?: boolean;
  otp?: string; // dev only
}

export interface Complete2FAResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

// ============================================================================
// OTP
// ============================================================================

export interface VerifyOTPRequest {
  code: string;
  tempToken: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  otpId: string;
  recipientId: string;
  otpType: OtpType;
}

export interface ResendOTPRequest {
  tempToken: string;
}

export interface ResendOTPResponse {
  success: boolean;
  message: string;
  otpId: string;
  expiresAt: string;
  otp?: string; // dev only
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  tempToken: string;
  message: string;
  otp?: string; // dev only
}

export interface ResetPasswordRequest {
  otp: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  success: boolean;
}

// ============================================================================
// User
// ============================================================================

export interface User {
  id: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string | null;
  profilePicture?: { url: string; publicId: string } | null;
  companyId?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  is2FAEnabled: boolean;
  twoFactorEnabled: boolean;
  totalClients?: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserMeResponse = User;

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePasswordRequest {
  userId?: string;
  newPassword: string;
  currentPassword?: string;
  logoutAllDevices?: boolean;
  reset2FA?: boolean;
  replace2FAWithMethod?: string | null;
  reason?: string;
}
export interface UpdatePasswordResponse {
  message: string;
  success: boolean;
  devicesLoggedOut?: number;
  twoFactorStatus?: { enabled: boolean };
}

export type UseLoginInput = Pick<LoginRequest, 'password'> & { identifier: string };

export interface UserSettings {
  lowBalanceThreshold?: number;
  autoLockDeviceWhenEmiDue?: boolean;
  lockGracePeriodDays?: number;
  notificationsEnabled?: boolean;
  biometricEnabled?: boolean;
}

export interface Company {
  id: string;
  name: string;
  status: string;
  baseKeyRate?: number;
  taxPercentage?: number;
  [key: string]: unknown;
}

// ============================================================================
// Biometric Authentication
// ============================================================================

export interface BiometricSetupRequest {
  deviceFingerprint: string;
  deviceName?: string;
  publicKey: string;
}

export interface BiometricSetupResponse {
  deviceFingerprint: string;
  expiresAt: string;
  message: string;
}

export interface BiometricChallengeRequest {
  email?: string;
  deviceFingerprint: string;
}

export interface BiometricChallengeResponse {
  challenge: string;
}

export interface BiometricLoginRequest {
  email?: string;
  deviceFingerprint: string;
  challenge: string;
  signature: string;
  deviceInfo?: DeviceInfo;
}

export type BiometricLoginResponse = LoginResponse;

// ============================================================================
// Notification Preferences
// ============================================================================

export interface NotificationPreferences {
  master: boolean;
  systemAlerts: boolean;
  [key: string]: boolean | undefined;
}

// ============================================================================
// Errors & Constants
// ============================================================================

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
}

export const TOKEN_LIFESPANS = {
  ACCESS_TOKEN: 15 * 60 * 1000,
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000,
  TEMP_TOKEN: 10 * 60 * 1000,
  OTP_EXPIRY: 10 * 60 * 1000,
} as const;

export const OTP_CONFIG = {
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN: 60 * 1000,
  CODE_LENGTH: 6,
} as const;
