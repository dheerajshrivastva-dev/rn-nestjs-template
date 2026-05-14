/**
 * Change Password Bottom Sheet
 * Allows Super Admin to change any user's password (except other Super Admins)
 * Uses Material Design 3 bottom sheet pattern
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BottomSheet,
  BottomSheetScrollView,
  HeadlineSmall,
  BodyMedium,
  PasswordInput,
  TextField,
  FilledButton,
  OutlinedButton,
  Row,
  Spacer,
  Divider,
  useTheme,
  useToast,
} from '@forge/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { Switch } from 'react-native-paper';
import { z } from 'zod';

import type { UserRole } from '../../api/types';
import { useUpdatePassword, useCanUpdateUserPassword } from '../../hooks/mutations/useUpdatePassword';
import { selectUser, useAuthStore } from '../../store/authStore';

interface ChangePasswordBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  userId: string;
  userName: string;
  userRole: UserRole;
}

const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  logoutAllDevices: z.boolean(),
  reset2FA: z.boolean(),
  reason: z.string().optional(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export const ChangePasswordBottomSheet = React.memo<ChangePasswordBottomSheetProps>(
  ({ visible, onDismiss, userId, userName, userRole }) => {
    const theme = useTheme();
    const toast = useToast();
    const currentUser = useAuthStore(selectUser);
    const { mutate: updatePassword, isPending } = useUpdatePassword();

    const canUpdate = useCanUpdateUserPassword(
      userRole,
      currentUser?.role!
    );

    const {
      control,
      handleSubmit,
      reset,
      formState: { errors, isValid },
    } = useForm<PasswordFormData>({
      resolver: zodResolver(passwordSchema),
      defaultValues: {
        newPassword: '',
        confirmPassword: '',
        logoutAllDevices: true,
        reset2FA: false,
        reason: '',
      },
      mode: 'onChange',
    });

    const handleClose = React.useCallback(() => {
      reset();
      onDismiss();
    }, [onDismiss, reset]);

    const onSubmit = React.useCallback(
      (data: PasswordFormData) => {
        if (!canUpdate) {
          toast.error('Error', "You do not have permission to change this user's password.");
          return;
        }

        updatePassword(
          {
            userId,
            newPassword: data.newPassword,
            options: {
              logoutAllDevices: data.logoutAllDevices,
              reset2FA: data.reset2FA,
              reason: data.reason,
            },
          },
          {
            onSuccess: (response) => {
              toast.success(
                'Success',
                `Password changed successfully for ${userName}.${
                  response.devicesLoggedOut && response.devicesLoggedOut > 0
                    ? ` ${response.devicesLoggedOut} device(s) logged out.`
                    : ''
                }`,
              );
              handleClose();
            },
            onError: (error) => {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Failed to change password. Please try again.';
              toast.error('Error', errorMessage);
            },
          }
        );
      },
      [canUpdate, userId, userName, updatePassword, handleClose]
    );

    if (!canUpdate) {
      return null;
    }

    return (
      <BottomSheet
        visible={visible}
        onDismiss={handleClose}
        scrollable
        footer={
          <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
          <Row gap={12}>
            <OutlinedButton
              onPress={handleClose}
              disabled={isPending}
              style={styles.button}>
              Cancel
            </OutlinedButton>
            <FilledButton
              onPress={handleSubmit(onSubmit)}
              loading={isPending}
              disabled={!isValid || isPending}
              style={styles.button}>
              Change Password
            </FilledButton>
          </Row>
        </View>
        }
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <HeadlineSmall>Change Password</HeadlineSmall>
          <BodyMedium color={theme.colors.onSurfaceVariant}>
            Update password for {userName}
          </BodyMedium>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* New Password */}
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, value } }) => (
              <PasswordInput
                label="New Password"
                value={value}
                onChangeText={onChange}
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                required
              />
            )}
          />

          <Spacer size="md" />

          {/* Confirm Password */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <PasswordInput
                label="Confirm Password"
                value={value}
                onChangeText={onChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                required
              />
            )}
          />

          <Spacer size="lg" />
          <Divider />
          <Spacer size="md" />

          {/* Options */}
          <BodyMedium style={styles.sectionTitle}>Security Options</BodyMedium>
          <Spacer size="sm" />

          {/* Logout All Devices */}
          <Controller
            control={control}
            name="logoutAllDevices"
            render={({ field: { onChange, value } }) => (
              <Row style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <BodyMedium>Logout all devices</BodyMedium>
                  <BodyMedium
                    color={theme.colors.onSurfaceVariant}
                    style={styles.helperText}>
                    Force user to login again on all devices
                  </BodyMedium>
                </View>
                <Switch value={value} onValueChange={onChange} />
              </Row>
            )}
          />

          <Spacer size="md" />

          {/* Reset 2FA */}
          <Controller
            control={control}
            name="reset2FA"
            render={({ field: { onChange, value } }) => (
              <Row style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <BodyMedium>Reset Two-Factor Authentication</BodyMedium>
                  <BodyMedium
                    color={theme.colors.onSurfaceVariant}
                    style={styles.helperText}>
                    Disable 2FA for this user (they can re-enable it)
                  </BodyMedium>
                </View>
                <Switch value={value} onValueChange={onChange} />
              </Row>
            )}
          />

          <Spacer size="lg" />
          <Divider />
          <Spacer size="md" />

          {/* Reason (optional) */}
          <BodyMedium style={styles.sectionTitle}>Reason (Optional)</BodyMedium>
          <Spacer size="sm" />

          <Controller
            control={control}
            name="reason"
            render={({ field: { onChange, value } }) => (
              <TextField
                label="Reason for password change"
                value={value || ''}
                onChangeText={onChange}
                multiline
                numberOfLines={3}
                placeholder="e.g., User requested password reset"
              />
            )}
          />
        </View>

        {/* Actions */}
        
      </BottomSheet>
    );
  }
);

ChangePasswordBottomSheet.displayName = 'ChangePasswordBottomSheet';

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  contentContainer: {
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  switchRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});
