/**
 * AccountCenterScreen
 * Main account hub — profile overview, quick links, app info.
 * All authenticated roles. Mounted as a bottom-tab destination.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useTheme, Divider } from 'react-native-paper';
import Animated, {
  FadeInDown,
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
  FilledButton,
  OutlinedButton,
  ConfirmDialog,
  AlertDialog,
  BottomSheet,
  BottomSheetScrollView,
  OTPInput,
} from '@bevarc/ui';

import { useAuthStore, selectUser } from '../../store/authStore';
import { useLogout } from '../../hooks/mutations/useLogout';
import {
  useSendEmailVerificationOtp,
  useVerifyEmail,
} from '../../hooks/mutations/useEmailVerification';
import { useOtpResendCooldown } from '../../hooks/useOtpResendCooldown';
import { AccountScreens, SharedScreens } from '../../navigation/screens';
import type { AccountStackNavigationProp } from '../../navigation/types';
import { UserRole } from '../../api/types';

// ─── App version info (would come from native modules in prod) ─────────────

const APP_VERSION = '1.0.1';
const BUILD_NUMBER = '2';

// ─── Role display helpers ──────────────────────────────────────────────────

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.SUPER]: 'Super Distributor',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.DISTRIBUTOR]: 'Distributor',
  [UserRole.RETAILER]: 'Retailer',
  [UserRole.USER]: 'User',
};

const ROLE_ICONS: Partial<Record<UserRole, string>> = {
  [UserRole.SUPER_ADMIN]: 'shield-crown',
  [UserRole.SUPER]: 'account-star',
  [UserRole.ADMIN]: 'shield-account',
  [UserRole.MANAGER]: 'account-supervisor',
  [UserRole.DISTRIBUTOR]: 'account-network',
  [UserRole.RETAILER]: 'storefront',
  [UserRole.USER]: 'account',
};

const ROLE_RING_COLORS: Partial<Record<UserRole, string>> = {
  [UserRole.SUPER_ADMIN]: '#7C3AED',
  [UserRole.SUPER]: '#0284C7',
  [UserRole.ADMIN]: '#0284C7',
  [UserRole.MANAGER]: '#059669',
  [UserRole.DISTRIBUTOR]: '#059669',
  [UserRole.RETAILER]: '#D97706',
  [UserRole.USER]: '#6B7280',
};

// ─── Animated Menu Row ────────────────────────────────────────────────────

interface MenuRowProps {
  icon: string;
  label: string;
  description?: string;
  onPress: () => void;
  delay?: number;
  chevron?: boolean;
  tint?: string;
  trailing?: React.ReactNode;
}

const MenuRow: React.FC<MenuRowProps> = ({
  icon,
  label,
  description,
  onPress,
  delay = 0,
  tint,
  trailing,
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

  const iconColor = tint ?? theme.colors.primary;

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.menuRow,
            { backgroundColor: pressed ? `${theme.colors.primary}08` : 'transparent' },
          ]}
        >
          {/* Icon pill */}
          <View style={[styles.iconPill, { backgroundColor: `${iconColor}18` }]}>
            <Icon name={icon} size={20} color={iconColor} />
          </View>

          {/* Text */}
          <View style={styles.menuRowText}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '500' }}>
              {label}
            </Text>
            {description ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {description}
              </Text>
            ) : null}
          </View>

          {/* Trailing */}
          <View style={styles.menuRowTrailing}>
            {trailing ?? (
              <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
            )}
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

MenuRow.displayName = 'MenuRow';

// ─── Section Header ───────────────────────────────────────────────────────

const SectionHeader: React.FC<{ label: string; delay?: number }> = ({ label, delay = 0 }) => {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.sectionHeader}>
      <Text variant="labelSmall" style={{ color: theme.colors.primary, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
    </Animated.View>
  );
};

SectionHeader.displayName = 'SectionHeader';

// ─── Profile Header Card ──────────────────────────────────────────────────

