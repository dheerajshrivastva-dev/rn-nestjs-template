import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { USER_ENDPOINTS } from '../../api/endpoints';
import type { User, UserStatus } from '../../api/types';
import { queryKeys } from '../queryKeys';

export interface UsersFilters {
  search?: string;
  status?: UserStatus;
  companyId?: string;
  role?: string;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export const useUsers = (filters?: UsersFilters) => {
  return useQuery<UsersResponse>({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<UsersResponse>(USER_ENDPOINTS.GET_ALL, {
        params: filters,
      });
      return response.data;
    },
  });
};
