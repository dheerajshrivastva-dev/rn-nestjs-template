/**
 * SessionsScreen
 * Lists all active sessions. Current device highlighted.
 * Supports per-session revoke and logout-all.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeOutRight,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  SafeScreen,
  Text,
  ElevatedCard,
  ListItemShimmer,
  ErrorFallback,
  ConfirmDialog,
} from '@bevarc/ui';

import { useSessions, type UserSession } from '../../hooks/queries/useSessions';
import { useBiometrics, type BiometricDevice } from '../../hooks/queries/useBiometrics';
import { useRevokeSession, useLogoutAllSessions, useRevokeBiometric } from '../../hooks/mutations/useSessionMutations';
import type { AccountStackNavigationProp } from '../../navigation/types';

// ─── Device icon helper ────────────────────────────────────────────────────

function deviceIcon(type: UserSession['deviceType']): string {
  switch (type) {
    case 'mobile': return 'cellphone';
    case 'tablet': return 'tablet';
    case 'desktop': return 'monitor';
    default: return 'devices';
  }
}

// ─── Time ago helper ───────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Session Card ─────────────────────────────────────────────────────────

const SessionCard: React.FC<{
  session: UserSession;
  onRevoke: (id: string) => void;
  revoking: boolean;
  index: number;
}> = ({ session, onRevoke, revoking, index }) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const [revokeDialogVisible, setRevokeDialogVisible] = React.useState(false);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleRevokePress = useCallback(() => {
    if (session.isCurrent) return;
    setRevokeDialogVisible(true);
  }, [session.isCurrent]);

  const locationParts = [session.city, session.region, session.country].filter(Boolean);
  const locationStr = locationParts.length ? locationParts.join(', ') : session.ipAddress ?? 'Unknown location';

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(index * 60).springify()}
        exiting={FadeOutRight.duration(250)}
        layout={Layout.springify()}
        style={cardStyle}
      >
        <View style={[
          styles.sessionCard,
          session.isCurrent && { borderColor: theme.colors.primary, borderWidth: 1.5 },
        ]}>
          {/* Current badge */}
          {session.isCurrent && (
            <View style={[styles.currentBadge, { backgroundColor: theme.colors.primary }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimary }}>
                This device
              </Text>
            </View>
          )}

          <View style={styles.sessionRow}>
            {/* Device icon */}
            <View style={[styles.sessionIconWrap, { backgroundColor: `${theme.colors.primary}14` }]}>
              <Icon name={deviceIcon(session.deviceType)} size={24} color={theme.colors.primary} />
            </View>

            {/* Info */}
            <View style={styles.sessionInfo}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '600' }}
                numberOfLines={1}
              >
                {session.deviceName}
              </Text>
              {session.osName ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {session.osName}{session.osVersion ? ` ${session.osVersion}` : ''}
                </Text>
              ) : null}
              <View style={styles.sessionMeta}>
                <Icon name="map-marker-outline" size={12} color={theme.colors.onSurfaceVariant} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 3 }} numberOfLines={1}>
                  {locationStr}
                </Text>
              </View>
              <View style={styles.sessionMeta}>
                <Icon name="clock-outline" size={12} color={theme.colors.onSurfaceVariant} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 3 }}>
                  Active {timeAgo(session.lastActivityAt)}
                </Text>
              </View>
            </View>

            {/* Revoke button */}
            {!session.isCurrent && (
              <Pressable
                onPress={handleRevokePress}
                disabled={revoking}
                onPressIn={() => { scale.value = withSpring(0.95, { damping: 20, stiffness: 400 }); }}
                onPressOut={() => { scale.value = withSpring(1, { damping: 20, stiffness: 400 }); }}
                style={[styles.revokeBtn, { backgroundColor: `${theme.colors.error}14` }]}
                hitSlop={8}
              >
                <Icon
                  name={revoking ? 'loading' : 'close-circle-outline'}
                  size={20}
                  color={theme.colors.error}
                />
              </Pressable>
            )}
          </View>
        </View>
      </Animated.View>

      <ConfirmDialog
        visible={revokeDialogVisible}
        title="End Session"
        message={`Sign out of "${session.deviceName}"? This device will be logged out immediately.`}
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={() => { setRevokeDialogVisible(false); onRevoke(session.id); }}
        onCancel={() => setRevokeDialogVisible(false)}
      />
    </>
  );
};

SessionCard.displayName = 'SessionCard';

// ─── Biometric Card ───────────────────────────────────────────────────────

