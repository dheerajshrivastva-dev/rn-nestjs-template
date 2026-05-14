/**
 * Session Management Mutation Hooks
 * - useRevokeSession: revoke a single session
 * - useLogoutAllSessions: revoke all sessions (logout everywhere)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import DeviceInfo from 'react-native-device-info';
import apiClient, { handleApiError } from '../../api/client';
import { USER_ENDPOINTS, AUTH_ENDPOINTS } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { queryClient as globalQueryClient } from '../../providers/QueryProvider';
import { clearAllBiometricData } from '../../utils/biometricStorage';

// ─── Revoke single session ──────────────────────────────────────────────────

export const useRevokeSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['revokeSession'],
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(USER_ENDPOINTS.REVOKE_SESSION(sessionId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error) => {
      console.error('Revoke session failed:', handleApiError(error));
    },
  });
};

// ─── Revoke biometric device ────────────────────────────────────────────────

export const useRevokeBiometric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['revokeBiometric'],
    mutationFn: async (deviceFingerprint: string) => {
      await apiClient.post(AUTH_ENDPOINTS.BIOMETRIC_REVOKE, { deviceFingerprint });
    },
    onSuccess: async (_data, revokedFingerprint) => {
      queryClient.invalidateQueries({ queryKey: ['biometrics'] });

      // If the user revoked their own current device, clear the local keypair
      // immediately so the app doesn't try to biometric-login next time.
      const currentFingerprint = await DeviceInfo.getUniqueId();
      if (revokedFingerprint === currentFingerprint) {
        await clearAllBiometricData();
        useAuthStore.getState().setHasBiometricSetup(false);
      }
    },
    onError: (error) => {
      console.error('Revoke biometric failed:', handleApiError(error));
    },
  });
};

// ─── Logout all sessions ────────────────────────────────────────────────────

export const useLogoutAllSessions = () => {
  const { logout: clearAuthState } = useAuthStore();

  return useMutation({
    mutationKey: ['logoutAll'],
    mutationFn: async () => {
      await apiClient.post(USER_ENDPOINTS.LOGOUT_ALL);
    },
    onSuccess: async () => {
      await clearAuthState();
      globalQueryClient.clear();
    },
    onError: async (error) => {
      console.error('Logout all failed:', handleApiError(error));
      // Still clear local state even on network error
      await clearAuthState();
      globalQueryClient.clear();
    },
  });
};
