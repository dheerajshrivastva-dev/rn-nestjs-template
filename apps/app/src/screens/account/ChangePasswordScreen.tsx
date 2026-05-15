/**
 * ChangePasswordScreen
 * Lets the signed-in user update their own password.
 * Uses useUpdatePassword hook (POST /users/me/change-password).
 *
 * Presented as a modal (slide up) from SecurityScreen or AccountCenterScreen.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SafeScreen, Text, FilledButton, PasswordInput, ElevatedCard, useToast } from '@bevarc/ui';

import { useAuthStore, selectUser } from '../../store/authStore';
import { useUpdatePassword } from '../../hooks/mutations/useUpdatePassword';

// ─── Password strength ──────────────────────────────────────────────────────

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#c62828' };
  if (score <= 3) return { score, label: 'Fair', color: '#f57c00' };
  return { score, label: 'Strong', color: '#2e7d32' };
}

// ─── Strength Bar ────────────────────────────────────────────────────────────

const StrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const { score, label, color } = passwordStrength(password);
  if (!password) return null;
  const pct = Math.round((score / 5) * 100);

  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.strengthWrap}>
      <View style={[styles.strengthTrack, { backgroundColor: `${color}28` }]}>
        <View style={[styles.strengthFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text variant="labelSmall" style={{ color, marginTop: 3 }}>
        {label}
      </Text>
    </Animated.View>
  );
};

StrengthBar.displayName = 'StrengthBar';

// ─── Main Screen ─────────────────────────────────────────────────────────────

const ChangePasswordScreen = () => {
  const theme = useTheme();
  const user = useAuthStore(selectUser);
  const { mutate: updatePassword, isPending } = useUpdatePassword();
  const toast = useToast();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit =
    current.trim().length > 0 &&
    next.trim().length >= 8 &&
    next === confirm &&
    !isPending;

  const handleSubmit = useCallback(() => {
    if (!user || !canSubmit) return;

    updatePassword(
      {
        userId: user.id,
        newPassword: next,
        currentPassword: current,
      },
      {
        onSuccess: () => {
          toast.success('Password Updated', 'Your password has been changed successfully.');
          setCurrent('');
          setNext('');
          setConfirm('');
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ??
            'Failed to change password. Please check your current password and try again.';
          toast.error('Error', msg);
        },
      },
    );
  }, [user, canSubmit, updatePassword, next, current]);

  return (
    <SafeScreen edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info card */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <ElevatedCard style={styles.infoCard}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 20 }}>
                Choose a strong password with at least 8 characters including uppercase letters, numbers, and symbols.
              </Text>
            </ElevatedCard>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.form}>
            <PasswordInput
              label="Current Password"
              value={current}
              onChangeText={setCurrent}
              autoCapitalize="none"
              textContentType="password"
            />

            <PasswordInput
              label="New Password"
              value={next}
              onChangeText={setNext}
              autoCapitalize="none"
              textContentType="newPassword"
            />

            <StrengthBar password={next} />

            <PasswordInput
              label="Confirm New Password"
              value={confirm}
              onChangeText={setConfirm}
              autoCapitalize="none"
              textContentType="newPassword"
              error={mismatch}
            />

            {mismatch && (
              <Animated.View entering={FadeInDown.springify()}>
                <Text variant="labelSmall" style={{ color: theme.colors.error, marginTop: -8 }}>
                  Passwords don't match
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Submit */}
          <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.btnWrap}>
            <FilledButton
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={isPending}
              icon="lock-reset"
            >
              {isPending ? 'Updating…' : 'Update Password'}
            </FilledButton>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

export default ChangePasswordScreen;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  infoCard: {
    padding: 16,
    borderRadius: 14,
  },
  form: {
    gap: 14,
  },
  strengthWrap: {
    marginTop: -6,
    marginBottom: 2,
  },
  strengthTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: 4,
    borderRadius: 2,
  },
  btnWrap: {
    marginTop: 8,
  },
});
