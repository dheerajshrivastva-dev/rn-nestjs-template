/**
 * useForgotPassword Mutation Hook
 * Sends a forgot password request with email
 * Returns tempToken to be used in the reset password flow
 */

import {useMutation} from '@tanstack/react-query';
import apiClient, {handleApiError} from '../../api/client';
import {AUTH_ENDPOINTS} from '../../api/endpoints';
import type {ForgotPasswordRequest, ForgotPasswordResponse} from '../../api/types';

export const useForgotPassword = () => {
  return useMutation({
    mutationKey: ['forgot-password'],
    mutationFn: async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
      const response = await apiClient.post<ForgotPasswordResponse>(
        AUTH_ENDPOINTS.FORGOT_PASSWORD,
        data,
      );
      return response.data;
    },
    onError: error => {
      console.error('Forgot password failed:', handleApiError(error));
    },
  });
};
