/**
 * useComplete2FA Mutation Hook
 * Completes 2FA authentication after OTP verification
 */

import {useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient, {handleApiError} from '../../api/client';
import {AUTH_ENDPOINTS, USER_ENDPOINTS} from '../../api/endpoints';
import type {Complete2FAResponse, User} from '../../api/types';
import {useAuthStore} from '../../store/authStore';
import {hasBiometricToken} from '../../utils/biometricStorage';
import {queryKeys} from '../queryKeys';

export const useComplete2FA = () => {
  const {setUser, setTokens, setTempToken, setPendingPinSetup, pendingPinSetupIdentifier} = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['complete2FA'],
    mutationFn: async (otp: string): Promise<Complete2FAResponse> => {
      // Temp token is automatically added by axios interceptor; OTP is verified server-side
      const response = await apiClient.post<Complete2FAResponse>(
        AUTH_ENDPOINTS.COMPLETE_2FA,
        { otp },
      );
      return response.data;
    },
    onSuccess: async data => {
      // Clear temp token
      await setTempToken(null);

      // Store tokens
      await setTokens(data.accessToken, data.refreshToken);

      try {
        // Fetch full user profile from /users/me
        const profileResponse = await apiClient.get<User>(
          USER_ENDPOINTS.GET_ME,
        );

        setUser(profileResponse.data);

        // Seed the cache so useMe (enabled=true after setTokens) doesn't immediately refetch
        queryClient.setQueryData(queryKeys.auth.me, profileResponse.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', handleApiError(error));
        // Fallback: use the minimal user from the 2FA response
        setUser(data.user as User);
      }

      // After 2FA completes, prompt PIN/biometric setup if not yet configured.
      // The identifier was saved by useLogin when it stored the tempToken.
      const alreadySetUp = await hasBiometricToken();
      if (!alreadySetUp && pendingPinSetupIdentifier) {
        setPendingPinSetup(pendingPinSetupIdentifier);
      }
    },
    onError: async error => {
      console.error('Complete 2FA failed:', handleApiError(error));
      // Clear temp token on failure
      await setTempToken(null);
    },
  });
};
