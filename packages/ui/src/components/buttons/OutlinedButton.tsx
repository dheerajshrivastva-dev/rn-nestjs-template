/**
 * OutlinedButton Component
 * Material Design 3 - Outlined Button (Tertiary action)
 * Height: 40dp, outline border
 */

import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps as PaperButtonProps } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { semanticColors } from '../../theme/colors';

export interface OutlinedButtonProps extends Omit<PaperButtonProps, 'mode'> {
  /**
   * Button label text
   */
  children: any;

  /**
   * On press handler
   */
  onPress?: () => void;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Loading state (shows spinner)
   * @default false
   */
  loading?: boolean;

  /**
   * Icon to display (MaterialCommunityIcons name)
   */
  icon?: string;

  /**
   * Variant style
   */
  variant?: 'danger' | 'success' | 'warning' | 'default';
}

/**
 * Outlined Button
 *
 * Tertiary action button with outline border.
 * Height: 40dp, fully rounded corners.
 *
 * @example
 * <OutlinedButton onPress={() => console.log('Pressed')}>
 *   Back to Dashboard
 * </OutlinedButton>
 */
export const OutlinedButton: React.FC<OutlinedButtonProps> = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
  variant,
  ...props
}) => {
  const theme = useTheme();

  // Support both spellings; `variant` takes precedence
  const resolvedVariant = variant ?? 'default';

  const variantColor: string = (() => {
    switch (resolvedVariant) {
      case 'danger':
        return theme.colors.error;
      case 'success':
        return semanticColors.success.main;
      case 'warning':
        return semanticColors.warning.main;
      default:
        return theme.colors.primary;
    }
  })();

  return (
    <PaperButton
      mode="outlined"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      textColor={variantColor}
      contentStyle={{ height: theme.componentSpacing.buttonHeight }}
      style={[
        { borderRadius: theme.componentSpacing.buttonHeight / 2, borderColor: variantColor },
        style,
      ]}
      {...props}
    >
      {children}
    </PaperButton>
  );
};
