/**
 * useUpdateUser Mutation Hook
 * Updates user profile or admin fields
 *
 * Access Control:
 * - SUPER_ADMIN: Can update any user (profile + status)
 * - ADMIN: Can update users in their company (status only)
 * - USER: Can update their own profile only (name, address, profile picture)
 *
 * NOTE: Email and phone cannot be updated via this endpoint
 */

import {useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient from '../../api/client';
import {USER_ENDPOINTS} from '../../api/endpoints';
import type {User, UserStatus} from '../../api/types';
import {useAuthStore} from '../../store/authStore';
import {queryKeys} from '../queryKeys';

export interface UpdateUserProfileDTO {
  name?: string;
  address?: string;
  profilePicture?: { url: string; publicId: string };
}

export interface UpdateUserStatusDTO {
  status?: UserStatus;
}

export type UpdateUserDTO = UpdateUserProfileDTO | UpdateUserStatusDTO;

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserDTO;
    }): Promise<User> => {
      const response = await apiClient.put<User>(
        USER_ENDPOINTS.UPDATE(userId),
        data,
      );
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Invalidate the specific user detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.byId(updatedUser.id),
      });

      // Invalidate users list
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });

      // If the updated user is the currently logged-in user, update local store + refresh me cache
      if (updatedUser.id === currentUserId && currentUser) {
        setUser({ ...currentUser, ...updatedUser });
        queryClient.invalidateQueries({
          queryKey: queryKeys.auth.me,
        });
      }
    },
  });
};
