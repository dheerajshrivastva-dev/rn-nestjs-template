/**
 * API Client - Axios instance with interceptors
 * Handles authentication, token refresh, and error handling
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import Toast from 'react-native-toast-message';
import { useNetworkStore } from '../store/networkStore';
import {API_BASE_URL, AUTH_ENDPOINTS, USER_ENDPOINTS} from './endpoints';
import type {ApiError, RefreshTokenResponse} from './types';

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@forge:accessToken',
  REFRESH_TOKEN: '@forge:refreshToken',
  TEMP_TOKEN: '@forge:tempToken',
} as const;

// ============================================================================
// Token Management with AsyncStorage Persistence
// ============================================================================

let accessToken: string | null = null;
let refreshToken: string | null = null;
let tempToken: string | null = null;

// Called by authStore.initialize() to hook into session expiry
let onSessionExpired: (() => void) | null = null;

export const TokenManager = {
  /** Register a callback to be invoked when the session is forcibly cleared (e.g. 401 after refresh failure) */
  onSessionExpired: (cb: () => void) => {
    onSessionExpired = cb;
  },
  getAccessToken: (): string | null => accessToken,
  setAccessToken: async (token: string | null) => {
    accessToken = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  },

  getRefreshToken: (): string | null => refreshToken,
  setRefreshToken: async (token: string | null) => {
    refreshToken = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  },

  getTempToken: (): string | null => tempToken,
  setTempToken: async (token: string | null) => {
    tempToken = token;
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TEMP_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.TEMP_TOKEN);
    }
  },

  clearTokens: async (notifyExpiry = false) => {
    accessToken = null;
    refreshToken = null;
    tempToken = null;
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.TEMP_TOKEN,
    ]);
    if (notifyExpiry) {
      onSessionExpired?.();
    }
  },

  // Initialize tokens from storage on app start
  initializeFromStorage: async () => {
    const [storedAccessToken, storedRefreshToken, storedTempToken] =
      await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.TEMP_TOKEN,
      ]);

    accessToken = storedAccessToken[1];
    refreshToken = storedRefreshToken[1];
    tempToken = storedTempToken[1];
  },

  hasAccessToken: (): boolean => !!accessToken,
  hasTempToken: (): boolean => !!tempToken,
};

// ============================================================================
// Axios Instance
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies (refresh token)
  paramsSerializer: {
    serialize: (params) => {
      // Filter out undefined/null values before serialization
      const cleanedParams = Object.fromEntries(
        Object.entries(params || {}).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );
      // Use URLSearchParams to properly serialize params (handles arrays correctly)
      return new URLSearchParams(cleanedParams).toString();
    },
  },
});

// ============================================================================
// cURL Logger for Development
// ============================================================================

/**
 * Generates a cURL command from an axios request config
 * Useful for debugging API requests in development
 */
const generateCurlCommand = (config: InternalAxiosRequestConfig): string => {
  const method = (config.method || 'get').toUpperCase();

  // Build base URL
  let url = config.baseURL
    ? `${config.baseURL}${config.url || ''}`
    : config.url || '';

  // Add query params directly to URL (avoids double-encoding)
  if (config.params) {
    const params = new URLSearchParams(config.params).toString();
    if (params) {
      url += `?${params}`;
    }
  }

  let curlCommand = `curl -X ${method} "${url}"`;

  // Add headers
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        // Escape double quotes in header values
        const escapedValue = value.replace(/"/g, '\\"');
        curlCommand += ` \\\n  -H "${key}: ${escapedValue}"`;
      }
    });
  }

  // Add request body
  if (config.data) {
    const dataString =
      typeof config.data === 'string'
        ? config.data
        : JSON.stringify(config.data);
    // Escape single quotes for shell
    const escapedData = dataString.replace(/'/g, "'\\''");
    curlCommand += ` \\\n  -d '${escapedData}'`;
  }

  return curlCommand;
};

// ============================================================================
// Request Interceptor - Add Auth Token
// ============================================================================

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip network check for internal probes (NetworkBanner health checks)
    if ((config as any)._skipNetworkCheck) {
      return config;
    }

    // Block request immediately if device has no connectivity
    const netState = await NetInfo.fetch();
    const isConnected = !!(netState.isConnected && netState.isInternetReachable !== false);
    if (!isConnected) {
      useNetworkStore.getState().setConnected(false);
      const error = new Error('No internet connection') as any;
      error.code = 'NETWORK_OFFLINE';
      error.isNetworkOffline = true;
      return Promise.reject(error);
    }

    // Use temp token for 2FA completion endpoint
    if (config.url === AUTH_ENDPOINTS.COMPLETE_2FA) {
      const token = TokenManager.getTempToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Log cURL in development
      if (__DEV__) {
        console.log('\n🌐 API Request (cURL):\n');
        console.log(generateCurlCommand(config));
        console.log('\n');
      }
      return config;
    }

    // Use access token for all other authenticated requests
    // If no access token, fallback to temp token
    // Skip if Authorization was already explicitly set by the caller (e.g. 2FA enable flow)
    if (!config.headers.Authorization) {
      const storedAccessToken = TokenManager.getAccessToken();
      const storedTempToken = TokenManager.getTempToken();
      const token = storedAccessToken || storedTempToken;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Log detailed request info in development
    if (__DEV__) {
      console.log('\n🌐 API Request Details:');
      console.log('URL:', config.url);
      console.log('Base URL:', config.baseURL);
      console.log('Params:', config.params);
      console.log('Full URL will be:', `${config.baseURL || ''}${config.url || ''}`);
      console.log('\n🌐 API Request (cURL):\n');
      console.log(generateCurlCommand(config));
      console.log('\n');
    }

    return config;
  },
  error => {
    console.error('🌐 API Request Error:', error)
    return Promise.reject(error);
  },
);

