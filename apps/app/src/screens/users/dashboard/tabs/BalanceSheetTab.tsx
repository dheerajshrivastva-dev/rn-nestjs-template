/**
 * BalanceSheetTab Component
 *
 * Displays balance sheet with transaction history and summary.
 * Used by all user roles (SUPER, DISTRIBUTOR, RETAILER).
 * Shows balance summary card and filterable transaction list.
 *
 * Material Design 3 compliant
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  PullToRefreshFlatList,
  ElevatedCard,
  Text,
  CardShimmer,
  ErrorFallback,
  useTheme,
} from '@bevarc/ui';
import { useBalanceSheet, useBalanceSummary } from '../../../../hooks';
import { BalanceSheetListItem, FilterChips, type FilterOption, BalanceSheetType } from '../components';
import { formatCurrency } from '../../../../utils/formatters';
import { UserRole } from '../../../../api/types';

interface BalanceSheetTabProps {
  userId: string;
  role?: UserRole;
}

// Balance Summary Card Component
const BalanceSummaryCard = React.memo<{ userId: string; companyId: string }>(({ userId, companyId }) => {
  const { data: summary, isLoading, error, refetch } = useBalanceSummary(userId, companyId);
  const theme = useTheme();

  if (isLoading) return <CardShimmer count={1} />;
  if (error) return <ErrorFallback error={error} onRetry={refetch} variant="inline" />;
  if (!summary) return null;

  return (
    <ElevatedCard style={styles.summaryCard}>
      <Text variant="titleMedium" style={styles.summaryTitle}>
        Balance Summary
      </Text>

      <View style={styles.summaryRow}>
        <Text variant="bodyLarge">
          {summary.currentBalance}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Keys Available
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Purchased
          </Text>
          <Text variant="bodyMedium">
            {summary.totalKeysPurchased}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Used
          </Text>
          <Text variant="bodyMedium">
            {summary.totalKeysUsed}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Commission
          </Text>
          <Text variant="bodyMedium">
            {formatCurrency(summary.totalCommission)}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Transactions
          </Text>
          <Text variant="bodyMedium">
            {summary.totalTransactions}
          </Text>
        </View>
      </View>
    </ElevatedCard>
  );
});

BalanceSummaryCard.displayName = 'BalanceSummaryCard';

// Filter options for transaction types
const transactionTypeFilters: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: BalanceSheetType.ORDER_PURCHASE, label: 'Purchases' },
  { value: BalanceSheetType.KEY_TRANSFER_SENT, label: 'Sent' },
  { value: BalanceSheetType.KEY_TRANSFER_RECEIVED, label: 'Received' },
  { value: BalanceSheetType.REFUND, label: 'Refund' },
];

const transactionTypeFiltersDistributer: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: BalanceSheetType.KEY_TRANSFER_SENT, label: 'Sent' },
  { value: BalanceSheetType.KEY_TRANSFER_RECEIVED, label: 'Received' },
];

const transactionTypeFiltersRetailers: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: BalanceSheetType.KEY_USE, label: 'Key Use' },
  { value: BalanceSheetType.KEY_TRANSFER_RECEIVED, label: 'Received' },
];

// Main BalanceSheetTab Component
export const BalanceSheetTab = React.memo<BalanceSheetTabProps>(({ userId, role }) => {
  const [selectedType, setSelectedType] = React.useState<string[]>(['all']);

  const filters = React.useMemo(
    () => ({
      userId,
      transactionType: selectedType[0] === 'all' ? undefined : selectedType[0],
    }),
    [userId, selectedType]
  );

  const { data, isLoading, error, refetch } = useBalanceSheet(filters);

  const renderItem = React.useCallback(
    ({ item }: any) => <BalanceSheetListItem entry={item} />,
    []
  );

  const filtersOptions = useMemo(() => {
    if (role === UserRole.DISTRIBUTOR) return transactionTypeFiltersDistributer;
    if (role === UserRole.RETAILER) return transactionTypeFiltersRetailers;
    return transactionTypeFilters;
  }, [role]);

  const ListHeaderComponent = React.useMemo(
    () => (
      <View>
        {/* <BalanceSummaryCard userId={userId} /> */}
        <FilterChips
          filters={filtersOptions}
          selectedFilters={selectedType}
          onFilterChange={setSelectedType}
          multiSelect={false}
        />
      </View>
    ),
    [selectedType, filtersOptions]
  );

  const onRefresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);


  return (
    <View style={styles.container}>
      <PullToRefreshFlatList
        data={data?.entries || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        error={error}
        onRefresh={onRefresh}
        refreshing={isLoading}
        onRetry={refetch}
        ListHeaderComponent={ListHeaderComponent}
        shimmerCount={8}
        emptyState={{
          icon: 'file-document-outline',
          title: 'No Transactions',
          description: 'No balance sheet entries found for the selected filter.',
        }}
        errorConfig={{
          type: 'network',
          variant: 'inline',
        }}
      />
    </View>
  );
});

BalanceSheetTab.displayName = 'BalanceSheetTab';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    paddingHorizontal: 16,
    padding: 8,
  },
  summaryTitle: {
    marginBottom: 16,
  },
  summaryRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
  },
});
