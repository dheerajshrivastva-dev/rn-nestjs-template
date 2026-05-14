/**
 * BodyMedium Typography Component
 * Material Design 3 - Body Medium (14sp)
 * Used for: Standard body text, descriptions
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type BodyMediumProps = Omit<TextProps, 'variant'>;

/**
 * Body Medium Text
 *
 * Standard text for body content and descriptions.
 * Font size: 14sp, Line height: 20
 *
 * @example
 * <BodyMedium>Your performance summary for this month.</BodyMedium>
 */
export const BodyMedium: React.FC<BodyMediumProps> = (props) => {
  return <Text variant="bodyMedium" {...props} />;
};
