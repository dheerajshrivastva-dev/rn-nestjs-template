/**
 * KeyTransferListItem Component
 *
 * Displays key transfer information with direction indicator.
 *
 * ─── VIEW MODE MATRIX ────────────────────────────────────────────────────────
 *
 * The component resolves one of 6 named view modes based on props + transfer data.
 * This cleanly separates "who is looking" from "whose data is shown".
 *
 * Inputs:
 *   currentUserId  – logged-in user (from Zustand)
 *   subjectUserId  – whose transfers are being listed (may differ from currentUser)
 *   variant        – tab/screen context hint
 *
 * isSelfView = currentUserId === subjectUserId
 *
 * ┌─────────────────────────┬────────────────────────────────────────────────────────────────┐
 * │ VIEW MODE               │ WHEN                                                           │
 * ├─────────────────────────┼────────────────────────────────────────────────────────────────┤
 * │ SENT_BY_ME              │ isSelfView && subjectUserId === fromUserId (I sent it)          │
 * │ RECEIVED_BY_ME          │ isSelfView && subjectUserId === toUserId   (I received it)      │
 * │ REQUESTED_BY_ME         │ isSelfView && initiatedBy === subjectUserId && toUserId===me    │
 * │ OBSERVER_SUBJECT_SENT   │ !isSelfView && subjectUserId === fromUserId (viewing their out) │
 * │ OBSERVER_SUBJECT_RECV   │ !isSelfView && subjectUserId === toUserId   (viewing their in)  │
 * │ RETAILER_REQUEST_TO_ME  │ isSelfView && variant=retailer-requests && I'm the fulfiller   │
 * └─────────────────────────┴────────────────────────────────────────────────────────────────┘
 *
 * Each mode drives: directionIcon, directionColor, directionLabel,
 *                   otherPartyPrefix, otherPartyLabel, amountColor, showCommission
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { Text, StatusChip, useTheme, type DemigodTheme } from '@bevarc/ui';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type { User } from '../../../../api/types';
import { formatRelativeTime } from '../../../../utils';
import { formatCurrency } from '../../../../utils/formatters';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface KeyTransfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser?: Partial<User>;
  toUser?: Partial<User>;
  quantity: number;
  baseRate: number;
  commissionPercentage: number;
  transferAmount: number;
  commissionAmount: number;
  status: 'pending' | 'pending_payment' | 'payment_received' | 'completed' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  initiatedBy?: string;
  priority?: 'normal' | 'urgent' | 'high';
  requestReason?: string;
  rejectionReason?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  paymentMethod?: string;
  paymentTransactionId?: string;
  paymentReceivedAt?: string;
  paymentProof?: string;
  notes?: string;
  adminComments?: string;
  cancellationReason?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdBy?: string;
  approvedBy?: string;
}

export interface KeyTransferListItemProps {
  transfer: KeyTransfer;
  /**
   * The subject user whose transfer list is being displayed.
   * When a Super views a Distributor's transfers, this is the Distributor's ID.
   * When viewing your own transfers, this equals currentUserId.
   */
  subjectUserId: string;
  /**
   * The currently logged-in user's ID (from Zustand).
   * Used to determine if this is a self-view or an observer-view.
   */
  currentUserId: string;
  variant?: 'default' | 'request' | 'mykeys' | 'retailer-requests';
  onPress?: () => void;
}

// ─── View Mode ─────────────────────────────────────────────────────────────────

/**
 * Named view modes — each maps to a distinct display intent.
 *
 * SENT_BY_SUBJECT       – subject sent keys to someone else (outbound)
 * RECEIVED_BY_SUBJECT   – subject received keys from someone else (inbound)
 * REQUESTED_BY_SUBJECT  – subject requested keys (initiated, but receiver)
 * RETAILER_REQ_TO_ME    – a retailer requested keys FROM me (I am fulfiller, self-view)
 * OBSERVER_OUTBOUND     – observer watching subject's outbound transfers
 * OBSERVER_INBOUND      – observer watching subject's inbound transfers
 */
type ViewMode =
  | 'SENT_BY_SUBJECT'
  | 'RECEIVED_BY_SUBJECT'
  | 'REQUESTED_BY_SUBJECT'
  | 'RETAILER_REQ_TO_ME'
  | 'OBSERVER_OUTBOUND'
  | 'OBSERVER_INBOUND';