const ProfileHeaderCard: React.FC<{
  user: NonNullable<ReturnType<typeof selectUser>>;
  onEditPress: () => void;
  onVerifyEmailPress: () => void;
  onTwoFactorPress: () => void;
}> = ({ user, onEditPress, onVerifyEmailPress, onTwoFactorPress }) => {
  const theme = useTheme();

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;
  const roleIcon = ROLE_ICONS[user.role] ?? 'account';
  const ringColor = ROLE_RING_COLORS[user.role] ?? theme.colors.primary;

  return (
    <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.profileCardWrapper}>
      <ElevatedCard style={styles.profileCard}>

        <View style={styles.avatarWrap}>
          {/* ── Avatar with ring + role badge ── */}
          <View style={[styles.avatarRing, { borderColor: ringColor }]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
              {user.profilePicture?.url ? (
                <Image
                  source={{ uri: user.profilePicture.url }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 44 }]}
                  resizeMode="cover"
                />
              ) : (
                <Text variant="headlineLarge" style={{ color: theme.colors.onPrimaryContainer }}>
                  {initials}
                </Text>
              )}
            </View>
            <View style={[styles.roleBadge, { backgroundColor: ringColor }]}>
              <Icon name={roleIcon} size={13} color="#fff" />
            </View>
          </View>
          <View style={styles.avatarSection}>
            {/* Ring */}

            {/* Role badge — bottom-right of ring */}
            {/* ── Identity ── */}
            <Text variant="titleMedium" style={[styles.profileName, { color: theme.colors.onSurface }]}>
              {user.name}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
              {user.email}
            </Text>

            {/* ── Role label chip ── */}
            <View style={[styles.roleChip, { backgroundColor: `${ringColor}18`, borderColor: `${ringColor}40`, borderWidth: 1 }]}>
              <Text variant="labelSmall" style={{ color: ringColor, fontWeight: '700', letterSpacing: 0.4 }}>
                {roleLabel.toUpperCase()}
              </Text>
            </View>

          </View>
        </View>
        {/* ── Status badges (email + 2FA only) ── */}
        <View style={styles.badges}>
          <Pressable
            onPress={user.emailVerified ? undefined : onVerifyEmailPress}
            style={[styles.badge, { backgroundColor: user.emailVerified ? '#dcfce7' : '#fee2e2' }]}
          >
            <Icon
              name={user.emailVerified ? 'email-check' : 'email-alert'}
              size={12}
              color={user.emailVerified ? '#16a34a' : '#dc2626'}
            />
            <Text variant="labelSmall" style={{ color: user.emailVerified ? '#16a34a' : '#dc2626', marginLeft: 3 }}>
              {user.emailVerified ? 'Verified' : 'Tap to verify'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onTwoFactorPress}
            style={[styles.badge, { backgroundColor: user.twoFactorEnabled ? '#dbeafe' : '#f3f4f6' }]}
          >
            <Icon
              name={user.twoFactorEnabled ? 'shield-check' : 'shield-off-outline'}
              size={12}
              color={user.twoFactorEnabled ? '#2563eb' : '#6b7280'}
            />
            <Text variant="labelSmall" style={{ color: user.twoFactorEnabled ? '#2563eb' : '#6b7280', marginLeft: 3 }}>
              {user.twoFactorEnabled ? '2FA On' : 'Setup 2FA'}
            </Text>
          </Pressable>
        </View>
      </ElevatedCard>
    </Animated.View>
  );
};

ProfileHeaderCard.displayName = 'ProfileHeaderCard';

// ─── Email Verify Bottom Sheet ────────────────────────────────────────────

