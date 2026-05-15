/**
 * UserActivitySection Component
 *
 * Shows recent activity feed + quick action buttons for SUPER and DISTRIBUTOR
 * users on the OverviewTab.
 *
 * Activity is derived from:
 *  - Balance sheet entries  (all roles)
 *  - Key transfers          (SUPER, DISTRIBUTOR)
 *  - Orders                 (SUPER)
 *
 * Each source is fetched independently so sections load without blocking each other.
 * Quick actions respect the role hierarchy defined in QuickActionButtons.
 *
 * Material Design 3 compliant
 */

import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  TitleMedium,
  ElevatedCard,
  Spacer,
  Divider,
  CardShimmer,
  ErrorFallback,
  EmptyState,
  useTheme,
} from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { UserRole } from '../../../../api/types';
import {
  useBalanceSheet,
  useKeyTransfers,
} from '../../../../hooks';
import { useOrders } from '../../../../hooks/queries/useOrders';
import {
  KeyTransferScreens,
  OrderScreens,
} from '../../../../navigation/screens';
import { ActivityItem } from '../../../dashboard/components/ActivityItem';
import { QuickActionButtons } from './QuickActionButtons';
import type { BalanceSheetEntry, BalanceSheetType } from './BalanceSheetListItem';
import type { KeyTransfer } from './KeyTransferListItem';
import { selectUser, useAuthStore } from '../../../../store/authStore';

// ============================================================================
// Types
// ============================================================================

interface UserActivitySectionProps {
  userId: string;
  role?: UserRole;
}

interface ActivityFeedItem {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  timestamp: string;
  actionable: boolean;
  onPress?: () => void;
}

// ============================================================================
// Icon / colour helpers
// ============================================================================

const BALANCE_TYPE_CONFIG: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  order_purchase:       { icon: 'cart-plus',        color: '#2196f3', label: 'Order Purchase' },
  key_use:              { icon: 'key-minus',         color: '#9c27b0', label: 'Key Used' },
  key_transfer_sent:    { icon: 'swap-horizontal',   color: '#ff9800', label: 'Keys Sent' },
  key_transfer_received:{ icon: 'transfer-down',     color: '#4caf50', label: 'Keys Received' },
  balance_transfer:     { icon: 'bank-transfer-out', color: '#ff5722', label: 'Balance Transferred' },
  balance_received:     { icon: 'bank-transfer-in',  color: '#4caf50', label: 'Balance Received' },
  refund:               { icon: 'cash-refund',       color: '#00bcd4', label: 'Refund' },
  commission_earned:    { icon: 'cash-plus',         color: '#8bc34a', label: 'Commission Earned' },
  adjustment:           { icon: 'tune',              color: '#607d8b', label: 'Balance Adjustment' },
};

const TRANSFER_STATUS_CONFIG: Record<
  string,
  { icon: string; color: string }
> = {
  pending:         { icon: 'clock-outline',      color: '#ff9800' },
  pending_payment: { icon: 'cash-clock',         color: '#ff9800' },
  payment_received:{ icon: 'cash-check',         color: '#2196f3' },
  completed:       { icon: 'transfer',           color: '#4caf50' },
  rejected:        { icon: 'transfer-down',      color: '#f44336' },
  cancelled:       { icon: 'cancel',             color: '#757575' },
};

const ORDER_STATUS_CONFIG: Record<
  string,
  { icon: string; color: string }
> = {
  pending:   { icon: 'clock-alert',           color: '#ff9800' },
  approved:  { icon: 'check-circle',          color: '#4caf50' },
  rejected:  { icon: 'close-circle',          color: '#f44336' },
  completed: { icon: 'checkbox-marked-circle',color: '#4caf50' },
  cancelled: { icon: 'cancel',                color: '#757575' },
  failed:    { icon: 'alert-circle',          color: '#f44336' },
};

// ============================================================================
// Data mappers
// ============================================================================

const mapBalanceEntry = (
  entry: BalanceSheetEntry,
  onPress: () => void,
): ActivityFeedItem => {
  const cfg = BALANCE_TYPE_CONFIG[entry.transactionType] ?? {
    icon: 'cash',
    color: '#607d8b',
    label: entry.transactionType,
  };
  const isDebit = entry.amount < 0;
  const amountStr = `${isDebit ? '-' : '+'}${Math.abs(entry.amount)} keys`;

  return {
    id: `balance-${entry.id}`,
    icon: cfg.icon,
    iconColor: cfg.color,
    title: cfg.label,
    subtitle: entry.description ? `${entry.description} · ${amountStr}` : amountStr,
    timestamp: new Date(entry.createdAt).toLocaleString(),
    actionable: false,
    onPress,
  };
};

