/**
 * LabelSmall Typography Component
 * Material Design 3 - Label Small (11sp)
 * Used for: Small labels, captions, metadata
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type LabelSmallProps = Omit<TextProps, 'variant'>;

/**
 * Label Small Text
 *
 * Utility text for small labels and captions.
 * Font size: 11sp, Line height: 16, Font weight: 500
 *
 * @example
 * <LabelSmall>Optional</LabelSmall>
 */
export const LabelSmall: React.FC<LabelSmallProps> = (props) => {
  return <Text variant="labelSmall" {...props} />;
};
