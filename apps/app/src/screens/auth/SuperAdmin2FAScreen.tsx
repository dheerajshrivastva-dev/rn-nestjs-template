/**
 * Super Admin 2FA Verification Screen
 * Based on SUPER_ADMIN_FLOWS.md specifications
 * Uses @forge/ui OTPInput component
 * Validates OTP with backend and completes 2FA flow
 */

import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Animated} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Text,
  OTPInput,
  FilledButton,
  TextButton,
  useTheme,
  useToast,
} from '@forge/ui';
import {useComplete2FA, useResendOTP} from '../../hooks';
import {useAuthStore, selectTempToken} from '../../store/authStore';
import {OTP_CONFIG} from '../../api/types';
import {AuthScreenLayout} from './AuthScreenLayout';

// ============================================================================
// Validation Schema
// ============================================================================

const otpSchema = z.object({
  otp: z
    .string({required_error: 'OTP is required'})
    .length(OTP_CONFIG.CODE_LENGTH, `OTP must be ${OTP_CONFIG.CODE_LENGTH} digits`)
    .regex(/^\d+$/, 'OTP must contain only digits'),
});

type OTPFormData = z.infer<typeof otpSchema>;

// ============================================================================
// Props
// ============================================================================

interface SuperAdmin2FAScreenProps {
  /** Message from the backend describing where the code was sent (already masked) */
  message?: string;
  /** The 2FA method that was triggered */
  primaryMethod?: 'email_otp' | 'mobile_otp' | 'totp';
  onBack?: () => void;
  onVerificationSuccess?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const SuperAdmin2FAScreen: React.FC<SuperAdmin2FAScreenProps> = ({
  message,
  primaryMethod,
  onBack,
  onVerificationSuccess,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const tempToken = useAuthStore(selectTempToken);

  const complete2FAMutation = useComplete2FA();
  const resendOTPMutation = useResendOTP();

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: {errors},
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {otp: ''},
  });

  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const shakeAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    setResendTimer(60);
    setCanResend(false);

    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: -10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();
  };

  const onSubmit = async (data: OTPFormData) => {
    if (!tempToken) {
      toast.error('Session expired', 'Please login again.');
      onBack?.();
      return;
    }

    clearErrors();

    try {
      await complete2FAMutation.mutateAsync(data.otp);
      onVerificationSuccess?.();
    } catch (error: any) {
      triggerShake();
      setValue('otp', '');
      const errorMessage =
        error?.response?.data?.message || 'Invalid OTP. Please try again.';
      setError('otp', {type: 'manual', message: errorMessage});
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || !tempToken) return;

    try {
      await resendOTPMutation.mutateAsync({tempToken});
      setResendTimer(60);
      setCanResend(false);
      toast.success('OTP resent', 'OTP has been resent to your email.');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Failed to resend OTP. Please try again.';
      toast.error('Error', errorMessage);
    }
  };

  const handleOTPComplete = (otp: string) => {
    setValue('otp', otp);
    handleSubmit(onSubmit)();
  };

  const isLoading = complete2FAMutation.isPending;

  const subtitle =
    message ||
    (primaryMethod === 'mobile_otp'
      ? '2FA code sent to your phone'
      : primaryMethod === 'totp'
      ? 'Enter the code from your authenticator app'
      : '2FA code sent to your email');

  return (
    <AuthScreenLayout
      title="Super Admin Verification"
      subtitle={subtitle}
      onBack={onBack}
      backDisabled={isLoading}>

      {/* OTP Input */}
      <Animated.View
        style={[styles.otpContainer, {transform: [{translateX: shakeAnimation}]}]}>
        <Controller
          control={control}
          name="otp"
          render={({field: {onChange, value}}) => (
            <OTPInput
              value={value}
              onChangeText={onChange}
              onComplete={handleOTPComplete}
              error={!!errors.otp}
              disabled={isLoading}
              length={OTP_CONFIG.CODE_LENGTH}
            />
          )}
        />
      </Animated.View>

      {errors.otp && (
        <Text
          variant="bodySmall"
          align="center"
          style={styles.errorText}
          color={theme.colors.error}>
          {errors.otp.message}
        </Text>
      )}

      <FilledButton
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.verifyButton}>
        Verify & Continue
      </FilledButton>

      {/* Resend OTP */}
      <View style={styles.resendContainer}>
        <Text variant="bodySmall" align="center" color={theme.colors.onSurfaceVariant}>
          Didn't receive the code?
        </Text>
        {canResend ? (
          <TextButton
            onPress={handleResendOTP}
            disabled={resendOTPMutation.isPending}
            color={theme.colors.primary}>
            {resendOTPMutation.isPending ? 'Sending...' : 'Resend OTP'}
          </TextButton>
        ) : (
          <Text
            variant="labelLarge"
            align="center"
            color={theme.colors.outline}
            style={styles.resendTimer}>
            Resend OTP (0:{resendTimer.toString().padStart(2, '0')})
          </Text>
        )}
      </View>

      <View style={styles.divider} />
      <View style={[styles.securityNote, {backgroundColor: theme.colors.tertiaryContainer}]}>
        <Text variant="bodySmall" align="center" color={theme.colors.onTertiaryContainer}>
          🔒 Enhanced security for admin access
        </Text>
      </View>
    </AuthScreenLayout>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  otpContainer: {
    marginBottom: 8,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 8,
  },
  verifyButton: {
    marginTop: 16,
    height: 40,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendTimer: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 24,
  },
  securityNote: {
    padding: 12,
    borderRadius: 8,
  },
});