const mapTransfer = (
  transfer: KeyTransfer,
  userId: string,
  onPress: () => void,
): ActivityFeedItem => {
  const cfg = TRANSFER_STATUS_CONFIG[transfer.status] ?? {
    icon: 'swap-horizontal',
    color: '#757575',
  };
  const direction = transfer.fromUserId === userId ? 'sent' : 'received';
  const peer =
    direction === 'sent'
      ? transfer.toUser?.name ?? 'Downstream user'
      : transfer.fromUser?.name ?? 'Upstream user';
  const isActionable =
    transfer.status === 'pending' || transfer.status === 'pending_payment';

  return {
    id: `transfer-${transfer.id}`,
    icon: cfg.icon,
    iconColor: cfg.color,
    title: `Keys ${direction === 'sent' ? 'transferred to' : 'received from'} ${peer}`,
    subtitle: `${transfer.quantity} keys · ${transfer.status.replace(/_/g, ' ')}`,
    timestamp: new Date(transfer.createdAt).toLocaleString(),
    actionable: isActionable,
    onPress,
  };
};

const mapOrder = (
  order: any,
  onPress: () => void,
): ActivityFeedItem => {
  const cfg = ORDER_STATUS_CONFIG[order.status] ?? {
    icon: 'package-variant',
    color: '#757575',
  };
  const isActionable = order.status === 'pending';

  return {
    id: `order-${order.id}`,
    icon: cfg.icon,
    iconColor: cfg.color,
    title: `Order #${order.orderNumber ?? order.id.slice(0, 8)}`,
    subtitle: `${order.quantity ?? ''} keys · ${order.status}`,
    timestamp: new Date(order.createdAt).toLocaleString(),
    actionable: isActionable,
    onPress,
  };
};

// ============================================================================
// Sub-sections (each loads independently)
// ============================================================================

/** Balance sheet recent entries – available to all roles */
const BalanceActivitySection = React.memo<{
  userId: string;
  onItemPress: (id: string) => void;
}>(({ userId, onItemPress }) => {
  const { data, isLoading, error, refetch } = useBalanceSheet({
    userId,
    limit: 5,
    page: 1,
  });

  if (isLoading) return <CardShimmer count={1} />;
  if (error) {
    return (
      <ErrorFallback
        error={error}
        onRetry={refetch}
        variant="inline"
        type="network"
      />
    );
  }
  if (!data?.entries?.length) return null;

  const items: ActivityFeedItem[] = data.entries.map((entry) =>
    mapBalanceEntry(entry, () => onItemPress(entry.id)),
  );

  return <ActivityList items={items} />;
});
BalanceActivitySection.displayName = 'BalanceActivitySection';

/** Key transfer recent entries – SUPER and DISTRIBUTOR */
const TransferActivitySection = React.memo<{
  userId: string;
  onItemPress: (id: string) => void;
}>(({ userId, onItemPress }) => {
  const { data, isLoading, error, refetch } = useKeyTransfers({
    userId,
    direction: 'sent',
    limit: 5,
    page: 1,
  });

  if (isLoading) return <CardShimmer count={1} />;
  if (error) {
    return (
      <ErrorFallback
        error={error}
        onRetry={refetch}
        variant="inline"
        type="network"
      />
    );
  }
  if (!data?.transfers?.length) return null;

  const items: ActivityFeedItem[] = data.transfers.map((transfer) =>
    mapTransfer(transfer, userId, () => onItemPress(transfer.id)),
  );

  return <ActivityList items={items} />;
});
TransferActivitySection.displayName = 'TransferActivitySection';

/** Order recent entries – SUPER only */
const OrderActivitySection = React.memo<{
  userId: string;
  onOrderPress: (id: string) => void;
}>(({ userId, onOrderPress }) => {
  const { data, isLoading, error, refetch } = useOrders({
    filter: { userId },
    limit: 5,
  });

  if (isLoading) return <CardShimmer count={1} />;
  if (error) {
    return (
      <ErrorFallback
        error={error}
        onRetry={refetch}
        variant="inline"
        type="network"
      />
    );
  }

  const orders: any[] = (data as any)?.orders ?? (data as any)?.data ?? [];
  if (!orders.length) return null;

  const items: ActivityFeedItem[] = orders.map((order: any) =>
    mapOrder(order, () => onOrderPress(order.id)),
  );

  return <ActivityList items={items} />;
});
OrderActivitySection.displayName = 'OrderActivitySection';

