/**
 * useEmailVerification
 *
 * Two-step email verification flow for authenticated users:
 *   1. useSendEmailVerificationOtp  → POST /users/me/send-email-verification
 *      Returns { tempToken } — holds the OTP session.
 *   2. useVerifyEmail               → POST /users/me/verify-email (tempToken in Authorization header)
 *      Sends { code } in body. Backend verifies OTP and marks email verified in one call.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@forge/ui';
import apiClient, { handleApiError } from '../../api/client';
import { USER_ENDPOINTS } from '../../api/endpoints';
import { queryKeys } from '../queryKeys';
import { useAuthStore } from '../../store/authStore';

// ─── Step 1: Send OTP ────────────────────────────────────────────────────────

interface SendEmailVerificationResponse {
  tempToken: string;
  message: string;
  /** True when a valid OTP already existed — no new email was sent */
  alreadySent?: boolean;
}

export const useSendEmailVerificationOtp = () => {
  const toast = useToast();
  return useMutation({
    mutationKey: ['sendEmailVerificationOtp'],
    mutationFn: async (): Promise<SendEmailVerificationResponse> => {
      const { data } = await apiClient.post<SendEmailVerificationResponse>(
        USER_ENDPOINTS.SEND_EMAIL_VERIFICATION,
      );
      return data;
    },
    onError: (error) => {
      const { message } = handleApiError(error);
      toast.error('Failed to send code', message);
    },
  });
};

// ─── Step 2: Verify OTP + mark email verified ─────────────────────────────────

interface VerifyEmailParams {
  code: string;
  tempToken: string;
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();
  const { setUser, user } = useAuthStore();
  const toast = useToast();

  return useMutation({
    mutationKey: ['verifyEmail'],
    mutationFn: async ({ code, tempToken }: VerifyEmailParams): Promise<VerifyEmailResponse> => {
      const { data } = await apiClient.post<VerifyEmailResponse>(
        USER_ENDPOINTS.VERIFY_EMAIL,
        { code },
        { headers: { Authorization: `Bearer ${tempToken}` } },
      );
      return data;
    },
    onSuccess: () => {
      if (user) {
        setUser({ ...user, emailVerified: true });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success('Email verified', 'Your email address has been confirmed.');
    },
    onError: (error) => {
      const { message } = handleApiError(error);
      toast.error('Verification failed', message);
    },
  });
};
