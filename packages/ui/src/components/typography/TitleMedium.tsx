/**
 * TitleMedium Typography Component
 * Material Design 3 - Title Medium (16sp)
 * Used for: List section headers, sub-headings
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type TitleMediumProps = Omit<TextProps, 'variant'>;

/**
 * Title Medium Text
 *
 * Medium-emphasis text for list section headers and sub-headings.
 * Font size: 16sp, Line height: 24, Font weight: 500
 *
 * @example
 * <TitleMedium>Active Clients</TitleMedium>
 */
export const TitleMedium: React.FC<TitleMediumProps> = (props) => {
  return <Text variant="titleMedium" {...props} />;
};
