/**
 * Custom Stack Header Component
 * Theme-aware header for React Navigation Stack screens
 * Ensures consistent appearance across all Android versions
 *
 * @see https://reactnavigation.org/docs/native-stack-navigator/#header
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks/useTheme';
import {Text} from '../typography/Text';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type {NativeStackHeaderProps} from '@react-navigation/native-stack';

export interface StackHeaderProps extends Partial<NativeStackHeaderProps> {
  /**
   * Header title
   */
  title?: string;

  /**
   * Show back button
   * @default true
   */
  showBack?: boolean;

  /**
   * Custom back button label (iOS style)
   */
  backLabel?: string;

  /**
   * Callback when back is pressed
   * If not provided, uses navigation.goBack()
   */
  onBackPress?: () => void;

  /**
   * Show close button (for modals)
   * @default false
   */
  showClose?: boolean;

  /**
   * Callback when close is pressed
   */
  onClosePress?: () => void;

  /**
   * Right side actions
   */
  actions?: React.ReactNode;

  /**
   * Header background color override
   */
  backgroundColor?: string;

  /**
   * Header text color override
   */
  textColor?: string;

  /**
   * Show shadow/elevation
   * @default true
   */
  elevated?: boolean;

  /**
   * Header alignment
   * @default 'center' on iOS, 'left' on Android
   */
  titleAlign?: 'left' | 'center';
}

/**
 * Custom Stack Header
 * Used for modal screens and other stack navigators
 * Ensures consistent theming across all Android versions
 */
export const StackHeader: React.FC<StackHeaderProps> = ({
  title,
  showBack = true,
  backLabel,
  onBackPress,
  showClose = false,
  onClosePress,
  actions,
  backgroundColor,
  textColor,
  elevated = true,
  titleAlign,
  navigation,
  options,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Determine title alignment
  const alignment =
    titleAlign || (Platform.OS === 'ios' ? 'center' : 'left');

  // Handle back press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  // Handle close press
  const handleClosePress = () => {
    if (onClosePress) {
      onClosePress();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  // Get title from options if not provided directly
  const headerTitle = title || (typeof options?.title === 'string' ? options.title : '');

  // MD3 Top App Bar: surfaceContainer background, onSurface title, onSurfaceVariant icons
  const bgColor = backgroundColor || theme.colors.surface;
  const iconColor = textColor || theme.colors.onSurfaceVariant;
  const titleColor = textColor || theme.colors.onSurface;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: bgColor,
          borderBottomColor: elevated
            ? 'transparent'
            : theme.colors.outlineVariant,
          borderBottomWidth: elevated ? 0 : StyleSheet.hairlineWidth,
        },
      ]}>
      <View style={styles.header}>
        {/* Left Side - Back or Close */}
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              accessibilityLabel="Go back"
              accessibilityRole="button">
              <Icon
                name={Platform.OS === 'ios' ? 'chevron-left' : 'arrow-left'}
                size={24}
                color={iconColor}
              />
              {backLabel && Platform.OS === 'ios' && (
                <Text
                  style={[
                    styles.backLabel,
                    {color: textColor || theme.colors.primary},
                  ]}>
                  {backLabel}
                </Text>
              )}
            </TouchableOpacity>
          )}
          {showClose && (
            <TouchableOpacity
              onPress={handleClosePress}
              style={styles.closeButton}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              accessibilityLabel="Close"
              accessibilityRole="button">
              <Icon
                name="close"
                size={24}
                color={iconColor}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title */}
        <View
          style={[
            styles.titleContainer,
            alignment === 'center' && styles.titleContainerCenter,
          ]}>
          <Text
            variant="titleLarge"
            numberOfLines={1}
            style={[
              styles.title,
              {
                color: titleColor,
                textAlign: alignment,
              },
            ]}>
            {headerTitle}
          </Text>
        </View>

        {/* Right Side - Actions */}
        <View style={styles.rightContainer}>{actions}</View>
      </View>
    </View>
  );
};

/**
 * Helper function to create screen options with custom header
 * Use this in your navigator's screenOptions or individual screen options
 */
export const createStackHeaderOptions = (
  headerProps?: Omit<StackHeaderProps, 'navigation' | 'options'>,
) => {
  return {
    headerShown: true,
    header: (props: NativeStackHeaderProps) => (
      <StackHeader {...props} {...headerProps} />
    ),
  };
};

/**
 * Header Action Button Component
 * For use in the actions prop of StackHeader
 */
export interface HeaderActionProps {
  icon?: string;
  label?: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

export const HeaderAction: React.FC<HeaderActionProps> = ({
  icon,
  label,
  onPress,
  color,
  disabled = false,
}) => {
  const theme = useTheme();
  // MD3: action icons use onSurfaceVariant; disabled uses opacity 0.38 via style
  const actionColor = color || theme.colors.onSurfaceVariant;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        disabled && styles.actionButtonDisabled,
      ]}
      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
      accessibilityRole="button"
      accessibilityLabel={label || 'Action'}>
      {icon && (
        <Icon
          name={icon}
          size={24}
          color={actionColor}
        />
      )}
      {label && (
        <Text
          variant="labelLarge"
          style={[
            styles.actionLabel,
            {color: actionColor},
          ]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 4,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backLabel: {
    // fontSize: 17 removed - use Text component default or MD3 bodyLarge (16sp)
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  titleContainerCenter: {
    alignItems: 'center',
    position: 'absolute',
    left: 48,
    right: 48,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    // fontSize: 20 removed - Text variant="titleLarge" already provides MD3 titleLarge (22sp)
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 48,
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.38,
  },
  actionLabel: {
    fontFamily: 'Inter-SemiBold',
    // fontSize: 14 removed - Text variant="labelLarge" already provides MD3 labelLarge (14sp)
    marginLeft: 4,
  },
});
