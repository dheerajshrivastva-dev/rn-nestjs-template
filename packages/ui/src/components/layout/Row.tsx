/**
 * Row Component
 * Horizontal flexbox layout wrapper
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

export interface RowProps extends ViewProps {
  /**
   * Child components to render in row
   */
  children: React.ReactNode;

  /**
   * Justify content alignment
   * @default 'flex-start'
   */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';

  /**
   * Align items vertically
   * @default 'stretch'
   */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';

  /**
   * Gap between items in dp
   */
  gap?: number;

  /**
   * Whether to wrap items to next line
   * @default false
   */
  wrap?: boolean;
}

/**
 * Row
 *
 * Horizontal layout component using flexbox.
 * Simplifies creating horizontal layouts with consistent spacing.
 *
 * @example
 * // Basic horizontal layout
 * <Row>
 *   <Button title="Cancel" />
 *   <Button title="Confirm" />
 * </Row>
 *
 * @example
 * // Centered with gap
 * <Row justify="center" align="center" gap={16}>
 *   <Icon name="user" />
 *   <Text>Profile</Text>
 * </Row>
 *
 * @example
 * // Space between with wrapping
 * <Row justify="space-between" wrap>
 *   <Chip label="Tag 1" />
 *   <Chip label="Tag 2" />
 *   <Chip label="Tag 3" />
 * </Row>
 */
export const Row: React.FC<RowProps> = ({
  children,
  justify = 'flex-start',
  align = 'stretch',
  gap,
  wrap = false,
  style,
  ...props
}) => {
  const rowStyle = [
    styles.row,
    {
      justifyContent: justify,
      alignItems: align,
      gap: gap,
      flexWrap: wrap ? 'wrap' : 'nowrap',
    },
    style,
  ];

  return (
    <View style={rowStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
