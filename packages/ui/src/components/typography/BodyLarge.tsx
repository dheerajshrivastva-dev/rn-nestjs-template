/**
 * BodyLarge Typography Component
 * Material Design 3 - Body Large (16sp)
 * Used for: Emphasized body text
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type BodyLargeProps = Omit<TextProps, 'variant'>;

/**
 * Body Large Text
 *
 * Emphasized body text for important content.
 * Font size: 16sp, Line height: 24
 *
 * @example
 * <BodyLarge>We sent a 6-digit code to your email</BodyLarge>
 */
export const BodyLarge: React.FC<BodyLargeProps> = (props) => {
  return <Text variant="bodyLarge" {...props} />;
};
