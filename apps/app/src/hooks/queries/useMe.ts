/**
 * useMe Query Hook
 * Fetches authenticated user's profile
 * Also fetches and stores company data if user has companyId
 */

import {useQuery} from '@tanstack/react-query';

import apiClient from '../../api/client';
import {USER_ENDPOINTS} from '../../api/endpoints';
import type {User} from '../../api/types';
import {useAuthStore} from '../../store/authStore';
import {queryKeys} from '../queryKeys';

export const useMe = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get<User>(USER_ENDPOINTS.GET_ME);
      setUser(response.data);
      return response.data;
    },
    enabled: isAuthenticated,
  });

  return query;
};
