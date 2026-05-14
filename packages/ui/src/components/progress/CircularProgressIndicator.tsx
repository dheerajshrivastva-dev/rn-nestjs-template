/**
 * CircularProgressIndicator Component
 * Circular loading spinner
 */

import React from 'react';
import { ActivityIndicator } from 'react-native-paper';
import { ViewStyle } from 'react-native';

export interface CircularProgressIndicatorProps {
  /**
   * Size of indicator
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large' | number;

  /**
   * Custom color
   */
  color?: string;

  /**
   * Whether to animate
   * @default true
   */
  animating?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * CircularProgressIndicator
 *
 * Circular loading spinner for loading states.
 * Material Design 3 styled activity indicator.
 *
 * @example
 * // Basic loading spinner
 * <CircularProgressIndicator />
 *
 * @example
 * // Large spinner with custom color
 * <CircularProgressIndicator
 *   size="large"
 *   color="#1976D2"
 * />
 *
 * @example
 * // Small inline spinner
 * <CircularProgressIndicator size="small" />
 */
export const CircularProgressIndicator: React.FC<CircularProgressIndicatorProps> = ({
  size = 'medium',
  color,
  animating = true,
  style,
}) => {
  const numericSize =
    size === 'small' ? 20 : size === 'medium' ? 40 : size === 'large' ? 60 : size;

  return (
    <ActivityIndicator
      size={numericSize}
      color={color}
      animating={animating}
      style={style}
    />
  );
};
