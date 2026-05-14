/**
 * useResetPassword Mutation Hook
 * Resets the password using OTP and tempToken from forgot-password flow
 * Sends tempToken as Authorization header (TempTokenGuard on backend)
 */

import {useMutation} from '@tanstack/react-query';
import apiClient, {handleApiError} from '../../api/client';
import {AUTH_ENDPOINTS} from '../../api/endpoints';
import type {ResetPasswordRequest, ResetPasswordResponse} from '../../api/types';

interface UseResetPasswordInput extends ResetPasswordRequest {
  tempToken: string;
}

export const useResetPassword = () => {
  return useMutation({
    mutationKey: ['reset-password'],
    mutationFn: async ({tempToken, otp, newPassword}: UseResetPasswordInput): Promise<ResetPasswordResponse> => {
      const response = await apiClient.post<ResetPasswordResponse>(
        AUTH_ENDPOINTS.RESET_PASSWORD,
        {otp, newPassword},
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        },
      );
      return response.data;
    },
    onError: error => {
      console.error('Reset password failed:', handleApiError(error));
    },
  });
};
