/**
 * Screen Names Registry — Single source of truth for all screen identifiers.
 * Never use raw strings for navigation — always import from here.
 *
 * Add your domain screens below following the same pattern.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export const AuthScreens = {
  Login: 'auth/login',
  Register: 'auth/register',
  PendingApproval: 'auth/pending-approval',
  OTP: 'auth/otp',
  ForgotPassword: 'auth/forgot-password',
  ResetPassword: 'auth/reset-password',
  PinSetup: 'auth/pin-setup',
  BiometricLogin: 'auth/biometric-login',
} as const;

// ─── Shared (all roles) ───────────────────────────────────────────────────────

export const SharedScreens = {
  Notifications: 'shared/notifications',
  NotificationDetail: 'shared/notification-detail',
  Settings: 'shared/settings',
} as const;

// ─── Account ─────────────────────────────────────────────────────────────────

export const AccountScreens = {
  Center: 'account/center',
  EditProfile: 'account/edit-profile',
  ChangePassword: 'account/change-password',
  TwoFactor: 'account/two-factor',
  Sessions: 'account/sessions',
  Security: 'account/security',
} as const;

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const DashboardScreens = {
  // TODO: Add role-specific dashboard screens here
  // e.g. Admin: 'dashboard/admin', Manager: 'dashboard/manager'
  Main: 'dashboard/main',
} as const;

// ─── Users ───────────────────────────────────────────────────────────────────

export const UserScreens = {
  List: 'users/list',
  Detail: 'users/detail',
  Dashboard: 'users/dashboard',
  Create: 'users/create',
  Edit: 'users/edit',
} as const;

// ─── Union ────────────────────────────────────────────────────────────────────

export const AllScreens = {
  ...AuthScreens,
  ...SharedScreens,
  ...AccountScreens,
  ...DashboardScreens,
  ...UserScreens,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthScreenName = (typeof AuthScreens)[keyof typeof AuthScreens];
export type SharedScreenName = (typeof SharedScreens)[keyof typeof SharedScreens];
export type AccountScreenName = (typeof AccountScreens)[keyof typeof AccountScreens];
export type DashboardScreenName = (typeof DashboardScreens)[keyof typeof DashboardScreens];
export type AnyScreenName = (typeof AllScreens)[keyof typeof AllScreens];
