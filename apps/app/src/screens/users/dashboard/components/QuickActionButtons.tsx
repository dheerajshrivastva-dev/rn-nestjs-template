/**
 * QuickActionButtons Component
 *
 * Displays row of quick action buttons based on user role.
 * Provides shortcuts for common actions like "Request Keys", "Transfer Keys", "Create Order"
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Text, useTheme } from '@bevarc/ui';
import { UserRole } from '../../../../api/types';

interface QuickActionButtonsProps {
  userRole: UserRole;
  userId: string;
  onAction: (action: string) => void;
}

interface ActionButton {
  icon: string;
  label: string;
  action: string;
  roles: UserRole[];
}

const actionButtons: ActionButton[] = [
  {
    icon: 'plus-circle-outline',
    label: 'Create Order',
    action: 'createOrder',
    roles: [UserRole.SUPER],
  },
  {
    icon: 'hand-coin-outline',
    label: 'Request Keys',
    action: 'requestKeys',
    roles: [UserRole.DISTRIBUTOR, UserRole.RETAILER],
  },
  {
    icon: 'swap-horizontal',
    label: 'Transfer Keys',
    action: 'transferKeys',
    roles: [UserRole.SUPER, UserRole.DISTRIBUTOR],
  },
  {
    icon: 'account-plus-outline',
    label: 'Create User',
    action: 'createUser',
    roles: [UserRole.SUPER, UserRole.DISTRIBUTOR],
  },
];

export const QuickActionButtons = React.memo<QuickActionButtonsProps>(({
  userRole,
  userId,
  onAction,
}) => {
  const theme = useTheme();

  const visibleActions = React.useMemo(
    () => actionButtons.filter(action => action.roles.includes(userRole)),
    [userRole]
  );

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleActions.map((action) => (
        <View key={action.action} style={styles.actionItem}>
          <IconButton
            icon={action.icon}
            size={40}
            onPress={() => onAction(action.action)}
            containerColor={theme.colors.primaryContainer}
            color={theme.colors.onPrimaryContainer}
          />
          <Text variant="labelSmall" style={styles.label} numberOfLines={1}>
            {action.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

QuickActionButtons.displayName = 'QuickActionButtons';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 70,
    maxWidth: 90,
  },
  label: {
    marginTop: 4,
    textAlign: 'center',
  },
});
