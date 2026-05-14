/**
 * API Types - Based on Duetech-service backend API
 * Cross-checked with actual backend implementation
 * Location: apps/Duetech-service/src/modules/*
 */

// ============================================================================
// Enums (from backend: apps/Duetech-service/src/common/enums/index.ts)
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = 'super_admin',  // System-wide access, can create companies
  SUPER = 'super',              // Top-level distributor for a company
  DISTRIBUTOR = 'distributor',  // Mid-level distributor
  RETAILER = 'retailer',        // End-level retailer, creates clients
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum OtpType {
  LOGIN_2FA = 'LOGIN_2FA',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PHONE_VERIFICATION = 'PHONE_VERIFICATION',
  EMERGENCY_UNLOCK = 'EMERGENCY_UNLOCK',
  PASSWORD_RESET = 'PASSWORD_RESET',
  BALANCE_TRANSFER = 'BALANCE_TRANSFER',
}

export enum OtpRecipientType {
  USER = 'user',
  CLIENT = 'client',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  NET_BANKING = 'net_banking',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
}

export enum ClientStatus {
  DEVICE_NOT_REGISTERED = 'deviceNotRegistered',
  DEVICE_VERIFIED = 'deviceVerified',
  PROTECTED = 'protected',
  NOT_PROTECTED = 'notProtected',
  LOCKED = 'locked',
  EXPIRED = 'expired',
}

export enum PermissionStatus {
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
}

export enum KeyRequestUrgency {
  URGENT = 'urgent',
  NORMAL = 'normal',
  LOW = 'low',
}

// ============================================================================
// Device Info (for session management)
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
// Authentication API (POST /auth/login, /auth/complete-2fa, /auth/refresh)
// ============================================================================

export interface LoginRequest {
  // One of these three is required (backend validates)
  userId?: string;    // User ID (e.g., ABCSUO2750126011234)
  email?: string;     // Email address
  phone?: string;     // Phone number with country code
  password: string;   // Required
  deviceInfo?: DeviceInfo;
}

// Helper type for frontend form (uses identifier)
export interface UseLoginInput {
  identifier: string; // Can be userId, email, or phone - will be parsed
  password: string;
}

export interface LoginResponse {
  accessToken?: string; // Present if 2FA disabled
  refreshToken?: string; // Present if 2FA disabled
  tempToken?: string; // Present if 2FA enabled
  twoFactorRequired?: boolean;
  primaryMethod?: 'email_otp' | 'mobile_otp' | 'totp';
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    companyId?: string | null;
  };
  message?: string;
  otpSent?: boolean;
  otp?: string; // Only in development
}

export interface Complete2FAResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

export interface RefreshTokenRequest {
  refreshToken?: string; // Optional, can use cookie instead
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

// ============================================================================
// OTP API (POST /otp/verify, /otp/resend)
// ============================================================================

export interface VerifyOTPRequest {
  code: string; // 6 digits
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
  otp?: string; // Only in development
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  tempToken: string;
  message: string;
  otp?: string; // Only in development
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
// User Entity & DTOs (NEW - matches backend User entity)
// ============================================================================

export interface User {
  id: string;
  userId: string; // Auto-generated unique ID (e.g., DLASUO275026013210)
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  companyId: string | null; // null for SUPER_ADMIN
  parentUserId: string | null; // Points to parent in hierarchy
  hierarchyLevel: number; // 0 (SUPER_ADMIN), 1 (SUPER), 2 (DISTRIBUTOR), 3 (RETAILER)
  hierarchyPath: string; // Path of ancestor IDs
  commissionPercentage: string; // decimal 0-30% as string (e.g., "14.00")
  balance: number; // decimal
  totalClients: number;
  activeClients: number;
  profilePicture: {
    url: string;
    publicId: string;
    provider: string;
    uploadedAt: string;
  } | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  // Optional fields not in API response
  googleId?: string;
  lastLoginIp?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  updatedAt?: string;
}

// UserMeResponse is now the same as User
export type UserMeResponse = User;

export interface CreateSuperRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyId: string; // Required
  commissionPercentage?: number; // 0-30%
}

export interface CreateDistributorRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyId: string; // Required
  parentUserId: string; // Required (typically SUPER)
  commissionPercentage?: number; // 0-30%
}

