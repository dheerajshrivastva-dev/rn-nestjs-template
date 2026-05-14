/**
 * FilledTonalButton Component
 * Material Design 3 - Filled Tonal Button (Secondary action)
 * Height: 40dp, secondaryContainer background
 */

import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps as PaperButtonProps } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

export interface FilledTonalButtonProps extends Omit<PaperButtonProps, 'mode'> {
  /**
   * Button label text
   */
  children: string;

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
}

/**
 * Filled Tonal Button
 *
 * Secondary action button with tonal background (secondaryContainer color).
 * Height: 40dp, fully rounded corners.
 *
 * @example
 * <FilledTonalButton onPress={() => console.log('Pressed')}>
 *   Add Another Admin
 * </FilledTonalButton>
 */
export const FilledTonalButton: React.FC<FilledTonalButtonProps> = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
  ...props
}) => {
  const theme = useTheme();

  return (
    <PaperButton
      mode="contained-tonal"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      buttonColor={theme.colors.secondaryContainer}
      textColor={theme.colors.onSecondaryContainer}
      contentStyle={{ height: theme.componentSpacing.buttonHeight }}
      style={[{ borderRadius: theme.componentSpacing.buttonHeight / 2 }, style]}
      {...props}
    >
      {children}
    </PaperButton>
  );
};
