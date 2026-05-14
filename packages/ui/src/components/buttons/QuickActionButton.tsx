/**
 * QuickActionButton Component
 * Material Design 3 - Quick Action Button
 * Icon-above-label button for dashboard quick actions
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, TouchableRipple } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { LabelSmall } from '../typography';

export interface QuickActionButtonProps {
  /**
   * Icon name (MaterialCommunityIcons)
   */
  icon: string;

  /**
   * Button label text
   */
  label: string;

  /**
   * On press handler
   */
  onPress: () => void;

  /**
   * Icon size
   * @default 20
   */
  iconSize?: number;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom icon color
   */
  iconColor?: string;

  /**
   * Custom background color
   */
  backgroundColor?: string;
}

/**
 * Quick Action Button
 *
 * Displays an icon above a label in a subtle container.
 * Used for dashboard quick actions and shortcuts.
 *
 * @example
 * <QuickActionButton
 *   icon="account-plus"
 *   label="Create New User"
 *   onPress={() => navigation.navigate('CreateUser')}
 * />
 */
export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onPress,
  iconSize = 20,
  disabled = false,
  iconColor,
  backgroundColor,
}) => {
  const theme = useTheme();

  const defaultIconColor = iconColor || theme.colors.primary;
  const defaultBackgroundColor =
    backgroundColor || theme.colors.surfaceVariant + '20'; // 20% opacity

  return (
    <Surface
      style={[
        styles.container,
        {
          backgroundColor: defaultBackgroundColor,
          opacity: disabled ? 0.38 : 1,
        },
      ]}
      elevation={0}
    >
      <TouchableRipple
        onPress={onPress}
        disabled={disabled}
        rippleColor={theme.colors.primary + '30'} // 30% opacity ripple
        style={styles.touchable}
        borderless={false}
      >
        <View style={styles.content}>
          <Icon name={icon} size={iconSize} color={defaultIconColor} />
          <LabelSmall style={{ color: defaultIconColor }}>
            {label}
          </LabelSmall>
        </View>
      </TouchableRipple>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden', // Required for ripple effect clipping
  },
  touchable: {
    flex: 1,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    minHeight: 72,
  },
});
