/**
 * Deep Linking Configuration (2026 - UserStack Architecture)
 * Defines URL paths for deep linking into the app
 *
 * Architecture:
 * - Root → Public / Private
 * - Private → UserStack (single flat stack, all roles)
 * - UserStack root → UserHome (role-specific bottom tabs)
 *
 * URL Format: forge://path?param=value
 *
 * Examples:
 * - forge://companies/detail?companyId=123
 * - forge://orders/detail?orderId=789
 * - forge://users/dashboard?userId=456
 *
 * IMPORTANT: Uses centralized screen names from screens.ts
 */

import {
  AuthScreens,
  SharedScreens,
  DashboardScreens,
  CompanyScreens,
  UserScreens,
  ClientScreens,
  OrderScreens,
  KeyTransferScreens,
  ReportScreens,
  SystemScreens,
} from '../screens';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

/**
 * Deep Linking Configuration
 * Maps to the actual navigation structure: Root → Public/Private → UserStack → Screens
 */
export const deepLinkingConfig: LinkingOptions<RootStackParamList>['config'] = {
  screens: {
    // ============================================
    // Public Stack (Auth screens)
    // ============================================
    Public: {
      screens: {
        [AuthScreens.Login]: 'login',
        [AuthScreens.OTP]: 'otp',
        [AuthScreens.ForgotPassword]: 'forgot-password',
        [AuthScreens.ResetPassword]: 'reset-password',
      },
    },

    // ============================================
    // Private Root → UserStack (flat, all roles)
    // ============================================
    Private: {
      screens: {
        // Root
        [UserScreens.Home]: 'home',

        // Dashboards
        [DashboardScreens.SuperAdmin]: 'dashboard/super-admin',
        [DashboardScreens.Super]: 'dashboard/super',
        [DashboardScreens.Distributor]: 'dashboard/distributor',
        [DashboardScreens.Retailer]: 'dashboard/retailer',

        // Orders
        [OrderScreens.Detail]: 'orders/detail',
        [OrderScreens.Create]: 'orders/create',
        [OrderScreens.Balance]: 'orders/balance',
        [OrderScreens.Approve]: 'orders/approve',
        [OrderScreens.Reject]: 'orders/reject',

        // Key Transfers
        [KeyTransferScreens.Detail]: 'key-transfers/detail',
        [KeyTransferScreens.Create]: 'key-transfers/create',
        [KeyTransferScreens.Request]: 'key-transfers/request',

        // Companies
        [CompanyScreens.Detail]: 'companies/detail',
        [CompanyScreens.Create]: 'companies/create',
        [CompanyScreens.Edit]: 'companies/edit',
        [CompanyScreens.Settings]: 'companies/settings',

        // Users
        [UserScreens.Detail]: 'users/detail',
        [UserScreens.Dashboard]: 'users/dashboard',
        [UserScreens.Create]: 'users/create',
        [UserScreens.Edit]: 'users/edit',
        [UserScreens.TransferBalance]: 'users/transfer-balance',

        // Clients
        [ClientScreens.Detail]: 'clients/detail',
        [ClientScreens.Create]: 'clients/create',
        [ClientScreens.Edit]: 'clients/edit',

        // System (SUPER_ADMIN only)
        [SystemScreens.Settings]: 'system/settings',
        [SystemScreens.AuditLogs]: 'system/audit-logs',
        [SystemScreens.Health]: 'system/health',
        [SystemScreens.Maintenance]: 'system/maintenance',

        // Reports
        [ReportScreens.Overview]: 'reports',
        [ReportScreens.Revenue]: 'reports/revenue',
        [ReportScreens.Clients]: 'reports/clients',
        [ReportScreens.EMI]: 'reports/emi',
        [ReportScreens.Devices]: 'reports/devices',
        [ReportScreens.SystemWide]: 'reports/system-wide',

        // Shared
        [SharedScreens.Profile]: 'profile',
        [SharedScreens.EditProfile]: 'profile/edit',
        [SharedScreens.Settings]: 'settings',
        [SharedScreens.ChangePassword]: 'settings/change-password',
        [SharedScreens.Notifications]: 'notifications',
        [SharedScreens.NotificationDetail]: 'notifications/detail',
      },
    },
  },
};

/**
 * Linking prefixes for deep linking
 */
export const linkingPrefixes = [
  'forge://',
  'https://app.forge.dev',
  'https://*.forge.dev',
];