// ============================================================================
// Response Interceptor - Handle Token Refresh
// ============================================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  response => {
    // Reset server reachability on any successful response
    const store = useNetworkStore.getState();
    if (!store.isServerReachable) {
      store.setServerReachable(true);
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Log error details in development
    if (__DEV__) {
      console.error('🌐 API Response Error:', {
        url: originalRequest?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Show alert for non-401 errors (401 will be handled by auth flow)
    if (error.response?.status !== 401) {
      // Detect network/server-unreachable errors — banner handles these, no alert needed
      const isNetworkError = !error.response && (
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'NETWORK_OFFLINE' ||
        (error as any).isNetworkOffline === true ||
        error.message === 'Network Error'
      );

      if (isNetworkError) {
        // Mark server as unreachable so the banner shows
        const {isConnected} = useNetworkStore.getState();
        if (isConnected) {
          useNetworkStore.getState().setServerReachable(false);
        }
        // Don't show the error dialog — the NetworkBanner handles this visually
      } else {
        const rawMessage = error.response?.data?.message;
        const errorMessage = Array.isArray(rawMessage)
          ? rawMessage.join('\n')
          : rawMessage || error.message || 'An error occurred';
        Toast.show({
          type: 'error',
          text1: errorMessage,
        });
      }
    }

    // If error is not 401 or request doesn't exist, reject immediately
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Endpoints protected by TempTokenGuard — a 401 here means bad OTP/token,
    // NOT an expired session. Never trigger logout for these.
    const TEMP_TOKEN_ENDPOINTS = [
      AUTH_ENDPOINTS.COMPLETE_2FA,
      USER_ENDPOINTS.VERIFY_EMAIL,
      USER_ENDPOINTS.ENABLE_EMAIL_OTP_2FA,
      USER_ENDPOINTS.ENABLE_MOBILE_OTP_2FA,
    ];
    if (TEMP_TOKEN_ENDPOINTS.includes(originalRequest.url as any)) {
      return Promise.reject(error);
    }

    // Don't retry for login, refresh, or already retried requests
    if (
      originalRequest.url === AUTH_ENDPOINTS.LOGIN ||
      originalRequest.url === AUTH_ENDPOINTS.REFRESH ||
      originalRequest._retry
    ) {
      // Only notify session expiry if it's not a login failure (wrong password)
      const isSessionExpiry = originalRequest.url !== AUTH_ENDPOINTS.LOGIN;
      await TokenManager.clearTokens(isSessionExpiry);
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({resolve, reject});
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshTokenValue = TokenManager.getRefreshToken();

    // No refresh token available
    if (!refreshTokenValue) {
      processQueue(new Error('No refresh token available'), null);
      isRefreshing = false;
      await TokenManager.clearTokens(true);
      return Promise.reject(error);
    }

    try {
      // Attempt to refresh the token
      const response = await axios.post<RefreshTokenResponse>(
        `${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH}`,
        {refreshToken: refreshTokenValue},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const {accessToken: newAccessToken, refreshToken: newRefreshToken} =
        response.data;

      // Update tokens
      await TokenManager.setAccessToken(newAccessToken);
      await TokenManager.setRefreshToken(newRefreshToken);

      // Update the failed request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Process queued requests
      processQueue(null, newAccessToken);

      isRefreshing = false;

      // Retry the original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed - clear tokens and reject all queued requests
      processQueue(refreshError as Error, null);
      isRefreshing = false;
      await TokenManager.clearTokens(true);

      return Promise.reject(refreshError);
    }
  },
);

// ============================================================================
// API Error Handler
// ============================================================================

export const handleApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;

    if (axiosError.response) {
      // Server responded with error
      const rawMessage = axiosError.response.data?.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join('\n')
        : rawMessage || 'An error occurred while processing your request';
      return {
        message,
        statusCode: axiosError.response.status,
        error: axiosError.response.data?.error,
      };
    } else if (axiosError.request) {
      // Request made but no response — mark server as unreachable
      useNetworkStore.getState().setServerReachable(false);
      return {
        message: 'Unable to connect to server. Please check your connection.',
        statusCode: 0,
        error: 'NETWORK_ERROR',
      };
    }
  }

  // Unknown error
  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
    error: 'UNKNOWN_ERROR',
  };
};

// ============================================================================
// Export
// ============================================================================

export default apiClient;
