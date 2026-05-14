/**
 * ScrollContainer Component
 * Scrollable content area wrapper
 */

import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ScrollContainerProps extends ScrollViewProps {
  /**
   * Child components to render inside scrollable area
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
   * Whether to show vertical scroll indicator
   * @default false
   */
  showsVerticalScrollIndicator?: boolean;

  /**
   * Whether to enable keyboard dismissal on drag
   * @default true
   */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

/**
 * ScrollContainer
 *
 * Scrollable container component for content that exceeds screen height.
 * Wraps React Native ScrollView with consistent theming and padding.
 *
 * @example
 * // Basic scrollable container
 * <ScrollContainer>
 *   <Text>Long content here...</Text>
 *   <Text>More content...</Text>
 * </ScrollContainer>
 *
 * @example
 * // With custom padding and visible scroll indicator
 * <ScrollContainer padding={24} showsVerticalScrollIndicator>
 *   <Form />
 * </ScrollContainer>
 *
 * @example
 * // Horizontal scrolling
 * <ScrollContainer horizontal>
 *   <Chip label="Tag 1" />
 *   <Chip label="Tag 2" />
 *   <Chip label="Tag 3" />
 * </ScrollContainer>
 */
export const ScrollContainer: React.FC<ScrollContainerProps> = ({
  children,
  padding,
  backgroundColor,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  contentContainerStyle,
  style,
  ...props
}) => {
  const theme = useTheme();

  const containerStyle = [
    {
      backgroundColor: backgroundColor ?? theme.colors.surface,
    },
    style,
  ];

  const contentStyle = [
    {
      padding: padding ?? theme.spacing.none, // Default 16dp
    },
    contentContainerStyle,
  ];

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    >
      {children}
    </ScrollView>
  );
};
