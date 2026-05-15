/**
 * KeyRequestListItem Component
 *
 * Displays key request information with action buttons.
 * Used in KeyRequestsTab for DISTRIBUTOR/RETAILER to view and manage requests.
 * Reuses KeyTransferListItem for consistency.
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FilledButton, OutlinedButton } from '@bevarc/ui';
import { KeyTransferListItem, type KeyTransfer } from './KeyTransferListItem';

interface KeyRequestListItemProps {
  transfer: KeyTransfer;
  userId: string;
  onApprove?: () => void;
  onReject?: () => void;
  onPress?: () => void;
}

export const KeyRequestListItem = React.memo<KeyRequestListItemProps>(({
  transfer,
  userId,
  onApprove,
  onReject,
  onPress,
}) => {
  const showActions = transfer.status === 'pending' && transfer.toUserId === userId;

  return (
    <View>
      <KeyTransferListItem transfer={transfer} userId={userId} onPress={onPress} />

      {showActions && (onApprove || onReject) && (
        <View style={styles.actionsContainer}>
          {onApprove && (
            <FilledButton
              label="Approve"
              onPress={onApprove}
              style={styles.actionButton}
              compact
            />
          )}
          {onReject && (
            <OutlinedButton
              label="Reject"
              onPress={onReject}
              style={styles.actionButton}
              compact
            />
          )}
        </View>
      )}
    </View>
  );
});

KeyRequestListItem.displayName = 'KeyRequestListItem';

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
