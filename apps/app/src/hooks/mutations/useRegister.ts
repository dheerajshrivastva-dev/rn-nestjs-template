import {useMutation} from '@tanstack/react-query';
import apiClient, {handleApiError} from '../../api/client';
import {AUTH_ENDPOINTS} from '../../api/endpoints';
import type {RegisterRequest, RegisterResponse} from '../../api/types';

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterRequest): Promise<RegisterResponse> => {
      const response = await apiClient.post<RegisterResponse>(
        AUTH_ENDPOINTS.REGISTER,
        data,
      );
      return response.data;
    },
    onError: error => {
      console.error('Registration failed:', handleApiError(error));
    },
  });
};
