/**
 * useNotifications - TanStack Query hooks for the Notification inbox
 *
 * Covers:
 *  - useNotifications()           → paginated list
 *  - useNotificationsInfinite()   → infinite-scroll accumulator
 *  - useUnreadCount()             → badge count
 *  - useMarkRead()                → mark single notification read
 *  - useMarkAllRead()             → mark all read
 */

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import apiClient from '../../api/client';
import { NOTIFICATIONS_ENDPOINTS } from '../../api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, string>;
}

export interface NotificationsPage {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const notificationKeys = {
  all: ['notifications'] as const,
  infinite: () => ['notifications', 'infinite'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

/**
 * Infinite-scroll list of notifications.
 * Pages accumulate automatically — safe for FlatList onEndReached.
 */
export const useNotificationsInfinite = () => {
  return useInfiniteQuery({
    queryKey: notificationKeys.infinite(),
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await apiClient.get<NotificationsPage>(
        NOTIFICATIONS_ENDPOINTS.GET_ALL,
        { params: { page: pageParam, pageSize: PAGE_SIZE } },
      );
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const fetched = (lastPage.page - 1) * lastPage.pageSize + lastPage.items.length;
      return fetched < lastPage.total ? lastPage.page + 1 : undefined;
    },
    staleTime: 30_000,
  });
};

/**
 * Number of unread notifications — used for badge in AppBar.
 */
export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const { data } = await apiClient.get<{ count: number }>(
        NOTIFICATIONS_ENDPOINTS.UNREAD_COUNT,
      );
      return data.count;
    },
  });
};

/**
 * Mark a single notification as read.
 */
export const useMarkRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch(NOTIFICATIONS_ENDPOINTS.MARK_READ(notificationId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

/**
 * Mark all notifications as read.
 */
export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch(NOTIFICATIONS_ENDPOINTS.MARK_ALL_READ);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
