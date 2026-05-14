/**
 * useVerifyOTP Mutation Hook
 * Verifies OTP code during 2FA
 */

import {useMutation} from '@tanstack/react-query';
import apiClient, {handleApiError} from '../../api/client';
import {OTP_ENDPOINTS} from '../../api/endpoints';
import type {VerifyOTPRequest, VerifyOTPResponse} from '../../api/types';

export const useVerifyOTP = () => {
  return useMutation({
    mutationKey: ['verifyOTP'],
    mutationFn: async (
      request: VerifyOTPRequest,
    ): Promise<VerifyOTPResponse> => {
      const response = await apiClient.post<VerifyOTPResponse>(
        OTP_ENDPOINTS.VERIFY,
        request,
      );
      return response.data;
    },
    onError: error => {
      console.error('OTP verification failed:', handleApiError(error));
    },
  });
};
