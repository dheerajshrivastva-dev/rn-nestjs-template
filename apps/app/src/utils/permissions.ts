/**
 * Permissions Utility
 *
 * Uses react-native-permissions for unified iOS + Android permission handling.
 *
 * - Startup: requestAllPermissions() requests everything sequentially
 * - Required (location, camera): loops — if denied shows alert then re-asks;
 *   if permanently denied, directs to Settings
 * - Optional (notifications, storage): asked once, no retry loop
 * - Safe to call from anywhere (e.g. before opening camera)
 */

import {Alert, Platform} from 'react-native';
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
  requestMultiple,
} from 'react-native-permissions';
import type {Permission} from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Shows a denial alert. If permanently denied → Open Settings button.
 * Otherwise → Allow button that retries the native dialog.
 */
const showDeniedAlert = (
  title: string,
  message: string,
  onRetry: () => void,
  permanent: boolean,
) => {
  Alert.alert(title, message, [
    permanent
      ? {text: 'Open Settings', onPress: () => openSettings()}
      : {text: 'Allow', onPress: onRetry},
    {text: 'Cancel', style: 'cancel'},
  ]);
};

/**
 * Requests a single required permission. Loops until granted or permanent denial.
 * On permanent denial, shows alert with "Open Settings" button.
 */
const requestRequired = async (
  permission: Permission,
  title: string,
  message: string,
): Promise<boolean> => {
  const doRequest = async (): Promise<boolean> => {
    const result = await request(permission);

    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) return true;

    const permanent = result === RESULTS.BLOCKED;

    return new Promise(resolve => {
      showDeniedAlert(title, message, () => resolve(doRequest()), permanent);
    });
  };

  return doRequest();
};

// ─── Individual permission requestors ─────────────────────────────────────────

/**
 * Requests LOCATION permission.
 * Required — loops until granted or user opens Settings.
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

  return requestRequired(
    permission,
    'Location Required',
    'Location is used to record where client sessions are created for security and audit purposes. Please allow it to continue.',
  );
};

/**
 * Requests CAMERA permission.
 * Required — loops until granted or user opens Settings.
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  const permission =
    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

  return requestRequired(
    permission,
    'Camera Required',
    'Camera access is needed to scan barcodes and take photos for client profiles and documents. Please allow it to continue.',
  );
};

/**
 * Requests NOTIFICATION permission.
 * - Android 13+ (API 33+): runtime permission (POST_NOTIFICATIONS)
 * - Android 7-12 (API 24-32): granted automatically
 * - iOS: uses Firebase messaging (separate from react-native-permissions)
 * Optional — does not loop on denial.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  // Android 13+ only (Platform.Version is string on iOS, cast to be safe)
  if (Number(Platform.Version) < 33) return true;

  // POST_NOTIFICATIONS not in typed constants for this RN version — use string literal
  const result = await request('android.permission.POST_NOTIFICATIONS' as Permission);
  return result === RESULTS.GRANTED;
};

/**
 * Requests STORAGE / MEDIA permissions (Android only, version-aware).
 *
 * API 34+ (Android 14+): READ_MEDIA_VISUAL_USER_SELECTED (photo picker)
 * API 33   (Android 13) : READ_MEDIA_IMAGES + READ_MEDIA_VIDEO
 * API 24-32(Android 7-12): READ_EXTERNAL_STORAGE
 *
 * On iOS photo library access is requested by the image picker on first use.
 * Optional — does not loop on denial.
 */
export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  if (Platform.Version >= 34) {
    const result = await request(PERMISSIONS.ANDROID.READ_MEDIA_VISUAL_USER_SELECTED);
    return result === RESULTS.GRANTED;
  }

  if (Platform.Version >= 33) {
    const results = await requestMultiple([
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
      PERMISSIONS.ANDROID.READ_MEDIA_VIDEO,
    ]);
    return Object.values(results).every(
      r => r === RESULTS.GRANTED || r === RESULTS.LIMITED,
    );
  }

  // Android 7-12 (API 24-32)
  const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
  return result === RESULTS.GRANTED;
};

// ─── Startup ──────────────────────────────────────────────────────────────────

/**
 * Call once at app startup (after splash hide).
 * Requests all permissions sequentially so dialogs don't stack.
 * Required (location, camera) will re-prompt until granted or Settings opened.
 * Optional (notifications, storage) asked once silently.
 */
export const requestAllPermissions = async (): Promise<void> => {
  await requestLocationPermission();
  await requestCameraPermission();
  await requestNotificationPermission();
  await requestStoragePermission();
};

/**
 * Checks if a permission is currently granted without prompting.
 * Useful for conditional UI (e.g. show/hide location-dependent features).
 */
export const isPermissionGranted = async (permission: Permission): Promise<boolean> => {
  const result = await check(permission);
  return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
};
