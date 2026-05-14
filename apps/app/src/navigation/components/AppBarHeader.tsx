/**
 * AppBarHeader - Centralized header component for all stack navigators.
 * Provides consistent AppBar across all screens with navigation integration.
 */

import React from 'react';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AppBar } from '@forge/ui';
import { DashboardScreens, SharedScreens, AccountScreens } from '../screens';
import { useAppBarProps } from '../../hooks';

const getScreenTitle = (screenName: string): string => {
  if (screenName === DashboardScreens.Main) return 'Dashboard';

  if (screenName === SharedScreens.Settings) return 'Settings';
  if (screenName === SharedScreens.Notifications) return 'Notifications';
  if (screenName === SharedScreens.NotificationDetail) return 'Notification';

  if (screenName === AccountScreens.Center) return 'Account';
  if (screenName === AccountScreens.EditProfile) return 'Edit Profile';
  if (screenName === AccountScreens.Security) return 'Security';
  if (screenName === AccountScreens.ChangePassword) return 'Change Password';
  if (screenName === AccountScreens.TwoFactor) return 'Two-Factor Auth';
  if (screenName === AccountScreens.Sessions) return 'Active Sessions';

  // TODO: Add domain screen titles here

  // Fallback — convert last path segment from kebab-case to Title Case
  return (screenName.split('/').pop() ?? screenName)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Screen';
};

export const AppBarHeader: React.FC<NativeStackHeaderProps> = ({
  navigation,
  route,
  options,
}) => {
  const canGoBack = navigation.canGoBack();
  const title = getScreenTitle(route.name);
  const { profileInitials, profileImageUrl, notificationCount } = useAppBarProps();

  return (
    <AppBar
      title={options?.title || title}
      showMenu={!canGoBack}
      showBack={canGoBack}
      onMenuPress={() => (navigation as any).openDrawer?.()}
      onBackPress={() => navigation.goBack()}
      showNotifications
      notificationCount={notificationCount}
      onNotificationPress={() => navigation.navigate(SharedScreens.Notifications)}
      showProfile
      profileImageUrl={profileImageUrl}
      profileInitials={profileInitials}
      onProfilePress={() => navigation.navigate(AccountScreens.Center)}
      logoSource={require('../../../assets/logo.png')}
    />
  );
};

export const appBarScreenOptions = {
  header: (props: NativeStackHeaderProps) => <AppBarHeader {...props} />,
};
