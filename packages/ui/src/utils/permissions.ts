/**
 * Permission Utilities
 * Production-grade permission handling for React Native
 * Handles camera, photo library, and storage permissions with graceful fallbacks
 */

import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';

export type PermissionType = 'camera' | 'photoLibrary' | 'storage';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  shouldShowSettings: boolean;
}

/**
 * Get the platform-specific permission constant
 * Handles Android 14+ partial photo access (READ_MEDIA_VISUAL_USER_SELECTED)
 */
const getPermissionConstant = (type: PermissionType): Permission | null => {
  if (Platform.OS === 'ios') {
    switch (type) {
      case 'camera':
        return PERMISSIONS.IOS.CAMERA;
      case 'photoLibrary':
        return PERMISSIONS.IOS.PHOTO_LIBRARY;
      default:
        return null;
    }
  } else if (Platform.OS === 'android') {
    const apiLevel = Platform.Version;

    switch (type) {
      case 'camera':
        return PERMISSIONS.ANDROID.CAMERA;
      case 'photoLibrary':
        // Android 14+ (API 34+) uses READ_MEDIA_VISUAL_USER_SELECTED for partial access
        // This provides better privacy by allowing users to select specific photos
        if (apiLevel >= 34) {
          return PERMISSIONS.ANDROID.READ_MEDIA_VISUAL_USER_SELECTED;
        }
        // Android 13 (API 33) uses READ_MEDIA_IMAGES
        if (apiLevel >= 33) {
          return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        }
        // Android 10-12 uses READ_EXTERNAL_STORAGE
        return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      case 'storage':
        // Android 14+ uses visual user selected for media
        if (apiLevel >= 34) {
          return PERMISSIONS.ANDROID.READ_MEDIA_VISUAL_USER_SELECTED;
        }
        // Android 13+ uses READ_MEDIA_IMAGES
        if (apiLevel >= 33) {
          return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        }
        return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      default:
        return null;
    }
  }

  return null;
};

/**
 * Get user-friendly permission name for messages
 */
const getPermissionName = (type: PermissionType): string => {
  switch (type) {
    case 'camera':
      return 'Camera';
    case 'photoLibrary':
      return 'Photo Library';
    case 'storage':
      return 'Storage';
    default:
      return 'Permission';
  }
};

/**
 * Check if permission is granted
 */
export const checkPermission = async (type: PermissionType): Promise<boolean> => {
  try {
    const permission = getPermissionConstant(type);

    if (!permission) {
      // Web or unsupported platform - assume granted
      return true;
    }

    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error(`Error checking ${type} permission:`, error);
    return false;
  }
};

/**
 * Request permission with proper fallbacks and user guidance
 */
export const requestPermission = async (
  type: PermissionType,
  options?: {
    rationale?: string;
    onDenied?: () => void;
    onBlocked?: () => void;
  }
): Promise<PermissionResult> => {
  try {
    const permission = getPermissionConstant(type);
    const permissionName = getPermissionName(type);

    if (!permission) {
      // Web or unsupported platform - assume granted
      return { granted: true, canAskAgain: false, shouldShowSettings: false };
    }

    // First check current status
    const currentStatus = await check(permission);

    if (currentStatus === RESULTS.GRANTED) {
      return { granted: true, canAskAgain: false, shouldShowSettings: false };
    }

    if (currentStatus === RESULTS.BLOCKED) {
      // Permission permanently denied - guide user to settings
      return handleBlockedPermission(permissionName, options?.onBlocked);
    }

    // Show rationale if provided (Android)
    if (Platform.OS === 'android' && options?.rationale) {
      const shouldContinue = await showPermissionRationale(
        permissionName,
        options.rationale
      );

      if (!shouldContinue) {
        return { granted: false, canAskAgain: true, shouldShowSettings: false };
      }
    }

    // Request permission
    const result = await request(permission);

    switch (result) {
      case RESULTS.GRANTED:
        return { granted: true, canAskAgain: false, shouldShowSettings: false };

      case RESULTS.DENIED:
        options?.onDenied?.();
        return { granted: false, canAskAgain: true, shouldShowSettings: false };

      case RESULTS.BLOCKED:
        return handleBlockedPermission(permissionName, options?.onBlocked);

      default:
        return { granted: false, canAskAgain: false, shouldShowSettings: false };
    }
  } catch (error) {
    console.error(`Error requesting ${type} permission:`, error);
    return { granted: false, canAskAgain: false, shouldShowSettings: false };
  }
};

/**
 * Show rationale dialog before requesting permission (Android)
 */
const showPermissionRationale = (
  permissionName: string,
  rationale: string
): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      `${permissionName} Permission Required`,
      rationale,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Continue',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false }
    );
  });
};

/**
 * Handle blocked permission - guide user to settings
 */
const handleBlockedPermission = (
  permissionName: string,
  onBlocked?: () => void
): Promise<PermissionResult> => {
  onBlocked?.();

  return new Promise((resolve) => {
    Alert.alert(
      `${permissionName} Permission Required`,
      `${permissionName} access is required for this feature. Please enable it in your device settings.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () =>
            resolve({ granted: false, canAskAgain: false, shouldShowSettings: true }),
        },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
            resolve({ granted: false, canAskAgain: false, shouldShowSettings: true });
          },
        },
      ],
      { cancelable: false }
    );
  });
};

/**
 * Request multiple permissions at once
 */
export const requestMultiplePermissions = async (
  permissions: PermissionType[],
  options?: {
    rationale?: string;
    onDenied?: () => void;
    onBlocked?: () => void;
  }
): Promise<Record<PermissionType, PermissionResult>> => {
  const results: Record<string, PermissionResult> = {};

  for (const permission of permissions) {
    results[permission] = await requestPermission(permission, options);
  }

  return results as Record<PermissionType, PermissionResult>;
};

/**
 * Convenience function for camera + photo library (typical use case)
 */
export const requestCameraAndLibraryPermissions = async (): Promise<{
  camera: PermissionResult;
  photoLibrary: PermissionResult;
}> => {
  const camera = await requestPermission('camera', {
    rationale: 'Camera access is needed to take photos.',
  });

  const photoLibrary = await requestPermission('photoLibrary', {
    rationale: 'Photo library access is needed to select photos.',
  });

  return { camera, photoLibrary };
};

/**
 * Check if we have any photo access (either camera or library)
 */
export const hasAnyPhotoAccess = async (): Promise<boolean> => {
  const [cameraGranted, libraryGranted] = await Promise.all([
    checkPermission('camera'),
    checkPermission('photoLibrary'),
  ]);

  return cameraGranted || libraryGranted;
};
