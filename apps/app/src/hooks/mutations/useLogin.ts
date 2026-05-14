/**
 * useLogin Mutation Hook
 * Handles login with phone/email/userId and password
 * Collects device info for session management
 */

import {Query, useMutation, useQueryClient} from '@tanstack/react-query';
import apiClient, {handleApiError} from '../../api/client';
import {AUTH_ENDPOINTS, USER_ENDPOINTS} from '../../api/endpoints';
import type {UseLoginInput, LoginResponse, UserMeResponse, User} from '../../api/types';
import {useAuthStore} from '../../store/authStore';
import {getDeviceInfo} from '../../utils/deviceInfo';
import {parseIdentifier} from '../../utils/parseIdentifier';
import {hasBiometricToken} from '../../utils/biometricStorage';
import {queryKeys} from '../queryKeys';

export const useLogin = () => {
  const {setUser, setTokens, setTempToken, setPendingPinSetup, setPendingPinSetupIdentifier} = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.auth.login,
    mutationFn: async (credentials: UseLoginInput): Promise<LoginResponse> => {
      // Collect device info for session management
      const deviceInfo = await getDeviceInfo();

      // Parse identifier to determine field type (userId, email, or phone)
      const identifierFields = parseIdentifier(credentials.identifier);

      // Send login request with device info
      const response = await apiClient.post<LoginResponse>(
        AUTH_ENDPOINTS.LOGIN,
        {
          ...identifierFields,
          password: credentials.password,
          deviceInfo,
        },
      );
      return response.data;
    },
    onSuccess: async (data, variables) => {
      if (data.tempToken) {
        // 2FA required - store temp token and save identifier so useComplete2FA
        // can trigger PinSetupScreen after 2FA completes
        await setTempToken(data.tempToken);
        setPendingPinSetupIdentifier(variables.identifier);
      } else if (data.accessToken && data.refreshToken && (data.user || data.user)) {
        // No 2FA - login complete, store tokens first
        await setTokens(data.accessToken, data.refreshToken);

        // Use data.user (new) or data.user (backwards compatibility)
        const userData = data.user || data.user!;

        try {
          // Fetch full user profile from /users/me
          const profileResponse = await apiClient.get<UserMeResponse>(
            USER_ENDPOINTS.GET_ME,
          );

          console.log('✅ User profile fetched:', {
            id: profileResponse.data.id,
            role: profileResponse.data.role,
            name: profileResponse.data.name,
          });

          // UserMeResponse is now an alias for User, use directly
          console.log('✅ Setting user in store with role:', profileResponse.data.role);
          setUser(profileResponse.data);

          // Update query cache with correct key so useMe doesn't refetch immediately
          queryClient.setQueryData(queryKeys.auth.me, profileResponse.data);
        } catch (error) {
          console.error('❌ Failed to fetch user profile:', handleApiError(error));
          // Fallback: create minimal User data from login response
          const minimalUser: User = {
            ...userData,
            phone: '',
            balance: 0,
            twoFactorEnabled: false,
            emailVerified: false,
            phoneVerified: false,
            profilePicture: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            companyId: null,
            parentUserId: null,
            hierarchyLevel: 0,
            hierarchyPath: '',
            commissionPercentage: '0',
            totalClients: 0,
            activeClients: 0,
            lastLoginAt: null,
            userId: userData.id,
          };
          console.log('⚠️ Using minimal user data:', minimalUser.role);
          setUser(minimalUser);
        }

        // After successful password login, prompt PIN/biometric setup if not yet configured
        const alreadySetUp = await hasBiometricToken();
        if (!alreadySetUp) {
          setPendingPinSetup(variables.identifier);
        }
      }
    },
    onError: error => {
      console.error('Login failed:', handleApiError(error));
    },
  });
};
