/**
 * Login Screen
 * Universal login for all roles (Super Admin, Admin, User)
 * Based on SUPER_ADMIN_FLOWS.md and DEMI_ADMIN_FLOWS_MODERN.md
 * Uses @bevarc/ui components with Material Design 3
 * Form validation with react-hook-form + zod
 */

import React, {useRef, useState} from 'react';
import {View, StyleSheet, type TextInput} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
  Text,
  PhoneInput,
  PasswordInput,
  FilledButton,
  TextButton,
  useTheme,
  useToast,
} from '@bevarc/ui';
import {useLogin} from '../../hooks';
import {UseLoginInput} from '../../api/types';
import {AuthScreenLayout} from './AuthScreenLayout';
import {indianMobileSchema} from '../../utils/validation';

// ============================================================================
// Validation Schema
// ============================================================================

const loginSchema = z.object({
  phone: indianMobileSchema,
  countryCode: z.string().default('+91'),
  password: z
    .string({required_error: 'Password is required'})
    .min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// Props
// ============================================================================

interface TwoFAParams {
  message?: string;
  primaryMethod?: 'email_otp' | 'mobile_otp' | 'totp';
}

interface LoginScreenProps {
  /** Called when backend returns tempToken (2FA required). Passes method context for display. */
  onNavigateTo2FA?: (params: TwoFAParams) => void;
  /** Receives the identifier (phone with country code) so PIN setup can store it */
  onLoginSuccess?: (identifier?: string) => void;
  onForgotPassword?: () => void;
  onRegister?: () => void;
  /** Pre-populate phone from registration "account exists" redirect */
  prefill?: { phone?: string; countryCode?: string };
}

// Backwards compatibility
export interface SuperAdminLoginScreenProps extends LoginScreenProps {}

// ============================================================================
// Component
// ============================================================================

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateTo2FA,
  onLoginSuccess,
  onForgotPassword,
  onRegister,
  prefill,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const loginMutation = useLogin();
  const [countryCode, setCountryCode] = useState(prefill?.countryCode ?? '+91');
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: prefill?.phone ?? '',
      countryCode: prefill?.countryCode ?? '+91',
      password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: LoginFormData) => {
    const fullPhoneNumber = `${countryCode}${data.phone.trim()}`;

    const credentials: UseLoginInput = {
      identifier: fullPhoneNumber,
      password: data.password,
    };

    try {
      const result = await loginMutation.mutateAsync(credentials);

      if (result.tempToken) {
        onNavigateTo2FA?.({
          message: result.message,
          primaryMethod: result.primaryMethod,
        });
      } else if (result.accessToken) {
        onLoginSuccess?.(fullPhoneNumber);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        'Invalid phone number or password. Please try again.';
      toast.error('Login Failed', errorMessage);
    }
  };

  const handleFormSubmit = handleSubmit(onSubmit);

  return (
    <AuthScreenLayout title="Sign in to your account">
      {/* Autofill section — groups username+password for Samsung Pass / Android Autofill */}
      {/* Phone Number Field */}
      <Controller
        control={control}
        name="phone"
        render={({field: {onChange, onBlur, value}}) => (
          <PhoneInput
            label="Phone Number"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            error={!!errors.phone?.message}
            helperText={errors.phone?.message}
            editable={!loginMutation.isPending}
            placeholder="9876543210"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
        )}
      />

      {/* Password Field */}
      <Controller
        control={control}
        name="password"
        render={({field: {onChange, onBlur, value}}) => (
          <PasswordInput
            ref={passwordRef}
            label="Password"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.password?.message}
            helperText={errors.password?.message}
            editable={!loginMutation.isPending}
            placeholder="Enter your password"
            returnKeyType="done"
            onSubmitEditing={handleFormSubmit}
            blurOnSubmit={false}
          />
        )}
      />

      <FilledButton
        onPress={handleFormSubmit}
        loading={loginMutation.isPending}
        disabled={loginMutation.isPending}
        style={styles.signInButton}>
        Sign In
      </FilledButton>

      <View style={styles.forgotPasswordRow}>
        <TextButton
          onPress={onForgotPassword}
          disabled={loginMutation.isPending}>
          Forgot Password?
        </TextButton>
      </View>

      <View
        style={[
          styles.registerRow,
          {borderTopColor: theme.colors.outlineVariant},
        ]}>
        <Text
          variant="bodyMedium"
          style={{color: theme.colors.onSurfaceVariant}}>
          New to Bevarc?
        </Text>
        <TextButton
          onPress={onRegister}
          disabled={loginMutation.isPending}>
          Create Account
        </TextButton>
      </View>
    </AuthScreenLayout>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  signInButton: {
    borderRadius: 12,
  },
  forgotPasswordRow: {
    alignItems: 'center',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  securityNote: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});

// ============================================================================
// Backwards Compatibility Export
// ============================================================================

export const SuperAdminLoginScreen = LoginScreen;
