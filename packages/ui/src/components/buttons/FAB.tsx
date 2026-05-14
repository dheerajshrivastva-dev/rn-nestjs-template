/**
 * FAB Component
 * Material Design 3 - Floating Action Button
 * Size: 56x56dp, primary action
 */

import React from 'react';
import { FAB as PaperFAB } from 'react-native-paper';
import type { FABProps as PaperFABProps } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

export interface FABProps extends Omit<PaperFABProps, 'variant'> {
  /**
   * Icon name (MaterialCommunityIcons)
   */
  icon: string;

  /**
   * On press handler
   */
  onPress?: () => void;

  /**
   * Label text (makes it an Extended FAB)
   */
  label?: string;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Loading state
   * @default false
   */
  loading?: boolean;
}

/**
 * Floating Action Button
 *
 * Primary floating action button.
 * Standard: 56x56dp, Extended: with label
 *
 * @example
 * <FAB icon="plus" onPress={() => console.log('Add')} />
 *
 * @example
 * <FAB
 *   icon="account-plus"
 *   label="Add Client"
 *   onPress={() => navigation.navigate('AddClient')}
 * />
 */
export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  label,
  disabled = false,
  loading = false,
  style,
  ...props
}) => {
  const theme = useTheme();

  return (
    <PaperFAB
      icon={icon}
      label={label}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      variant={label ? 'primary' : 'surface'}
      color={theme.colors.onPrimary}
      style={[
        {
          backgroundColor: theme.colors.primary,
          position: 'absolute',
          right: theme.spacing.xl,
          bottom: theme.spacing.xl,
        },
        style,
      ]}
      {...props}
    />
  );
};
