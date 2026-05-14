/**
 * DisplaySmall Typography Component
 * Material Design 3 - Display Small (36sp)
 * Used for: Main titles, headers
 */

import React from 'react';
import { Text, TextProps } from './Text';

export type DisplaySmallProps = Omit<TextProps, 'variant'>;

/**
 * Display Small Text
 *
 * Large, expressive text for main titles and headers.
 * Font size: 36sp, Line height: 44
 *
 * @example
 * <DisplaySmall>Welcome to Forge</DisplaySmall>
 */
export const DisplaySmall: React.FC<DisplaySmallProps> = (props) => {
  return <Text variant="displaySmall" {...props} />;
};
