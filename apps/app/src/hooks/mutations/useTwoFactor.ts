/**
 * Two-Factor Authentication Hooks
 *
 * Flow:
 *   Step 1 — Send setup OTP:  useSetup2FAEmailOtp | useSetup2FAMobileOtp
 *             → returns { tempToken, message, alreadySent? }
 *   Step 2 — Verify & enable: useEnable2FA({ method, tempToken })
 *             Uses TempTokenGuard, so tempToken goes in Authorization header
 *   Disable: useDisable2FA
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient, { handleApiError } from '../../api/client';
import { USER_ENDPOINTS } from '../../api/endpoints';
import { useToast } from '@forge/ui';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TwoFAStatus {
  enabled: boolean;
  primaryMethod: 'email_otp' | 'mobile_otp' | null;
  emailOtpEnabled: boolean;
  mobileOtpEnabled: boolean;
}

interface SetupOtpResponse {
  tempToken: string;
  message: string;
  alreadySent?: boolean;
}

// ─── Status Query ────────────────────────────────────────────────────────────

export const use2FAStatus = () =>
  useQuery<TwoFAStatus>({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const { data } = await apiClient.get<TwoFAStatus>(USER_ENDPOINTS.GET_2FA_STATUS);
      return data;
    },
  });

// ─── Step 1: Send setup OTP ──────────────────────────────────────────────────

export const useSetup2FAEmailOtp = () => {
  const toast = useToast();
  return useMutation<SetupOtpResponse, Error>({
    mutationKey: ['setup2FAEmailOtp'],
    mutationFn: async () => {
      const { data } = await apiClient.post<SetupOtpResponse>(
        USER_ENDPOINTS.SETUP_EMAIL_OTP_2FA,
      );
      return data;
    },
    onError: (error) => {
      const { message } = handleApiError(error);
      toast.error('Failed to send code', message);
    },
  });
};

export const useSetup2FAMobileOtp = () => {
  const toast = useToast();
  return useMutation<SetupOtpResponse, Error>({
    mutationKey: ['setup2FAMobileOtp'],
    mutationFn: async () => {
      const { data } = await apiClient.post<SetupOtpResponse>(
        USER_ENDPOINTS.SETUP_MOBILE_OTP_2FA,
      );
      return data;
    },
    onError: (error) => {
      const { message } = handleApiError(error);
      toast.error('Failed to send code', message);
    },
  });
};

// ─── Step 2: Verify OTP and enable 2FA ──────────────────────────────────────

interface EnableParams {
  method: 'email_otp' | 'mobile_otp';
  tempToken: string;
  code: string;
}

export const useEnable2FA = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<{ success: boolean; message: string }, Error, EnableParams>({
    mutationKey: ['enable2FA'],
    mutationFn: async ({ method, tempToken, code }) => {
      const endpoint =
        method === 'email_otp'
          ? USER_ENDPOINTS.ENABLE_EMAIL_OTP_2FA
          : USER_ENDPOINTS.ENABLE_MOBILE_OTP_2FA;

      const { data } = await apiClient.post<{ success: boolean; message: string }>(
        endpoint,
        { code },
        { headers: { Authorization: `Bearer ${tempToken}` } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.success('2FA enabled', 'Your account is now protected.');
    },
    onError: (error) => {
      const { message } = handleApiError(error);
      toast.error('Failed to enable 2FA', message);
    },
  });
};

// ─── Disable 2FA ─────────────────────────────────────────────────────────────

export const useDisable2FA = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation<{ success: boolean; message: string }, Error>({
    mutationKey: ['disable2FA'],
    mutationFn: async () => {
      const { data } = await apiClient.delete<{ success: boolean; message: string }>(
        USER_ENDPOINTS.DISABLE_2FA,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      toast.info('2FA disabled', 'Two-factor authentication has been turned off.');
    },
    onError: (error) => {
      const { message } = handleApiError(error);
      toast.error('Failed to disable 2FA', message);
    },
  });
};
