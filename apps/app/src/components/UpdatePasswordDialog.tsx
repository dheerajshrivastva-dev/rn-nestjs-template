/**
 * UpdatePasswordDialog Component
 *
 * Advanced password update dialog with security options:
 * - Update own password or other users (SUPER_ADMIN only)
 * - Logout all devices option
 * - Reset or replace 2FA option
 * - Reason field for audit trail
 *
 * Permission-aware UI based on user role
 */

import React, {useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {
  Text,
  FilledButton,
  OutlinedButton,
  TextField,
  PasswordInput,
  useTheme,
  useToast,
} from '@forge/ui';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useUpdatePassword, useCanUpdateUserPassword} from '../hooks/mutations/useUpdatePassword';
import type {UserRole} from '../api/types';
import {useAuthStore} from '../store/authStore';
import {Checkbox} from 'react-native-paper';

// ============================================================================
// Validation Schema
// ============================================================================

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character',
      ),
    confirmPassword: z.string(),
    logoutAllDevices: z.boolean().optional(),
    reset2FA: z.boolean().optional(),
    replace2FAMethod: z
      .enum(['none', '2fa_totp', '2fa_mobile_otp'])
      .optional(),
    reason: z.string().optional(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

// ============================================================================
// Component Props
// ============================================================================

interface UpdatePasswordDialogProps {
  visible: boolean;
  onDismiss: () => void;
  targetUserId: string;
  targetUserName: string;
  targetUserRole: UserRole;
  isOwnPassword?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const UpdatePasswordDialog: React.FC<UpdatePasswordDialogProps> = ({
  visible,
  onDismiss,
  targetUserId,
  targetUserName,
  targetUserRole,
  isOwnPassword = false,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const {user} = useAuthStore();
  const updatePasswordMutation = useUpdatePassword();

  const canUpdatePassword = useCanUpdateUserPassword(
    targetUserRole,
    user?.role as UserRole,
  );

  const {
    control,
    handleSubmit,
    formState: {errors},
    watch,
    reset,
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      logoutAllDevices: false,
      reset2FA: false,
      replace2FAMethod: 'none',
      reason: '',
    },
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Watch form values for conditional rendering
  const watchReset2FA = watch('reset2FA');
  const watchReplace2FAMethod = watch('replace2FAMethod');

  // Handle form submission
  const onSubmit = async (data: UpdatePasswordFormData) => {
    try {
      const result = await updatePasswordMutation.mutateAsync({
        userId: targetUserId,
        newPassword: data.newPassword,
        currentPassword: isOwnPassword ? data.currentPassword : undefined,
        options: {
          logoutAllDevices: data.logoutAllDevices,
          reset2FA: data.reset2FA,
          replace2FAWithMethod:
            data.replace2FAMethod !== 'none'
              ? (data.replace2FAMethod as '2fa_totp' | '2fa_mobile_otp')
              : null,
          reason: data.reason,
        },
      });

      toast.success(
        'Success',
        `Password updated successfully for ${targetUserName}.${
          result.devicesLoggedOut
            ? ` ${result.devicesLoggedOut} device(s) logged out.`
            : ''
        }${
          result.twoFactorStatus
            ? ` 2FA Status: ${result.twoFactorStatus.enabled ? 'Enabled' : 'Disabled'}`
            : ''
        }`,
      );
      reset();
      onDismiss();
    } catch (error: any) {
      toast.error(
        'Error',
        error?.response?.data?.message ||
          'Failed to update password. Please try again.',
      );
    }
  };

  // Permission check
  if (!visible) return null;

  if (!isOwnPassword && !canUpdatePassword) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={{color: theme.colors.error}}>
          Permission Denied
        </Text>
        <Text variant="bodyMedium" style={{marginTop: 8}}>
          You do not have permission to update this user's password.
        </Text>
        <OutlinedButton
          onPress={onDismiss}
          style={{marginTop: 16}}
        >Close</OutlinedButton>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <Text variant="headlineSmall" style={{marginBottom: 8}}>
          Update Password
        </Text>
        <Text variant="bodyMedium" style={{color: theme.colors.onSurfaceVariant}}>
          {isOwnPassword
            ? 'Update your own password'
            : `Update password for ${targetUserName} (${targetUserRole})`}
        </Text>

        {/* Current Password (required for own password) */}
        {isOwnPassword && (
          <View style={styles.field}>
            <Controller
              control={control}
              name="currentPassword"
              rules={{required: 'Current password is required'}}
              render={({field: {onChange, onBlur, value}}) => (
                <PasswordInput
                  label="Current Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.currentPassword?.message}
                  helperText={errors.currentPassword?.message}
                />
              )}
            />
          </View>
        )}

        {/* New Password */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="newPassword"
            render={({field: {onChange, onBlur, value}}) => (
              <PasswordInput
                label="New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.newPassword?.message}
                helperText={
                  errors.newPassword?.message ||
                  'Min 8 chars, uppercase, lowercase, number, special char'
                }
              />
            )}
          />
        </View>

        {/* Confirm Password */}
        <View style={styles.field}>
          <Controller
            control={control}
            name="confirmPassword"
            render={({field: {onChange, onBlur, value}}) => (
              <PasswordInput
                label="Confirm New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={!!errors.confirmPassword?.message}
                helperText={errors.confirmPassword?.message}
              />
            )}
          />
        </View>

        {/* Advanced Options Toggle */}
        <OutlinedButton
          onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
          style={{marginTop: 16}}
        >{showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}</OutlinedButton>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <View style={styles.advancedOptions}>
            {/* Logout All Devices */}
            <View style={styles.checkboxRow}>
              <Controller
                control={control}
                name="logoutAllDevices"
                render={({field: {onChange, value}}) => (
                  <Checkbox
                    status={value ? 'checked' : 'unchecked'}
                    onPress={() => onChange(!value)}
                  />
                )}
              />
              <View style={styles.checkboxLabel}>
                <Text variant="bodyLarge">Logout from all devices</Text>
                <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
                  Terminate all active sessions after password update
                </Text>
              </View>
            </View>

            {/* Reset 2FA */}
            <View style={styles.checkboxRow}>
              <Controller
                control={control}
                name="reset2FA"
                render={({field: {onChange, value}}) => (
                  <Checkbox
                    status={value ? 'checked' : 'unchecked'}
                    onPress={() => onChange(!value)}
                  />
                )}
              />
              <View style={styles.checkboxLabel}>
                <Text variant="bodyLarge">Disable 2FA</Text>
                <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
                  Remove two-factor authentication requirement
                </Text>
              </View>
            </View>

            {/* Replace 2FA Method */}
            {!watchReset2FA && (
              <View style={styles.field}>
                <Text variant="bodyMedium" style={{marginBottom: 8}}>
                  Replace 2FA Method
                </Text>
                <Controller
                  control={control}
                  name="replace2FAMethod"
                  render={({field: {onChange, value}}) => (
                    <View>
                      <View style={styles.radioRow}>
                        <Checkbox
                          status={value === 'none' ? 'checked' : 'unchecked'}
                          onPress={() => onChange('none')}
                        />
                        <Text>Keep current 2FA method</Text>
                      </View>
                      <View style={styles.radioRow}>
                        <Checkbox
                          status={value === '2fa_totp' ? 'checked' : 'unchecked'}
                          onPress={() => onChange('2fa_totp')}
                        />
                        <Text>Replace with TOTP (Authenticator App)</Text>
                      </View>
                      <View style={styles.radioRow}>
                        <Checkbox
                          status={value === '2fa_mobile_otp' ? 'checked' : 'unchecked'}
                          onPress={() => onChange('2fa_mobile_otp')}
                        />
                        <Text>Replace with Mobile OTP (SMS)</Text>
                      </View>
                    </View>
                  )}
                />
              </View>
            )}

            {/* Reason (for audit log) */}
            {!isOwnPassword && (
              <View style={styles.field}>
                <Controller
                  control={control}
                  name="reason"
                  render={({field: {onChange, onBlur, value}}) => (
                    <TextField
                      label="Reason (optional)"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="e.g., User forgot password, security incident"
                      multiline
                      numberOfLines={3}
                    />
                  )}
                />
                <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginTop: 4}}>
                  This will be recorded in the audit log
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <OutlinedButton
            onPress={() => {
              reset();
              onDismiss();
            }}
            disabled={updatePasswordMutation.isPending}
            style={{flex: 1}}
          >Cancel</OutlinedButton>
          <FilledButton
            onPress={handleSubmit(onSubmit)}
            disabled={updatePasswordMutation.isPending}
            style={{flex: 1, marginLeft: 12}}
          >{updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}</FilledButton>
        </View>

        {/* Security Notice */}
        <View style={[styles.notice, {backgroundColor: theme.colors.errorContainer}]}>
          <Text variant="bodySmall" style={{color: theme.colors.onErrorContainer}}>
            ⚠️ This action will be recorded in the audit log. {!isOwnPassword && 'The user will be notified via email.'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  field: {
    marginTop: 16,
  },
  advancedOptions: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  notice: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
});
