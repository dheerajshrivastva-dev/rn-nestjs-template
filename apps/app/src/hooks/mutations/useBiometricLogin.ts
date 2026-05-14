/**
 * useBiometricLogin Mutation
 *
 * Called on subsequent app launches when biometric is set up.
 * Uses a challenge-response flow with hardware-bound key pair:
 *
 *  1. GET /auth/biometric-challenge  → server returns a random nonce
 *  2. Sign the nonce with the device private key (OS shows biometric prompt)
 *  3. POST /auth/biometric-login { challenge, signature, deviceFingerprint, ... }
 *  4. Server verifies signature against stored public key → issues tokens
 *
 * The private key never leaves the device (Android Keystore / Secure Enclave).
 */

import {useMutation, useQueryClient} from '@tanstack/react-query';
import DeviceInfo from 'react-native-device-info';

import apiClient, {handleApiError} from '../../api/client';
import {AUTH_ENDPOINTS, USER_ENDPOINTS} from '../../api/endpoints';
import type {
  BiometricChallengeResponse,
  BiometricLoginRequest,
  BiometricLoginResponse,
  UserMeResponse,
  User,
} from '../../api/types';
import {useAuthStore} from '../../store/authStore';
import {clearAllBiometricData, signBiometricChallenge} from '../../utils/biometricStorage';
import {getDeviceInfo} from '../../utils/deviceInfo';
import {parseIdentifier} from '../../utils/parseIdentifier';
import {queryKeys} from '../queryKeys';

// Backend messages that indicate the biometric registration no longer exists server-side
const BIOMETRIC_REVOKED_MESSAGES = [
  'Biometric not registered for this device',
  'Biometric registration expired',
];

interface BiometricLoginInput {
  identifier: string; // phone / email / userId stored at setup time
}

export const useBiometricLogin = () => {
  const {setUser, setTokens, setBiometricVerified} = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.auth.biometricToken,
    mutationFn: async ({
      identifier,
    }: BiometricLoginInput): Promise<BiometricLoginResponse> => {
      const [deviceFingerprint, deviceInfo] = await Promise.all([
        DeviceInfo.getUniqueId(),
        getDeviceInfo(),
      ]);

      const identifierFields = parseIdentifier(identifier);

      // Step 1: fetch a one-time challenge from the server
      const challengeRes = await apiClient.post<BiometricChallengeResponse>(
        AUTH_ENDPOINTS.BIOMETRIC_CHALLENGE,
        {
          ...identifierFields,
          deviceFingerprint,
        },
      );
      const challenge = challengeRes.data.challenge;

      // Step 2: sign the challenge — OS biometric prompt fires here
      const signature = await signBiometricChallenge(
        challenge,
        'Touch the fingerprint sensor to sign in',
      );
      if (!signature) {
        throw new Error('Biometric authentication cancelled or failed');
      }

      // Step 3: send the signature to the server for verification
      const payload: BiometricLoginRequest = {
        ...identifierFields,
        deviceFingerprint,
        challenge,
        signature,
        deviceInfo,
      };

      const response = await apiClient.post<BiometricLoginResponse>(
        AUTH_ENDPOINTS.BIOMETRIC_LOGIN,
        payload,
      );
      return response.data;
    },
    onSuccess: async data => {
      // Biometric was accepted — clear the app-restart verification gate
      setBiometricVerified();

      if (data.accessToken && data.refreshToken) {
        await setTokens(data.accessToken, data.refreshToken);

        try {
          const profileResponse = await apiClient.get<UserMeResponse>(USER_ENDPOINTS.GET_ME);
          setUser(profileResponse.data);
          queryClient.setQueryData(queryKeys.auth.me, profileResponse.data);
        } catch (error) {
          console.error('Failed to fetch profile after biometric login:', handleApiError(error));
          if (data.user) {
            const minimalUser: User = {
              ...data.user,
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
              userId: data.user.id,
            };
            setUser(minimalUser);
          }
        }
      }
    },
    onError: async error => {
      const apiError = handleApiError(error);
      console.error('Biometric login failed:', apiError.message);

      // If the server no longer has this device's biometric registration
      // (revoked remotely or expired), clear the local keypair so the app
      // falls back to password login instead of looping.
      const isRevoked = BIOMETRIC_REVOKED_MESSAGES.some(m => apiError.message.includes(m));
      if (isRevoked) {
        await clearAllBiometricData();
        useAuthStore.getState().setHasBiometricSetup(false);
      }
    },
  });
};
