/**
 * Spacer Component
 * Vertical or horizontal spacing based on 4dp grid
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface SpacerProps extends ViewProps {
  /**
   * Size of spacer using theme spacing tokens
   * @default 'md' (8dp)
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl' | 'huge' | 'xhuge' | 'max';

  /**
   * Direction of spacer
   * @default 'vertical'
   */
  direction?: 'vertical' | 'horizontal';

  /**
   * Custom spacing value in dp (overrides size prop)
   */
  spacing?: number;
}

/**
 * Spacer
 *
 * Flexible spacing component following 4dp grid system.
 * Creates vertical or horizontal space between components.
 *
 * @example
 * // Vertical spacer (default)
 * <Text>First line</Text>
 * <Spacer size="lg" />
 * <Text>Second line</Text>
 *
 * @example
 * // Horizontal spacer
 * <View style={{ flexDirection: 'row' }}>
 *   <Button title="Cancel" />
 *   <Spacer direction="horizontal" size="md" />
 *   <Button title="Confirm" />
 * </View>
 *
 * @example
 * // Custom spacing
 * <Spacer spacing={20} />
 */
export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  direction = 'vertical',
  spacing,
  style,
  ...props
}) => {
  const theme = useTheme();

  // Use custom spacing if provided, otherwise use theme spacing
  const spaceValue = spacing ?? theme.spacing[size];

  const spacerStyle =
    direction === 'vertical'
      ? { height: spaceValue }
      : { width: spaceValue };

  return <View style={[spacerStyle, style]} {...props} />;
};