const EmailVerifySheet: React.FC<{
  visible: boolean;
  onDismiss: () => void;
  userEmail: string;
}> = ({ visible, onDismiss, userEmail }) => {
  const theme = useTheme();

  const [step, setStep] = useState<'idle' | 'otp'>('idle');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [alreadySent, setAlreadySent] = useState(false);
  const [closeConfirmVisible, setCloseConfirmVisible] = useState(false);
  const verifiedRef = React.useRef(false);

  const { mutate: sendOtp, isPending: sending } = useSendEmailVerificationOtp();
  const { mutate: verifyEmail, isPending: verifying } = useVerifyEmail();

  const { secondsLeft, canResend, startCooldown } = useOtpResendCooldown();

  // Clear entered digits and error when sheet opens fresh.
  // verifiedRef is NOT reset on close — it must survive the hide animation
  // so that any dismiss callbacks fired during the animation don't re-show
  // the skip-confirm dialog after a successful verification.
  React.useEffect(() => {
    if (visible) {
      setOtp('');
      setOtpError(false);
    }
  }, [visible]);

  const handleSendOtp = useCallback(() => {
    sendOtp(undefined, {
      onSuccess: (data) => {
        setTempToken(data.tempToken);
        setAlreadySent(data.alreadySent ?? false);
        setStep('otp');
        setOtp('');
        setOtpError(false);
        if (!data.alreadySent) {
          startCooldown();
        }
      },
    });
  }, [sendOtp, startCooldown]);

  const handleVerify = useCallback((code: string) => {
    if (!tempToken) return;
    setOtpError(false);
    verifyEmail(
      { code, tempToken },
      {
        onSuccess: () => {
          verifiedRef.current = true;
          onDismiss();
        },
        onError: () => {
          setOtpError(true);
          setOtp('');
        },
      },
    );
  }, [tempToken, verifyEmail, onDismiss]);

  const handleClosePress = useCallback(() => {
    if (verifiedRef.current) return;
    setCloseConfirmVisible(true);
  }, []);

  const busy = sending || verifying;

  return (
    <>
      <BottomSheet
        visible={visible}
        onDismiss={handleClosePress}
        scrollable
        dismissable={false}
        enablePanDownToClose={false}
        footer={
          <View style={[sheetStyles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
            {step === 'idle' ? (
              <FilledButton onPress={handleSendOtp} loading={sending} disabled={busy} style={{ flex: 1 }}>
                Send OTP
              </FilledButton>
            ) : canResend ? (
              <OutlinedButton onPress={handleSendOtp} loading={sending} disabled={busy} style={{ flex: 1 }}>
                Resend OTP
              </OutlinedButton>
            ) : (
              <OutlinedButton disabled style={{ flex: 1 }}>
                {`Resend in ${secondsLeft}s`}
              </OutlinedButton>
            )}
          </View>
        }
      >
        {/* Scrollable content */}
        <View style={sheetStyles.content}>

          {/* Top row: centred title + close button */}
          <View style={sheetStyles.sheetTopRow}>
            <View style={{ flex: 1 }} />
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
              Verify Email
            </Text>
            <Pressable onPress={handleClosePress} style={sheetStyles.closeBtn} hitSlop={8}>
              <Icon name="close" size={20} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Icon + subtitle */}
          <View style={sheetStyles.header}>
            <View style={[sheetStyles.iconWrap, { backgroundColor: `${theme.colors.primary}18` }]}>
              <Icon name="email-check-outline" size={28} color={theme.colors.primary} />
            </View>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 10, textAlign: 'center' }}>
              {step === 'idle'
                ? `We'll send a 6-digit code to\n${userEmail}`
                : `Check your inbox at\n${userEmail}\nand enter the code below.`}
            </Text>
          </View>

          {/* OTP input */}
          {step === 'otp' && (
            <View style={sheetStyles.otpWrap}>
              <OTPInput
                value={otp}
                onChangeText={setOtp}
                onComplete={handleVerify}
                error={otpError}
                disabled={busy}
                length={6}
              />
              {otpError && (
                <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8, textAlign: 'center' }}>
                  Invalid or expired code. Try again.
                </Text>
              )}
              {!otpError && alreadySent && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                  A code was already sent — use it or request a new one below.
                </Text>
              )}
              {verifying && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                  Verifying…
                </Text>
              )}
            </View>
          )}
        </View>
      </BottomSheet>

      {/* Skip confirmation — explains verification benefits */}
      <ConfirmDialog
        visible={closeConfirmVisible}
        title="Skip email verification?"
        message={
          'A verified email helps you:\n\n' +
          '• Recover your account if you forget your password\n' +
          '• Receive OTP codes for login and security actions\n' +
          '• Get order, transfer, and security alerts\n\n' +
          'You can verify anytime from Account Center.'
        }
        confirmText="Skip for now"
        cancelText="Keep verifying"
        onConfirm={() => {
          verifiedRef.current = true;
          setCloseConfirmVisible(false);
          onDismiss();
        }}
        onCancel={() => setCloseConfirmVisible(false)}
      />
    </>
  );
};

EmailVerifySheet.displayName = 'EmailVerifySheet';

