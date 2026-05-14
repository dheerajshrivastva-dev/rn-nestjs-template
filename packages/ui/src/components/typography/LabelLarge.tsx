/**
 * LabelLarge Typography Component
 * Material Design 3 - Label Large (14sp)
 * Used for: Button labels, tab labels
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type LabelLargeProps = Omit<TextProps, 'variant'>;

/**
 * Label Large Text
 *
 * Utility text for button labels and tab labels.
 * Font size: 14sp, Line height: 20, Font weight: 500
 *
 * @example
 * <LabelLarge>Sign In</LabelLarge>
 */
export const LabelLarge: React.FC<LabelLargeProps> = (props) => {
  return <Text variant="labelLarge" {...props} />;
};
