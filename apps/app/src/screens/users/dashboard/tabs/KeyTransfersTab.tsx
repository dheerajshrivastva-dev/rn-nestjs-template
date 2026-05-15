/**
 * KeyTransfersTab Component
 *
 * Displays key transfers for SUPER/DISTRIBUTOR/RETAILER users.
 *
 * Variants:
 *  'default'           – SUPER: Sent / Received chips, Transfer Keys FAB
 *  'request'           – RETAILER: Received only, Request Keys FAB
 *  'mykeys'            – DISTRIBUTOR My Keys tab: keys coming TO me (All/Direct/Requested chips), Request Keys FAB
 *  'retailer-requests' – DISTRIBUTOR Retailer Requests tab: keys going FROM me (All/Sent/Pending chips), Transfer Keys FAB
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { FAB, PullToRefreshFlatList } from '@bevarc/ui';
import { useNavigation } from '@react-navigation/native';

import { UserRole } from '../../../../api/types';
import { useKeyTransfers, usePendingKeyTransfers } from '../../../../hooks';
import { KeyTransferScreens } from '../../../../navigation/screens';
import type { SuperNavigationProp } from '../../../../navigation/types';
import { selectUser, useAuthStore } from '../../../../store/authStore';
import { FilterChips, KeyTransferListItem, type FilterOption } from '../components';

// ─── Prop types ───────────────────────────────────────────────────────────────

interface KeyTransfersTabProps {
  userId: string;
  variant?: 'default' | 'request' | 'mykeys' | 'retailer-requests';
}

// ─── Static filter chip definitions ───────────────────────────────────────────

const defaultFilters: FilterOption[] = [
  { value: 'sent', label: 'Sent' },
  { value: 'received', label: 'Received' },
];

const requestFilters: FilterOption[] = [
  { value: 'received', label: 'Received' },
];

const myKeysFilters: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'direct', label: 'Direct' },
  { value: 'requested', label: 'Requested' },
];

const retailerRequestFilters: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'pending', label: 'Pending' },
];

// ─── Main component ────────────────────────────────────────────────────────────

export const KeyTransfersTab = React.memo<KeyTransfersTabProps>(({ userId, variant = 'default' }) => {
  const currentUser = useAuthStore(selectUser);
  const navigation = useNavigation<SuperNavigationProp>();

  const isMyKeys = variant === 'mykeys';
  const isRetailerRequests = variant === 'retailer-requests';
  const isRequest = variant === 'request';

  const [selectedFilter, setSelectedFilter] = React.useState<string[]>(['all']);

  const filterOptions: FilterOption[] = React.useMemo(() => {
    if (isMyKeys) return myKeysFilters;
    if (isRetailerRequests) return retailerRequestFilters;
    if (isRequest) return requestFilters;
    return defaultFilters;
  }, [isMyKeys, isRetailerRequests, isRequest]);

  // ── Build API query params from selected chip ────────────────────────────────
  //
  // For 'mykeys': always direction=received. The All/Direct/Requested chips are
  //   client-side visual hints only — all three show received transfers, the list
  //   item component already shows the correct REQUESTED/RECEIVED label based on
  //   initiatedBy. We pass the chip as a hint so KeyTransferListItem can filter
  //   client-side via the data already returned.
  //
  // For 'retailer-requests': always direction=sent. Pending chip adds status filter.
  //
  const apiFilters = React.useMemo(() => {
    const chip = selectedFilter[0];

    if (isMyKeys) {
      // All incoming — chip is only a visual filter applied in JS below
      return { userId, direction: 'received' as const };
    }

    if (isRetailerRequests) {
      if (chip === 'pending') {
        return { userId, direction: 'sent' as const, status: 'pending' as const };
      }
      return { userId, direction: 'sent' as const };
    }

    // default / request
    const direction = chip === 'sent' || chip === 'received' ? chip : undefined;
    return { userId, direction: direction as 'sent' | 'received' | undefined };
  }, [userId, selectedFilter, isMyKeys, isRetailerRequests]);

  const { data, isLoading, error, refetch } = useKeyTransfers(apiFilters);

  // Pending count badge for 'retailer-requests' Pending chip
  const { data: pendingData } = usePendingKeyTransfers(isRetailerRequests ? userId : undefined);
  const pendingCount = pendingData?.transfers?.length ?? 0;

  // ── Client-side sub-filter for 'mykeys' Direct/Requested chips ─────────────
  const transfers = React.useMemo(() => {
    const all = data?.transfers ?? [];
    const chip = selectedFilter[0];

    if (isMyKeys) {
      if (chip === 'direct') {
        // Direct: SUPER pushed keys — initiatedBy !== toUserId (i.e., not initiated by me)
        return all.filter((t) => t.initiatedBy !== t.toUserId);
      }
      if (chip === 'requested') {
        // Requested: I asked for these — initiatedBy === toUserId (i.e., initiated by me/toUser)
        return all.filter((t) => t.initiatedBy === t.toUserId);
      }
    }

    return all;
  }, [data, selectedFilter, isMyKeys]);

  // ── Navigation handlers ─────────────────────────────────────────────────────

  const handleTransferPress = React.useCallback(
    (transferId: string) => {
      navigation.navigate(KeyTransferScreens.Detail, { transferId });
    },
    [navigation],
  );

  const handleFABPress = React.useCallback(() => {
    if (isRequest || isMyKeys) {
      navigation.navigate(KeyTransferScreens.Request);
    } else {
      navigation.navigate(KeyTransferScreens.Create);
    }
  }, [navigation, isRequest, isMyKeys]);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderItem = React.useCallback(
    ({ item }: any) => (
      <KeyTransferListItem
        transfer={item}
        subjectUserId={userId}
        currentUserId={currentUser?.id ?? ''}
        variant={variant}
        onPress={() => handleTransferPress(item.id)}
      />
    ),
    [userId, currentUser?.id, variant, handleTransferPress],
  );

  // Build filter options with pending badge
  const filterOptionsWithBadge: FilterOption[] = React.useMemo(() => {
    if (!isRetailerRequests) return filterOptions;
    return filterOptions.map((opt) =>
      opt.value === 'pending' && pendingCount > 0
        ? { ...opt, badge: pendingCount }
        : opt,
    );
  }, [filterOptions, isRetailerRequests, pendingCount]);

  const ListHeaderComponent = React.useMemo(
    () => (
      <FilterChips
        filters={filterOptionsWithBadge}
        selectedFilters={selectedFilter}
        onFilterChange={setSelectedFilter}
        multiSelect={false}
      />
    ),
    [filterOptionsWithBadge, selectedFilter],
  );

  const onRefresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);

  // ── Empty state ─────────────────────────────────────────────────────────────

  const emptyState = React.useMemo(() => {
    if (isMyKeys) {
      return {
        icon: 'key-arrow-down',
        title: 'No Keys Received',
        description: 'You have not received any keys yet. Request keys from your SUPER to get started.',
      };
    }
    if (isRetailerRequests) {
      return {
        icon: 'package-variant-closed-check',
        title: 'No Retailer Requests',
        description: 'No key requests from your retailers yet. You can also directly transfer keys to a retailer.',
      };
    }
    if (isRequest) {
      return {
        icon: 'package-variant',
        title: 'No Key Requests',
        description: "You haven't requested any keys yet. Request keys from your upstream to start adding clients.",
      };
    }
    return {
      icon: 'swap-horizontal',
      title: 'No Transfers',
      description: "You haven't made any key transfers yet. Transfer keys to your downstream users to distribute inventory.",
    };
  }, [isMyKeys, isRetailerRequests, isRequest]);

  // ── FAB config ──────────────────────────────────────────────────────────────

  const fabConfig = React.useMemo(() => {
    if (isMyKeys) {
      return { icon: 'key-plus', label: 'Request Keys' };
    }
    if (isRetailerRequests) {
      return { icon: 'swap-horizontal', label: 'Transfer Keys' };
    }
    if (isRequest) {
      return { icon: 'package-variant', label: 'Request Keys' };
    }
    return { icon: 'swap-horizontal', label: 'Transfer Keys' };
  }, [isMyKeys, isRetailerRequests, isRequest]);

  const showFAB = React.useMemo(() => {
    if (isMyKeys || isRetailerRequests) return currentUser?.role === UserRole.DISTRIBUTOR;
    if (isRequest) return currentUser?.role === UserRole.RETAILER;
    return currentUser?.role === UserRole.SUPER || currentUser?.role === UserRole.DISTRIBUTOR;
  }, [isMyKeys, isRetailerRequests, isRequest, currentUser?.role]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <PullToRefreshFlatList
        data={transfers}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        error={error}
        onRefresh={onRefresh}
        refreshing={isLoading}
        ListHeaderComponent={ListHeaderComponent}
        shimmerCount={8}
        emptyState={emptyState}
        errorConfig={{ type: 'network', variant: 'inline' }}
      />

      {showFAB && (
        <FAB
          icon={fabConfig.icon}
          label={fabConfig.label}
          onPress={handleFABPress}
          style={styles.fab}
        />
      )}
    </View>
  );
});

KeyTransfersTab.displayName = 'KeyTransfersTab';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
