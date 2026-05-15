/**
 * React Query hooks for Notification Preferences API
 * GET  /notifications/preferences  — load current user's preferences
 * PUT  /notifications/preferences  — save updated preferences
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { NOTIFICATIONS_ENDPOINTS } from '../api/endpoints';
import { queryKeys } from './queryKeys';
import type { NotificationPreferences } from '../api/types';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  master: true,
  systemAlerts: true,
};

/**
 * Fetch the current user's notification preferences from the backend.
 * Falls back to all-enabled defaults if the request fails (e.g. offline).
 */
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: queryKeys.notifications.preferences,
    queryFn: async (): Promise<NotificationPreferences> => {
      const { data } = await apiClient.get<NotificationPreferences>(
        NOTIFICATIONS_ENDPOINTS.PREFERENCES,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 min — preferences rarely change
    placeholderData: DEFAULT_PREFERENCES,
  });
};

/**
 * Persist a partial preferences update to the backend.
 * Optimistically updates the cache so the UI reflects the change immediately.
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      update: Partial<NotificationPreferences>,
    ): Promise<NotificationPreferences> => {
      const { data } = await apiClient.put<NotificationPreferences>(
        NOTIFICATIONS_ENDPOINTS.PREFERENCES,
        update,
      );
      return data;
    },

    // Optimistic update — apply locally before the request completes
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.preferences });

      const previous = queryClient.getQueryData<NotificationPreferences>(
        queryKeys.notifications.preferences,
      );

      queryClient.setQueryData<NotificationPreferences>(
        queryKeys.notifications.preferences,
        (old) => ({ ...(old ?? DEFAULT_PREFERENCES), ...update }),
      );

      return { previous };
    },

    // On error, roll back to the snapshot taken before the mutation
    onError: (_err, _update, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.preferences, context.previous);
      }
    },

    // Always sync with the server response after settle
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
    },
  });
};
