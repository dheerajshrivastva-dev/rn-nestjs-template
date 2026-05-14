/**
 * Reset Password Screen
 * User enters the OTP received via email and sets a new password
 * OTP verification + new password with strength requirements
 */

import React, {useRef, useState, useEffect} from 'react';
import {View, StyleSheet, Animated, type TextInput} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Text,
  OTPInput,
  PasswordInput,
  FilledButton,
  TextButton,
  useTheme,
  useToast,
} from '@forge/ui';
import {useResetPassword} from '../../hooks';
import {useAuthStore} from '../../store/authStore';
import {useResendOTP} from '../../hooks/mutations/useResendOTP';
import {useOtpResendCooldown} from '../../hooks/useOtpResendCooldown';
import {OTP_CONFIG} from '../../api/types';
import {AuthScreenLayout} from './AuthScreenLayout';

// ============================================================================
// Validation Schema
// ============================================================================

const resetPasswordSchema = z
  .object({
    otp: z
      .string({required_error: 'OTP is required'})
      .length(OTP_CONFIG.CODE_LENGTH, `OTP must be ${OTP_CONFIG.CODE_LENGTH} digits`)
      .regex(/^\d+$/, 'OTP must contain only digits'),
    newPassword: z
      .string({required_error: 'Password is required'})
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number')
      .regex(/[@$!%*?&]/, 'Must contain at least one special character (@$!%*?&)'),
    confirmPassword: z.string({required_error: 'Please confirm your password'}),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================================================
// Props
// ============================================================================

interface ResetPasswordScreenProps {
  token: string;
  onBack?: () => void;
  onSuccess?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({
  token,
  onBack,
  onSuccess,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const resetPasswordMutation = useResetPassword();
  const {setForgotPasswordToken} = useAuthStore();
  const resendOTPMutation = useResendOTP();
  const { secondsLeft, canResend, startCooldown } = useOtpResendCooldown();
  const newPasswordRef = useRef<TextInput>(null);

  // OTP was already sent when this screen opened — start the initial cooldown
  useEffect(() => { startCooldown(); }, []);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Shake animation for OTP error
  const shakeAnimation = useState(new Animated.Value(0))[0];

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: {errors},
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {otp: '', newPassword: '', confirmPassword: ''},
  });

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: -10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Session Expired', 'Please go back and request a new OTP.');
      onBack?.();
      return;
    }

    clearErrors();

    try {
      await resetPasswordMutation.mutateAsync({
        tempToken: token,
        otp: data.otp,
        newPassword: data.newPassword,
      });

      setForgotPasswordToken(null);
      toast.success('Password reset successful');
      onSuccess?.();
    } catch (error: any) {
      triggerShake();
      setValue('otp', '');

      const errorMessage =
        error?.response?.data?.message || 'Invalid or expired OTP. Please try again.';

      setError('otp', {type: 'manual', message: errorMessage});
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOTPMutation.mutateAsync({tempToken: token});
      startCooldown();
      toast.success('OTP resent to your email');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to resend OTP. Please try again.';
      toast.error(msg);
    }
  };

  const handleOTPComplete = (otp: string) => {
    setValue('otp', otp);
    newPasswordRef.current?.focus();
  };

  const isLoading = resetPasswordMutation.isPending;

  return (
    <AuthScreenLayout
      title="Create New Password"
      subtitle="Enter the 6-digit code sent to your email and set a new password."
      onBack={onBack}
      backDisabled={isLoading}>
      {/* OTP Input */}
      <Animated.View
        style={[
          styles.otpContainer,
          {transform: [{translateX: shakeAnimation}]},
        ]}>
        <Text
          variant="labelLarge"
          style={styles.fieldLabel}
          color={theme.colors.onSurfaceVariant}>
          Verification Code
        </Text>
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
        {errors.otp && (
          <Text
            variant="bodySmall"
            align="center"
            style={styles.errorText}
            color={theme.colors.error}>
            {errors.otp.message}
          </Text>
        )}

        <View style={styles.resendRow}>
          {canResend ? (
            <TextButton
              onPress={handleResend}
              disabled={resendOTPMutation.isPending || isLoading}>
              Resend OTP
            </TextButton>
          ) : (
            <Text variant="bodySmall" color={theme.colors.onSurfaceVariant}>
              Resend in {secondsLeft}s
            </Text>
          )}
        </View>
      </Animated.View>

      {/* New Password */}
      <Controller
        control={control}
        name="newPassword"
        render={({field: {onChange, onBlur, value}}) => (
          <PasswordInput
            ref={newPasswordRef}
            label="New Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.newPassword?.message}
            helperText={errors.newPassword?.message}
            editable={!isLoading}
            placeholder="Min 8 chars, upper, lower, number, special"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            blurOnSubmit={false}
          />
        )}
      />

      {/* Confirm Password */}
      <Controller
        control={control}
        name="confirmPassword"
        render={({field: {onChange, onBlur, value}}) => (
          <PasswordInput
            ref={confirmPasswordRef}
            label="Confirm Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.confirmPassword?.message}
            helperText={errors.confirmPassword?.message}
            editable={!isLoading}
            placeholder="Re-enter your new password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit(onSubmit)}
            blurOnSubmit={false}
          />
        )}
      />

      <FilledButton
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        disabled={isLoading}
        style={styles.resetButton}>
        Reset Password
      </FilledButton>

      <View
        style={[
          styles.securityNote,
          {backgroundColor: theme.colors.tertiaryContainer},
        ]}>
        <Text
          variant="bodySmall"
          align="center"
          color={theme.colors.onTertiaryContainer}>
          🔒 OTP expires in 10 minutes.
        </Text>
      </View>
    </AuthScreenLayout>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  fieldLabel: {
    marginBottom: 8,
  },
  otpContainer: {
    marginBottom: 24,
  },
  errorText: {
    marginTop: 8,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  fieldGap: {
    height: 8,
  },
  buttonGap: {
    height: 20,
  },
  resetButton: {
    borderRadius: 12,
  },
  divider: {
    marginVertical: 24,
  },
  securityNote: {
    padding: 12,
    borderRadius: 8,
  },
});
