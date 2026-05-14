/**
 * Role-Based Access Control for Screens (Updated 2026)
 * Defines which roles can access which screens
 * Updated for 4-tier hierarchy: SUPER_ADMIN → SUPER → DISTRIBUTOR → RETAILER
 *
 * Usage:
 * ```ts
 * import { canAccessScreen } from '../configs/roleAccess';
 *
 * if (canAccessScreen(ClientScreens.Create, userRole)) {
 *   navigation.navigate(ClientScreens.Create);
 * }
 * ```
 */

import { UserRole } from '../../api/types';
import {
  AuthScreens,
  SharedScreens,
  DashboardScreens,
  CompanyScreens,
  UserScreens,
  ClientScreens,
  DeviceScreens,
  OrderScreens,
  ReportScreens,
  SystemScreens,
} from '../screens';

/**
 * Screen Access Map (Updated 2026)
 * Maps screen names to allowed roles
 */
export const screenAccessMap: Record<string, UserRole[]> = {
  // Auth screens - All roles (but only when not authenticated)
  [AuthScreens.Login]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [AuthScreens.OTP]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [AuthScreens.ForgotPassword]: [
    UserRole.SUPER_ADMIN,
    UserRole.SUPER,
    UserRole.DISTRIBUTOR,
    UserRole.RETAILER,
  ],
  [AuthScreens.ResetPassword]: [
    UserRole.SUPER_ADMIN,
    UserRole.SUPER,
    UserRole.DISTRIBUTOR,
    UserRole.RETAILER,
  ],

  // Shared screens - All authenticated users
  [SharedScreens.Profile]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [SharedScreens.EditProfile]: [
    UserRole.SUPER_ADMIN,
    UserRole.SUPER,
    UserRole.DISTRIBUTOR,
    UserRole.RETAILER,
  ],
  [SharedScreens.Notifications]: [
    UserRole.SUPER_ADMIN,
    UserRole.SUPER,
    UserRole.DISTRIBUTOR,
    UserRole.RETAILER,
  ],
  [SharedScreens.NotificationDetail]: [
    UserRole.SUPER_ADMIN,
    UserRole.SUPER,
    UserRole.DISTRIBUTOR,
    UserRole.RETAILER,
  ],
  [SharedScreens.Settings]: [
    UserRole.SUPER_ADMIN,
    UserRole.SUPER,
    UserRole.DISTRIBUTOR,
    UserRole.RETAILER,
  ],
  [SharedScreens.ChangePassword]: [
    UserRole.SUPER_ADMIN,
    UserRole.SUPER,
    UserRole.DISTRIBUTOR,
    UserRole.RETAILER,
  ],

  // Dashboard screens - Role-specific
  [DashboardScreens.SuperAdmin]: [UserRole.SUPER_ADMIN],

  // Company screens - Super Admin only
  [CompanyScreens.List]: [UserRole.SUPER_ADMIN],
  [CompanyScreens.Detail]: [UserRole.SUPER_ADMIN],
  [CompanyScreens.Create]: [UserRole.SUPER_ADMIN],
  [CompanyScreens.Edit]: [UserRole.SUPER_ADMIN],
  [CompanyScreens.Settings]: [UserRole.SUPER_ADMIN],

  // User screens (New hierarchy) - Super Admin only
  [UserScreens.List]: [UserRole.SUPER_ADMIN],
  [UserScreens.Detail]: [UserRole.SUPER_ADMIN],
  [UserScreens.Create]: [UserRole.SUPER_ADMIN],
  [UserScreens.Edit]: [UserRole.SUPER_ADMIN],

  // Client screens - All roles except SUPER_ADMIN
  [ClientScreens.List]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ClientScreens.Detail]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ClientScreens.Create]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ClientScreens.Edit]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ClientScreens.QRCode]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ClientScreens.Documents]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ClientScreens.EMIHistory]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],

  // Device screens - All roles except SUPER_ADMIN
  [DeviceScreens.Lock]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [DeviceScreens.Unlock]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [DeviceScreens.Track]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [DeviceScreens.History]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [DeviceScreens.SendMessage]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],

  // Order screens - All authenticated (updated for new hierarchy)
  [OrderScreens.List]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [OrderScreens.Detail]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [OrderScreens.Create]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [OrderScreens.PurchaseKeys]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [OrderScreens.Balance]: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],

  // Report screens - Role-based
  [ReportScreens.Overview]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ReportScreens.Revenue]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ReportScreens.Clients]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ReportScreens.EMI]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ReportScreens.Devices]: [UserRole.SUPER_ADMIN, UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
  [ReportScreens.SystemWide]: [UserRole.SUPER_ADMIN],

  // System screens - Super Admin only
  [SystemScreens.Settings]: [UserRole.SUPER_ADMIN],
  [SystemScreens.AuditLogs]: [UserRole.SUPER_ADMIN],
  [SystemScreens.Health]: [UserRole.SUPER_ADMIN],
  [SystemScreens.Maintenance]: [UserRole.SUPER_ADMIN],
};

/**
 * Check if a user role can access a screen
 *
 * @param screen - Screen name from screenNames
 * @param userRole - Current user's role
 * @returns true if user can access the screen
 */
export function canAccessScreen(screen: string, userRole: UserRole): boolean {
  const allowedRoles = screenAccessMap[screen];

  if (!allowedRoles) {
    console.warn(`[RoleAccess] No access control defined for screen: ${screen}`);
    return false;
  }

  return allowedRoles.includes(userRole);
}

/**
 * Get all screens accessible by a role
 *
 * @param userRole - User's role
 * @returns Array of screen names the user can access
 */
export function getAccessibleScreens(userRole: UserRole): string[] {
  return Object.entries(screenAccessMap)
    .filter(([_, roles]) => roles.includes(userRole))
    .map(([screen]) => screen);
}

/**
 * Check if a role has access to any screen in a category
 *
 * @param category - Screen category (e.g., 'Company', 'Client')
 * @param userRole - User's role
 * @returns true if user can access at least one screen in the category
 */
export function canAccessCategory(category: string, userRole: UserRole): boolean {
  const screens = getAccessibleScreens(userRole);
  return screens.some(screen => screen.startsWith(category));
}

/**
 * Role display names for UI (Updated 2026)
 */
export const roleDisplayNames: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.SUPER]: 'Super',
  [UserRole.DISTRIBUTOR]: 'Distributor',
  [UserRole.RETAILER]: 'Retailer',
};

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  return roleDisplayNames[role] || role;
}
