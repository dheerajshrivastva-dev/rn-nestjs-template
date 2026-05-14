/**
 * Safe Screen Component
 * Screen wrapper with proper safe area handling
 * Use this as the root component for all screens
 */

import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {SafeAreaView, Edge} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks/useTheme';

export interface SafeScreenProps {
  /**
   * Child components
   */
  children: React.ReactNode;

  /**
   * Apply safe area edges
   * @default ['top', 'bottom', 'left', 'right']
   */
  edges?: Edge[];

  /**
   * Background color (defaults to theme surface)
   */
  backgroundColor?: string;

  /**
   * Additional styles
   */
  style?: ViewStyle;

  /**
   * Use standard View instead of SafeAreaView
   * Useful when you handle safe area manually (e.g., in AppBar)
   * @default false
   */
  noSafeArea?: boolean;
}

/**
 * Safe Screen
 * Wrapper component that handles safe area insets properly
 */
export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  backgroundColor,
  style,
  noSafeArea = false,
}) => {
  const theme = useTheme();
  const bgColor = backgroundColor || theme.colors.surface;

  const containerStyle = [
    styles.container,
    {backgroundColor: bgColor},
    style,
  ];

  if (noSafeArea) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <SafeAreaView style={containerStyle} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
