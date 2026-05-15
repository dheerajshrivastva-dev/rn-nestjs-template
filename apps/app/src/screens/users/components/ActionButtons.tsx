/**
 * Action Buttons Component
 * Displays action buttons for managing agents (edit, balance, clients)
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {
  FilledButton,
  FilledTonalButton,
  OutlinedButton,
} from '@bevarc/ui';
import {User, UserRole} from '../../../api/types';

interface ActionButtonsProps {
  isSelfView: boolean;
  user: User;
  viewerRole: UserRole;
  onEdit: () => void;
  onManageBalance: () => void;
  onViewClients: () => void;
}

export const ActionButtons = React.memo(
  ({
    isSelfView,
    user,
    onEdit,
    onManageBalance,
    onViewClients,
  }: ActionButtonsProps) => {

    return (
      <View style={styles.actionButtons}>
        {isSelfView ? (
          <>
            <FilledButton onPress={onEdit} style={styles.actionButtonFull}>
              Edit Profile
            </FilledButton>
            <OutlinedButton
              onPress={onViewClients}
              style={styles.actionButtonFull}>
              My Clients ({user.totalClients ?? 0})
            </OutlinedButton>
          </>
        ) : (
          <>
            <FilledTonalButton onPress={onEdit} style={styles.actionButton}>
              Edit User
            </FilledTonalButton>
            <FilledButton onPress={onManageBalance} style={styles.actionButton}>
              Manage Balance
            </FilledButton>
            <OutlinedButton
              onPress={onViewClients}
              style={styles.actionButtonFull}>
              View Clients ({user.totalClients ?? 0})
            </OutlinedButton>
          </>
        )}
      </View>
    );
  },
);

ActionButtons.displayName = 'ActionButtons';

const styles = StyleSheet.create({
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonFull: {
    width: '100%',
  },
});
