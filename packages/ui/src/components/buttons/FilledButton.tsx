/**
 * FilledButton Component
 * Material Design 3 - Filled Button (Primary action)
 * Height: 40dp, fully rounded
 */

import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps as PaperButtonProps } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

export interface FilledButtonProps extends Omit<PaperButtonProps, 'mode'> {
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
 * Filled Button
 *
 * Primary action button with filled background.
 * Height: 40dp, fully rounded corners.
 *
 * @example
 * <FilledButton onPress={() => console.log('Pressed')}>
 *   Sign In
 * </FilledButton>
 *
 * @example
 * <FilledButton icon="login" loading={isLoading} onPress={handleLogin}>
 *   Sign In
 * </FilledButton>
 */
export const FilledButton: React.FC<FilledButtonProps> = ({
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
      mode="contained"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      buttonColor={theme.colors.primary}
      textColor={theme.colors.onPrimary}
      contentStyle={{ height: theme.componentSpacing.buttonHeight }}
      style={[{ borderRadius: theme.componentSpacing.buttonHeight / 2 }, style]}
      {...props}
    >
      {children}
    </PaperButton>
  );
};