export interface CreateRetailerRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  companyId: string; // Required
  parentUserId: string; // Required (SUPER or DISTRIBUTOR)
  commissionPercentage?: number; // 0-30%
}

export interface UpdatePasswordRequest {
  userId: string; // Target user ID (can be self or other user if SUPER_ADMIN)
  newPassword: string; // New password (min 8 chars, complexity requirements)
  currentPassword?: string; // Required if updating own password
  logoutAllDevices?: boolean; // Optional: logout from all devices (default: false)
  reset2FA?: boolean; // Optional: disable 2FA (default: false)
  replace2FAWithMethod?: '2fa_totp' | '2fa_mobile_otp' | null; // Optional: replace with different 2FA method
  reason?: string; // Optional: reason for password update (for audit log)
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
  devicesLoggedOut?: number; // Number of sessions terminated
  twoFactorStatus?: {
    enabled: boolean;
    primaryMethod?: string;
  };
  auditLogId: string; // ID of the audit log entry
}

export interface RegisterAgentRequest {
  name: string; // 2-255 chars
  email: string; // unique, email format
  phone: string; // phone format, India
  password: string; // min 8 characters
  companyId?: string; // UUID, only for SUPER_ADMIN
}

export interface AddAdminToCompanyRequest {
  name: string; // 2-255 chars
  email: string; // unique, email format
  phone: string; // phone format, India
  password: string; // min 8 characters
  profilePicture?: { url: string; publicId: string }; // optional profile picture
}

// ============================================================================
// Company Entity & DTOs
// ============================================================================

export interface Address {
  id: string;
  street?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number; // decimal(10,8)
  longitude?: number; // decimal(11,8)
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  email: string; // unique
  phone: string;
  gst?: string; // unique, 15 chars
  pan?: string; // unique, 10 chars
  logoUrl?: string;
  address?: Address;

  // Pricing (Set by SUPER_ADMIN)
  baseKeyRate: string; // decimal(10,2) - Base price per key
  taxPercentage: string; // decimal(5,2) - Tax percentage (e.g., 18%)

  // Governance (Set by SUPER_ADMIN)
  maxCommissionCap: number; // 0–30, upper limit for all user commissions
  showKeyRatesToSuper: boolean; // whether SUPER users can see raw key rate
  maintenanceMode: boolean; // read-only system maintenance toggle

  // User counts
  totalUsers: number;
  totalDistributors: number;
  totalRetailers: number;
  totalAgents: number; // Legacy count
  activeAgents: number; // Legacy count

  // Client counts
  totalCustomers: number;
  activeCustomers: number;

  // Financial
  balance: number; // decimal
  totalRevenue: number; // decimal

  // Status
  isActive: boolean;

  // Audit
  createdBy?: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string; // 2-255 chars
  email: string; // unique
  phone: string; // phone format, India
  gst?: string; // 15 chars, valid GST format
  pan?: string; // 10 chars, valid PAN format
  logoUrl?: string; // 1-500 chars, URL
  address?: {
    street?: string; // 1-255 chars
    city: string; // 1-100 chars
    state: string; // 1-100 chars
    country: string; // 1-100 chars
    postalCode: string; // 1-20 chars
    latitude?: number;
    longitude?: number;
  };
}

export interface UpdateCompanyRequest {
  name?: string;
  email?: string;
  phone?: string;
  gst?: string;
  pan?: string;
  logoUrl?: string;
  address?: {
    street?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  };
  // Pricing (SUPER_ADMIN only)
  baseKeyRate?: number;
  taxPercentage?: number;
  // Governance (SUPER_ADMIN only)
  maxCommissionCap?: number;
  showKeyRatesToSuper?: boolean;
  maintenanceMode?: boolean;
  isActive?: boolean;
}

