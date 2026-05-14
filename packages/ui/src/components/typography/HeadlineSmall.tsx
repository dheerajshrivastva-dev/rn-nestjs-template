/**
 * HeadlineSmall Typography Component
 * Material Design 3 - Headline Small (24sp)
 * Used for: Section headers, card titles
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type HeadlineSmallProps = Omit<TextProps, 'variant'>;

/**
 * Headline Small Text
 *
 * High-emphasis text for section headers and card titles.
 * Font size: 24sp, Line height: 32
 *
 * @example
 * <HeadlineSmall>Dashboard Overview</HeadlineSmall>
 */
export const HeadlineSmall: React.FC<HeadlineSmallProps> = (props) => {
  return <Text variant="headlineSmall" {...props} />;
};
