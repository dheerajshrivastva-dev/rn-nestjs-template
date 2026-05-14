import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeScreen, Text, useTheme } from '@forge/ui';

export const DashboardScreen = () => {
  const { colors } = useTheme();
  return (
    <SafeScreen edges={['left', 'right', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text variant="headlineMedium">Dashboard</Text>
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          Your dashboard goes here.
        </Text>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