export interface CompanyStats {
  companyId: string;
  companyName: string;
  totalAgents: number;
  activeAgents: number;
  totalCustomers: number;
  activeCustomers: number;
  balance: number;
  totalRevenue: number;
  commissionPercentage: number;
  isActive: boolean;
}

// ============================================================================
// Dashboard & System Stats
// ============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface ActivityItem {
  id: string;
  type: 'company_created' | 'agent_created' | 'client_registered' | 'company_updated';
  description: string;
  timestamp: Date | string;
  actorName: string;
}

export interface SystemStats {
  // Client metrics
  totalClients: number;
  activeClients: number;
  protectedClients: number; // DEVICE_VERIFIED + PROTECTED

  // User metrics
  totalUsers: number;

  // Key metrics
  keysRemaining: number;    // Available keys in balance
  keysUsed: number;         // Keys consumed (= clients created)
  totalKeysOrdered: number; // Keys ordered (COMPLETED orders) in the period

  // Order / transfer metrics
  pendingOrders: number;    // SUPER_ADMIN: pending orders; others: pending key transfers
  commissionEarned: number; // SUPER_ADMIN: 0; others: commission on completed transfers in period

  // % change vs previous equivalent period (null = no comparison available)
  trends: {
    clientsGrowth: number | null;     // % change in totalClients (keys used = clients created)
    protectedGrowth: number | null;   // % change in protectedClients
    usersGrowth: number | null;       // % change in totalUsers
    keysOrderedGrowth: number | null; // % change in total keys volume ordered (sum of totalKeys across COMPLETED orders)
  };
}

// ============================================================================
// API Error Types
// ============================================================================

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
}

// ============================================================================
// Token Configuration Constants
// ============================================================================

export const TOKEN_LIFESPANS = {
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
  TEMP_TOKEN: 10 * 60 * 1000, // 10 minutes
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
} as const;

export const OTP_CONFIG = {
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN: 60 * 1000, // 1 minute
  CODE_LENGTH: 6,
} as const;

// ============================================================================
// Audit Log Types
// ============================================================================

export enum AuditLogAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // 2FA
  TWO_FA_ENABLED = 'TWO_FA_ENABLED',
  TWO_FA_DISABLED = 'TWO_FA_DISABLED',
  TWO_FA_METHOD_CHANGED = 'TWO_FA_METHOD_CHANGED',

  // Session Management
  SESSION_REVOKED = 'SESSION_REVOKED',
  ALL_SESSIONS_REVOKED = 'ALL_SESSIONS_REVOKED',

  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_ACTIVATED = 'USER_ACTIVATED',

  // Company Management
  COMPANY_CREATED = 'COMPANY_CREATED',
  COMPANY_UPDATED = 'COMPANY_UPDATED',
  COMPANY_DELETED = 'COMPANY_DELETED',

  // Security Events
  SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
}

