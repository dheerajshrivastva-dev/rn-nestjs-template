/**
 * useUpdatePassword Mutation Hook
 *
 * Handles password updates with advanced security options:
 * - SUPER_ADMIN can update any user's password (except other SUPER_ADMINs)
 * - Users can update their own password (requires current password)
 * - Options to logout all devices
 * - Options to reset or replace 2FA
 * - All actions are logged in audit logs
 *
 * Permission Rules:
 * - SUPER_ADMIN: Can update passwords for SUPER, DISTRIBUTOR, RETAILER
 * - SUPER_ADMIN: CANNOT update other SUPER_ADMIN passwords
 * - Other roles: Can only update their own password
 */

import {useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient, {handleApiError} from '../../api/client';
import {USER_ENDPOINTS} from '../../api/endpoints';
import {
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  UserRole,
} from '../../api/types';
import {useAuthStore} from '../../store/authStore';

interface UpdatePasswordParams {
  userId: string;
  newPassword: string;
  currentPassword?: string;
  options?: {
    logoutAllDevices?: boolean;
    reset2FA?: boolean;
    replace2FAWithMethod?: '2fa_totp' | '2fa_mobile_otp' | null;
    reason?: string;
  };
}

export const useUpdatePassword = () => {
  const queryClient = useQueryClient();
  const {user} = useAuthStore();

  return useMutation({
    mutationKey: ['updatePassword'],
    mutationFn: async (
      params: UpdatePasswordParams,
    ): Promise<UpdatePasswordResponse> => {
      const {userId, newPassword, currentPassword, options} = params;

      // Determine if updating own password or another user's password
      const isOwnPassword = user?.id === userId;

      // Build request payload
      const requestData: UpdatePasswordRequest = {
        userId,
        newPassword,
        currentPassword: isOwnPassword ? currentPassword : undefined,
        logoutAllDevices: options?.logoutAllDevices ?? false,
        reset2FA: options?.reset2FA ?? false,
        replace2FAWithMethod: options?.replace2FAWithMethod ?? null,
        reason: options?.reason,
      };

      // Choose appropriate endpoint
      const endpoint = isOwnPassword
        ? USER_ENDPOINTS.CHANGE_OWN_PASSWORD
        : USER_ENDPOINTS.UPDATE_PASSWORD;

      const response = await apiClient.post<UpdatePasswordResponse>(
        endpoint,
        requestData,
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate user queries to refetch updated data
      queryClient.invalidateQueries({queryKey: ['users']});
      queryClient.invalidateQueries({queryKey: ['user', variables.userId]});

      // If sessions were logged out, invalidate session queries
      if (data.devicesLoggedOut && data.devicesLoggedOut > 0) {
        queryClient.invalidateQueries({queryKey: ['sessions']});
      }

      // If 2FA was modified, invalidate 2FA queries
      if (
        variables.options?.reset2FA ||
        variables.options?.replace2FAWithMethod
      ) {
        queryClient.invalidateQueries({queryKey: ['2fa']});
      }

      // Invalidate audit logs to show new entry
      queryClient.invalidateQueries({queryKey: ['auditLogs']});
    },
    onError: error => {
      console.error('Update password failed:', handleApiError(error));
    },
  });
};

/**
 * Helper hook for SUPER_ADMIN to check if they can update a user's password
 */
export const useCanUpdateUserPassword = (
  targetUserRole: UserRole,
  currentUserRole: UserRole,
): boolean => {
  // SUPER_ADMIN can update any user except other SUPER_ADMINs
  if (currentUserRole === UserRole.SUPER_ADMIN) {
    return targetUserRole !== UserRole.SUPER_ADMIN;
  }

  // Other roles cannot update other users' passwords
  return false;
};
