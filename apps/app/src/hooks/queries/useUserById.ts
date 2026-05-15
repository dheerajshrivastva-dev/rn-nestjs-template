import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { USER_ENDPOINTS } from '../../api/endpoints';
import type { User } from '../../api/types';
import { queryKeys } from '../queryKeys';

export const useUserById = (userId?: string) => {
  return useQuery<User>({
    queryKey: queryKeys.users.byId(userId ?? ''),
    queryFn: async () => {
      const response = await apiClient.get<User>(USER_ENDPOINTS.GET_BY_ID(userId!));
      return response.data;
    },
    enabled: !!userId,
  });
};
