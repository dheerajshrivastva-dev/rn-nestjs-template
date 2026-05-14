/**
 * BiometricLoginScreen
 *
 * Shown on app launch when hasBiometricSetup = true.
 * Offers three paths:
 *   1. Fingerprint — auto-triggers on mount if available; manual button after cancel
 *   2. PIN — 4–6 digit entry, 3 attempts max before full-logout
 *   3. "Use password instead" — navigates back to full LoginScreen
 *
 * Attempt limits:
 *   PIN:         3 attempts → clears biometric data + navigates to LoginScreen
 *   Fingerprint: 5 attempts → hides fingerprint button; PIN still available
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';

import {
  View,
  StyleSheet,
  Animated,
  Platform,
  Image,
} from 'react-native';

import {
  SafeScreen,
  Text,
  TextButton,
  OTPInput,
  KeyboardAwareScrollContainer,
  useTheme,
  IconButton,
  useToast,
  AlertDialog,
} from '@forge/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {FEATURES} from '../../config/featureFlags';
import {useBiometricLogin} from '../../hooks';
import {useAuthStore} from '../../store/authStore';
import {
  verifyPin,
  checkBiometricAvailability,
  getStoredIdentifier,
  clearAllBiometricData,
  PIN_ATTEMPTS_KEY,
} from '../../utils/biometricStorage';

// ============================================================================
// Constants
// ============================================================================

const MAX_PIN_ATTEMPTS = 3;
const MAX_FINGERPRINT_ATTEMPTS = 5;

// ============================================================================
// Props
// ============================================================================

interface BiometricLoginScreenProps {
  onLoginSuccess: () => void;
  onUsePassword: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const BiometricLoginScreen: React.FC<BiometricLoginScreenProps> = ({
  onLoginSuccess,
  onUsePassword,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const biometricLogin = useBiometricLogin();
  const setHasBiometricSetup = useAuthStore(s => s.setHasBiometricSetup);

  const [alertDialog, setAlertDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttonText: string;
    onPress: () => void;
  }>({ visible: false, title: '', message: '', buttonText: 'OK', onPress: () => {} });

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const identifierRef = useRef<string | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [fingerprintAttempts, setFingerprintAttempts] = useState(0);
  const [pinError, setPinError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fingerprintLocked = fingerprintAttempts >= MAX_FINGERPRINT_ATTEMPTS;

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const [availability, storedId, savedAttempts] = await Promise.all([
        checkBiometricAvailability(),
        getStoredIdentifier(),
        AsyncStorage.getItem(PIN_ATTEMPTS_KEY),
      ]);
      setBiometricAvailable(availability.available);
      setIdentifier(storedId);
      identifierRef.current = storedId;
      if (savedAttempts) setPinAttempts(parseInt(savedAttempts, 10));
    };
    init();
  }, []);

  // Auto-trigger fingerprint prompt once on mount if available
  useEffect(() => {
    if (biometricAvailable && !fingerprintLocked && !autoTriggered && identifier) {
      setAutoTriggered(true);
      // Small delay to allow the screen animation to settle
      const timer = setTimeout(() => handleFingerprintPress(), 500);
      return () => clearTimeout(timer);
    }
  }, [biometricAvailable, identifier]);

  // ── Shake animation ───────────────────────────────────────────────────────

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 10, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -10, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 8, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -8, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 60, useNativeDriver: true}),
    ]).start();
  }, [shakeAnim]);

  // ── Shared: dispatch login result to navigation ───────────────────────────

  const handleLoginResult = useCallback(
    async (result: {tempToken?: string; accessToken?: string}) => {
      await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
      if (result.accessToken) {
        onLoginSuccess();
      }
    },
    [onLoginSuccess],
  );

  // ── Handle expired / revoked biometric ───────────────────────────────────
  // clearAllBiometricData() + setHasBiometricSetup(false) already called by
  // useBiometricLogin.onError before this screen's catch fires. We just show UI.

  const handleExpiredBiometric = useCallback(() => {
    setAlertDialog({
      visible: true,
      title: 'Quick Login Removed',
      message: 'Your fingerprint login was removed. Sign in with your password — you can set up fingerprint again after logging in.',
      buttonText: 'Sign In',
      onPress: onUsePassword,
    });
  }, [onUsePassword]);

  // ── Fingerprint path ──────────────────────────────────────────────────────
  // The hook fetches a challenge, calls createSignature (OS biometric prompt),
  // then sends the signature to the server — no token stored on device.

  const handleFingerprintPress = useCallback(async () => {
    const id = identifierRef.current;
    if (fingerprintLocked || isLoading || !id) return;
    setIsLoading(true);
    try {
      const result = await biometricLogin.mutateAsync({identifier: id});
      await handleLoginResult(result);
    } catch (error: any) {
      // Prefer the server's message over the generic axios one
      const msg: string = error?.response?.data?.message ?? error?.message ?? '';
      if (msg === 'Biometric authentication cancelled or failed') {
        // User cancelled the OS prompt — count as an attempt
        const newCount = fingerprintAttempts + 1;
        setFingerprintAttempts(newCount);
        if (newCount >= MAX_FINGERPRINT_ATTEMPTS) {
          toast.error('Fingerprint Disabled', 'Too many failed attempts. Please enter your PIN.');
        }
      } else if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('not registered')) {
        handleExpiredBiometric();
      } else {
        toast.error('Login Failed', msg || 'Fingerprint login failed. Please try your PIN.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    fingerprintAttempts,
    fingerprintLocked,
    isLoading,
    biometricLogin,
    handleLoginResult,
    handleExpiredBiometric,
  ]);

  // ── PIN path ──────────────────────────────────────────────────────────────

  const handlePinComplete = useCallback(
    async (enteredPin: string) => {
      const id = identifierRef.current;
      if (!id || isLoading) return;
      setPinError('');

      const valid = await verifyPin(enteredPin);
      if (!valid) {
        shake();
        setPinValue('');
        const newAttempts = pinAttempts + 1;
        setPinAttempts(newAttempts);
        await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, String(newAttempts));

        const remaining = MAX_PIN_ATTEMPTS - newAttempts;
        if (remaining <= 0) {
          await clearAllBiometricData();
          setHasBiometricSetup(false);
          await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
          setAlertDialog({
            visible: true,
            title: 'Too Many Attempts',
            message: 'Quick login has been disabled due to too many incorrect PINs. Please sign in with your password.',
            buttonText: 'OK',
            onPress: onUsePassword,
          });
          return;
        }
        setPinError(
          remaining === 1
            ? '1 attempt remaining before quick login is disabled'
            : `${remaining} attempts remaining`,
        );
        return;
      }

      // PIN correct — trigger biometric login (hook fetches challenge + signs it)
      setIsLoading(true);
      try {
        const result = await biometricLogin.mutateAsync({identifier: id});
        await handleLoginResult(result);
      } catch (error: any) {
        const msg: string = error?.response?.data?.message ?? error?.message ?? '';
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('not registered')) {
          handleExpiredBiometric();
        } else {
          toast.error('Login Failed', msg || 'Please try again or use your password.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      pinAttempts,
      shake,
      setHasBiometricSetup,
      biometricLogin,
      handleLoginResult,
      handleExpiredBiometric,
      onUsePassword,
    ],
  );

  // ── Masked identifier display ─────────────────────────────────────────────

  // eslint-disable-next-line no-nested-ternary
  const maskedIdentifier = identifier
    ? identifier.length > 6
      ? `${identifier.slice(0, 4)}${'•'.repeat(identifier.length - 7)}${identifier.slice(-3)}`
      : identifier
    : '';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeScreen edges={['top', 'bottom', 'left', 'right']}>

      <KeyboardAwareScrollContainer
        style={{backgroundColor: theme.colors.background}}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>

          {/* Logo */}
          <View
            style={[
              styles.logoContainer,
              {backgroundColor: theme.colors.primaryContainer},
            ]}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Greeting */}
          <Text
            variant="headlineSmall"
            align="center"
            color={theme.colors.onBackground}
            style={styles.greeting}>
            Welcome back
          </Text>
          {maskedIdentifier ? (
            <Text
              variant="bodyMedium"
              align="center"
              color={theme.colors.onSurfaceVariant}>
              {maskedIdentifier}
            </Text>
          ) : null}

          {/* Fingerprint card (only if available and not locked) */}
          {biometricAvailable && !fingerprintLocked && (
            <React.Fragment>
              <IconButton
                icon="fingerprint"
                onPress={handleFingerprintPress}
                disabled={isLoading}
                size={48}
              />
              <Text
                variant="labelMedium"
                align="center"
                color={theme.colors.onPrimaryContainer}>
                {isLoading ? 'Verifying…' : 'Touch sensor to unlock'}
              </Text>
            </React.Fragment>
          )}

          {fingerprintLocked && (
            <View
              style={[
                styles.lockedBadge,
                {backgroundColor: theme.colors.errorContainer},
              ]}>
              <Text variant="labelSmall" color={theme.colors.onErrorContainer} align="center">
                Fingerprint disabled after {MAX_FINGERPRINT_ATTEMPTS} failed attempts
              </Text>
            </View>
          )}

          {/* Divider + PIN Entry — hidden until PIN login flow is ready */}
          {FEATURES.PIN_LOGIN && (
            <>
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, {backgroundColor: theme.colors.outlineVariant}]} />
                <Text
                  variant="labelMedium"
                  color={theme.colors.onSurfaceVariant}
                  style={styles.dividerLabel}>
                  or enter PIN
                </Text>
                <View style={[styles.dividerLine, {backgroundColor: theme.colors.outlineVariant}]} />
              </View>

              <View
                style={[
                  styles.pinCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outlineVariant,
                    ...Platform.select({
                      android: {elevation: 1},
                      ios: {
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 1},
                        shadowOpacity: 0.06,
                        shadowRadius: 6,
                      },
                    }),
                  },
                ]}>
                <Animated.View style={{transform: [{translateX: shakeAnim}]}}>
                  <OTPInput
                    length={6}
                    value={pinValue}
                    onChangeText={setPinValue}
                    onComplete={handlePinComplete}
                    secureTextEntry
                  />
                </Animated.View>

                {pinError ? (
                  <Text
                    variant="labelSmall"
                    align="center"
                    color={theme.colors.error}
                    style={styles.pinErrorText}>
                    {pinError}
                  </Text>
                ) : null}

                {pinAttempts > 0 && !pinError && (
                  <Text
                    variant="labelSmall"
                    align="center"
                    color={theme.colors.onSurfaceVariant}
                    style={styles.pinErrorText}>
                    {MAX_PIN_ATTEMPTS - pinAttempts} attempt{MAX_PIN_ATTEMPTS - pinAttempts !== 1 ? 's' : ''} remaining
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Password fallback */}
          <TextButton onPress={onUsePassword} style={styles.passwordButton}>
            Use password instead
          </TextButton>
        </View>
      </KeyboardAwareScrollContainer>

      <AlertDialog
        visible={alertDialog.visible}
        title={alertDialog.title}
        message={alertDialog.message}
        buttonText={alertDialog.buttonText}
        onPress={() => {
          setAlertDialog(d => ({ ...d, visible: false }));
          alertDialog.onPress();
        }}
      />
    </SafeScreen>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  accentBar: {
    height: 3,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  content: {
    paddingHorizontal: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  greeting: {
    fontWeight: '700',
  },
  lockedBadge: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    flexShrink: 0,
  },
  pinCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  pinErrorText: {
    marginTop: 10,
  },
  passwordButton: {
    marginTop: 4,
  },
});
