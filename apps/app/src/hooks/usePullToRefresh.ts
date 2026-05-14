/**
 * usePullToRefresh Hook
 * Simplifies pull-to-refresh with TanStack Query
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, error, refreshing, onRefresh } = usePullToRefresh(
 *   ['dashboard-stats'],
 *   fetchDashboardStats
 * );
 *
 * <PullToRefresh onRefresh={onRefresh} refreshing={refreshing}>
 *   {isLoading ? <StatsCardShimmer /> : <StatsCards data={data} />}
 *   {error && <ErrorFallback error={error} onRetry={onRefresh} />}
 * </PullToRefresh>
 * ```
 */

import {useQuery, useQueryClient, QueryKey} from '@tanstack/react-query';
import {useState, useCallback} from 'react';

export interface UsePullToRefreshOptions<TData> {
  /**
   * Query key for caching
   */
  queryKey: QueryKey;

  /**
   * Query function to fetch data
   */
  queryFn: () => Promise<TData>;

  /**
   * Enable/disable query
   * @default true
   */
  enabled?: boolean;

  /**
   * Stale time in milliseconds
   * @default 30000 (30 seconds)
   */
  staleTime?: number;

  /**
   * Cache time in milliseconds
   * @default 300000 (5 minutes)
   */
  cacheTime?: number;

  /**
   * Callback fired on success
   */
  onSuccess?: (data: TData) => void;

  /**
   * Callback fired on error
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for pull-to-refresh with TanStack Query
 */
export const usePullToRefresh = <TData = unknown,>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 30000,
}: UsePullToRefreshOptions<TData>) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
  });

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({queryKey});
      await query.refetch();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, queryKey, query]);

  return {
    ...query,
    refreshing: isRefreshing,
    onRefresh,
  };
};

/**
 * Hook for multiple queries with single pull-to-refresh
 * Useful for dashboards with multiple API calls
 */
export const useMultiPullToRefresh = (queryKeys: QueryKey[]) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Invalidate all queries at once
      await Promise.all(
        queryKeys.map(key => queryClient.invalidateQueries({queryKey: key}))
      );
    } catch (error) {
      console.error('Multi-refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, queryKeys]);

  return {
    refreshing: isRefreshing,
    onRefresh,
  };
};
