/**
 * Network Banner
 *
 * Two exports:
 * - NetworkListener  — mounts in GlobalBottomSheets, no UI, runs NetInfo + server probe
 * - NetworkBannerStrip — pure UI strip rendered inside AmazonTabBar (below tabs)
 *
 * Tab bar pushes itself up via `paddingBottom` when the strip is visible.
 * No floating overlay, no layout shift on screens above.
 */

import React, {useEffect, useRef, useCallback} from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Text} from '@forge/ui';
import {useNetworkStore, NetworkStatus} from '../store/networkStore';
import apiClient from '../api/client';

// ─── Constants ────────────────────────────────────────────────────────────────

export const NETWORK_BANNER_HEIGHT = 28;
const RETRY_THRESHOLD = 3;
const AUTO_RETRY_INTERVAL = 5000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusConfig = (
  status: NetworkStatus,
  retryCount: number,
): {bg: string; iconName: string; iconColor: string; label: string} => {
  switch (status) {
    case 'offline':
      return {bg: '#1a1a1a', iconName: 'wifi-off', iconColor: '#ff5252', label: 'No internet'};
    case 'server_unreachable':
      return {
        bg: '#1a1a2e',
        iconName: 'cloud-off-outline',
        iconColor: '#ffab00',
        label: retryCount > 0 ? `Connecting… (${retryCount})` : 'Server unreachable',
      };
    default:
      return {bg: '#0d3b1e', iconName: 'wifi-check', iconColor: '#00e676', label: 'Back online'};
  }
};

// ─── NetworkListener ──────────────────────────────────────────────────────────
// No UI — just wires up NetInfo and server probe into the store.
// Mount once in GlobalBottomSheets.

export const NetworkListener: React.FC = () => {
  const {setConnected, setServerReachable, incrementRetry, resetRetry, status} =
    useNetworkStore();

  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStatus = useRef<NetworkStatus>(status);
  currentStatus.current = status;

  const probeServer = useCallback(async () => {
    try {
      await apiClient.get('/health', {timeout: 5000, _skipNetworkCheck: true} as any);
      setServerReachable(true);
      resetRetry();
    } catch (_) {
      incrementRetry();
      setServerReachable(false);
    }
  }, [setServerReachable, resetRetry, incrementRetry]);

  const scheduleRetry = useCallback(() => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => {
      if (currentStatus.current === 'server_unreachable') {
        probeServer();
      }
    }, AUTO_RETRY_INTERVAL);
  }, [probeServer]);

  const retryCount = useNetworkStore(s => s.retryCount);

  // Re-schedule auto-retry whenever retryCount changes and still unreachable
  useEffect(() => {
    if (status === 'server_unreachable' && retryCount < RETRY_THRESHOLD) {
      scheduleRetry();
    }
  }, [retryCount, status, scheduleRetry]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setConnected(connected);
      if (connected) probeServer();
    });

    NetInfo.fetch().then(state => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setConnected(connected);
      if (connected) probeServer();
    });

    return () => {
      unsubscribe();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

// ─── NetworkBannerStrip ───────────────────────────────────────────────────────
// Pure UI — rendered inside AmazonTabBar below the tab row.
// Animates its height from 0 → NETWORK_BANNER_HEIGHT.

export const NetworkBannerStrip: React.FC = () => {
  const {status, retryCount, resetRetry} = useNetworkStore();

  const {setServerReachable, incrementRetry} = useNetworkStore();

  const probeServer = useCallback(async () => {
    try {
      await apiClient.get('/health', {timeout: 5000, _skipNetworkCheck: true} as any);
      setServerReachable(true);
      resetRetry();
    } catch (_) {
      incrementRetry();
      setServerReachable(false);
    }
  }, [setServerReachable, resetRetry, incrementRetry]);

  const handleManualRetry = useCallback(() => {
    resetRetry();
    probeServer();
  }, [probeServer, resetRetry]);

  // Animated height: 0 when hidden, NETWORK_BANNER_HEIGHT when visible
  const animHeight = useRef(new Animated.Value(0)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatus = useRef<NetworkStatus>('online');

  useEffect(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);

    const show = () => {
      Animated.parallel([
        Animated.timing(animHeight, {toValue: NETWORK_BANNER_HEIGHT, duration: 220, useNativeDriver: false}),
        Animated.timing(animOpacity, {toValue: 1, duration: 180, useNativeDriver: false}),
      ]).start();
    };

    const hide = (delay = 0) => {
      hideTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(animHeight, {toValue: 0, duration: 200, useNativeDriver: false}),
          Animated.timing(animOpacity, {toValue: 0, duration: 160, useNativeDriver: false}),
        ]).start();
      }, delay);
    };

    if (status === 'online') {
      // Only show "back online" flash if we were previously offline/unreachable
      if (prevStatus.current !== 'online') {
        show();
        hide(2200);
      }
    } else {
      show();
    }

    prevStatus.current = status;

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [status, animHeight, animOpacity]);

  const config = getStatusConfig(status, retryCount);
  const showRetryButton = status === 'server_unreachable' && retryCount >= RETRY_THRESHOLD;

  return (
    <Animated.View style={[styles.strip, {height: animHeight, opacity: animOpacity, backgroundColor: config.bg}]}>
      <Icon name={config.iconName} size={12} color={config.iconColor} />
      <Text variant="labelSmall" style={styles.label} numberOfLines={1}>
        {status === 'online' ? 'Back online' : config.label}
      </Text>

      {status === 'server_unreachable' && retryCount > 0 && !showRetryButton && (
        <View style={styles.countPill}>
          <Text variant="labelSmall" style={styles.countText}>{retryCount}</Text>
        </View>
      )}

      {showRetryButton && (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={handleManualRetry}
          activeOpacity={0.7}
          hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
          <Text variant="labelSmall" style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 16,
    gap: 8,
  },
  label: {
    color: '#e8e8e8',
    fontSize: 10,
    letterSpacing: 0.2,
    flex: 1,
  },
  countPill: {
    backgroundColor: 'rgba(255,171,0,0.2)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,171,0,0.4)',
  },
  countText: {
    color: '#ffab00',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  retryBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});
