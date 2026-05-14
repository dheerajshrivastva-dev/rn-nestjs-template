/**
 * PullToRefresh Component
 * Universal pull-to-refresh wrapper with Material Design 3 styling
 *
 * Features:
 * - Pull-to-refresh gesture for data reloading
 * - Customizable refresh indicator colors
 * - Supports multiple child API calls
 * - Works with any content (ScrollView, FlatList, etc.)
 *
 * Usage:
 * ```tsx
 * <PullToRefresh onRefresh={handleRefresh} refreshing={isRefreshing}>
 *   <YourContent />
 * </PullToRefresh>
 * ```
 */

import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  ScrollViewProps,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface PullToRefreshProps extends Omit<ScrollViewProps, 'refreshControl'> {
  /**
   * Callback fired when user pulls to refresh
   */
  onRefresh: () => void | Promise<void>;

  /**
   * Whether the refresh indicator is currently showing
   */
  refreshing: boolean;

  /**
   * Content to be rendered inside the scrollable area
   */
  children: React.ReactNode;

  /**
   * Custom colors for the refresh indicator
   * Defaults to theme primary color
   */
  colors?: string[];

  /**
   * Android: Background color of the refresh indicator
   */
  progressBackgroundColor?: string;

  /**
   * The title displayed during refresh (iOS only)
   */
  title?: string;

  /**
   * Whether to show scroll indicators
   * @default false
   */
  showsVerticalScrollIndicator?: boolean;
}

/**
 * PullToRefresh Component
 * Provides pull-to-refresh functionality for any content
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  refreshing,
  children,
  colors,
  progressBackgroundColor,
  title,
  showsVerticalScrollIndicator = false,
  ...scrollViewProps
}) => {
  const theme = useTheme();

  const defaultColors = colors || [theme.colors.primary];
  const defaultProgressBg = progressBackgroundColor || theme.colors.surface;

  return (
    <ScrollView
      {...scrollViewProps}
      style={[styles.container, scrollViewProps.style]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={defaultColors}
          progressBackgroundColor={defaultProgressBg}
          tintColor={theme.colors.primary}
          title={title}
          titleColor={theme.colors.onSurface}
        />
      }
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
