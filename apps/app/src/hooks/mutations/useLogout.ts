/**
 * useLogout Mutation Hook
 * Handles user logout with API call and token cleanup
 */

import {useMutation} from '@tanstack/react-query';
import apiClient from '../../api/client';
import {AUTH_ENDPOINTS} from '../../api/endpoints';
import {useAuthStore} from '../../store/authStore';
import {queryClient} from '../../providers/QueryProvider';
import { queryKeys } from '../queryKeys';

export const useLogout = () => {
  const {logout: clearAuthState} = useAuthStore();

  return useMutation({
    mutationKey: queryKeys.auth.logout,
    mutationFn: async (): Promise<void> => {
      // Clear local state immediately — user is gone regardless of API outcome
      await clearAuthState();
      queryClient.clear();

      // Notify server in the background; ignore errors (token may already be invalid)
      apiClient.post(AUTH_ENDPOINTS.LOGOUT).catch(() => {});
    },
  });
};
