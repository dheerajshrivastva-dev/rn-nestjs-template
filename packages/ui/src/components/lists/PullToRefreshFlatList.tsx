/**
 * PullToRefreshFlatList Component
 * Reusable FlatList with built-in pull-to-refresh, loading, error, and empty states
 *
 * Features:
 * - Generic typing for any data type
 * - Pull-to-refresh with native RefreshControl
 * - Automatic loading shimmer on initial load
 * - Error state with retry
 * - Empty state (default or custom)
 * - All standard FlatList props supported
 */

import React from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  View,
  StyleSheet,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { EmptyState, ErrorFallback } from '../feedback/ErrorFallback';
import { ListItemShimmer } from '../feedback';

export interface PullToRefreshFlatListProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  /**
   * Array of data items
   */
  data: T[] | undefined;

  /**
   * Whether the initial data is loading
   */
  isLoading: boolean;

  /**
   * Whether pull-to-refresh is active
   */
  refreshing: boolean;

  /**
   * Error object (if any)
   */
  error?: Error | null;

  /**
   * Callback for pull-to-refresh
   */
  onRefresh: () => void | Promise<void>;

  /**
   * Callback for retry on error
   */
  onRetry?: () => void;

  /**
   * Number of shimmer items to show during loading
   * @default 5
   */
  shimmerCount?: number;

  /**
   * Custom shimmer component
   * If provided, will be used instead of default ListItemShimmer
   */
  LoadingComponent?: React.ReactElement;

  /**
   * Empty state configuration
   */
  emptyState?: {
    /**
     * Icon name for empty state
     * @default 'inbox-outline'
     */
    icon?: string;

    /**
     * Title for empty state
     * @default 'No Data'
     */
    title?: string;

    /**
     * Description for empty state
     */
    description?: string;

    /**
     * Action button label
     */
    actionLabel?: string;

    /**
     * Action button callback
     */
    onAction?: () => void;
  };

  /**
   * Custom empty state component
   * If provided, will be used instead of default EmptyState
   */
  EmptyComponent?: React.ReactElement;

  /**
   * Error state configuration
   */
  errorConfig?: {
    /**
     * Error type for styling
     * @default 'network'
     */
    type?: 'network' | 'server' | 'notFound' | 'unauthorized' | 'generic';

    /**
     * Error variant
     * @default 'fullScreen'
     */
    variant?: 'inline' | 'fullScreen';
  };
}

/**
 * Generic PullToRefreshFlatList component
 *
 * @example
 * ```tsx
 * <PullToRefreshFlatList
 *   data={orders}
 *   isLoading={isLoading}
 *   refreshing={refreshing}
 *   error={error}
 *   onRefresh={handleRefresh}
 *   onRetry={handleRetry}
 *   renderItem={({ item }) => <OrderCard order={item} />}
 *   keyExtractor={(item) => item.id}
 *   emptyState={{
 *     icon: 'clipboard-outline',
 *     title: 'No Orders',
 *     description: 'No orders found',
 *   }}
 * />
 * ```
 */
export function PullToRefreshFlatList<T>({
  data,
  isLoading,
  refreshing,
  error,
  onRefresh,
  onRetry,
  shimmerCount = 5,
  LoadingComponent,
  emptyState,
  EmptyComponent,
  errorConfig,
  contentContainerStyle,
  ...flatListProps
}: PullToRefreshFlatListProps<T>) {
  const theme = useTheme();

  // Render empty component based on current state (loading, error, or empty)
  const renderEmptyComponent = React.useCallback(() => {
    // Loading state - show shimmer
    if (isLoading && !refreshing) {
      if (LoadingComponent) {
        return <View style={styles.loadingContainer}>{LoadingComponent}</View>;
      }
      return (
        <View style={styles.loadingContainer}>
          <ListItemShimmer count={shimmerCount} />
        </View>
      );
    }

    // Error state - show error fallback
    if (error) {
      const handleRetry = onRetry || onRefresh;
      return (
        <ErrorFallback
          error={error}
          onRetry={handleRetry}
          type={errorConfig?.type || 'network'}
          variant={errorConfig?.variant || 'fullScreen'}
        />
      );
    }

    // Empty state - show custom or default empty component
    if (EmptyComponent) {
      return EmptyComponent;
    }

    return (
      <EmptyState
        icon={emptyState?.icon || 'inbox-outline'}
        title={emptyState?.title || 'No Data'}
        description={emptyState?.description}
        actionLabel={emptyState?.actionLabel}
        onAction={emptyState?.onAction}
      />
    );
  }, [isLoading, refreshing, error, LoadingComponent, shimmerCount, onRetry, onRefresh, errorConfig, EmptyComponent, emptyState]);

  // Always return FlatList - let ListEmptyComponent handle loading/error/empty states
  return (
    <FlatList
      data={data || []}
      contentContainerStyle={[
        styles.listContent,
        contentContainerStyle,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      ListEmptyComponent={renderEmptyComponent}
      {...flatListProps}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
});