function resolveViewMode(
  transfer: KeyTransfer,
  subjectUserId: string,
  currentUserId: string,
  variant: KeyTransferListItemProps['variant'],
): ViewMode {
  const isSelfView = currentUserId === subjectUserId;
  const subjectIsSender = transfer.fromUserId === subjectUserId;
  const subjectIsReceiver = transfer.toUserId === subjectUserId;
  const subjectInitiated = transfer.initiatedBy === subjectUserId;

  if (!isSelfView) {
    // Observer (e.g. Super viewing Distributor's transfers)
    return subjectIsSender ? 'OBSERVER_OUTBOUND' : 'OBSERVER_INBOUND';
  }

  // Self-view below
  if (variant === 'retailer-requests' && subjectIsReceiver && !subjectInitiated) {
    // A retailer requested keys from me (I am the from-side fulfiller)
    return 'RETAILER_REQ_TO_ME';
  }

  if (subjectInitiated && subjectIsReceiver) {
    // I requested these keys (I initiated but I'm the receiver)
    return 'REQUESTED_BY_SUBJECT';
  }

  if (subjectIsSender) {
    return 'SENT_BY_SUBJECT';
  }

  return 'RECEIVED_BY_SUBJECT';
}

// ─── Display config per mode ────────────────────────────────────────────────────

interface DisplayConfig {
  icon: string;
  iconColor: string;
  label: string;
  otherPartyPrefix: string;
  otherPartyLabel: string;
  amountColor: string;
  showCommission: boolean;
  showRequestReason: boolean;
  keysLabel: string;
  amountLabel: string;
  timeLabel: string;
}

