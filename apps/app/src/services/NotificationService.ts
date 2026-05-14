/**
 * NotificationService - Firebase Cloud Messaging (FCM) Integration
 *
 * Handles:
 * - FCM token registration and refresh
 * - Foreground notification display
 * - Background / quit notification tap → deep-link navigation
 * - Role-based screen routing via fcmMapping
 *
 * Usage:
 *   NotificationService.init(navigationRef, userRole);
 *   NotificationService.cleanup();
 */

import { AppState } from 'react-native';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  setBackgroundMessageHandler,
  requestPermission,
  AuthorizationStatus,
  type FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFCMScreenMapping } from '../navigation/configs/fcmMapping';
import type { FCMNotificationType, NotificationPayload } from '../navigation/types';
import type { UserRole } from '../api/types';
import apiClient from '../api/client';
import { NOTIFICATIONS_ENDPOINTS } from '../api/endpoints';
import { queryClient } from '../providers/QueryProvider';
import { notificationKeys } from '../hooks/queries/useNotifications';

// ─── Storage Keys ────────────────────────────────────────────────────────────

const FCM_TOKEN_KEY = '@forge:fcmToken';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavigationRef = React.RefObject<{
  navigate: (screen: string, params?: unknown) => void;
  isReady: () => boolean;
} | null>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse a raw FCM RemoteMessage into our typed NotificationPayload.
 * The backend must include `type` in the data payload.
 */
function parseMessage(
  message: FirebaseMessagingTypes.RemoteMessage,
): NotificationPayload | null {
  const data = message.data ?? {};
  const type = data.type as FCMNotificationType | undefined;

  if (!type) {
    console.warn('[FCM] Received message without `type` in data payload', message);
    return null;
  }

  const str = (v: string | object | undefined): string | undefined =>
    typeof v === 'string' ? v : undefined;

  return {
    type,
    title: message.notification?.title ?? str(data.title),
    body: message.notification?.body ?? str(data.body),
    deepLink: str(data.deepLink),
    data: {
      clientId: str(data.clientId),
      clientName: str(data.clientName),
      orderId: str(data.orderId),
      userId: str(data.userId),
      companyId: str(data.companyId),
      transferId: str(data.transferId),
      deviceId: str(data.deviceId),
    },
  };
}

/**
 * Navigate to the correct screen based on notification type + user role.
 *
 * Always navigates via the "Private" root screen so React Navigation can
 * resolve nested screens inside role drawers (SuperAdminDrawer, SuperDrawer, etc.).
 *
 * If the Private stack isn't mounted yet (quit state / not logged in),
 * stores the intent — RootNavigator flushes it via flushPendingIntent()
 * once authentication is confirmed.
 */
function routeNotification(
  payload: NotificationPayload,
  navigationRef: NavigationRef,
  userRole: UserRole,
) {
  const mapping = getFCMScreenMapping(payload.type, userRole);
  if (!mapping) return;

  const params = mapping.getParams(payload.data);
  const intent = { screen: mapping.screen, params };

  // Always store the intent first. If Private is already mounted and the
  // navigator is ready (foreground tap), flush immediately. Otherwise the
  // intent is flushed either by onPrivateMounted() (quit/login flow) or by
  // the AppState 'active' listener (background-tap / app resume flow).
  _pendingIntent = intent;
  console.log('[FCM] Storing intent for:', intent.screen);

  if (_isPrivateMounted && navigationRef.current?.isReady()) {
    _flushPendingIntent();
  }
}

// ─── NotificationService ──────────────────────────────────────────────────────

let _navigationRef: NavigationRef | null = null;
let _userRole: UserRole | null = null;
let _unsubscribeOnMessage: (() => void) | null = null;
let _unsubscribeTokenRefresh: (() => void) | null = null;
let _unsubscribeAppState: (() => void) | null = null;

// Stores a notification tap intent to be flushed once the navigator is ready.
let _pendingIntent: { screen: string; params: unknown } | null = null;

// Set to true by PrivateRootWithFCM on mount, false on unmount.
let _isPrivateMounted = false;

function _flushPendingIntent(): void {
  if (!_pendingIntent) return;
  const nav = _navigationRef?.current;
  if (!nav?.isReady()) return;

  const intent = _pendingIntent;
  _pendingIntent = null;
  console.log('[FCM] Flushing pending intent to:', intent.screen);
  nav.navigate('Private', { screen: intent.screen, params: intent.params });
}

