/**
 * OrderListItem Component
 *
 * Displays order information with status badge.
 * Used in OrdersTab for SUPER users to view their orders to SUPER_ADMIN.
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, StatusChip, useTheme, StatusType } from '@bevarc/ui';
import { OrderStatus, type Order } from '../../../../api/types';
import { formatCurrency } from '../../../../utils/formatters';
import { formatRelativeTime } from '../../../../utils';

interface OrderListItemProps {
  order: Order;
  onPress?: () => void;
}

const getOrderStatusColor = (status: OrderStatus): StatusType => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'warning';
    case OrderStatus.APPROVED:
      return 'success';
    case OrderStatus.REJECTED:
      return 'error';
    case OrderStatus.COMPLETED:
      return 'success';
    case OrderStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};

export const OrderListItem = React.memo<OrderListItemProps>(({ order, onPress }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: theme.colors.outlineVariant }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text variant="titleMedium" numberOfLines={1} style={styles.orderId}>
          {order.orderId}
        </Text>
        <StatusChip
          label={order.status.toUpperCase()}
          status={getOrderStatusColor(order.status)}
        />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Keys:
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {order.totalKeys}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Amount:
          </Text>
          <Text variant="bodyMedium" style={[styles.value, { color: theme.colors.primary }]}>
            {formatCurrency(order.totalAmount)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Rate:
          </Text>
          <Text variant="bodySmall" style={styles.value}>
            {formatCurrency(order.ratePerKey)}/key
          </Text>
        </View>

        {order.discount > 0 && (
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              discount{order.user?.commissionPercentage ? ` (${order.user.commissionPercentage}%)` : ''}:
            </Text>
            <Text variant="bodySmall" style={[styles.value, { color: theme.colors.primary }]}>
              - {formatCurrency(order.discount)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {formatRelativeTime(order.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

OrderListItem.displayName = 'OrderListItem';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    flex: 1,
    marginRight: 8,
  },
  details: {
    gap: 4,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
