/**
 * IconButton Component
 * Material Design 3 - Icon Button (Icon-only action)
 * Size: 40x40dp or 48x48dp
 */

import React from 'react';
import { IconButton as PaperIconButton } from 'react-native-paper';
import type { IconButtonProps as PaperIconButtonProps } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

export interface IconButtonProps extends Omit<PaperIconButtonProps, 'iconColor'> {
  /**
   * Icon name (MaterialCommunityIcons)
   */
  icon: string;

  /**
   * On press handler
   */
  onPress?: () => void;

  /**
   * Icon color (defaults to theme.colors.onSurface)
   */
  color?: string;

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;
}

/**
 * Icon Button
 *
 * Icon-only button with optional background.
 * Standard: 40x40dp, Extended: 48x48dp
 *
 * @example
 * <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
 *
 * @example
 * <IconButton icon="dots-vertical" size="extended" />
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  color,
  disabled = false,
  ...props
}) => {
  const theme = useTheme();

  return (
    <PaperIconButton
      icon={icon}
      onPress={onPress}
      disabled={disabled}
      iconColor={color || theme.colors.onSurface}
      {...props}
    />
  );
};
