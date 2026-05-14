/**
 * TabAppBar - AppBar for bottom tab navigators
 * Handles profile, notifications and profile navigation internally.
 */

import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { AppBar } from '@forge/ui';
import { useAppBarProps } from '../../hooks';
import { AccountScreens, SharedScreens } from '../screens';

interface TabAppBarProps {
  title: string;
}

export const TabAppBar: React.FC<TabAppBarProps> = ({ title }) => {
  const navigation = useNavigation<any>();
  const { profileInitials, profileImageUrl, notificationCount } = useAppBarProps();

  return (
    <AppBar
      title={title}
      showMenu={false}
      showBack={false}
      showNotifications
      notificationCount={notificationCount}
      onNotificationPress={() => navigation.navigate(SharedScreens.Notifications)}
      showSettings
      onSettingsPress={() => navigation.navigate(SharedScreens.Settings)}
      showProfile
      profileInitials={profileInitials}
      profileImageUrl={profileImageUrl}
      onProfilePress={() => {
        navigation.navigate(AccountScreens.Center);
      }}
      logoSource={require('../../../assets/logo.png')}
    />
  );
};
