/**
 * Pending Order Card Component
 * Displays a single pending order with approve/reject actions
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
  useTheme,
  Row,
  Spacer,
} from '@forge/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatTimeAgo, formatCurrency, getAgeInHours } from '../../utils/formatters';
import type { Order } from '../../api/types';

interface PendingOrderCardProps {
  order: Order;
  onApprove: () => void;
  onReject: () => void;
}

export const PendingOrderCard = React.memo<PendingOrderCardProps>(
  ({ order, onApprove, onReject }) => {
    const theme = useTheme();
    const ageInHours = getAgeInHours(order.createdAt);
    const isUrgent = ageInHours > 24;

    // Extract company and user info with defaults
    const companyName = order.company?.name || 'Unknown Company';
    const userName = order.user?.name || 'Unknown User';
    const userEmail = order.user?.email || '';

    return (
      <ElevatedCard style={styles.card}>
        {/* Company Header */}
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

          {isUrgent && (
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
          )}
        </Row>

        <Spacer size="md" />

        {/* SUPER User Info */}
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

        <Spacer size="sm" />

        {/* Time */}
        <BodySmall color={theme.colors.onSurfaceVariant}>
          {formatTimeAgo(order.createdAt)}
        </BodySmall>

        <Spacer size="md" />

        {/* Actions */}
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
      </ElevatedCard>
    );
  }
);

PendingOrderCard.displayName = 'PendingOrderCard';

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

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
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
});