const sheetStyles = StyleSheet.create({
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpWrap: {
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  closeBtn: {
    flex: 1,
    alignItems: 'flex-end',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────

const AccountCenterScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<AccountStackNavigationProp>();
  const user = useAuthStore(selectUser);
  const { mutate: logout, isPending: loggingOut } = useLogout();

  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [emailVerifyVisible, setEmailVerifyVisible] = useState(false);

  const handleLogoutPress = useCallback(() => {
    setLogoutDialogVisible(true);
  }, []);

  const handleLogoutConfirm = useCallback(() => {
    setLogoutDialogVisible(false);
    logout();
  }, [logout]);

  const handleLogoutCancel = useCallback(() => {
    setLogoutDialogVisible(false);
  }, []);

  if (!user) return null;

  return (
    <SafeScreen edges={['left', 'right', 'bottom']}>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <ProfileHeaderCard
          user={user}
          onEditPress={() => navigation.navigate(AccountScreens.EditProfile, { userId: user.id })}
          onVerifyEmailPress={() => setEmailVerifyVisible(true)}
          onTwoFactorPress={() => navigation.navigate(AccountScreens.TwoFactor)}
        />

        {/* ── ACCOUNT section ── */}
        <SectionHeader label="Account" delay={100} />
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <ElevatedCard style={styles.menuCard}>
            <MenuRow
              icon="account-edit-outline"
              label="Edit Profile"
              description="Name, phone, profile picture"
              onPress={() => navigation.navigate(AccountScreens.EditProfile, { userId: user.id })}
              delay={130}
            />
            <Divider />
            <MenuRow
              icon="bell-outline"
              label="Notifications"
              description="Alerts and push settings"
              onPress={() => navigation.navigate(SharedScreens.Notifications)}
              delay={150}
            />
          </ElevatedCard>
        </Animated.View>

        {/* ── SECURITY section ── */}
        <SectionHeader label="Security" delay={180} />
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ElevatedCard style={styles.menuCard}>
            <MenuRow
              icon="shield-lock-outline"
              label="Security Center"
              description="Password, 2FA, active sessions"
              onPress={() => navigation.navigate(AccountScreens.Security)}
              delay={210}
              tint={theme.colors.tertiary}
            />
            <Divider />
            <MenuRow
              icon="key-variant"
              label="Change Password"
              onPress={() => navigation.navigate(AccountScreens.ChangePassword)}
              delay={220}
              tint={theme.colors.tertiary}
            />
            <Divider />
            <MenuRow
              icon="two-factor-authentication"
              label="Two-Factor Auth"
              description={user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
              onPress={() => navigation.navigate(AccountScreens.TwoFactor)}
              delay={230}
              tint={user.twoFactorEnabled ? theme.colors.primary : theme.colors.error}
            />
            <Divider />
            <MenuRow
              icon="devices"
              label="Active Sessions"
              description="Manage signed-in devices"
              onPress={() => navigation.navigate(AccountScreens.Sessions)}
              delay={240}
              tint={theme.colors.tertiary}
            />
          </ElevatedCard>
        </Animated.View>

        {/* ── APP section ── */}
        <SectionHeader label="App" delay={270} />
        <Animated.View entering={FadeInDown.delay(290).springify()}>
          <ElevatedCard style={styles.menuCard}>
            <MenuRow
              icon="information-outline"
              label="Version"
              description={`v${APP_VERSION} (${BUILD_NUMBER})`}
              onPress={() => {}}
              delay={300}
              trailing={
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {`v${APP_VERSION}`}
                </Text>
              }
            />
            <Divider />
            <MenuRow
              icon="note-text-outline"
              label="Release Notes"
              description="What's new in this version"
              onPress={() => {}}
              delay={310}
            />
          </ElevatedCard>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(340).springify()} style={styles.logoutWrapper}>
          <FilledButton
            onPress={handleLogoutPress}
            loading={loggingOut}
            disabled={loggingOut}
            buttonColor={theme.colors.errorContainer}
            textColor={theme.colors.onErrorContainer}
            icon="logout"
            style={styles.logoutBtn}
          >
            Sign Out
          </FilledButton>
        </Animated.View>
      </ScrollView>

      {/* Email verification bottom sheet */}
      <EmailVerifySheet
        visible={emailVerifyVisible}
        onDismiss={() => setEmailVerifyVisible(false)}
        userEmail={user.email}
      />

      {/* Logout confirmation dialog */}
      <ConfirmDialog
        visible={logoutDialogVisible}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        loading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </SafeScreen>
  );
};

export default AccountCenterScreen;

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  profileCardWrapper: {
    marginBottom: 4,
  },
  profileCard: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarWrap: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flex:1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editBtn: {
    marginTop: 16,
    alignSelf: 'stretch',
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowText: {
    flex: 1,
    gap: 1,
  },
  menuRowTrailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutWrapper: {
    marginTop: 20,
  },
  logoutBtn: {
    borderRadius: 14,
  },
});
