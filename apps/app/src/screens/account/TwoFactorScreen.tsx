/**
 * TwoFactorScreen
 * Manage 2FA: view current status, enable via email or phone OTP, disable.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  SafeScreen,
  Text,
  ElevatedCard,
  FilledButton,
  OutlinedButton,
  BottomSheet,
  OTPInput,
  ConfirmDialog,
} from '@bevarc/ui';

import { useAuthStore, selectUser } from '../../store/authStore';
import {
  use2FAStatus,
  useSetup2FAEmailOtp,
  useSetup2FAMobileOtp,
  useEnable2FA,
  useDisable2FA,
} from '../../hooks/mutations/useTwoFactor';
import { useOtpResendCooldown } from '../../hooks/useOtpResendCooldown';

// ─── Method card ─────────────────────────────────────────────────────────────

interface MethodCardProps {
  icon: string;
  title: string;
  subtitle: string;
  active: boolean;
  tint: string;
  onPress: () => void;
  delay?: number;
  disabled?: boolean;
}

const MethodCard: React.FC<MethodCardProps> = ({
  icon,
  title,
  subtitle,
  active,
  tint,
  onPress,
  delay = 0,
  disabled = false,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const effectiveTint = disabled ? theme.colors.onSurfaceVariant : tint;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  }, [scale, disabled]);
  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  }, [scale, disabled]);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ opacity: disabled ? 0.45 : 1 }}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={disabled ? undefined : onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.methodCard,
            {
              borderColor: active ? effectiveTint : theme.colors.outlineVariant,
              backgroundColor: active ? `${effectiveTint}0D` : theme.colors.surface,
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.methodIcon, { backgroundColor: `${effectiveTint}18` }]}>
            <Icon name={icon} size={26} color={effectiveTint} />
          </View>

          {/* Text */}
          <View style={styles.methodText}>
            <Text
              variant="titleSmall"
              style={{ color: disabled ? theme.colors.onSurfaceVariant : theme.colors.onSurface, fontWeight: '600' }}
            >
              {title}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
            >
              {subtitle}
            </Text>
          </View>

          {/* Status indicator / coming soon */}
          {disabled ? (
            <View style={[styles.methodBadge, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} />
            </View>
          ) : (
            <View
              style={[
                styles.methodBadge,
                { backgroundColor: active ? effectiveTint : theme.colors.surfaceVariant },
              ]}
            >
              <Icon
                name={active ? 'check' : 'plus'}
                size={14}
                color={active ? '#fff' : theme.colors.onSurfaceVariant}
              />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

MethodCard.displayName = 'MethodCard';

// ─── OTP Setup Sheet ─────────────────────────────────────────────────────────

interface SetupSheetProps {
  visible: boolean;
  method: 'email_otp' | 'mobile_otp';
  userEmail: string;
  userPhone: string;
  onDismiss: () => void;
  onSuccess: () => void;
}

const SetupSheet: React.FC<SetupSheetProps> = ({
  visible,
  method,
  userEmail,
  userPhone,
  onDismiss,
  onSuccess,
}) => {
  const theme = useTheme();

  const [step, setStep] = useState<'idle' | 'otp'>('idle');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [alreadySent, setAlreadySent] = useState(false);

  const { mutate: setupEmail, isPending: sendingEmail } = useSetup2FAEmailOtp();
  const { mutate: setupMobile, isPending: sendingMobile } = useSetup2FAMobileOtp();
  const { mutate: enable2FA, isPending: enabling } = useEnable2FA();
  const { secondsLeft, canResend, startCooldown } = useOtpResendCooldown();

  const sending = sendingEmail || sendingMobile;
  const busy = sending || enabling;

  const isEmail = method === 'email_otp';
  const destination = isEmail ? userEmail : userPhone;
  const icon = isEmail ? 'email-lock' : 'phone-lock';

  // Reset when sheet opens/closes
  React.useEffect(() => {
    if (!visible) {
      setStep('idle');
      setOtp('');
      setOtpError(false);
      setTempToken(null);
      setAlreadySent(false);
    }
  }, [visible]);

  const handleSendOtp = useCallback(() => {
    const mutate = isEmail ? setupEmail : setupMobile;
    mutate(undefined, {
      onSuccess: (data) => {
        setTempToken(data.tempToken);
        setAlreadySent(data.alreadySent ?? false);
        setStep('otp');
        setOtp('');
        setOtpError(false);
        if (!data.alreadySent) startCooldown();
      },
    });
  }, [isEmail, setupEmail, setupMobile, startCooldown]);

  const handleVerify = useCallback(
    (code: string) => {
      if (!tempToken) return;
      setOtpError(false);
      enable2FA(
        { method, tempToken, code },
        {
          onSuccess: () => onSuccess(),
          onError: () => {
            setOtpError(true);
            setOtp('');
          },
        },
      );
    },
    [tempToken, method, enable2FA, onSuccess],
  );

  return (
    <BottomSheet
      visible={visible}
      onDismiss={onDismiss}
      scrollable
      dismissable={step === 'idle'}
      enablePanDownToClose={step === 'idle'}
      footer={
        <View style={[sheetStyles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
        {step === 'idle' ? (
          <FilledButton
            onPress={handleSendOtp}
            loading={sending}
            disabled={busy}
            style={{ flex: 1 }}
          >
            Send Code
          </FilledButton>
        ) : canResend ? (
          <OutlinedButton
            onPress={handleSendOtp}
            loading={sending}
            disabled={busy}
            style={{ flex: 1 }}
          >
            Resend Code
          </OutlinedButton>
        ) : (
          <OutlinedButton disabled style={{ flex: 1 }}>
            {`Resend in ${secondsLeft}s`}
          </OutlinedButton>
        )}
      </View>
      }
    >
      <View style={sheetStyles.container}>
        {/* Header */}
        <View style={sheetStyles.topRow}>
          <View style={{ flex: 1 }} />
          <Text
            variant="titleSmall"
            style={{ color: theme.colors.onSurface, fontWeight: '700' }}
          >
            {isEmail ? 'Verify Email' : 'Verify Phone'}
          </Text>
          {step === 'idle' ? (
            <Pressable onPress={onDismiss} style={sheetStyles.closeBtn} hitSlop={8}>
              <Icon name="close" size={20} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>

        {/* Icon + description */}
        <View style={sheetStyles.header}>
          <View
            style={[
              sheetStyles.iconWrap,
              { backgroundColor: `${theme.colors.primary}18` },
            ]}
          >
            <Icon name={icon} size={28} color={theme.colors.primary} />
          </View>
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            {step === 'idle'
              ? `We'll send a 6-digit code to\n${destination}`
              : `Enter the code sent to\n${destination}`}
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
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.error,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                Invalid or expired code. Try again.
              </Text>
            )}
            {!otpError && alreadySent && (
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                A code was already sent — use it or request a new one below.
              </Text>
            )}
            {enabling && (
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                Enabling 2FA…
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Footer buttons */}
      
    </BottomSheet>
  );
};

SetupSheet.displayName = 'SetupSheet';

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TwoFactorScreen = () => {
  const theme = useTheme();
  const user = useAuthStore(selectUser);

  const { data: tfaStatus, refetch } = use2FAStatus();
  const { mutate: disable2FA, isPending: disabling } = useDisable2FA();

  const [setupMethod, setSetupMethod] = useState<'email_otp' | 'mobile_otp' | null>(null);
  const [disableConfirmVisible, setDisableConfirmVisible] = useState(false);

  const handleDisableConfirm = useCallback(() => {
    setDisableConfirmVisible(false);
    disable2FA(undefined, {
      onSuccess: () => refetch(),
    });
  }, [disable2FA, refetch]);

  const handleSetupSuccess = useCallback(() => {
    setSetupMethod(null);
    refetch();
  }, [refetch]);

  if (!user) return null;

  const enabled = tfaStatus?.enabled ?? user.twoFactorEnabled;
  const primaryMethod = tfaStatus?.primaryMethod ?? null;

  const emailActive = enabled && primaryMethod === 'email_otp';

  return (
    <SafeScreen edges={['left', 'right', 'bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        <Animated.View entering={FadeInDown.delay(0).springify()}>
          <ElevatedCard
            style={[styles.statusCard, { backgroundColor: enabled ? `${theme.colors.primary}12` : `${theme.colors.error}0C` }] as any}
          >
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIconWrap,
                  {
                    backgroundColor: enabled
                      ? `${theme.colors.primary}20`
                      : `${theme.colors.error}18`,
                  },
                ]}
              >
                <Icon
                  name={enabled ? 'shield-check' : 'shield-alert-outline'}
                  size={28}
                  color={enabled ? theme.colors.primary : theme.colors.error}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="titleSmall"
                  style={{
                    color: enabled ? theme.colors.primary : theme.colors.error,
                    fontWeight: '700',
                  }}
                >
                  {enabled ? '2FA is Active' : '2FA is Disabled'}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}
                >
                  {enabled
                    ? `Protected via ${primaryMethod === 'email_otp' ? 'Email OTP' : 'Phone OTP'}`
                    : 'Enable 2FA to secure your account'}
                </Text>
              </View>
            </View>
          </ElevatedCard>
        </Animated.View>

        {/* Section: choose method */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={styles.sectionHeader}
        >
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.primary, letterSpacing: 1 }}
          >
            {enabled ? 'CURRENT METHOD' : 'CHOOSE A METHOD'}
          </Text>
        </Animated.View>

        <MethodCard
          icon="email-lock"
          title="Email OTP"
          subtitle={`Codes sent to ${user.email}`}
          active={emailActive}
          tint={theme.colors.primary}
          onPress={() => {
            if (!emailActive) setSetupMethod('email_otp');
          }}
          delay={100}
        />

        <View style={{ height: 10 }} />

        <MethodCard
          icon="phone-lock-outline"
          title="Phone OTP"
          subtitle="Coming soon"
          active={false}
          tint="#059669"
          onPress={() => {}}
          delay={130}
          disabled
        />

        {/* Divider + Disable button when enabled */}
        {enabled && (
          <>
            <Animated.View
              entering={FadeInDown.delay(180).springify()}
              style={styles.sectionHeader}
            >
              <Text
                variant="labelSmall"
                style={{ color: theme.colors.error, letterSpacing: 1 }}
              >
                DANGER ZONE
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <ElevatedCard style={styles.dangerCard}>
                <Pressable
                  onPress={() => setDisableConfirmVisible(true)}
                  style={({ pressed }) => [
                    styles.dangerRow,
                    { backgroundColor: pressed ? `${theme.colors.error}08` : 'transparent' },
                  ]}
                >
                  <View
                    style={[
                      styles.dangerIcon,
                      { backgroundColor: `${theme.colors.error}18` },
                    ]}
                  >
                    <Icon name="shield-off-outline" size={20} color={theme.colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.error, fontWeight: '600' }}
                    >
                      Disable 2FA
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Not recommended — reduces account security
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>
              </ElevatedCard>
            </Animated.View>
          </>
        )}

        {/* Info note */}
        <Animated.View
          entering={FadeInDown.delay(240).springify()}
          style={styles.infoNote}
        >
          <Icon name="information-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant, marginLeft: 6, flex: 1 }}
          >
            When 2FA is active, you'll be asked for a code on every login. Keep access
            to your email or phone to avoid being locked out.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Setup bottom sheet */}
      {setupMethod && (
        <SetupSheet
          visible={!!setupMethod}
          method={setupMethod}
          userEmail={user.email}
          userPhone={user.phone ?? ''}
          onDismiss={() => setSetupMethod(null)}
          onSuccess={handleSetupSuccess}
        />
      )}

      {/* Disable confirm dialog */}
      <ConfirmDialog
        visible={disableConfirmVisible}
        title="Disable Two-Factor Auth?"
        message={
          'Without 2FA anyone who knows your password can access your account.\n\n' +
          'You can re-enable it at any time from Account → Security.'
        }
        confirmText="Disable"
        cancelText="Keep enabled"
        loading={disabling}
        onConfirm={handleDisableConfirm}
        onCancel={() => setDisableConfirmVisible(false)}
      />
    </SafeScreen>
  );
};

export default TwoFactorScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  statusCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodText: {
    flex: 1,
  },
  methodBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dangerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 4,
    gap: 2,
  },
});

const sheetStyles = StyleSheet.create({
  container: {
    padding: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  closeBtn: {
    flex: 1,
    alignItems: 'flex-end',
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
    borderTopWidth: 1,
  },
});
