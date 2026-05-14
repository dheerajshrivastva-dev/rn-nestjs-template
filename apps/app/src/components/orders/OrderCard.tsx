/**
 * Universal Order Card Component
 * Displays order with different layouts based on status
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  ElevatedCard,
  FilledButton,
  OutlinedButton,
  BodySmall,
  BodyMedium,
  TitleMedium,
  HeadlineSmall,
  StatusChip,
  useTheme,
  Row,
  Spacer,
} from '@forge/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatTimeAgo, formatCurrency, getAgeInHours } from '../../utils/formatters';
import type { Order, OrderStatus } from '../../api/types';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export const OrderCard = React.memo<OrderCardProps>(
  ({ order, onPress, onApprove, onReject }) => {
    const theme = useTheme();
    const ageInHours = getAgeInHours(order.createdAt);
    const isUrgent = order.status === 'pending' && ageInHours > 24;

    // Extract company and user info with defaults
    const companyName = order.company?.name || 'Unknown Company';
    const userName = order.user?.name || 'Unknown User';
    const userEmail = order.user?.email || '';

    // Get status display info
    const statusInfo = getStatusInfo(order.status);

    return (
      <View>
        <Pressable onPress={onPress}>
          <ElevatedCard style={styles.card}>
            {/* Header Row */}
            <Row gap={12} style={styles.header}>
              <View
                style={[
                  styles.companyLogo,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Icon
                  name="office-building"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.companyInfo}>
                <TitleMedium>{companyName}</TitleMedium>
                <BodySmall color={theme.colors.onSurfaceVariant}>
                  Order #{order.orderId}
                </BodySmall>
              </View>

              <View style={styles.badges}>
                <StatusChip status={statusInfo.type} label={statusInfo.label} />
                {isUrgent && (
                  <View>
                    <Spacer size="xs" />
                    <View
                      style={[
                        styles.urgentBadge,
                        { backgroundColor: theme.colors.errorContainer },
                      ]}
                    >
                      <BodySmall color={theme.colors.onErrorContainer}>
                        Urgent
                      </BodySmall>
                    </View>
                  </View>
                )}
              </View>
            </Row>

            <Spacer size="md" />

            {/* User Info */}
            <View style={styles.userSection}>
              <BodyMedium>SUPER User</BodyMedium>
              <BodySmall color={theme.colors.onSurfaceVariant}>
                {userName} • {userEmail}
              </BodySmall>
            </View>

            <Spacer size="md" />

            {/* Order Details */}
            <Row gap={24}>
              <DetailItem
                label="Keys"
                value={order.totalKeys.toString()}
              />
              <DetailItem
                label="Rate/Key"
                value={formatCurrency(order.ratePerKey)}
              />
              <DetailItem
                label="Total"
                value={formatCurrency(order.totalAmount)}
                valueColor={theme.colors.primary}
              />
            </Row>

            {/* Commission Info */}
            {order.discount > 0 && (
              <View>
                <Spacer size="sm" />
                <View
                  style={[
                    styles.commissionBox,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <Row gap={8}>
                    <Icon
                      name="percent-outline"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <BodySmall color={theme.colors.primary}>
                      Commission{order.user?.commissionPercentage ? ` (${order.user.commissionPercentage}%)` : ''}: {formatCurrency(order.discount)}
                    </BodySmall>
                  </Row>
                </View>
              </View>
            )}

            <Spacer size="sm" />

            {/* Time */}
            <BodySmall color={theme.colors.onSurfaceVariant}>
              {formatTimeAgo(order.createdAt)}
            </BodySmall>

            {/* Conditional Actions */}
            {order.status === 'pending' && onApprove && onReject && (
              <View>
                <Spacer size="md" />
                <Row gap={12}>
                  <OutlinedButton
                    onPress={onReject}
                    style={styles.actionButton}
                    icon="close"
                  >
                    Reject
                  </OutlinedButton>
                  <FilledButton
                    onPress={onApprove}
                    style={styles.actionButton}
                    icon="check"
                  >
                    Approve
                  </FilledButton>
                </Row>
              </View>
            )}

            {/* Show transaction ID for completed orders */}
            {order.status === 'completed' && order.paymentTransactionId && (
              <View>
                <Spacer size="md" />
                <View
                  style={[
                    styles.transactionBox,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Row gap={8}>
                    <Icon
                      name="check-decagram"
                      size={16}
                      color={theme.colors.primary}
                    />
                    <BodySmall color={theme.colors.onSurfaceVariant}>
                      Transaction: {order.paymentTransactionId}
                    </BodySmall>
                  </Row>
                </View>
              </View>
            )}

            {/* Show cancellation reason */}
            {(order.status === 'cancelled' || order.status === 'rejected') &&
              order.cancellationReason && (
                <View>
                  <Spacer size="md" />
                  <View
                    style={[
                      styles.reasonBox,
                      { backgroundColor: theme.colors.errorContainer },
                    ]}
                  >
                    <BodySmall color={theme.colors.onErrorContainer}>
                      Reason: {order.cancellationReason}
                    </BodySmall>
                  </View>
                </View>
              )}
          </ElevatedCard>
        </Pressable>
      </View>
    );
  }
);

OrderCard.displayName = 'OrderCard';

interface DetailItemProps {
  label: string;
  value: string;
  valueColor?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, valueColor }) => {
  const theme = useTheme();

  return (
    <View style={styles.detailItem}>
      <BodySmall color={theme.colors.onSurfaceVariant}>{label}</BodySmall>
      <HeadlineSmall color={valueColor}>{value}</HeadlineSmall>
    </View>
  );
};

// Helper to get status display info
const getStatusInfo = (status: OrderStatus): { type: 'success' | 'warning' | 'error' | 'info'; label: string } => {
  switch (status) {
    case 'pending':
      return { type: 'warning', label: 'Pending' };
    case 'approved':
      return { type: 'info', label: 'Approved' };
    case 'processing':
      return { type: 'info', label: 'Processing' };
    case 'completed':
      return { type: 'success', label: 'Completed' };
    case 'rejected':
      return { type: 'error', label: 'Rejected' };
    case 'cancelled':
      return { type: 'error', label: 'Cancelled' };
    case 'failed':
      return { type: 'error', label: 'Failed' };
    default:
      return { type: 'info', label: status };
  }
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    alignItems: 'flex-start',
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: {
    flex: 1,
  },
  badges: {
    alignItems: 'flex-end',
  },
  urgentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  userSection: {
    gap: 4,
  },
  detailItem: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
  commissionBox: {
    padding: 8,
    borderRadius: 8,
  },
  transactionBox: {
    padding: 12,
    borderRadius: 8,
  },
  reasonBox: {
    padding: 12,
    borderRadius: 8,
  },
});
