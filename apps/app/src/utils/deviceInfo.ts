/**
 * Device Info Utility
 * Collects device information for session management
 */

import {Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import type {DeviceInfo as DeviceInfoType} from '../api/types';

/**
 * Attempts to get GPS coordinates WITHOUT prompting the user for permission.
 * Only returns coords if permission was already granted previously.
 * Returns null if not permitted or unavailable.
 */
const getLocationIfPermitted = (): Promise<{latitude: number; longitude: number} | null> => {
  return new Promise(resolve => {
    // navigator.geolocation is available in React Native's JS environment
    // Short timeout so login is never blocked by geolocation
    const timeout = setTimeout(() => resolve(null), 3000);

    Geolocation.getCurrentPosition(
      position => {
        clearTimeout(timeout);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        clearTimeout(timeout);
        resolve(null); // Permission denied or unavailable — silent fail
      },
      {
        enableHighAccuracy: false,
        timeout: 2500,
        maximumAge: 5 * 60 * 1000, // Accept a cached position up to 5 min old
      },
    );
  });
};

/**
 * Collects comprehensive device information for authentication
 * Used in login and session management
 */
export const getDeviceInfo = async (): Promise<DeviceInfoType> => {
  try {
    const [deviceName, userAgent, uniqueId, location] = await Promise.all([
      DeviceInfo.getDeviceName(),
      DeviceInfo.getUserAgent(),
      DeviceInfo.getUniqueId(),
      getLocationIfPermitted(),
    ]);

    const deviceType = await getDeviceType();

    return {
      deviceName,
      deviceType,
      deviceFingerprint: uniqueId,
      userAgent,
      // Attach GPS coords only if permission was already granted — never prompt
      ...(location ? {latitude: location.latitude, longitude: location.longitude} : {}),
      // NOTE: ipAddress is automatically extracted by the backend from the request
      // This ensures accurate IP detection (handling proxies, NAT, etc.)
      // Do not send ipAddress from client
    };
  } catch (error) {
    console.error('Failed to collect device info:', error);
    // Return minimal device info as fallback
    return {
      deviceName: 'Unknown Device',
      deviceType: Platform.OS,
      userAgent: `forge-app/${Platform.OS}`,
    };
  }
};

/**
 * Determines device type (mobile, tablet, desktop)
 */
const getDeviceType = async (): Promise<string> => {
  const isTablet = DeviceInfo.isTablet();

  if (isTablet) {
    return 'tablet';
  }

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return 'mobile';
  }

  return 'desktop';
};
