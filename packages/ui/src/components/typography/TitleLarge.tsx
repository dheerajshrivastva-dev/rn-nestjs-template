/**
 * TitleLarge Typography Component
 * Material Design 3 - Title Large (22sp)
 * Used for: Card headers, emphasized titles
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type TitleLargeProps = Omit<TextProps, 'variant'>;

/**
 * Title Large Text
 *
 * Medium-emphasis text for card headers and emphasized titles.
 * Font size: 22sp, Line height: 28
 *
 * @example
 * <TitleLarge>Quick Actions</TitleLarge>
 */
export const TitleLarge: React.FC<TitleLargeProps> = (props) => {
  return <Text variant="titleLarge" {...props} />;
};
