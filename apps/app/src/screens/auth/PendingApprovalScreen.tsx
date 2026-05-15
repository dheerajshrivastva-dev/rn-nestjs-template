import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text, FilledButton, TextButton, useTheme} from '@bevarc/ui';
import {AuthScreenLayout} from './AuthScreenLayout';

interface PendingApprovalScreenProps {
  onBackToLogin: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  onBackToLogin,
}) => {
  const theme = useTheme();

  return (
    <AuthScreenLayout title="Request Submitted">
      <View style={styles.iconContainer}>
        {/* Clock / hourglass indicator */}
        <View
          style={[
            styles.iconCircle,
            {backgroundColor: theme.colors.secondaryContainer},
          ]}>
          <Text style={[styles.iconEmoji]}>⏳</Text>
        </View>
      </View>

      <Text
        variant="titleMedium"
        style={[styles.headline, {color: theme.colors.onSurface}]}>
        Waiting for admin approval
      </Text>

      <Text
        variant="bodyMedium"
        style={[styles.body, {color: theme.colors.onSurfaceVariant}]}>
        Your account has been created successfully. An admin will review your
        request and activate your account shortly.
      </Text>

      <Text
        variant="bodyMedium"
        style={[styles.body, {color: theme.colors.onSurfaceVariant}]}>
        You'll be able to sign in once your account is approved. This usually
        takes less than 24 hours.
      </Text>

      <View
        style={[
          styles.infoCard,
          {backgroundColor: theme.colors.surfaceVariant},
        ]}>
        <Text
          variant="labelMedium"
          style={{color: theme.colors.onSurfaceVariant}}>
          What happens next?
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.infoText, {color: theme.colors.onSurfaceVariant}]}>
          {'1. Admin reviews your details\n2. Your account gets activated\n3. You receive a notification to sign in'}
        </Text>
      </View>

      <FilledButton onPress={onBackToLogin} style={styles.button}>
        Back to Sign In
      </FilledButton>

      <TextButton onPress={onBackToLogin}>
        Already approved? Sign in
      </TextButton>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 36,
  },
  headline: {
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    gap: 8,
  },
  infoText: {
    lineHeight: 24,
  },
  button: {
    borderRadius: 12,
    marginTop: 8,
  },
});
