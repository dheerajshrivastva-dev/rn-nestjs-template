/**
 * BalanceSheetListItem Component
 *
 * Displays balance transaction entry with transaction type icon and amount.
 * Used in BalanceSheetTab for all user roles.
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCurrency } from '../../../../utils/formatters';
import { formatRelativeTime } from '../../../../utils';

export enum BalanceSheetType {
  ORDER_PURCHASE = 'order_purchase',
  KEY_USE = 'key_use',
  KEY_TRANSFER_SENT = 'key_transfer_sent',
  KEY_TRANSFER_RECEIVED = 'key_transfer_received',
  BALANCE_TRANSFER = 'balance_transfer',
  BALANCE_RECEIVED = 'balance_received',
  REFUND = 'refund',
  COMMISSION_EARNED = 'commission_earned',
  ADJUSTMENT = 'adjustment',
}

export interface BalanceSheetEntryMetadata {
  transferId?: string;
  toUserId?: string;
  totalValue?: number;
  commissionEarned?: number;
  senderCommissionPct?: number;
  receiverCommissionPct?: number;
  discountGivenToReceiver?: number;
}

export interface BalanceSheetEntry {
  id: string;
  transactionType: BalanceSheetType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  metadata?: BalanceSheetEntryMetadata;
  createdAt: string;
}

interface BalanceSheetListItemProps {
  entry: BalanceSheetEntry;
  onPress?: () => void;
}

const getTransactionIcon = (type: BalanceSheetType): string => {
  switch (type) {
    case BalanceSheetType.ORDER_PURCHASE:
      return 'cart-plus';
    case BalanceSheetType.KEY_USE:
      return 'key-minus';
    case BalanceSheetType.KEY_TRANSFER_SENT:
      return 'arrow-up-circle';
    case BalanceSheetType.KEY_TRANSFER_RECEIVED:
      return 'arrow-down-circle';
    case BalanceSheetType.BALANCE_TRANSFER:
      return 'swap-horizontal';
    case BalanceSheetType.BALANCE_RECEIVED:
      return 'cash-plus';
    case BalanceSheetType.REFUND:
      return 'cash-refund';
    case BalanceSheetType.COMMISSION_EARNED:
      return 'currency-usd';
    case BalanceSheetType.ADJUSTMENT:
      return 'pencil';
    default:
      return 'cash';
  }
};

const getTransactionLabel = (type: BalanceSheetType): string => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const isCredit = (type: BalanceSheetType): boolean => {
  return [
    BalanceSheetType.ORDER_PURCHASE,
    BalanceSheetType.KEY_TRANSFER_RECEIVED,
    BalanceSheetType.BALANCE_RECEIVED,
    BalanceSheetType.REFUND,
    BalanceSheetType.COMMISSION_EARNED,
  ].includes(type);
};

export const BalanceSheetListItem = React.memo<BalanceSheetListItemProps>(({
  entry,
  onPress,
}) => {
  const theme = useTheme();
  const credit = isCredit(entry.transactionType);
  const amountColor = credit ? theme.colors.primary : theme.colors.error;
  const amountSign = credit ? '+' : '-';

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: theme.colors.outlineVariant }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
        <Icon
          name={getTransactionIcon(entry.transactionType)}
          size={24}
          color={amountColor}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="titleSmall" numberOfLines={1} style={styles.label}>
            {getTransactionLabel(entry.transactionType)}
          </Text>
          <Text variant="titleMedium" style={[styles.amount, { color: amountColor }]}>
            {amountSign}{Math.abs(entry.amount)} <Icon name="key-outline" size={12} color={amountColor} />
          </Text>
        </View>

        {entry.description && (
          <Text variant="bodySmall" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
            {entry.description}
          </Text>
        )}

        {entry.metadata && 'commissionEarned' in entry.metadata && (
          <Text variant="labelSmall" style={[styles.commissionRow, { color: theme.colors.tertiary }]}>
            Commission earned: {formatCurrency(entry.metadata.commissionEarned ?? 0)}
          </Text>
        )}

        <View style={styles.footer}>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Balance: {entry.balanceAfter} keys
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatRelativeTime(entry.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

BalanceSheetListItem.displayName = 'BalanceSheetListItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commissionRow: {
    marginBottom: 4,
  },
});
