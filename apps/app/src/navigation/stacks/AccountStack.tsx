/**
 * AccountStack
 * Stack navigator for the Account Center tab.
 * Available to ALL roles as the "Account" bottom tab.
 *
 * Wires real screens — no placeholders for implemented features.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AccountCenterScreen from '../../screens/account/AccountCenterScreen';
import SecurityScreen from '../../screens/account/SecurityScreen';
import SessionsScreen from '../../screens/account/SessionsScreen';
import ChangePasswordScreen from '../../screens/account/ChangePasswordScreen';
import TwoFactorScreen from '../../screens/account/TwoFactorScreen';
import { NotificationsScreen } from '../../screens/notifications/NotificationsScreen';
import { NotificationDetailScreen } from '../../screens/notifications/NotificationDetailScreen';

import { AccountScreens, SharedScreens } from '../screens';
import type { AccountStackParamList } from '../types';
import { detailScreenOptions, editScreenOptions, modalScreenOptions } from '../configs';
import { EditUserScreen } from '../../screens/users';

// ─── Stack ─────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<AccountStackParamList>();



export const AccountStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: true }}>
    {/* ── Main hub ── */}
    <Stack.Screen
      name={AccountScreens.Center}
      component={AccountCenterScreen}
      options={detailScreenOptions('Account Center')}
    />

    {/* ── Profile / Edit Profile — reuses the existing self-view ProfileScreen ── */}
    <Stack.Screen
      name={AccountScreens.EditProfile}
      component={EditUserScreen}
      options={editScreenOptions('My Profile')}
    />

    {/* ── Notifications (real screens, already implemented) ── */}
    <Stack.Screen
      name={SharedScreens.Notifications}
      component={NotificationsScreen}
      options={detailScreenOptions('Notifications')}
    />
    <Stack.Screen
      name={SharedScreens.NotificationDetail}
      component={NotificationDetailScreen}
      options={detailScreenOptions('Notification')}
    />

    {/* ── Security hub ── */}
    <Stack.Screen
      name={AccountScreens.Security}
      component={SecurityScreen}
      options={detailScreenOptions('Security Settings')}
    />

    {/* ── Change Password ── */}
    <Stack.Screen
      name={AccountScreens.ChangePassword}
      component={ChangePasswordScreen}
      options={modalScreenOptions('Change Password')}
    />

    {/* ── Two-Factor Auth ── */}
    <Stack.Screen
      name={AccountScreens.TwoFactor}
      component={TwoFactorScreen}
      options={detailScreenOptions('Two-Factor Authentication')}
    />

    {/* ── Sessions ── */}
    <Stack.Screen
      name={AccountScreens.Sessions}
      component={SessionsScreen}
      options={detailScreenOptions('Active Sessions')}
    />
  </Stack.Navigator>
);
