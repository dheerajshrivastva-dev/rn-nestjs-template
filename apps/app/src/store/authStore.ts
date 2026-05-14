/**
 * Auth Store - Zustand
 * Manages authentication state (tokens, user, session)
 */

import {create} from 'zustand';
import {UserRole, type User} from '../api/types';
import {TokenManager} from '../api/client';
import {clearAllBiometricData, hasBiometricToken} from '../utils/biometricStorage';

// ============================================================================
// Store Types
// ============================================================================

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  sessionExpired: boolean; // True when kicked out by a 401 (show "session expired" on login)
  pendingRoute: { name: string; params?: Record<string, any> } | null; // Route to restore after re-login
  tempToken: string | null; // For 2FA flow
  forgotPasswordToken: string | null; // tempToken from forgot-password, survives back navigation
  hasBiometricSetup: boolean; // Is biometric registered for this device?
  /**
   * True when tokens were restored from storage on app start but biometric
   * has NOT yet been verified this session. RootNavigator shows the
   * BiometricLoginScreen until the user verifies. Once verified (PIN / fingerprint
   * / password login), set to false.
   */
  pendingBiometricVerification: boolean;
  /**
   * True when the user just logged in with password but hasn't gone through
   * PinSetupScreen yet this session. RootNavigator shows PinSetupScreen.
   */
  pendingPinSetup: boolean;
  pendingPinSetupIdentifier: string;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setTempToken: (tempToken: string | null) => Promise<void>;
  setForgotPasswordToken: (token: string | null) => void;
  setHasBiometricSetup: (value: boolean) => void;
  setBiometricVerified: () => void;
  setPendingPinSetup: (identifier: string) => void;
  setPendingPinSetupIdentifier: (identifier: string) => void;
  clearPendingPinSetup: () => void;
  setPendingRoute: (route: { name: string; params?: Record<string, any> } | null) => void;
  clearSessionExpired: () => void;
  logout: (reason?: 'session_expired') => Promise<void>;
  initialize: () => Promise<void>;
}

// ============================================================================
// Auth Store
// ============================================================================

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  sessionExpired: false,
  pendingRoute: null,
  tempToken: null,
  forgotPasswordToken: null,
  hasBiometricSetup: false,
  pendingBiometricVerification: false,
  pendingPinSetup: false,
  pendingPinSetupIdentifier: '',

  // Set authenticated user
  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  // Set authentication tokens
  setTokens: async (accessToken: string, refreshToken: string) => {
    await TokenManager.setAccessToken(accessToken);
    await TokenManager.setRefreshToken(refreshToken);
    set({isAuthenticated: true});
  },

  // Set temporary token (for 2FA flow)
  setTempToken: async (tempToken: string | null) => {
    await TokenManager.setTempToken(tempToken);
    set({tempToken});
  },

  // Set temp token from forgot-password flow (survives back navigation within session)
  setForgotPasswordToken: (token: string | null) => set({forgotPasswordToken: token}),

  // Set biometric setup flag
  setHasBiometricSetup: (value: boolean) => {
    set({hasBiometricSetup: value});
  },

  // Called after successful PIN / fingerprint verification — unblocks the app
  setBiometricVerified: () => {
    set({pendingBiometricVerification: false});
  },

  // Called after password login when biometric is NOT yet set up — shows PinSetupScreen
  setPendingPinSetup: (identifier: string) => {
    set({pendingPinSetup: true, pendingPinSetupIdentifier: identifier});
  },

  // Saves identifier for the 2FA path (so useComplete2FA can trigger PIN setup after 2FA)
  setPendingPinSetupIdentifier: (identifier: string) => {
    set({pendingPinSetupIdentifier: identifier});
  },

  // Called when PinSetupScreen completes or is skipped
  clearPendingPinSetup: () => {
    set({pendingPinSetup: false, pendingPinSetupIdentifier: ''});
  },

  setPendingRoute: (route) => {
    set({pendingRoute: route});
  },

  // Clears the sessionExpired banner after user acknowledges it on the login screen
  clearSessionExpired: () => {
    set({sessionExpired: false, pendingRoute: null});
  },

  // Logout — clears tokens, biometric key pair, FCM token, WS connection, and all auth state.
  // Pass reason='session_expired' when called by the 401 interceptor so the login screen
  // can show a "Session timed out" message.
  logout: async (reason?: 'session_expired') => {
    // Lazy imports to avoid circular dependency — these services import apiClient
    const [{ default: NotificationService }, { default: SocketService }] = await Promise.all([
      import('../services/NotificationService'),
      import('../services/SocketService'),
    ]);
    SocketService.disconnect();

    const isSessionExpiry = reason === 'session_expired';
    await Promise.allSettled([
      TokenManager.clearTokens(),
      // On session expiry (kicked by server), keep the biometric key pair intact so
      // the user can immediately log back in with their fingerprint.
      // On explicit logout, wipe it — next login must re-register biometric.
      isSessionExpiry ? Promise.resolve() : clearAllBiometricData(),
      NotificationService.cleanup(),
    ]);
    set({
      user: null,
      isAuthenticated: false,
      sessionExpired: isSessionExpiry,
      pendingRoute: null,
      tempToken: null,
      hasBiometricSetup: isSessionExpiry ? useAuthStore.getState().hasBiometricSetup : false,
      pendingBiometricVerification: false,
      pendingPinSetup: false,
      pendingPinSetupIdentifier: '',
    });
  },

  // Initialize auth state (called on app start)
  initialize: async () => {
    // Wire up session expiry — when the interceptor clears tokens after a 401,
    // it fires this so the store resets and RootNavigator redirects to login.
    TokenManager.onSessionExpired(() => {
      useAuthStore.getState().logout('session_expired');
    });

    // Restore tokens from AsyncStorage and check biometric setup in parallel
    const [, biometricSetup] = await Promise.all([
      TokenManager.initializeFromStorage(),
      hasBiometricToken(),
    ]);

    const hasToken = TokenManager.hasAccessToken();

    // If tokens exist but biometric/PIN quick login is NOT set up → force fresh
    // login every cold start by clearing the stored tokens.
    if (hasToken && !biometricSetup) {
      await TokenManager.clearTokens();
    }

    // If tokens exist AND biometric is registered → require verification before
    // entering the app (every cold start / app restart)
    const pendingBiometricVerification = hasToken && biometricSetup;

    set({
      isAuthenticated: hasToken && biometricSetup,
      isInitialized: true,
      hasBiometricSetup: biometricSetup,
      pendingBiometricVerification,
    });
  },
}));

// ============================================================================
// Selectors (for better performance)
// ============================================================================

export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) =>
  state.isAuthenticated;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectTempToken = (state: AuthState) => state.tempToken;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectHasBiometricSetup = (state: AuthState) => state.hasBiometricSetup;
export const selectSessionExpired = (state: AuthState) => state.sessionExpired;
export const selectPendingRoute = (state: AuthState) => state.pendingRoute;
export const selectPendingBiometricVerification = (state: AuthState) => state.pendingBiometricVerification;
export const selectPendingPinSetup = (state: AuthState) => state.pendingPinSetup;
export const selectPendingPinSetupIdentifier = (state: AuthState) => state.pendingPinSetupIdentifier;
export const selectIsSuperAdmin = (state: AuthState) =>
  state.user?.role === UserRole.SUPER_ADMIN;

// Backwards compatibility selectors
/** @deprecated Use selectUser instead */
export const selectAgent = selectUser;
/** @deprecated Use selectUserRole instead */
