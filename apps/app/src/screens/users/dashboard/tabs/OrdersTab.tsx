/**
 * OrdersTab Component
 *
 * Displays orders list for SUPER users.
 * Shows orders placed to SUPER_ADMIN with status filters.
 * Only visible for users with role 'super'.
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  PullToRefreshFlatList,
  FAB,
} from '@bevarc/ui';
import { useOrders } from '../../../../hooks/queries/useOrders';
import { OrderListItem, FilterChips, type FilterOption } from '../components';
import { useNavigation } from '@react-navigation/native';
import { UserRole, type OrderStatus } from '../../../../api/types';
import { OrderScreens } from '../../../../navigation/screens';
import type { SuperNavigationProp } from '../../../../navigation/types';
import { selectUser, useAuthStore } from '../../../../store/authStore';

interface OrdersTabProps {
  userId: string;
}

// Filter options for order status
const orderStatusFilters: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Main OrdersTab Component
export const OrdersTab = React.memo<OrdersTabProps>(({ userId }) => {
  const user = useAuthStore(selectUser);
  const navigation = useNavigation<SuperNavigationProp>();
  const [selectedStatus, setSelectedStatus] = React.useState<string[]>(['all']);

  const filters = React.useMemo(
    () => ({
      userId,
      status: selectedStatus[0] === 'all' ? undefined : (selectedStatus[0] as OrderStatus),
    }),
    [userId, selectedStatus]
  );

  const { data, isLoading, error, refetch } = useOrders({
    filter: filters,
    limit: 20,
    page: 1,
  });

  const onRefresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);


  const handleOrderPress = React.useCallback(
    (orderId: string) => {
      // Navigate to order detail screen
      navigation.navigate(OrderScreens.Detail, { orderId });
    },
    [navigation]
  );

  const handleCreateOrder = React.useCallback(() => {
    // Navigate to create order screen
    navigation.navigate(OrderScreens.Create);
  }, [navigation]);

  const renderItem = React.useCallback(
    ({ item }: any) => <OrderListItem order={item} onPress={() => handleOrderPress(item.id)} />,
    [handleOrderPress]
  );

  const ListHeaderComponent = React.useMemo(
    () => (
      <FilterChips
        filters={orderStatusFilters}
        selectedFilters={selectedStatus}
        onFilterChange={setSelectedStatus}
        multiSelect={false}
      />
    ),
    [selectedStatus]
  );

  return (
    <View style={styles.container}>
      <PullToRefreshFlatList
        data={data?.data || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        refreshing={isLoading}
        error={error}
        onRefresh={onRefresh}
        ListHeaderComponent={ListHeaderComponent}
        shimmerCount={8}
        emptyState={{
          icon: 'package-variant-closed',
          title: 'No Orders',
          description: 'You haven\'t placed any orders yet. Create your first order to purchase keys from SUPER_ADMIN.',
          actionLabel: 'Create Order',
          onAction: handleCreateOrder,
        }}
        errorConfig={{
          type: 'network',
          variant: 'inline',
        }}
      />

      {/* FAB for creating new orders */}
      {user?.role === UserRole.SUPER &&
        <FAB
          icon="plus"
          label="New Order"
          onPress={handleCreateOrder}
          style={styles.fab}
        />}
    </View>
  );
});

OrdersTab.displayName = 'OrdersTab';

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
