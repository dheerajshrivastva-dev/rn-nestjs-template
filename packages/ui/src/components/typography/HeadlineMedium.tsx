/**
 * HeadlineMedium Typography Component
 * Material Design 3 - Headline Medium (28sp)
 * Used for: Modal titles, dialog headers
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type HeadlineMediumProps = Omit<TextProps, 'variant'>;

/**
 * Headline Medium Text
 *
 * High-emphasis text for modal titles and dialog headers.
 * Font size: 28sp, Line height: 36
 *
 * @example
 * <HeadlineMedium>Add New Client</HeadlineMedium>
 */
export const HeadlineMedium: React.FC<HeadlineMediumProps> = (props) => {
  return <Text variant="headlineMedium" {...props} />;
};