export enum AuditLogSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface AuditLog {
  id: string;
  action: AuditLogAction;
  severity: AuditLogSeverity;
  actorId: string; // User who performed the action
  actorRole: UserRole;
  actorName: string;
  targetUserId?: string; // User affected by the action (if applicable)
  targetUserName?: string;
  targetUserRole?: UserRole;
  targetResourceType?: 'user' | 'company' | 'session' | '2fa' | 'password';
  targetResourceId?: string;
  description: string;
  metadata?: Record<string, any>; // Additional context (IP, device, etc.)
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  action?: AuditLogAction[];
  severity?: AuditLogSeverity[];
  actorId?: string;
  targetUserId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// User Creation (Hierarchical) - NEW
// ============================================================================

// Address DTO
export interface AddressDto {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

// Base user creation fields (common to all roles)
interface BaseUserCreateFields {
  name: string;
  email: string;
  phone: string;
  password?: string; // Optional - auto-generated if not provided
  suffix?: string; // 2-4 uppercase alphanumeric for userId generation
  stateIso?: string; // 2-character state code
  districtIso?: string; // 3-character district code
  commissionPercentage?: number; // 0-30
  address?: AddressDto;
  profilePicture?: { url: string; publicId: string };
}

// Create SUPER user request
export interface CreateSuperRequest extends BaseUserCreateFields {
  companyId: string; // Required for SUPER
}

// Create DISTRIBUTOR user request
export interface CreateDistributorRequest extends BaseUserCreateFields {
  parentUserId: string; // Required - must be SUPER
}

// Create RETAILER user request
export interface CreateRetailerRequest extends BaseUserCreateFields {
  parentUserId: string; // Required - can be SUPER or DISTRIBUTOR
}

// Generic create user request (for mutation hook)
export interface CreateUserRequest {
  endpoint: string; // '/users/super' | '/users/distributor' | '/users/retailer'
  payload: CreateSuperRequest | CreateDistributorRequest | CreateRetailerRequest;
  role: UserRole; // For UI display purposes
}

export interface CreateUserResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    companyId: string;
    companyName: string;
    parentUserId: string | null;
    parentUserName: string | null;
    hierarchyLevel: number; // 1, 2, or 3
    hierarchyPath: string;
    commissionPercentage: number;
    balance: number;
    status: UserStatus;
    createdAt: string;
  };
  message: string;
}

// User for dropdown selection (parent user)
export interface UserOption {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

// ============================================================================
// Order Management (SUPER_ADMIN) - NEW
// ============================================================================


export interface Order {
  id: string;

  orderId: string;

  totalKeys: number;

  ratePerKey: number;

  tax: number;

  taxPercentage: number;

  discount: number;

  totalAmount: number;

  status: OrderStatus;

  notes: string | null;

  // Payment fields
  paymentMethod?: string;

  paymentTransactionId?: string;

  user?: {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: string;
    commissionPercentage: number
  };

  company?: {
    id: string;
    name: string;
    email: string;
  };

  // Timestamps
  createdAt: string;

  updatedAt: string;

  completedAt: string | null;

  cancelledAt: string | null;

  cancellationReason?: string;
}

export interface PendingOrdersFilters {
  filter?: 'all' | 'today' | 'this_week';
  page?: number;
  limit?: number;
}

export interface PendingOrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateOrderRequest {
  totalKeys: number;
  notes?: string;
}

export interface CreateOrderResponse {
  order: Order;
  message: string;
}

export interface CreateKeyTransferRequest {
  fromUserId: string;
  toUserId: string;
  quantity: number;
  notes?: string;
}

export interface CreateKeyRequest {
  fromUserId: string;
  quantity: number;
  priority: KeyRequestUrgency
  requestReason?: string,
}

export interface CreateKeyTransferResponse {
  transfer: {
    id: string;
    fromUserId: string;
    toUserId: string;
    quantity: number;
    commissionAmount: number;
    totalAmount: number;
    status: string;
    createdAt: string;
  };
  message: string;
}

export interface ApproveOrderRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  paymentTransactionId: string;
  paymentProof?: string;
  notes?: string;
}

export enum OrderStatus {
  PENDING = 'pending',           // Order created, awaiting approval
  APPROVED = 'approved',         // Super Admin approved, awaiting payment
  PROCESSING = 'processing',     // Payment processing
  COMPLETED = 'completed',       // Order completed, keys transferred
  FAILED = 'failed',            // Order failed
  CANCELLED = 'cancelled',       // Order cancelled
  REJECTED = 'rejected',         // Super Admin rejected
  ALL=''
}

export interface ApproveOrderResponse {
  order: {
    id: string;
    orderId: string;
    status: 'completed';
    completedAt: string;
  };
  user: {
    id: string;
    name: string;
    balanceBefore: number;
    balanceAfter: number;
    keysAdded: number;
  };
  message: string;
}

export interface RejectOrderRequest {
  reason: string;
  orderId: string;
}

export interface RejectOrderResponse {
  order: {
    id: string;
    orderId: string;
    status: 'cancelled';
    cancelledAt: string;
  };
  message: string;
}

