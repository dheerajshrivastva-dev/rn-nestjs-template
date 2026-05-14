/**
 * Forgot Password Screen
 * User enters their registered email to receive a reset OTP
 */

import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Text,
  TextField,
  FilledButton,
  TextButton,
  useTheme,
  useToast,
} from '@forge/ui';
import {useForgotPassword} from '../../hooks';
import {useAuthStore} from '../../store/authStore';
import {AuthScreenLayout} from './AuthScreenLayout';

const COOLDOWN_SECONDS = 30;

// ============================================================================
// Validation Schema
// ============================================================================

const forgotPasswordSchema = z.object({
  email: z
    .string({required_error: 'Email is required'})
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ============================================================================
// Props
// ============================================================================

interface ForgotPasswordScreenProps {
  onSuccess?: (tempToken: string) => void;
  onBack?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onSuccess,
  onBack,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const forgotPasswordMutation = useForgotPassword();
  const {setForgotPasswordToken} = useAuthStore();

  // Cooldown lives in store as a timestamp so it survives back navigation
  const [cooldownUntil, setCooldownUntil] = useAuthStoreCooldown();
  const getSecondsLeft = () => Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    timerRef.current = setInterval(() => {
      const left = getSecondsLeft();
      setSecondsLeft(left);
      if (left <= 0 && timerRef.current) clearInterval(timerRef.current);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [secondsLeft > 0]);


  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {email: ''},
    mode: 'onBlur',
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (secondsLeft > 0) {
      toast.info(`Please wait ${secondsLeft}s before requesting another OTP.`);
      return;
    }
    try {
      const result = await forgotPasswordMutation.mutateAsync({
        email: data.email.trim().toLowerCase(),
      });
      if (result.tempToken) {
        setForgotPasswordToken(result.tempToken);
        setCooldownUntil(Date.now() + COOLDOWN_SECONDS * 1000);
        setSecondsLeft(COOLDOWN_SECONDS);
        onSuccess?.(result.tempToken);
      } else {
        toast.info(result.message || 'If an account exists, a reset email has been sent.');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        'Unable to send reset email. Please check your email address and try again.';
      toast.error(errorMessage);
    }
  };

  const canSend = secondsLeft <= 0 && !forgotPasswordMutation.isPending;

  return (
    <AuthScreenLayout
      title="Reset Password"
      subtitle="Enter your registered email address and we'll send you a verification code."
      onBack={onBack}
      backDisabled={forgotPasswordMutation.isPending}>

      {/* Email Field */}
      <Controller
        control={control}
        name="email"
        render={({field: {onChange, onBlur, value}}) => (
          <TextField
            label="Email Address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.email?.message}
            helperText={errors.email?.message}
            editable={!forgotPasswordMutation.isPending}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />

      <FilledButton
        onPress={handleSubmit(onSubmit)}
        loading={forgotPasswordMutation.isPending}
        disabled={!canSend}
        style={styles.continueButton}>
        {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Send OTP'}
      </FilledButton>

      <View style={styles.backLinkRow}>
        <TextButton onPress={onBack}>Back to Sign In</TextButton>
      </View>
    </AuthScreenLayout>
  );
};

// ============================================================================
// Cooldown stored outside Zustand (no need to persist to disk, just survive navigation)
// ============================================================================

let _cooldownUntil = 0;

function useAuthStoreCooldown(): [number, (v: number) => void] {
  const [value, setValue] = useState(_cooldownUntil);
  const set = (v: number) => {
    _cooldownUntil = v;
    setValue(v);
  };
  return [value, set];
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  continueButton: {
    borderRadius: 12,
  },
  backLinkRow: {
    alignItems: 'center',
  },
});
