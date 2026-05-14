/**
 * Navigation Types (2026 - UserStack Architecture)
 *
 * Architecture:
 * - Root → Public / Private
 * - Private → UserStack (single stack, all roles)
 * - UserStack root → UserHome (renders role-specific bottom tabs)
 * - All detail/modal screens are siblings in UserStack
 */

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { NavigatorScreenParams } from "@react-navigation/native";
import {
  AuthScreens,
  SharedScreens,
  DashboardScreens,
  CompanyScreens,
  UserScreens,
  ClientScreens,
  DeviceScreens,
  OrderScreens,
  KeyTransferScreens,
  ReportScreens,
  SystemScreens,
  AccountScreens,
  AppReleaseScreens,
} from "./screens";

/* =====================================================
   Root Stack
   ===================================================== */
export type RootStackParamList = {
  Splash: undefined;
  Public: undefined;
  Private: NavigatorScreenParams<UserStackParamList>;
  BiometricVerification: undefined;
  PinSetup: { identifier: string };
};

/* =====================================================
   Public / Auth Stack
   ===================================================== */
export type PublicStackParamList = {
  [AuthScreens.Login]: undefined;
  [AuthScreens.OTP]: {
    message?: string;
    primaryMethod?: 'email_otp' | 'mobile_otp' | 'totp';
  };
  [AuthScreens.ForgotPassword]: undefined;
  [AuthScreens.ResetPassword]: { token: string };
  [AuthScreens.PinSetup]: { identifier: string };
  [AuthScreens.BiometricLogin]: undefined;
};

/* =====================================================
   Shared Screens
   Inherited by UserStackParamList and AccountStackParamList.
   ===================================================== */
export type SharedStackParamList = {
  [SharedScreens.Profile]: undefined;
  [SharedScreens.EditProfile]: undefined;
  [SharedScreens.Notifications]: undefined;
  [SharedScreens.NotificationDetail]: { id: string; item: import('../hooks/queries/useNotifications').NotificationItem };
  [SharedScreens.Settings]: undefined;
  [SharedScreens.ChangePassword]: undefined;

  [AccountScreens.Center]: undefined;
  [AccountScreens.EditProfile]: { userId: string };
  [AccountScreens.Security]: undefined;
  [AccountScreens.ChangePassword]: undefined;
  [AccountScreens.TwoFactor]: undefined;
  [AccountScreens.Sessions]: undefined;
};

/* =====================================================
   UserStack — unified superset for ALL roles.
   Role-specific tabs live inside UserScreens.Home (UserHome component).
   All detail/modal screens are direct children of this stack so FCM
   navigation is always:  navigate('Private', { screen, params })
   ===================================================== */
export type UserStackParamList =
  & SharedStackParamList
  & {
    // Root — renders role-specific bottom tabs
    [UserScreens.Home]: any;

    // Dashboard tab roots (used by bottom tab navigators)
    [DashboardScreens.SuperAdmin]: undefined;
    [DashboardScreens.SuperAdminHome]: undefined;
    [DashboardScreens.Super]: undefined;
    [DashboardScreens.Distributor]: undefined;
    [DashboardScreens.Retailer]: undefined;
    [DashboardScreens.RetailerHome]: undefined;

    // Companies
    [CompanyScreens.List]: undefined;
    [CompanyScreens.Detail]: { companyId: string };
    [CompanyScreens.Create]: undefined;
    [CompanyScreens.Edit]: { companyId: string };
    [CompanyScreens.Settings]: { companyId: string };

    // Users
    [UserScreens.List]: { companyId?: string } | undefined;
    [UserScreens.Detail]: { userId: string };
    [UserScreens.Dashboard]: { userId: string };
    [UserScreens.Create]: undefined;
    [UserScreens.Edit]: { userId: string };
    [UserScreens.TransferBalance]: undefined;

    // Orders
    [OrderScreens.List]: undefined;
    [OrderScreens.Detail]: { orderId: string };
    [OrderScreens.Create]: undefined;
    [OrderScreens.Balance]: undefined;
    [OrderScreens.Approve]: { orderId: string };
    [OrderScreens.Reject]: { orderId: string };

    // Key Transfers
    [KeyTransferScreens.RequestList]: undefined;
    [KeyTransferScreens.TransferList]: undefined;
    [KeyTransferScreens.Detail]: { transferId: string };
    [KeyTransferScreens.Create]: undefined;
    [KeyTransferScreens.Request]: undefined;

    // Clients
    [ClientScreens.List]: undefined;
    [ClientScreens.Detail]: { clientId: string };
    [ClientScreens.Create]: undefined;
    [ClientScreens.Edit]: { clientId: string };

    // Devices
    [DeviceScreens.Lock]: { deviceId: string };
    [DeviceScreens.Unlock]: { deviceId: string };
    [DeviceScreens.Track]: { deviceId: string };
    [DeviceScreens.History]: { deviceId: string };

    // System (SUPER_ADMIN only)
    [SystemScreens.Settings]: undefined;
    [SystemScreens.AuditLogs]: undefined;
    [SystemScreens.Health]: undefined;
    [SystemScreens.Maintenance]: undefined;

    // App Release (SUPER_ADMIN only)
    [AppReleaseScreens.List]: undefined;
    [AppReleaseScreens.Upload]: undefined;

    // Reports
    [ReportScreens.Overview]: undefined;
    [ReportScreens.Revenue]: undefined;
    [ReportScreens.Clients]: undefined;
    [ReportScreens.EMI]: undefined;
    [ReportScreens.Devices]: undefined;
    [ReportScreens.SystemWide]: undefined;
  };

