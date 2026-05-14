/**
 * Drawer Navigation Configuration
 *
 * Role-based drawer menu. Add role-specific sections as your app grows.
 *
 * Usage:
 * ```ts
 * const sections = getDrawerSections(user.role);
 * ```
 */

import { UserRole } from '../api/types';

/* =====================================================
   Types
   ===================================================== */
export type AppDrawerSection =
  | { type: 'header'; title: string }
  | { type: 'divider' }
  | { type: 'item'; label: string; icon: string; screen: string; action?: never }
  | { type: 'item'; label: string; icon: string; action: 'logout'; screen?: never };

/* =====================================================
   Public API
   ===================================================== */
export const getDrawerSections = (role: UserRole): AppDrawerSection[] => {
  switch (role) {
    case UserRole.ADMIN:
      return adminSections();
    case UserRole.MANAGER:
      return managerSections();
    case UserRole.USER:
    default:
      return userSections();
  }
};

/* =====================================================
   ADMIN
   ===================================================== */
const adminSections = (): AppDrawerSection[] => [
  { type: 'header', title: 'Admin' },
  { type: 'item', label: 'Dashboard', icon: 'view-dashboard', screen: 'dashboard/main' },

  { type: 'divider' },

  { type: 'item', label: 'Profile', icon: 'account', screen: 'account/center' },
  { type: 'item', label: 'Settings', icon: 'cog', screen: 'shared/settings' },
  { type: 'item', label: 'Logout', icon: 'logout', action: 'logout' },
];

/* =====================================================
   MANAGER
   ===================================================== */
const managerSections = (): AppDrawerSection[] => [
  { type: 'header', title: 'Manager' },
  { type: 'item', label: 'Dashboard', icon: 'view-dashboard', screen: 'dashboard/main' },

  { type: 'divider' },

  { type: 'item', label: 'Profile', icon: 'account', screen: 'account/center' },
  { type: 'item', label: 'Settings', icon: 'cog', screen: 'shared/settings' },
  { type: 'item', label: 'Logout', icon: 'logout', action: 'logout' },
];

/* =====================================================
   USER
   ===================================================== */
const userSections = (): AppDrawerSection[] => [
  { type: 'header', title: 'User' },
  { type: 'item', label: 'Dashboard', icon: 'view-dashboard', screen: 'dashboard/main' },

  { type: 'divider' },

  { type: 'item', label: 'Profile', icon: 'account', screen: 'account/center' },
  { type: 'item', label: 'Settings', icon: 'cog', screen: 'shared/settings' },
  { type: 'item', label: 'Logout', icon: 'logout', action: 'logout' },
];

/* =====================================================
   Role Display Name
   ===================================================== */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN: return 'Admin';
    case UserRole.MANAGER: return 'Manager';
    case UserRole.USER: return 'User';
    default: return 'User';
  }
};