// ============================================================================
// Super Admin Dashboard - UPDATED
// ============================================================================

export interface SuperAdminDashboardStats {
  totalCompanies: number;
  companiesChange: number; // +/- for trend
  totalUsers: number; // All users across all companies
  usersChange: number;
  pendingOrders: number; // Unprocessed orders
  ordersChange: number;
  totalClients: number;
  clientsChange: number;
}

export interface UserActivityItem {
  id: string;
  type: 'user_created' | 'order_approved' | 'order_rejected';
  userName: string;
  userRole: UserRole;
  companyName: string;
  details: string; // e.g., "100 keys to TechCorp"
  timestamp: string;
  icon: string;
}

export interface SystemHealth {
  apiStatus: 'healthy' | 'degraded' | 'down';
  databaseStatus: 'healthy' | 'degraded' | 'down';
  storageUsage: number; // percentage
  activeSessions: number;
}

export interface SuperAdminDashboardResponse {
  stats: SuperAdminDashboardStats;
  pendingOrders: Order[]; // Max 3 items
  userActivity: UserActivityItem[]; // Max 5 items
  systemHealth: SystemHealth;
}

// ============================================================================
// Recent Activity Feed API (GET /reports/recent-activity)
// ============================================================================

/**
 * Activity Event Types (matches backend ActivityEventType enum)
 * Location: apps/Duetech-service/src/common/enums/index.ts
 */
export enum ActivityEventType {
  // Orders (High Priority - Actionable)
  ORDER_PENDING = 'order_pending',
  ORDER_APPROVED = 'order_approved',
  ORDER_REJECTED = 'order_rejected',
  ORDER_COMPLETED = 'order_completed',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_FAILED = 'order_failed',

  // Key Transfers (Medium Priority - Informational)
  KEY_TRANSFER_REQUESTED = 'key_transfer_requested',
  KEY_TRANSFER_COMPLETED = 'key_transfer_completed',
  KEY_TRANSFER_REJECTED = 'key_transfer_rejected',
  KEY_TRANSFER_PENDING_PAYMENT = 'key_transfer_pending_payment',

  // Users (Medium Priority - Growth Tracking)
  USER_CREATED = 'user_created',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_SUSPENDED = 'user_suspended',
  USER_ACTIVATED = 'user_activated',

  // Companies (High Priority - New Business)
  COMPANY_CREATED = 'company_created',
  COMPANY_ACTIVATED = 'company_activated',
  COMPANY_SUSPENDED = 'company_suspended',

  // Clients (Low Priority - Volume)
  CLIENT_CREATED = 'client_created',
  CLIENT_DEVICE_REGISTERED = 'client_device_registered',

  // System Health (High Priority - Alerts)
  SYSTEM_ALERT = 'system_alert',
  BALANCE_DISCREPANCY = 'balance_discrepancy',
}

/**
 * Activity Priority Levels
 */
export enum ActivityPriority {
  URGENT = 'urgent',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

/**
 * Activity Severity Levels
 */
export enum ActivitySeverity {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Single Activity Event
 */
export interface ActivityEvent {
  id: string;
  eventType: ActivityEventType;
  priority: ActivityPriority;
  severity: ActivitySeverity;
  timestamp: string;

  // Primary information
  title: string;
  description: string;

  // Entity references
  entityType: string;
  entityId: string;

  // Actor information
  actorId?: string;
  actorName?: string;
  actorRole?: UserRole;

  // Related entity information
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityName?: string;

  // Actionable items
  isActionable: boolean;
  actionUrl?: string;
  actionLabel?: string;