/** Use this for `useNavigation()` in any authenticated screen. */
export type UserStackNavigationProp = NativeStackNavigationProp<UserStackParamList>;

/* =====================================================
   Account Center Stack
   ===================================================== */
export type AccountStackParamList = Pick<
  SharedStackParamList,
  | typeof AccountScreens.Center
  | typeof AccountScreens.EditProfile
  | typeof AccountScreens.Security
  | typeof AccountScreens.ChangePassword
  | typeof AccountScreens.TwoFactor
  | typeof AccountScreens.Sessions
  | typeof SharedScreens.Notifications
  | typeof SharedScreens.NotificationDetail
>;

export type AccountStackNavigationProp = NativeStackNavigationProp<AccountStackParamList>;

/* =====================================================
   FCM / Push Notification Types
   ===================================================== */

export type FCMNotificationType =
  | 'order_placed'
  | 'order_approved'
  | 'order_rejected'
  | 'key_transfer_received'
  | 'key_transfer_requested'
  | 'key_transfer_completed'
  | 'key_transfer_rejected'
  | 'command_ack'
  | 'system_alert'
  | 'client_payment_due'
  | 'client_payment_overdue'
  | 'client_registered'
  | 'device_locked'
  | 'device_unlocked'
  | 'company_created';

export interface NotificationData {
  clientId?: string;
  clientName?: string;
  orderId?: string;
  userId?: string;
  companyId?: string;
  transferId?: string;
  deviceId?: string;
  commandId?: string;
  commandType?: string;
  status?: string;
  [key: string]: string | undefined;
}

export interface NotificationPayload {
  type: FCMNotificationType;
  title?: string;
  body?: string;
  deepLink?: string;
  data: NotificationData;
}

export interface FCMScreenMappingEntry {
  screen: string;
  getParams: (data: NotificationData) => Record<string, unknown>;
  roles: import('../api/types').UserRole[];
}

export type FCMScreenMapping = {
  [K in FCMNotificationType]?: FCMScreenMappingEntry;
};

/* =====================================================
   Legacy aliases — migrate screen files to UserStackNavigationProp
   then remove these.
   ===================================================== */
/** @deprecated Use UserStackNavigationProp */
export type SuperAdminStackParamList = UserStackParamList;
/** @deprecated Use UserStackNavigationProp */
export type SuperStackParamList = UserStackParamList;
/** @deprecated Use UserStackNavigationProp */
export type SuperAdminNavigationProp = UserStackNavigationProp;
/** @deprecated Use UserStackNavigationProp */
export type SuperNavigationProp = UserStackNavigationProp;
/** @deprecated Use UserStackNavigationProp */
export type MainDrawerNavigationProp = UserStackNavigationProp;
/** @deprecated Use UserStackNavigationProp */
export type CompaniesStackNavigationProp = UserStackNavigationProp;
/** @deprecated Use UserStackNavigationProp */
export type UsersStackNavigationProp = UserStackNavigationProp;
