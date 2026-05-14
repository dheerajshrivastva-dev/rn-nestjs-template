/**
 * useResendOTP Mutation Hook
 * Resends OTP code
 */

import {useMutation} from '@tanstack/react-query';
import apiClient, {handleApiError} from '../../api/client';
import {OTP_ENDPOINTS} from '../../api/endpoints';
import type {ResendOTPRequest, ResendOTPResponse} from '../../api/types';

export const useResendOTP = () => {
  return useMutation({
    mutationKey: ['resendOTP'],
    mutationFn: async (
      request: ResendOTPRequest,
    ): Promise<ResendOTPResponse> => {
      const response = await apiClient.post<ResendOTPResponse>(
        OTP_ENDPOINTS.RESEND,
        request,
      );
      return response.data;
    },
    onError: error => {
      console.error('Resend OTP failed:', handleApiError(error));
    },
  });
};
