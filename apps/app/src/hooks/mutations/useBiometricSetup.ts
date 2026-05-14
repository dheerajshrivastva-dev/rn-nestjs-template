/**
 * useBiometricSetup Mutation
 *
 * Called once after a successful password login to register this device for
 * biometric login using a hardware-bound key pair.
 *
 * Flow:
 *  1. Generate RSA key pair via react-native-biometrics (private key stays in
 *     Android Keystore / iOS Secure Enclave — never transmitted).
 *  2. POST /auth/biometric-setup with the public key + device fingerprint.
 *  3. Store the identifier locally so the login screen can pre-fill it.
 */

import {useMutation} from '@tanstack/react-query';
import DeviceInfo from 'react-native-device-info';

import apiClient from '../../api/client';
import {AUTH_ENDPOINTS} from '../../api/endpoints';
import type {BiometricSetupRequest, BiometricSetupResponse} from '../../api/types';
import {createBiometricKeyPair, storeIdentifier} from '../../utils/biometricStorage';

export const useBiometricSetup = () => {
  return useMutation({
    mutationKey: ['biometric-setup'],
    mutationFn: async (_identifier: string): Promise<BiometricSetupResponse> => {
      const [deviceFingerprint, deviceName, publicKey] = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getDeviceName(),
        createBiometricKeyPair(),
      ]);

      const payload: BiometricSetupRequest = {deviceFingerprint, deviceName, publicKey};
      const response = await apiClient.post<BiometricSetupResponse>(
        AUTH_ENDPOINTS.BIOMETRIC_SETUP,
        payload,
      );
      return response.data;
    },
    onSuccess: async (_data, identifier) => {
      // Store identifier so it can be pre-filled on the biometric login screen
      await storeIdentifier(identifier);
    },
    onError: error => {
      console.error('Biometric setup failed:', error);
    },
  });
};