// ============================================================================
// Shared activity list renderer
// ============================================================================

const ActivityList = React.memo<{ items: ActivityFeedItem[] }>(({ items }) => (
  <ElevatedCard style={styles.card}>
    {items.map((item, index) => (
      <View key={item.id}>
        <ActivityItem
          icon={item.icon}
          iconColor={item.iconColor}
          title={item.title}
          subtitle={item.subtitle}
          timestamp={item.timestamp}
          actionable={item.actionable}
          onPress={item.onPress}
        />
        {index < items.length - 1 && <Divider style={styles.divider} />}
      </View>
    ))}
  </ElevatedCard>
));
ActivityList.displayName = 'ActivityList';

// ============================================================================
// Main Component
// ============================================================================

export const UserActivitySection = React.memo<UserActivitySectionProps>(
  ({ userId, role }) => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const theme = useTheme();
    const currentUser = useAuthStore(selectUser);

    const isSuper = role === UserRole.SUPER;
    const isDistributor = role === UserRole.DISTRIBUTOR;
    const showTransfers = isSuper || isDistributor;
    const showOrders = isSuper && currentUser?.id === userId;

    // Navigation handlers
    const handleTransferPress = useCallback(
      (transferId: string) => {
        navigation.navigate(KeyTransferScreens.Detail, { transferId });
      },
      [navigation],
    );

    const handleOrderPress = useCallback(
      (orderId: string) => {
        navigation.navigate(OrderScreens.Detail, { orderId });
      },
      [navigation],
    );

    // Quick action navigation
    const handleQuickAction = useCallback(
      (action: string) => {
        switch (action) {
          case 'createOrder':
            navigation.navigate(OrderScreens.Create);
            break;
          case 'requestKeys':
            navigation.navigate(KeyTransferScreens.Request);
            break;
          case 'transferKeys':
            navigation.navigate(KeyTransferScreens.Create);
            break;
          case 'createUser':
            // Navigate up to user create (parent stack)
            navigation.navigate('user/create' as any);
            break;
          default:
            break;
        }
      },
      [navigation],
    );

    if (!role) return null;

    return (
      <View style={styles.container}>
        {/* ── Quick Actions ───────────────────────── */}
        {currentUser?.id === userId && <React.Fragment>
          <View style={styles.sectionHeader}>
            <Icon
              name="lightning-bolt"
              size={18}
              color={theme.colors.primary}
              style={styles.sectionIcon}
            />
            <TitleMedium>Quick Actions</TitleMedium>
          </View>
          <Spacer size="sm" />
          <ElevatedCard style={styles.actionsCard}>
            <QuickActionButtons
              userRole={role}
              userId={userId}
              onAction={handleQuickAction}
            />
          </ElevatedCard>

          <Spacer size="lg" />
        </React.Fragment>}

        {/* ── Recent Activity ─────────────────────── */}
        <View style={styles.sectionHeader}>
          <Icon
            name="history"
            size={18}
            color={theme.colors.primary}
            style={styles.sectionIcon}
          />
          <TitleMedium>Recent Activity</TitleMedium>
        </View>
        <Spacer size="sm" />

        {/* Orders (SUPER only) */}
        {showOrders && (
          <OrderActivitySection
            userId={userId}
            onOrderPress={handleOrderPress}
          />
        )}

        {/* Key Transfers (SUPER / DISTRIBUTOR) */}
        {showTransfers && (
          <>
            {showOrders && <Spacer size="sm" />}
            <TransferActivitySection
              userId={userId}
              onItemPress={handleTransferPress}
            />
          </>
        )}

        {/* Fallback empty state when nothing is shown */}
        {!showOrders && !showTransfers && (
          <EmptyState
            icon="history"
            title="No Recent Activity"
            description="Your recent transactions will appear here."
          />
        )}
      </View>
    );
  },
);

UserActivitySection.displayName = 'UserActivitySection';

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionIcon: {
    marginTop: 1,
  },
  actionsCard: {
    paddingVertical: 4,
  },
  card: {
    padding: 16,
  },
  divider: {
    marginVertical: 12,
  },
});
