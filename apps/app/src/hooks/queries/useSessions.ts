/**
 * useSessions Query Hook
 * Fetches active sessions for the current user
 */

import { useQuery } from '@tanstack/react-query';
import apiClient, { handleApiError } from '../../api/client';
import { USER_ENDPOINTS } from '../../api/endpoints';

export interface UserSession {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  osName?: string;
  osVersion?: string;
  ipAddress?: string;
  city?: string;
  region?: string;
  country?: string;
  lastActivityAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export const useSessions = () => {
  return useQuery<UserSession[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await apiClient.get<UserSession[]>(USER_ENDPOINTS.GET_SESSIONS);
      return data;
    },
    staleTime: 30_000,
  });
};
