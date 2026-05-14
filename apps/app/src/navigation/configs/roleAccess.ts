/**
 * Role-Based Access Control for Screens
 *
 * Defines which roles can access which screens.
 * Add entries here when you add role-restricted screens to your app.
 *
 * Usage:
 * ```ts
 * import { canAccessScreen } from '../configs/roleAccess';
 * if (canAccessScreen(ProjectScreens.Create, userRole)) {
 *   navigation.navigate(ProjectScreens.Create);
 * }
 * ```
 */

import { UserRole } from '../../api/types';
import { AuthScreens, SharedScreens, AccountScreens, DashboardScreens } from '../screens';

const ALL_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER];

export const screenAccessMap: Record<string, UserRole[]> = {
  // Auth — all roles (only when unauthenticated)
  [AuthScreens.Login]: ALL_ROLES,
  [AuthScreens.OTP]: ALL_ROLES,
  [AuthScreens.ForgotPassword]: ALL_ROLES,
  [AuthScreens.ResetPassword]: ALL_ROLES,

  // Shared — all authenticated users
  [SharedScreens.Notifications]: ALL_ROLES,
  [SharedScreens.NotificationDetail]: ALL_ROLES,
  [SharedScreens.Settings]: ALL_ROLES,

  // Account
  [AccountScreens.Center]: ALL_ROLES,
  [AccountScreens.EditProfile]: ALL_ROLES,
  [AccountScreens.Security]: ALL_ROLES,
  [AccountScreens.ChangePassword]: ALL_ROLES,
  [AccountScreens.TwoFactor]: ALL_ROLES,
  [AccountScreens.Sessions]: ALL_ROLES,

  // Dashboard
  [DashboardScreens.Main]: ALL_ROLES,

  // TODO: Add domain screen access rules here
  // e.g.
  // [ProjectScreens.Create]: [UserRole.ADMIN, UserRole.MANAGER],
  // [ProjectScreens.List]: ALL_ROLES,
};

export function canAccessScreen(screen: string, userRole: UserRole): boolean {
  const allowedRoles = screenAccessMap[screen];
  if (!allowedRoles) {
    console.warn(`[RoleAccess] No access control defined for screen: ${screen}`);
    return false;
  }
  return allowedRoles.includes(userRole);
}

export function getAccessibleScreens(userRole: UserRole): string[] {
  return Object.entries(screenAccessMap)
    .filter(([, roles]) => roles.includes(userRole))
    .map(([screen]) => screen);
}

export const roleDisplayNames: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.USER]: 'User',
};

export function getRoleDisplayName(role: UserRole): string {
  return roleDisplayNames[role] || role;
}
