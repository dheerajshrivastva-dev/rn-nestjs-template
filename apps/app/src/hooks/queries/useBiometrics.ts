import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import { AUTH_ENDPOINTS } from '../../api/endpoints';

export interface BiometricDevice {
  id: string;
  deviceFingerprint: string;
  deviceName: string | null;
  lastUsedAt: string | null;
  useCount: number;
  expiresAt: string;
  setupIp: string | null;
  createdAt: string;
}

export const useBiometrics = () => {
  return useQuery({
    queryKey: ['biometrics'],
    queryFn: async () => {
      const { data } = await apiClient.get<BiometricDevice[]>(AUTH_ENDPOINTS.BIOMETRIC_LIST);
      return data;
    },
    staleTime: 30000,
  });
};
