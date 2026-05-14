/**
 * Container Component
 * Screen wrapper with padding and background
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ContainerProps extends ViewProps {
  /**
   * Child components to render inside container
   */
  children: React.ReactNode;

  /**
   * Custom padding (overrides default 16dp)
   */
  padding?: number;

  /**
   * Custom background color (overrides theme surfaceContainer)
   */
  backgroundColor?: string;

  /**
   * Whether to center content vertically and horizontally
   * @default false
   */
  centered?: boolean;
}

/**
 * Container
 *
 * Screen wrapper component with consistent padding and background.
 * Uses theme surfaceContainer background by default with 16dp padding.
 *
 * @example
 * // Standard screen container
 * <Container>
 *   <Text>Screen content</Text>
 * </Container>
 *
 * @example
 * // Centered content with custom padding
 * <Container centered padding={24}>
 *   <Text>Centered content</Text>
 * </Container>
 *
 * @example
 * // Custom background
 * <Container backgroundColor="#FFFFFF">
 *   <Text>Custom background</Text>
 * </Container>
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  padding,
  backgroundColor,
  centered = false,
  style,
  ...props
}) => {
  const theme = useTheme();

  const containerStyle = [
    styles.container,
    {
      padding: padding ?? theme.spacing.xl, // Default 16dp
      backgroundColor: backgroundColor ?? theme.colors.surfaceContainerLowest,
    },
    centered && styles.centered,
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
