/**
 * MD3 Top App Bar Component
 * Material Design 3 compliant app bar with menu, notifications, and profile
 *
 * @see https://m3.material.io/components/top-app-bar/overview
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity, Platform, StatusBar, Image} from 'react-native';
import {Appbar, Badge, Avatar} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks/useTheme';

export interface AppBarProps {
  /**
   * App bar title text
   */
  title: string;

  /**
   * Subtitle text (optional)
   */
  subtitle?: string;

  /**
   * Show menu/hamburger icon on the left
   * @default true
   */
  showMenu?: boolean;

  /**
   * Callback when menu icon is pressed
   */
  onMenuPress?: () => void;

  /**
   * Show back button instead of menu
   * @default false
   */
  showBack?: boolean;

  /**
   * Callback when back button is pressed
   */
  onBackPress?: () => void;

  /**
   * Show notification icon
   * @default true
   */
  showNotifications?: boolean;

  /**
   * Number of unread notifications
   */
  notificationCount?: number;

  /**
   * Callback when notification icon is pressed
   */
  onNotificationPress?: () => void;

  /**
   * Show settings icon
   * @default false
   */
  showSettings?: boolean;

  /**
   * Callback when settings icon is pressed
   */
  onSettingsPress?: () => void;

  /**
   * Show profile avatar
   * @default true
   */
  showProfile?: boolean;

  /**
   * Profile image URL
   */
  profileImageUrl?: string | null;

  /**
   * Profile initials (if no image)
   */
  profileInitials?: string;

  /**
   * Callback when profile avatar is pressed
   */
  onProfilePress?: () => void;

  /**
   * Logo image source. Defaults to the built-in Demigod logo.
   * Pass a require()/uri source to override per-app.
   */
  logoSource?: React.ComponentProps<typeof Image>['source'];

  /**
   * Custom actions to render
   */
  actions?: React.ReactNode;

  /**
   * App bar variant
   * @default 'small'
   */
  variant?: 'small' | 'medium' | 'large';

  /**
   * Elevated style (has shadow)
   * @default true
   */
  elevated?: boolean;
}

/**
 * MD3 Top App Bar
 * Handles safe area, status bar, and Material Design 3 styling automatically
 */
export const AppBar: React.FC<AppBarProps> = ({
  title,
  subtitle,
  showMenu = true,
  onMenuPress,
  showBack = false,
  onBackPress,
  showNotifications = true,
  notificationCount = 0,
  onNotificationPress,
  showSettings = false,
  onSettingsPress,
  showProfile = true,
  profileImageUrl,
  profileInitials,
  onProfilePress,
  logoSource,
  actions,
  variant = 'small',
  elevated = true,
}) => {
  if (__DEV__ && showBack && showMenu) {
    console.warn("AppBar: showBack and showMenu should not both be true");
  }

  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Calculate height based on variant
  const getBarHeight = () => {
    switch (variant) {
      case 'medium':
        return 112;
      case 'large':
        return 152;
      default:
        return 48;
    }
  };

  const barHeight = getBarHeight();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: theme.colors.surface,
          borderBottomColor: elevated ? 'transparent' : theme.colors.outlineVariant,
          borderBottomWidth: elevated ? 0 : StyleSheet.hairlineWidth,
          ...(!elevated
            ? {}
            : {
                shadowColor: theme.colors.shadow,
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: 0.12,
                shadowRadius: 4,
                elevation: 0,
              }),
        },
      ]}>
      {/* Status Bar Spacer - handled by paddingTop */}
      <Appbar.Header
        style={[
          styles.header,
          {
            backgroundColor: 'transparent',
            height: barHeight,
          },
        ]}
        statusBarHeight={0} // We handle safe area ourselves
        elevated={false} // We handle elevation ourselves
      >
        {/* Leading Icon - Menu or Back */}
        {logoSource && <Image
          source={logoSource}
          style={styles.logoImage}
          resizeMode="contain"
        />}
        {showBack ? (
          <Appbar.BackAction onPress={onBackPress} color={theme.colors.onSurface} />
        ) : showMenu ? (
          <Appbar.Action
            icon="menu"
            onPress={onMenuPress}
            color={theme.colors.onSurface}
            accessibilityLabel="Open menu"
          />
        ) : null}

        {/* Title and Subtitle */}
        <Appbar.Content
          title={title}
          titleStyle={{
            fontFamily: 'Inter-SemiBold',
            // fontSize removed - uses theme typography based on variant
            color: theme.colors.onSurface,
          }}
          subtitle={subtitle}
          subtitleStyle={{
            fontFamily: 'Inter-Regular',
            // fontSize: 14 removed - uses MD3 bodyMedium (14sp)
            color: theme.colors.onSurfaceVariant,
          }}
        />

        {/* Trailing Actions */}
        {actions}

        {/* Notifications */}
        {showNotifications && (
          <View style={styles.iconContainer}>
            <Appbar.Action
              icon="bell-outline"
              onPress={onNotificationPress}
              color={theme.colors.onSurfaceVariant}
              accessibilityLabel="Notifications"
            />
            {notificationCount > 0 && (
              <Badge
                style={[
                  styles.badge,
                  {
                    backgroundColor: theme.colors.error,
                  },
                ]}
                size={16}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </View>
        )}

        {/* Settings */}
        {showSettings && (
          <Appbar.Action
            icon="cog-outline"
            onPress={onSettingsPress}
            color={theme.colors.onSurfaceVariant}
            accessibilityLabel="Settings"
          />
        )}

        {/* Profile Avatar */}
        {showProfile && (
          <TouchableOpacity
            onPress={onProfilePress}
            style={styles.profileButton}
            accessibilityLabel="Profile"
            accessibilityRole="button">
            {profileImageUrl ? (
              <Image
                source={{uri: profileImageUrl}}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                label={profileInitials || 'U'}
                size={40}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: theme.colors.primaryContainer,
                    paddingBottom: 0
                  },
                ]}
                labelStyle={{
                  color: theme.colors.onPrimaryContainer,
                }}
              />
            )}
          </TouchableOpacity>
        )}
      </Appbar.Header>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    paddingHorizontal: 4,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
  },
  profileButton: {
    marginLeft: 8,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  logoImage: {
    width: 40,
    height: 40,
    marginLeft: 12,
    marginRight: 8,
  },
});
