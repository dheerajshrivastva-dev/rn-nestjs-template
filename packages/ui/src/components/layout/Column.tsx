/**
 * Column Component
 * Vertical flexbox layout wrapper
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

export interface ColumnProps extends ViewProps {
  /**
   * Child components to render in column
   */
  children: React.ReactNode;

  /**
   * Justify content alignment
   * @default 'flex-start'
   */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';

  /**
   * Align items horizontally
   * @default 'stretch'
   */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';

  /**
   * Gap between items in dp
   */
  gap?: number;

  /**
   * Whether column should take full height
   * @default false
   */
  fullHeight?: boolean;
}

/**
 * Column
 *
 * Vertical layout component using flexbox.
 * Simplifies creating vertical layouts with consistent spacing.
 *
 * @example
 * // Basic vertical layout
 * <Column>
 *   <Text>First item</Text>
 *   <Text>Second item</Text>
 *   <Text>Third item</Text>
 * </Column>
 *
 * @example
 * // Centered with gap
 * <Column justify="center" align="center" gap={12}>
 *   <Icon name="check" />
 *   <Text>Success!</Text>
 * </Column>
 *
 * @example
 * // Full height with space between
 * <Column fullHeight justify="space-between">
 *   <Header />
 *   <Content />
 *   <Footer />
 * </Column>
 */
export const Column: React.FC<ColumnProps> = ({
  children,
  justify = 'flex-start',
  align = 'stretch',
  gap,
  fullHeight = false,
  style,
  ...props
}) => {
  const columnStyle = [
    styles.column,
    {
      justifyContent: justify,
      alignItems: align,
      gap: gap,
    },
    fullHeight && styles.fullHeight,
    style,
  ];

  return (
    <View style={columnStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  column: {
    flexDirection: 'column',
  },
  fullHeight: {
    flex: 1,
  },
});
