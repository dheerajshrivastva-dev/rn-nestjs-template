/**
 * Deep Linking Configuration
 *
 * URL Format: forge://path?param=value
 *
 * Examples:
 * - forge://dashboard
 * - forge://notifications/detail?id=123
 *
 * IMPORTANT: Uses centralized screen names from screens.ts
 */

import { AuthScreens, SharedScreens, DashboardScreens } from '../screens';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

export const deepLinkingConfig: LinkingOptions<RootStackParamList>['config'] = {
  screens: {
    Public: {
      screens: {
        [AuthScreens.Login]: 'login',
        [AuthScreens.OTP]: 'otp',
        [AuthScreens.ForgotPassword]: 'forgot-password',
        [AuthScreens.ResetPassword]: 'reset-password',
      },
    },

    Private: {
      screens: {
        [DashboardScreens.Main]: 'dashboard',
        [SharedScreens.Notifications]: 'notifications',
        [SharedScreens.NotificationDetail]: 'notifications/detail',
        [SharedScreens.Settings]: 'settings',

        // TODO: Add domain screen deep links here
        // e.g.
        // [ProjectScreens.List]: 'projects',
        // [ProjectScreens.Detail]: 'projects/detail',
      },
    },
  },
};

export const linkingPrefixes = [
  'forge://',
  'https://app.forge.dev',
];
