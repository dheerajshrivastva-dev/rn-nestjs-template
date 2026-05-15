/**
 * QuickStats Component
 * Displays basic user statistics.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ElevatedCard,
  HeadlineSmall,
  TitleMedium,
  BodySmall,
  Spacer,
  useTheme,
} from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { User } from '../../../api/types';

interface QuickStatsProps {
  user: User;
}

export const QuickStats = React.memo(({ user }: QuickStatsProps) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TitleMedium style={styles.sectionTitle}>Quick Stats</TitleMedium>

      <View style={styles.statsGrid}>
        <View style={styles.statWrapper}>
          <ElevatedCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon name="account-group-outline" size={24} color={theme.colors.onPrimaryContainer} />
            </View>
            <Spacer size="sm" />
            <HeadlineSmall>{user.totalClients ?? 0}</HeadlineSmall>
            <BodySmall color={theme.colors.onSurfaceVariant}>Total Clients</BodySmall>
          </ElevatedCard>
        </View>
      </View>
    </View>
  );
});

QuickStats.displayName = 'QuickStats';

const styles = StyleSheet.create({
  container: { paddingHorizontal: 0 },
  sectionTitle: { marginBottom: 12 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statWrapper: { flex: 1 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
