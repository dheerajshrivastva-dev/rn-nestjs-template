/**
 * React Query hooks for User Settings API
 * GET  /notifications/user-settings  — load current user's operational settings
 * PUT  /notifications/user-settings  — save updated settings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { NOTIFICATIONS_ENDPOINTS } from '../api/endpoints';
import { queryKeys } from './queryKeys';
import type { UserSettings } from '../api/types';

const DEFAULT_USER_SETTINGS: UserSettings = {
  lowBalanceThreshold: 10,
  autoLockDeviceWhenEmiDue: true,
  lockGracePeriodDays: 7,
};

export const useUserSettings = () => {
  return useQuery({
    queryKey: queryKeys.notifications.userSettings,
    queryFn: async (): Promise<UserSettings> => {
      const { data } = await apiClient.get<UserSettings>(
        NOTIFICATIONS_ENDPOINTS.USER_SETTINGS,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: DEFAULT_USER_SETTINGS,
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: Partial<UserSettings>): Promise<UserSettings> => {
      const { data } = await apiClient.put<UserSettings>(
        NOTIFICATIONS_ENDPOINTS.USER_SETTINGS,
        update,
      );
      return data;
    },

    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.userSettings });

      const previous = queryClient.getQueryData<UserSettings>(
        queryKeys.notifications.userSettings,
      );

      queryClient.setQueryData<UserSettings>(
        queryKeys.notifications.userSettings,
        (old) => ({ ...(old ?? DEFAULT_USER_SETTINGS), ...update }),
      );

      return { previous };
    },

    onError: (_err, _update, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications.userSettings, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.userSettings });
    },
  });
};
