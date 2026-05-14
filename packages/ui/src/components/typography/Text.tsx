/**
 * Base Text Component
 * Material Design 3 text with variant support
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import type { MD3Typography } from '../../theme/typography';

export interface TextProps extends RNTextProps {
  /**
   * Typography variant from MD3 type scale
   * @default 'bodyMedium'
   */
  variant?: keyof MD3Typography;

  /**
   * Text color (defaults to theme.colors.onSurface)
   */
  color?: string;

  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right' | 'justify';

  /**
   * Children content
   */
  children: React.ReactNode;
}

/**
 * Text Component
 *
 * Base text component with Material Design 3 typography variants.
 * Automatically applies theme colors and typography styles.
 *
 * @example
 * <Text variant="headlineSmall">Welcome</Text>
 *
 * @example
 * <Text variant="bodyMedium" color={theme.colors.primary}>
 *   Custom color text
 * </Text>
 */
export const Text: React.FC<TextProps> = ({
  variant = 'bodyMedium',
  color,
  align,
  style,
  children,
  ...props
}) => {
  const theme = useTheme();

  const variantStyle = theme.typography[variant];
  const textColor = color || theme.colors.onSurface;

  const combinedStyle: TextStyle = {
    ...variantStyle,
    color: textColor,
    textAlign: align,
    ...(style as TextStyle),
  };

  return (
    <RNText style={combinedStyle} {...props}>
      {children}
    </RNText>
  );
};