const BiometricCard: React.FC<{
  device: BiometricDevice;
  onRevoke: (fingerprint: string) => void;
  revoking: boolean;
  index: number;
}> = ({ device, onRevoke, revoking, index }) => {
  const theme = useTheme();
  const [revokeDialogVisible, setRevokeDialogVisible] = React.useState(false);

  const handleRevokePress = useCallback(() => {
    setRevokeDialogVisible(true);
  }, []);

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(index * 60).springify()}
        exiting={FadeOutRight.duration(250)}
        layout={Layout.springify()}
      >
        <View style={[styles.sessionCard, { borderColor: theme.colors.outline, borderWidth: StyleSheet.hairlineWidth }]}>
          <View style={styles.sessionRow}>
            <View style={[styles.sessionIconWrap, { backgroundColor: `${theme.colors.secondary}14` }]}>
              <Icon name="fingerprint" size={24} color={theme.colors.secondary} />
            </View>

            <View style={styles.sessionInfo}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }} numberOfLines={1}>
                {device.deviceName ?? 'Unknown device'}
              </Text>
              {device.lastUsedAt ? (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Last used {timeAgo(device.lastUsedAt)} · {device.useCount}×
                </Text>
              ) : (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Never used
                </Text>
              )}
              <View style={styles.sessionMeta}>
                <Icon name="clock-outline" size={12} color={theme.colors.onSurfaceVariant} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 3 }}>
                  Expires {new Date(device.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleRevokePress}
              disabled={revoking}
              style={[styles.revokeBtn, { backgroundColor: `${theme.colors.error}14` }]}
              hitSlop={8}
            >
              <Icon name={revoking ? 'loading' : 'close-circle-outline'} size={20} color={theme.colors.error} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <ConfirmDialog
        visible={revokeDialogVisible}
        title="Remove Fingerprint Login"
        message={`Remove biometric access for "${device.deviceName ?? 'Unknown device'}"? That device will need a password to log in again.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => { setRevokeDialogVisible(false); onRevoke(device.deviceFingerprint); }}
        onCancel={() => setRevokeDialogVisible(false)}
      />
    </>
  );
};

BiometricCard.displayName = 'BiometricCard';

// ─── Section Header ───────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>{title}</Text>
      {subtitle ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{subtitle}</Text>
      ) : null}
    </View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────

const EmptySessions: React.FC = () => {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.emptyWrap}>
      <Icon name="devices" size={48} color={theme.colors.onSurfaceVariant} />
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
        No active sessions found
      </Text>
    </Animated.View>
  );
};

EmptySessions.displayName = 'EmptySessions';

// ─── Main Screen ──────────────────────────────────────────────────────────

const SessionsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AccountStackNavigationProp>();

  const { data: sessions, isLoading, error, refetch } = useSessions();
  const { data: biometrics, isLoading: bioLoading, error: bioError, refetch: bioRefetch } = useBiometrics();
  const { mutate: revokeSession, isPending: revoking, variables: revokingId } = useRevokeSession();
  const { mutate: revokeBiometric, isPending: revokingBio, variables: revokingBioId } = useRevokeBiometric();
  const { mutate: logoutAll } = useLogoutAllSessions();
  const [logoutAllDialogVisible, setLogoutAllDialogVisible] = React.useState(false);

  return (
    <SafeScreen edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        {/* ── Active Sessions ── */}
        <SectionHeader
          title="Active Sessions"
          subtitle={`${sessions?.filter(s => !s.isCurrent).length ?? 0} other device(s)`}
        />
        {isLoading ? (
          <ListItemShimmer count={3} />
        ) : error ? (
          <ErrorFallback error={error} onRetry={refetch} variant="inline" />
        ) : !sessions?.length ? (
          <EmptySessions />
        ) : (
          sessions.map((session, index) => (
            <React.Fragment key={session.id}>
              <SessionCard
                session={session}
                onRevoke={(id) => revokeSession(id)}
                revoking={revoking && revokingId === session.id}
                index={index}
              />
              {index < sessions.length - 1 && <View style={{ height: 10 }} />}
            </React.Fragment>
          ))
        )}

        {/* ── Biometric Devices ── */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader
            title="Fingerprint Login"
            subtitle="Devices with biometric access. Remove a device to require password login."
          />
          {bioLoading ? (
            <ListItemShimmer count={2} />
          ) : bioError ? (
            <ErrorFallback error={bioError} onRetry={bioRefetch} variant="inline" />
          ) : !biometrics?.length ? (
            <View style={styles.emptyBio}>
              <Icon name="fingerprint-off" size={32} color="#9E9E9E" />
              <Text variant="bodySmall" style={{ color: '#9E9E9E', marginTop: 8 }}>
                No biometric devices registered
              </Text>
            </View>
          ) : (
            biometrics.map((device, index) => (
              <React.Fragment key={device.id}>
                <BiometricCard
                  device={device}
                  onRevoke={(fp) => revokeBiometric(fp)}
                  revoking={revokingBio && revokingBioId === device.deviceFingerprint}
                  index={index}
                />
                {index < biometrics.length - 1 && <View style={{ height: 10 }} />}
              </React.Fragment>
            ))
          )}
        </View>

      </ScrollView>

      <ConfirmDialog
        visible={logoutAllDialogVisible}
        title="Sign Out Everywhere"
        message="This will end all sessions including this one. You will be signed out immediately."
        confirmText="Sign Out All"
        cancelText="Cancel"
        onConfirm={() => { setLogoutAllDialogVisible(false); logoutAll(); }}
        onCancel={() => setLogoutAllDialogVisible(false)}
      />
    </SafeScreen>
  );
};

export default SessionsScreen;

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  logoutAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  sessionCard: {
    borderRadius: 16,
    padding: 14,
    overflow: 'visible',
  },
  currentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sessionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
    gap: 3,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  revokeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 4,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 2,
  },
  emptyBio: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
});
