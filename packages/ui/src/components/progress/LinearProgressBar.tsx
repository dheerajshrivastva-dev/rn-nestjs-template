/**
 * LinearProgressBar Component
 * Horizontal progress bar
 */

import React from 'react';
import { ProgressBar as PaperProgressBar } from 'react-native-paper';
import { ViewStyle } from 'react-native';

export interface LinearProgressBarProps {
  /**
   * Progress value (0 to 1)
   */
  progress: number;

  /**
   * Custom color
   */
  color?: string;

  /**
   * Whether progress is indeterminate
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * LinearProgressBar
 *
 * Horizontal progress bar for showing completion percentage.
 * Supports determinate and indeterminate modes.
 *
 * @example
 * // Basic progress bar
 * <LinearProgressBar progress={0.5} />
 *
 * @example
 * // EMI progress indicator
 * <LinearProgressBar
 *   progress={paidEMIs / totalEMIs}
 *   color="#4CAF50"
 * />
 *
 * @example
 * // Indeterminate loading
 * <LinearProgressBar indeterminate />
 */
export const LinearProgressBar: React.FC<LinearProgressBarProps> = ({
  progress,
  color,
  indeterminate = false,
  style,
}) => {
  return (
    <PaperProgressBar
      progress={progress}
      color={color}
      indeterminate={indeterminate}
      style={style}
    />
  );
};
