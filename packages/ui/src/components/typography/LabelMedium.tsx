/**
 * LabelMedium Typography Component
 * Material Design 3 - Label Medium (12sp)
 * Used for: Field labels, chip labels
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type LabelMediumProps = Omit<TextProps, 'variant'>;

/**
 * Label Medium Text
 *
 * Utility text for field labels and chip labels.
 * Font size: 12sp, Line height: 16, Font weight: 500
 *
 * @example
 * <LabelMedium>Email Address</LabelMedium>
 */
export const LabelMedium: React.FC<LabelMediumProps> = (props) => {
  return <Text variant="labelMedium" {...props} />;
};
