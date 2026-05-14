/**
 * TextButton Component
 * Material Design 3 - Text Button (Low-emphasis action)
 */

import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps as PaperButtonProps } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

export interface TextButtonProps extends Omit<PaperButtonProps, 'mode'> {
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
   * Icon to display (MaterialCommunityIcons name)
   */
  icon?: string;

  /**
   * Text color (defaults to theme.colors.tertiary)
   */
  color?: string;
}

/**
 * Text Button
 *
 * Low-emphasis action button with no background.
 * Used for: "Forgot password?", "View All", etc.
 *
 * @example
 * <TextButton onPress={() => console.log('Pressed')}>
 *   Forgot password?
 * </TextButton>
 */
export const TextButton: React.FC<TextButtonProps> = ({
  children,
  onPress,
  disabled = false,
  icon,
  color,
  ...props
}) => {
  const theme = useTheme();

  return (
    <PaperButton
      mode="text"
      onPress={onPress}
      disabled={disabled}
      icon={icon}
      textColor={color || theme.colors.tertiary}
      {...props}
    >
      {children}
    </PaperButton>
  );
};
