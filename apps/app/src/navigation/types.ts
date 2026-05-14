/**
 * Navigation Types
 *
 * Architecture:
 * - Root → Public / Private
 * - Private → MainStack (single stack, all roles)
 * - MainStack root → DashboardScreen (add role-specific tabs as needed)
 */

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import {
  AuthScreens,
  SharedScreens,
  AccountScreens,
  DashboardScreens,
} from './screens';

/* =====================================================
   Root Stack
   ===================================================== */
export type RootStackParamList = {
  Splash: undefined;
  Public: undefined;
  Private: NavigatorScreenParams<MainStackParamList>;
  BiometricVerification: undefined;
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
   Shared Screens — available to all authenticated users
   ===================================================== */
export type SharedStackParamList = {
  [SharedScreens.Notifications]: undefined;
  [SharedScreens.NotificationDetail]: {
    id: string;
    item: import('../hooks/queries/useNotifications').NotificationItem;
  };
  [SharedScreens.Settings]: undefined;

  [AccountScreens.Center]: undefined;
  [AccountScreens.EditProfile]: { userId: string };
  [AccountScreens.Security]: undefined;
  [AccountScreens.ChangePassword]: undefined;
  [AccountScreens.TwoFactor]: undefined;
  [AccountScreens.Sessions]: undefined;
};

/* =====================================================
   MainStack — unified stack for all authenticated screens.
   Add domain screen groups here as your app grows.
   ===================================================== */
export type MainStackParamList =
  & SharedStackParamList
  & {
    // Dashboard (role-specific tabs live here)
    [DashboardScreens.Main]: undefined;

    // TODO: Add domain screen groups here
    // e.g.
    // [ProjectScreens.List]: undefined;
    // [ProjectScreens.Detail]: { projectId: string };
  };

/** Use this for `useNavigation()` in any authenticated screen. */
export type MainStackNavigationProp = NativeStackNavigationProp<MainStackParamList>;

/* =====================================================
   Account Stack
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
  | 'system_alert';
  // TODO: Add app-specific notification types here

export interface NotificationData {
  userId?: string;
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
