/**
 * PinSetupScreen
 *
 * Shown once after the user's first successful password login.
 * Guides the user through a 3-step quick-login setup:
 *   Step 1 — Enter a 4–6 digit PIN
 *   Step 2 — Confirm the PIN
 *   Step 3 — (optional) Enable fingerprint in addition to PIN
 *
 * On completion: calls POST /auth/biometric-setup, stores the returned
 * biometricToken in Keychain, and sets hasBiometricSetup = true in the store.
 * The screen is skippable at every step.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';

import {
  View,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';

import {
  SafeScreen,
  Text,
  FilledButton,
  OutlinedButton,
  TextButton,
  OTPInput,
  KeyboardAwareScrollContainer,
  useTheme,
  useToast,
} from '@forge/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {FEATURES} from '../../config/featureFlags';
import {useBiometricSetup} from '../../hooks';
import {useAuthStore} from '../../store/authStore';
import {
  storePinHash,
  checkBiometricAvailability,
} from '../../utils/biometricStorage';



// ============================================================================
// Types
// ============================================================================

type SetupStep = 'enter' | 'confirm' | 'fingerprint';

interface PinSetupScreenProps {
  identifier: string;        // Phone number from the preceding login
  onSetupComplete: () => void;
  onSkip: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const PinSetupScreen: React.FC<PinSetupScreenProps> = ({
  identifier,
  onSetupComplete,
  onSkip,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const biometricSetup = useBiometricSetup();
  const setHasBiometricSetup = useAuthStore(s => s.setHasBiometricSetup);

  const [step, setStep] = useState<SetupStep>(FEATURES.PIN_LOGIN ? 'enter' : 'fingerprint');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Shake animation for PIN mismatch
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkBiometricAvailability().then(({available}) =>
      setBiometricAvailable(available),
    );
  }, []);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 10, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -10, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 8, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -8, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0, duration: 60, useNativeDriver: true}),
    ]).start();
  }, [shakeAnim]);

  const handlePinEntered = useCallback(
    (enteredPin: string) => {
      setPin(enteredPin);
      setConfirmPin('');
      setStep('confirm');
    },
    [],
  );

  const handleConfirmPin = useCallback(
    async (confirmedPin: string) => {
      if (confirmedPin !== pin) {
        shake();
        toast.error('PIN Mismatch', 'The PINs you entered do not match. Please try again.');
        setPin('');
        setConfirmPin('');
        setStep('enter');
        return;
      }
      await storePinHash(confirmedPin);
      if (biometricAvailable) {
        setStep('fingerprint');
      } else {
        await completeSetup();
      }
    },
    [pin, biometricAvailable, shake],
  );

  const completeSetup = useCallback(async () => {
    try {
      await biometricSetup.mutateAsync(identifier);
      setHasBiometricSetup(true);
      onSetupComplete();
    } catch {
      // If backend call fails we still let the user proceed —
      // they can set up again from Settings.
      toast.error('Setup Incomplete', 'Quick login could not be registered with the server. You can try enabling it again from Settings.');
      onSetupComplete();
    }
  }, [identifier, biometricSetup, setHasBiometricSetup, onSetupComplete]);

  // ── Header content per step ──────────────────────────────────────────────

  const stepTitle: Record<SetupStep, string> = {
    enter: 'Set up Quick Login',
    confirm: 'Confirm your PIN',
    fingerprint: 'Enable Fingerprint?',
  };

  const stepSubtitle: Record<SetupStep, string> = {
    enter: 'Choose a 4–6 digit PIN for fast, secure access',
    confirm: 'Enter your PIN again to confirm',
    fingerprint: 'Use your fingerprint alongside your PIN for even faster sign-in',
  };

  return (
    <SafeScreen edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAwareScrollContainer
        style={{backgroundColor: theme.colors.background}}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>

          {/* ── Icon ── */}
          <View
            style={[
              styles.iconContainer,
              {backgroundColor: theme.colors.primaryContainer},
            ]}>
            {step === 'fingerprint' ? (
              <Icon name="fingerprint" size={40} color={theme.colors.onPrimaryContainer} />
            ) : (
              <Icon name="lock" size={40} color={theme.colors.onPrimaryContainer} />
            )}
          </View>

          {/* ── Title ── */}
          <Text
            variant="headlineSmall"
            align="center"
            color={theme.colors.onBackground}
            style={styles.title}>
            {stepTitle[step]}
          </Text>
          <Text
            variant="bodyMedium"
            align="center"
            color={theme.colors.onSurfaceVariant}
            style={styles.subtitle}>
            {stepSubtitle[step]}
          </Text>

          {/* ── Step indicator — only shown when PIN steps are enabled ── */}
          {FEATURES.PIN_LOGIN && (
            <View style={styles.stepIndicator}>
              {(['enter', 'confirm', 'fingerprint'] as SetupStep[]).map(s => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    s === step ? styles.stepDotActive : styles.stepDotInactive,
                    {backgroundColor: s === step ? theme.colors.primary : theme.colors.outlineVariant},
                  ]}
                />
              ))}
            </View>
          )}

          {/* ── PIN Entry Card ── */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.onSurface,
                ...Platform.select({
                  android: {elevation: 2},
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                  },
                }),
              },
            ]}>

            {FEATURES.PIN_LOGIN && step === 'enter' && (
              <Animated.View style={{transform: [{translateX: shakeAnim}]}}>
                <OTPInput
                  length={6}
                  value={pin}
                  onChangeText={setPin}
                  onComplete={handlePinEntered}
                />
              </Animated.View>
            )}

            {FEATURES.PIN_LOGIN && step === 'confirm' && (
              <Animated.View style={{transform: [{translateX: shakeAnim}]}}>
                <OTPInput
                  length={6}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  onComplete={handleConfirmPin}
                />
              </Animated.View>
            )}

            {step === 'fingerprint' && (
              <View style={styles.fingerprintStep}>
                <View
                  style={[
                    styles.fingerprintIconBox,
                    {backgroundColor: theme.colors.secondaryContainer},
                  ]}>
                  <Icon name="fingerprint" size={40} color={theme.colors.onPrimaryContainer} />
                </View>
                <FilledButton
                  onPress={completeSetup}
                  loading={biometricSetup.isPending}
                  style={styles.actionButton}>
                  Enable Fingerprint
                </FilledButton>
                <OutlinedButton
                  onPress={onSkip}
                  disabled={biometricSetup.isPending}
                  style={styles.actionButton}>
                  {FEATURES.PIN_LOGIN ? 'Use PIN only' : 'Skip'}
                </OutlinedButton>
              </View>
            )}
          </View>

          {/* ── Continue / Skip — only shown during PIN steps ── */}
          {FEATURES.PIN_LOGIN && step !== 'fingerprint' && (
            <>
              <FilledButton
                onPress={() => {
                  if (step === 'enter') {
                    if (pin.length >= 6) handlePinEntered(pin);
                  } else {
                    if (confirmPin.length >= 6) handleConfirmPin(confirmPin);
                  }
                }}
                disabled={
                  step === 'enter' ? pin.length < 6 : confirmPin.length < 6
                }
                style={styles.continueButton}>
                Continue
              </FilledButton>
              <TextButton onPress={onSkip} style={styles.skipButton}>
                Skip for now
              </TextButton>
            </>
          )}
        </View>
      </KeyboardAwareScrollContainer>
    </SafeScreen>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    paddingHorizontal: 16,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stepDot: {
    height: 8,
    borderRadius: 6,
  },
  stepDotActive: {
    width: 20,
  },
  stepDotInactive: {
    width: 8,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    marginTop: 8,
  },
  fingerprintStep: {
    alignItems: 'center',
    gap: 12,
  },
  fingerprintIconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButton: {
    width: '100%',
  },
  continueButton: {
    width: '100%',
  },
  skipButton: {
    marginTop: 6,
  },
});
