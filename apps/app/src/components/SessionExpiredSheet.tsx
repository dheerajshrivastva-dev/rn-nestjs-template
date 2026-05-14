/**
 * Session Expired Bottom Sheet
 * Un-dismissable sheet shown when the backend invalidates the session (401 after refresh failure).
 * User must tap "Login Again" — no way to dismiss without logging in.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomSheet, Text, FilledButton, useTheme } from '@forge/ui';
import { useAuthStore, selectSessionExpired, selectIsAuthenticated } from '../store/authStore';

export const SessionExpiredSheet: React.FC = () => {
  const theme = useTheme();
  const sessionExpired = useAuthStore(selectSessionExpired);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { clearSessionExpired } = useAuthStore();

  const handleLoginAgain = () => {
    clearSessionExpired();
  };

  // Only show while the user is still on the private stack.
  // Once isAuthenticated flips false (navigator already on login screen), hide it.
  return (
    <BottomSheet
      visible={sessionExpired && !isAuthenticated}
      onDismiss={() => {}}
      dismissable={false}
      enablePanDownToClose={false}
      scrollable
      footer={
        <FilledButton onPress={handleLoginAgain} style={{ margin: 16 }}>
          Login Again
        </FilledButton>
      }
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.errorContainer }]}>
          <Text variant="headlineMedium" align="center">🔒</Text>
        </View>

        <Text
          variant="titleLarge"
          align="center"
          style={styles.title}
          color={theme.colors.onSurface}>
          Session Expired
        </Text>

        <Text
          variant="bodyMedium"
          align="center"
          style={styles.message}
          color={theme.colors.onSurfaceVariant}>
          Your session has ended. Please log in again to continue.
        </Text>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
  },
  message: {
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    width: '100%',
  },
});
