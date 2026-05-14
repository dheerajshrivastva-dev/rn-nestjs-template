/**
 * Divider Component
 * Horizontal or vertical separator line
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface DividerProps extends ViewProps {
  /**
   * Orientation of divider
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Thickness of divider in dp
   * @default 1
   */
  thickness?: number;

  /**
   * Custom color (overrides theme outlineVariant)
   */
  color?: string;

  /**
   * Vertical margin for horizontal divider (default 16dp)
   */
  verticalMargin?: number;

  /**
   * Horizontal margin for vertical divider (default 16dp)
   */
  horizontalMargin?: number;
}

/**
 * Divider
 *
 * Visual separator component for dividing content sections.
 * Uses theme outlineVariant color by default.
 *
 * @example
 * // Horizontal divider (default)
 * <View>
 *   <Text>Section 1</Text>
 *   <Divider />
 *   <Text>Section 2</Text>
 * </View>
 *
 * @example
 * // Vertical divider
 * <View style={{ flexDirection: 'row', height: 100 }}>
 *   <Text>Left</Text>
 *   <Divider orientation="vertical" />
 *   <Text>Right</Text>
 * </View>
 *
 * @example
 * // Custom styling
 * <Divider thickness={2} color="#FF0000" verticalMargin={24} />
 */
export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  thickness = 1,
  color,
  verticalMargin,
  horizontalMargin,
  style,
  ...props
}) => {
  const theme = useTheme();

  const dividerColor = color ?? theme.colors.outlineVariant;

  const dividerStyle =
    orientation === 'horizontal'
      ? {
          height: thickness,
          backgroundColor: dividerColor,
          marginVertical: verticalMargin ?? theme.spacing.xl, // Default 16dp
        }
      : {
          width: thickness,
          backgroundColor: dividerColor,
          marginHorizontal: horizontalMargin ?? theme.spacing.xl, // Default 16dp
        };

  return <View style={[dividerStyle, style]} {...props} />;
};
