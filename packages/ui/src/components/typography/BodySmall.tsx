/**
 * BodySmall Typography Component
 * Material Design 3 - Body Small (12sp)
 * Used for: Supporting text, captions
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type BodySmallProps = Omit<TextProps, 'variant'>;

/**
 * Body Small Text
 *
 * Supporting text and captions.
 * Font size: 12sp, Line height: 16
 *
 * @example
 * <BodySmall color={theme.colors.onSurfaceVariant}>
 *   Last updated 2 hours ago
 * </BodySmall>
 */
export const BodySmall: React.FC<BodySmallProps> = (props) => {
  return <Text variant="bodySmall" {...props} />;
};