const NotificationService = {
  // ── Initialise ──────────────────────────────────────────────────────────────

  /**
   * Call once after authentication is confirmed.
   * Requests permission, registers the FCM token, and wires up all handlers.
   */
  async init(navigationRef: NavigationRef, userRole: UserRole): Promise<void> {
    _navigationRef = navigationRef;
    _userRole = userRole;

    await NotificationService._requestPermission();
    await NotificationService._registerToken();
    NotificationService._wireHandlers();
  },

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  /**
   * Call on logout to remove listeners and clear the stored token.
   */
  async cleanup(): Promise<void> {
    _unsubscribeOnMessage?.();
    _unsubscribeTokenRefresh?.();
    _unsubscribeAppState?.();
    _unsubscribeOnMessage = null;
    _unsubscribeTokenRefresh = null;
    _unsubscribeAppState = null;
    _navigationRef = null;
    _userRole = null;

    // Unregister device from backend
    const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (token) {
      await NotificationService._unregisterToken(token);
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    }
  },

  // ── Permission ──────────────────────────────────────────────────────────────

  async _requestPermission(): Promise<void> {
    const authStatus = await requestPermission(getMessaging());
    const granted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!granted) {
      console.warn('[FCM] Notification permission not granted:', authStatus);
    } else {
      console.log('[FCM] Notification permission granted');
    }
  },

  // ── Token Management ────────────────────────────────────────────────────────

  async _registerToken(): Promise<void> {
    const token = await getToken(getMessaging());
    console.log('[FCM] Device token:', token);
    await NotificationService._saveAndSendToken(token);

    // Re-register whenever the token is refreshed
    _unsubscribeTokenRefresh = onTokenRefresh(getMessaging(), async (newToken: string) => {
      console.log('[FCM] Token refreshed');
      await NotificationService._saveAndSendToken(newToken);
    });
  },

  async _saveAndSendToken(token: string): Promise<void> {
    const stored = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (stored === token) return; // unchanged

    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

    try {
      await apiClient.post(`${NOTIFICATIONS_ENDPOINTS.BASE}/register-device`, {
        token,
        platform: require('react-native').Platform.OS,
      });
    } catch (err) {
      // Non-critical — token will be sent on next app open
      console.warn('[FCM] Failed to register token with backend:', err);
    }
  },

  async _unregisterToken(token: string): Promise<void> {
    try {
      await apiClient.delete(`${NOTIFICATIONS_ENDPOINTS.BASE}/register-device`, {
        data: { token },
      });
    } catch {
      // Best-effort
    }
  },

  // ── Message Handlers ────────────────────────────────────────────────────────

  _wireHandlers(): void {
    // 0️⃣ AppState: flush pending intent when app comes to foreground
    // This covers the background-tap case where PrivateRootWithFCM stays
    // mounted but onNotificationOpenedApp fires before the navigator is ready.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && _isPrivateMounted) {
        _flushPendingIntent();
      }
    });
    _unsubscribeAppState = () => subscription.remove();

    // 1️⃣ Foreground: app is open
    _unsubscribeOnMessage = onMessage(getMessaging(), async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('[FCM] Foreground message:', remoteMessage);
      const payload = parseMessage(remoteMessage);
      if (!payload) return;

      // Invalidate notification queries so badge + inbox refresh immediately.
      // (WebSocket may already have done this, but FCM is the fallback path.)
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });

    // 2️⃣ Background + Quit tap: app opened from notification
    onNotificationOpenedApp(getMessaging(), (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('[FCM] Notification opened app from background:', remoteMessage);
      const payload = parseMessage(remoteMessage);
      if (payload && _navigationRef && _userRole) {
        routeNotification(payload, _navigationRef, _userRole);
      }
    });

    // 3️⃣ Quit state: check for initial notification that launched the app
    getInitialNotification(getMessaging())
      .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (!remoteMessage) return;
        console.log('[FCM] App opened from quit state via notification:', remoteMessage);
        const payload = parseMessage(remoteMessage);
        if (payload && _navigationRef && _userRole) {
          routeNotification(payload, _navigationRef, _userRole);
        }
      });
  },

  // ── Utilities ───────────────────────────────────────────────────────────────

  /** Returns the current FCM token from storage (no network call). */
  async getStoredToken(): Promise<string | null> {
    return AsyncStorage.getItem(FCM_TOKEN_KEY);
  },

  /**
   * Called by RootNavigator when the Private stack becomes active (user is
   * authenticated and the role drawer is mounted). Marks Private as ready
   * and flushes any stored notification intent.
   */
  onPrivateMounted(): void {
    _isPrivateMounted = true;
    _flushPendingIntent();
  },

  /**
   * Called by RootNavigator when the user logs out / Public stack becomes active.
   * Prevents stale navigation attempts while unauthenticated.
   */
  onPrivateUnmounted(): void {
    _isPrivateMounted = false;
  },
};

// ── Background Handler (must be registered at module scope, outside component) ──
// This runs when the app is in background and a DATA-only message arrives.
setBackgroundMessageHandler(getMessaging(), async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  console.log('[FCM] Background message handler:', remoteMessage);
  // Data-only messages in background — no UI needed here.
  // Notification messages show an OS banner automatically.
});

export default NotificationService;
