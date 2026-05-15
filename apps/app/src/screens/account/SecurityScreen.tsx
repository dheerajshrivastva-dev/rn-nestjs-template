/**
 * SecurityScreen
 * Hub for all security actions:
 * change password, 2FA setup/disable, session management, logout all.
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme, Divider } from 'react-native-paper';
import Animated, {
  FadeInDown,
  FadeInLeft,
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
  ConfirmDialog,
} from '@bevarc/ui';

import { useAuthStore, selectUser } from '../../store/authStore';
import { useLogoutAllSessions } from '../../hooks/mutations/useSessionMutations';
import { useDisable2FA } from '../../hooks/mutations/useTwoFactor';
import { AccountScreens } from '../../navigation/screens';
import type { AccountStackNavigationProp } from '../../navigation/types';

// ─── Security Score Calculation ───────────────────────────────────────────

function calcSecurityScore(
  twoFactorEnabled: boolean,
  emailVerified: boolean,
  phoneVerified: boolean,
): { score: number; label: string; color: string } {
  let score = 0;
  if (twoFactorEnabled) score += 50;
  if (emailVerified) score += 30;
  if (phoneVerified) score += 20;

  if (score >= 90) return { score, label: 'Strong', color: '#2e7d32' };
  if (score >= 60) return { score, label: 'Good', color: '#f57c00' };
  return { score, label: 'Weak', color: '#c62828' };
}

// ─── Score Ring ────────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number; label: string; scoreColor: string }> = ({
  score,
  label,
  scoreColor,
}) => {
  const theme = useTheme();
  return (
    <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
      <Text variant="headlineMedium" style={{ color: scoreColor, fontWeight: '800' }}>
        {score}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
};

ScoreRing.displayName = 'ScoreRing';

// ─── Check Row ────────────────────────────────────────────────────────────

const CheckRow: React.FC<{
  label: string;
  met: boolean;
  delay?: number;
}> = ({ label, met, delay = 0 }) => {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInLeft.delay(delay).springify()}
      style={styles.checkRow}
    >
      <Icon
        name={met ? 'check-circle' : 'alert-circle-outline'}
        size={18}
        color={met ? theme.colors.primary : theme.colors.error}
      />
      <Text
        variant="bodySmall"
        style={{ color: met ? theme.colors.onSurface : theme.colors.error, marginLeft: 8 }}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

CheckRow.displayName = 'CheckRow';

// ─── Action Row ───────────────────────────────────────────────────────────

interface ActionRowProps {
  icon: string;
  label: string;
  description?: string;
  onPress: () => void;
  delay?: number;
  tint?: string;
  badge?: string;
  badgeColor?: string;
  destructive?: boolean;
}

const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  label,
  description,
  onPress,
  delay = 0,
  tint,
  badge,
  badgeColor,
  destructive = false,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  }, [scale]);

  const iconColor = destructive
    ? theme.colors.error
    : (tint ?? theme.colors.primary);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.actionRow,
            { backgroundColor: pressed ? `${iconColor}08` : 'transparent' },
          ]}
        >
          <View style={[styles.actionIcon, { backgroundColor: `${iconColor}18` }]}>
            <Icon name={icon} size={20} color={iconColor} />
          </View>

          <View style={styles.actionText}>
            <Text
              variant="bodyMedium"
              style={{ color: destructive ? theme.colors.error : theme.colors.onSurface, fontWeight: '500' }}
            >
              {label}
            </Text>
            {description ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {description}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionTrailing}>
            {badge ? (
              <View style={[styles.badgePill, { backgroundColor: badgeColor ?? `${theme.colors.primary}18` }]}>
                <Text variant="labelSmall" style={{ color: badgeColor ? '#fff' : theme.colors.primary }}>
                  {badge}
                </Text>
              </View>
            ) : (
              <Icon
                name={destructive ? 'chevron-right' : 'chevron-right'}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            )}
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

ActionRow.displayName = 'ActionRow';

// ─── Main Screen ──────────────────────────────────────────────────────────

const SecurityScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AccountStackNavigationProp>();
  const user = useAuthStore(selectUser);

  const { mutate: logoutAll } = useLogoutAllSessions();
  const { mutate: disable2FA } = useDisable2FA();

  const [logoutAllDialogVisible, setLogoutAllDialogVisible] = React.useState(false);
  const [disable2FADialogVisible, setDisable2FADialogVisible] = React.useState(false);

  const handleLogoutAll = useCallback(() => {
    setLogoutAllDialogVisible(true);
  }, []);

  const handleDisable2FA = useCallback(() => {
    setDisable2FADialogVisible(true);
  }, []);

  if (!user) return null;

  const { score, label: scoreLabel, color: scoreColor } = calcSecurityScore(
    user.twoFactorEnabled,
    user.emailVerified,
    user.phoneVerified,
  );

  return (
    <SafeScreen edges={['left', 'right', 'bottom']}>
      {/* Back header */}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Security score card */}
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <ElevatedCard style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <ScoreRing score={score} label={scoreLabel} scoreColor={scoreColor} />
              <View style={styles.scoreChecks}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600', marginBottom: 8 }}>
                  Security Status
                </Text>
                <CheckRow label="Email verified" met={user.emailVerified} delay={80} />
                <CheckRow label="Phone verified" met={user.phoneVerified} delay={100} />
                <CheckRow label="Two-factor auth enabled" met={user.twoFactorEnabled} delay={120} />
              </View>
            </View>
          </ElevatedCard>
        </Animated.View>

        {/* ── PASSWORD ── */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.sectionHeader}>
          <Text variant="labelSmall" style={{ color: theme.colors.primary, letterSpacing: 1 }}>
            PASSWORD
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <ElevatedCard style={styles.menuCard}>
            <ActionRow
              icon="key-variant"
              label="Change Password"
              description="Update your login password"
              onPress={() => navigation.navigate(AccountScreens.ChangePassword)}
              delay={170}
              tint={theme.colors.tertiary}
            />
          </ElevatedCard>
        </Animated.View>

        {/* ── TWO-FACTOR AUTH ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionHeader}>
          <Text variant="labelSmall" style={{ color: theme.colors.primary, letterSpacing: 1 }}>
            TWO-FACTOR AUTHENTICATION
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(210).springify()}>
          <ElevatedCard style={styles.menuCard}>
            <ActionRow
              icon="two-factor-authentication"
              label={user.twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
              description={
                user.twoFactorEnabled
                  ? 'Change method or view recovery options'
                  : 'Add an extra layer of protection'
              }
              onPress={() => navigation.navigate(AccountScreens.TwoFactor)}
              delay={220}
              badge={user.twoFactorEnabled ? 'ON' : 'OFF'}
              badgeColor={user.twoFactorEnabled ? theme.colors.primary : undefined}
            />
            {user.twoFactorEnabled && (
              <>
                <Divider />
                <ActionRow
                  icon="shield-off-outline"
                  label="Disable 2FA"
                  description="Not recommended — reduces security"
                  onPress={handleDisable2FA}
                  delay={230}
                  destructive
                />
              </>
            )}
          </ElevatedCard>
        </Animated.View>

        {/* ── SESSIONS ── */}
        <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.sectionHeader}>
          <Text variant="labelSmall" style={{ color: theme.colors.primary, letterSpacing: 1 }}>
            ACTIVE SESSIONS
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(270).springify()}>
          <ElevatedCard style={styles.menuCard}>
            <ActionRow
              icon="devices"
              label="Manage Sessions"
              description="See and revoke all signed-in devices"
              onPress={() => navigation.navigate(AccountScreens.Sessions)}
              delay={280}
              tint={theme.colors.tertiary}
            />
            <Divider />
            <ActionRow
              icon="logout-variant"
              label="Sign Out Everywhere"
              description="End all sessions on all devices"
              onPress={handleLogoutAll}
              delay={290}
              destructive
            />
          </ElevatedCard>
        </Animated.View>

        {/* Last login info */}
        {user.lastLoginAt ? (
          <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.lastLogin}>
            <Icon name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 5 }}>
              Last sign-in: {new Date(user.lastLoginAt).toLocaleString()}
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={logoutAllDialogVisible}
        title="Sign Out Everywhere"
        message="This will end all active sessions on every device, including this one. You will be signed out immediately."
        confirmText="Sign Out All"
        cancelText="Cancel"
        onConfirm={() => { setLogoutAllDialogVisible(false); logoutAll(); }}
        onCancel={() => setLogoutAllDialogVisible(false)}
      />
      <ConfirmDialog
        visible={disable2FADialogVisible}
        title="Disable Two-Factor Auth"
        message="Your account will be less secure without 2FA. Are you sure you want to disable it?"
        confirmText="Disable"
        cancelText="Cancel"
        onConfirm={() => { setDisable2FADialogVisible(false); disable2FA(); }}
        onCancel={() => setDisable2FADialogVisible(false)}
      />
    </SafeScreen>
  );
};

export default SecurityScreen;

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
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  scoreCard: {
    padding: 20,
    borderRadius: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  scoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreChecks: {
    flex: 1,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 6,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    gap: 1,
  },
  actionTrailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lastLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
});