function resolveDisplayConfig(
  mode: ViewMode,
  transfer: KeyTransfer,
  fromUserLabel: string,
  toUserLabel: string,
  theme: DemigodTheme,
): DisplayConfig {
  const statusColor = (() => {
    switch (transfer.status) {
      case 'completed':       return theme.semanticColors.success.main;
      case 'pending':
      case 'pending_payment': return theme.colors.tertiary;
      case 'rejected':
      case 'cancelled':       return theme.colors.error;
      case 'payment_received':return theme.colors.primary;
      default:                return theme.colors.onSurfaceVariant;
    }
  })();

  switch (mode) {
    // ── I sent keys to someone downstream ──────────────────────────────────────
    case 'SENT_BY_SUBJECT':
      return {
        icon: 'arrow-up-circle-outline',
        iconColor: theme.colors.error,
        label: 'SENT',
        otherPartyPrefix: 'To',
        otherPartyLabel: toUserLabel,
        amountColor: theme.colors.error,
        showCommission: transfer.commissionAmount > 0,
        showRequestReason: false,
        keysLabel: 'Keys:',
        amountLabel: 'Amount:',
        timeLabel: formatRelativeTime(transfer.createdAt),
      };

    // ── I received keys from someone upstream ──────────────────────────────────
    case 'RECEIVED_BY_SUBJECT':
      return {
        icon: 'arrow-down-circle-outline',
        iconColor: theme.colors.primary,
        label: 'RECEIVED',
        otherPartyPrefix: 'From',
        otherPartyLabel: fromUserLabel,
        amountColor: theme.colors.primary,
        showCommission: false,
        showRequestReason: false,
        keysLabel: 'Keys:',
        amountLabel: 'Amount:',
        timeLabel: formatRelativeTime(transfer.createdAt),
      };

    // ── I requested keys (initiatedBy === me, toUserId === me) ─────────────────
    case 'REQUESTED_BY_SUBJECT':
      return {
        icon: 'package-variant-closed',
        iconColor: statusColor,
        label: transfer.status === 'completed' ? 'FULFILLED' : 'REQUESTED',
        otherPartyPrefix: 'From',
        otherPartyLabel: fromUserLabel,
        amountColor: statusColor,
        showCommission: false,
        showRequestReason: transfer.status === 'pending' && Boolean(transfer.requestReason),
        keysLabel: 'Keys Requested:',
        amountLabel: 'Total Amount:',
        timeLabel: `Requested ${formatRelativeTime(transfer.createdAt)}`,
      };

    // ── A retailer requested keys FROM me (I'm the fulfiller, self-view) ───────
    case 'RETAILER_REQ_TO_ME': {
      let retailerReqIcon = 'close-circle-outline';
      if (transfer.status === 'pending') retailerReqIcon = 'package-variant-closed';
      else if (transfer.status === 'completed') retailerReqIcon = 'check-circle-outline';

      let retailerReqLabel = transfer.status.replace(/_/g, ' ').toUpperCase();
      if (transfer.status === 'pending') retailerReqLabel = 'REQUEST PENDING';
      else if (transfer.status === 'completed') retailerReqLabel = 'FULFILLED';

      return {
        icon: retailerReqIcon,
        iconColor: statusColor,
        label: retailerReqLabel,
        otherPartyPrefix: 'From',
        otherPartyLabel: fromUserLabel,
        amountColor: statusColor,
        showCommission: transfer.commissionAmount > 0,
        showRequestReason: transfer.status === 'pending' && Boolean(transfer.requestReason),
        keysLabel: 'Keys Requested:',
        amountLabel: 'Amount:',
        timeLabel: `Requested ${formatRelativeTime(transfer.createdAt)}`,
      };
    }

    // ── Observer watching subject's outbound (e.g. Super watching Distributor send) ──
    case 'OBSERVER_OUTBOUND':
      return {
        icon: 'arrow-up-circle-outline',
        iconColor: theme.colors.error,
        label: 'SENT BY',
        otherPartyPrefix: 'To',
        otherPartyLabel: toUserLabel,
        amountColor: theme.colors.error,
        showCommission: transfer.commissionAmount > 0,
        showRequestReason: false,
        keysLabel: 'Keys:',
        amountLabel: 'Amount:',
        timeLabel: formatRelativeTime(transfer.createdAt),
      };

    // ── Observer watching subject's inbound (e.g. Super watching Distributor receive) ─
    case 'OBSERVER_INBOUND':
      return {
        icon: 'arrow-down-circle-outline',
        iconColor: theme.colors.primary,
        label: 'RECEIVED BY',
        otherPartyPrefix: 'From',
        otherPartyLabel: fromUserLabel,
        amountColor: theme.colors.primary,
        showCommission: false,
        showRequestReason: false,
        keysLabel: 'Keys:',
        amountLabel: 'Amount:',
        timeLabel: formatRelativeTime(transfer.createdAt),
      };
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatUserLabel(user?: Partial<User>): string {
  if (!user) return 'Unknown';
  return `${user.name ?? ''} (${user.role ?? ''})`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const KeyTransferListItem = React.memo<KeyTransferListItemProps>(({
  transfer,
  subjectUserId,
  currentUserId,
  variant = 'default',
  onPress,
}) => {
  const theme = useTheme();

  const fromUserLabel = formatUserLabel(transfer.fromUser);
  const toUserLabel   = formatUserLabel(transfer.toUser);

  const viewMode = resolveViewMode(transfer, subjectUserId, currentUserId, variant);
  const display  = resolveDisplayConfig(viewMode, transfer, fromUserLabel, toUserLabel, theme);

  const chipStatus = React.useMemo((): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (transfer.status) {
      case 'completed':        return 'success';
      case 'pending':
      case 'pending_payment':  return 'warning';
      case 'rejected':
      case 'cancelled':        return 'error';
      case 'payment_received': return 'info';
      default:                 return 'default';
    }
  }, [transfer.status]);

  const isUrgentRetailerRequest =
    viewMode === 'RETAILER_REQ_TO_ME' &&
    transfer.status === 'pending' &&
    transfer.priority === 'urgent';

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: theme.colors.outlineVariant }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header row: direction badge + status chip */}
      <View style={styles.header}>
        <View style={styles.directionContainer}>
          <Icon name={display.icon} size={20} color={display.iconColor} />
          <Text variant="labelSmall" style={[styles.directionLabel, { color: display.iconColor }]}>
            {display.label}
          </Text>
        </View>
        <StatusChip
          label={transfer.status.replace(/_/g, ' ').toUpperCase()}
          status={chipStatus}
        />
      </View>

      {/* Other party */}
      <Text variant="titleMedium" numberOfLines={1} style={styles.otherParty}>
        {`${display.otherPartyPrefix}: ${display.otherPartyLabel}`}
      </Text>

      {/* Request reason (shown for pending requests) */}
      {display.showRequestReason && Boolean(transfer.requestReason) && (
        <Text
          variant="bodySmall"
          numberOfLines={2}
          style={[styles.requestReason, { color: theme.colors.onSurfaceVariant }]}
        >
          {transfer.requestReason}
        </Text>
      )}

      {/* Detail rows */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {display.keysLabel}
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {transfer.quantity}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {display.amountLabel}
          </Text>
          <Text variant="bodyMedium" style={[styles.value, { color: display.amountColor }]}>
            {formatCurrency(transfer.transferAmount)}
          </Text>
        </View>

        {display.showCommission && transfer.commissionAmount > 0 && (
          <View style={styles.detailRow}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Commission:
            </Text>
            <Text variant="bodySmall" style={[styles.value, { color: theme.colors.tertiary }]}>
              {`${formatCurrency(transfer.commissionAmount)} (${transfer.commissionPercentage}%)`}
            </Text>
          </View>
        )}
      </View>

      {/* Footer: timestamp + urgent badge */}
      <View style={styles.footer}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {display.timeLabel}
        </Text>
        {isUrgentRetailerRequest && (
          <StatusChip label="URGENT" status="error" />
        )}
      </View>
    </TouchableOpacity>
  );
});

KeyTransferListItem.displayName = 'KeyTransferListItem';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionLabel: {
    marginLeft: 4,
  },
  otherParty: {
    marginBottom: 4,
  },
  requestReason: {
    marginBottom: 8,
    fontStyle: 'italic',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