  // Additional metadata
  metadata?: Record<string, any>;
}

/**
 * Recent Activity Filters (Query Parameters)
 */
export interface RecentActivityFilters {
  limit?: number; // Default 50, max 100
  offset?: number; // Default 0
  eventTypes?: ActivityEventType[];
  priorities?: ActivityPriority[];
  severities?: ActivitySeverity[];
  startDate?: string; // ISO date string, default: 7 days ago
  endDate?: string; // ISO date string, default: now
  companyId?: string;
  userId?: string;
  actionableOnly?: boolean; // Show only items requiring action
}

/**
 * Recent Activity Response
 */
export interface RecentActivityResponse {
  summary: {
    totalEvents: number;
    actionableCount: number;
    timeRange: {
      start: string;
      end: string;
    };
  };
  events: ActivityEvent[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  byPriority: Record<ActivityPriority, number>;
  bySeverity: Record<ActivitySeverity, number>;
  byEventType: Record<ActivityEventType, number>;
}

// ============================================================================
// Biometric Authentication API (key-pair / signature based)
// ============================================================================

export interface BiometricSetupRequest {
  /** Unique device ID from DeviceInfo.getUniqueId() */
  deviceFingerprint: string;
  /** Human-readable device name e.g. "Samsung Galaxy S24" */
  deviceName?: string;
  /**
   * PEM-encoded RSA public key generated by react-native-biometrics.
   * The matching private key never leaves the device hardware.
   */
  publicKey: string;
}

export interface BiometricSetupResponse {
  deviceFingerprint: string;
  /** ISO date string, 90 days from now */
  expiresAt: string;
  message: string;
}

export interface BiometricChallengeRequest {
  // One of userId / email / phone required
  userId?: string;
  email?: string;
  phone?: string;
  deviceFingerprint: string;
}

export interface BiometricChallengeResponse {
  /** Random nonce the client must sign with its private key */
  challenge: string;
}

export interface BiometricLoginRequest {
  // One of userId / email / phone required
  userId?: string;
  email?: string;
  phone?: string;
  deviceFingerprint: string;
  /** The challenge returned by GET /auth/biometric-challenge */
  challenge: string;
  /** Base64-encoded RSA signature of challenge, produced by Secure Enclave / Keystore */
  signature: string;
  deviceInfo?: DeviceInfo;
}

/** Identical shape to LoginResponse */
export type BiometricLoginResponse = LoginResponse;

export interface BiometricRevokeRequest {
  deviceFingerprint: string;
}

// ============================================================================
// Notification Preferences (superset across all roles)
// Mirrors: apps/demi-service/src/modules/notification/notification-preferences.ts
// ============================================================================

export interface NotificationPreferences {
  /** Global kill-switch — false blocks ALL push for this user */
  master: boolean;
  /** order_placed, order_approved, order_rejected — SUPER_ADMIN & SUPER */
  orders: boolean;
  /** Incoming orders awaiting approval — SUPER_ADMIN only */
  pendingOrders: boolean;
  /** key_transfer_received/completed/rejected — SUPER, DISTRIBUTOR, RETAILER */
  keyTransfers: boolean;
  /** key_transfer_requested (parent must approve) — SUPER, DISTRIBUTOR */
  transferRequests: boolean;
  /** system_alert — all roles */
  systemAlerts: boolean;
  /** command_ack — RETAILER */
  clientActivity: boolean;
  /** deviceSyncWarning24h/48h, deviceGone72h — RETAILER */
  deviceAlerts: boolean;
  /** emi_reminder, emi_overdue — notifies RETAILER when their clients have EMI due/overdue */
  emiReminders: boolean;
  /** low_balance_alert — SUPER, DISTRIBUTOR, RETAILER */
  lowBalanceAlert: boolean;
}

// ============================================================================
// User Settings (operational config, superset across roles)
// Mirrors: apps/demi-service/src/modules/notification/user-settings.ts
// ============================================================================

export interface UserSettings {
  /** Alert when key balance drops to/below this. null = disabled. SUPER, DISTRIBUTOR, RETAILER. */
  lowBalanceThreshold: number | null;
  /** RETAILER only: master switch — false means devices never auto-lock for missed EMI. Default: true. */
  autoLockDeviceWhenEmiDue: boolean;
  /** RETAILER only: days after EMI due date before device locks (0–30). Default: 7. */
  lockGracePeriodDays: number;
}
