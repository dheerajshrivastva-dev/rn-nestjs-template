/**
 * useMe Query Hook
 * Fetches authenticated user's profile
 * Also fetches and stores company data if user has companyId
 */

import {useQuery} from '@tanstack/react-query';

import apiClient, {handleApiError} from '../../api/client';
import {USER_ENDPOINTS, COMPANY_ENDPOINTS} from '../../api/endpoints';
import type {User, Company} from '../../api/types';
import {useAuthStore} from '../../store/authStore';
import {useCompanyStore} from '../../store/companyStore';
import {queryKeys} from '../queryKeys';

export const useMe = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const setCompany = useCompanyStore((state) => state.setCompany);

  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async (): Promise<User> => {
      const response = await apiClient.get<User>(USER_ENDPOINTS.GET_ME);

      // Update Zustand synchronously inside queryFn so stores are updated
      // the moment fresh data lands — before any component re-render from useEffect.
      setUser(response.data);

      if (response.data.companyId) {
        apiClient
          .get<Company>(COMPANY_ENDPOINTS.GET_BY_ID(response.data.companyId))
          .then((res) => setCompany(res.data))
          .catch((error) => {
            console.error('Failed to fetch company data:', handleApiError(error));
          });
      }

      return response.data;
    },
    enabled: isAuthenticated,
  });

  return query;
};
