/**
 * ClientsQuickTab Component
 *
 * Displays quick access to clients for RETAILER users.
 * Shows client stats and a preview list with "View All" button.
 * Only visible for users with role 'retailer'.
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  PullToRefresh,
  ElevatedCard,
  Text,
  StatsCardShimmer,
  ListItemShimmer,
  ErrorFallback,
  EmptyState,
  FilledButton,
  useTheme,
} from '@bevarc/ui';
import { useNavigation } from '@react-navigation/native';
import { useMultiPullToRefresh } from '../../../../hooks';

interface ClientsQuickTabProps {
  userId: string;
}

// Mock client stats for now (will be replaced with real API)
const MockClientStats = React.memo(() => {
  const theme = useTheme();

  return (
    <View style={styles.statsGrid}>
      <ElevatedCard style={styles.statCard}>
        <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
          0
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Total Clients
        </Text>
      </ElevatedCard>

      <ElevatedCard style={styles.statCard}>
        <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
          0
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Active
        </Text>
      </ElevatedCard>

      <ElevatedCard style={styles.statCard}>
        <Text variant="headlineSmall" style={{ color: theme.colors.error }}>
          0
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Locked
        </Text>
      </ElevatedCard>

      <ElevatedCard style={styles.statCard}>
        <Text variant="headlineSmall" style={{ color: theme.colors.tertiary }}>
          0
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Expired
        </Text>
      </ElevatedCard>
    </View>
  );
});

MockClientStats.displayName = 'MockClientStats';

// Main ClientsQuickTab Component
export const ClientsQuickTab = React.memo<ClientsQuickTabProps>(({ userId }) => {
  const navigation = useNavigation();
  const theme = useTheme();

  // TODO: Replace with real client query
  // const { data: clients, isLoading, error, refetch } = useClients({ userId, limit: 10 });
  const isLoading = false;
  const error = null;
  const clients = [];

  const { refreshing, onRefresh } = useMultiPullToRefresh([
    ['clients', 'user', userId],
  ]);

  const handleViewAllClients = React.useCallback(() => {
    // Navigate to full clients list
    // navigation.navigate(ClientScreens.List);
    console.log('Navigate to clients list');
  }, []);

  const handleCreateClient = React.useCallback(() => {
    // Navigate to create client screen
    // navigation.navigate(ClientScreens.Create, { userId });
    console.log('Create new client for user:', userId);
  }, [userId]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.contentContainer]}>
        <StatsCardShimmer count={4} />
        <ListItemShimmer count={5} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorFallback error={error} onRetry={onRefresh} variant="fullScreen" />
      </View>
    );
  }

  return (
    <PullToRefresh
      onRefresh={onRefresh}
      refreshing={refreshing}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      nestedScrollEnabled
    >
      {/* Client Stats */}
      <MockClientStats />

      {/* Clients Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">Recent Clients</Text>
          {clients.length > 0 && (
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              {clients.length} shown
            </Text>
          )}
        </View>

        {clients.length === 0 ? (
          <EmptyState
            icon="account-group-outline"
            title="No Clients"
            description="You haven't created any clients yet. Create your first client to start managing devices."
            actionLabel="Create Client"
            onAction={handleCreateClient}
          />
        ) : (
          <>
            {/* TODO: Render client list items */}
            <View style={styles.clientsList}>
              <Text variant="bodyMedium" style={[styles.emptyListText, { color: theme.colors.onSurfaceVariant }]}>
                Client list will be displayed here
              </Text>
            </View>

            {/* View All Button */}
            <FilledButton
              onPress={handleViewAllClients}
              style={styles.viewAllButton}
            >"View All Clients"</FilledButton>
          </>
        )}
      </View>
    </PullToRefresh>
  );
});

ClientsQuickTab.displayName = 'ClientsQuickTab';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientsList: {
    marginTop: 8,
  },
  emptyListText: {
    textAlign: 'center',
    padding: 16,
  },
  viewAllButton: {
    marginTop: 16,
  },
});
