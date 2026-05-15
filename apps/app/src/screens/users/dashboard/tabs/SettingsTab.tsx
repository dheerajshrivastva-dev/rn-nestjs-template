/**
 * SettingsTab Component
 *
 * Displays user settings and profile management.
 * Available for all user roles with role-based sections.
 * Includes profile, account, status management, and preferences.
 *
 * Material Design 3 compliant
 */

import React from 'react';

import { View, StyleSheet } from 'react-native';

import {
  PullToRefresh,
  ElevatedCard,
  Text,
  ThreeLineListItem,
  Divider,
  CardShimmer,
  ErrorFallback,
  FilledButton,
  FilledTonalButton,
  OutlinedButton,
  Row,
  Spacer,
  ConfirmDialog,
  useTheme,
  useToast,
} from '@bevarc/ui';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type { UserRole, UserStatus } from '../../../../api/types';
import { useUserById, useUpdateUser } from '../../../../hooks';
import { UserScreens } from '../../../../navigation/screens';
import type { UsersStackNavigationProp } from '../../../../navigation/types';
import { selectUser, useAuthStore } from '../../../../store/authStore';

interface SettingsTabProps {
  userId: string;
  currentUserRole: UserRole; // Role of the logged-in user (for permission checks)
}

// Main SettingsTab Component
export const SettingsTab = React.memo<SettingsTabProps>(({ userId, currentUserRole }) => {
  const navigation = useNavigation<UsersStackNavigationProp>();
  const theme = useTheme();
  const currentUser = useAuthStore(selectUser);
  const hasBiometricSetup = useAuthStore(s => s.hasBiometricSetup);
  const setHasBiometricSetup = useAuthStore(s => s.setHasBiometricSetup);
  const [changePasswordVisible, setChangePasswordVisible] = React.useState(false);
  const [confirmDialog, setConfirmDialog] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  }>({ visible: false, title: '', message: '', confirmText: '', onConfirm: () => {} });
  const toast = useToast();

  // Use the actual hook
  const userQuery = useUserById(userId);
  const { mutate: updateUser, isPending: isUpdatingStatus } = useUpdateUser();

  const handleEditProfile = React.useCallback(() => {
    navigation.navigate(UserScreens.Edit, { userId });
  }, [userId, navigation]);

  const handleChangePassword = React.useCallback(() => {
    setChangePasswordVisible(true);
  }, []);

  const handleCloseChangePassword = React.useCallback(() => {
    setChangePasswordVisible(false);
  }, []);

  const [biometricDialogVisible, setBiometricDialogVisible] = React.useState(false);

  const handleConfirmDisableBiometric = React.useCallback(async () => {
    setBiometricDialogVisible(false);
    const {clearAllBiometricData} = await import('../../../../utils/biometricStorage');
    const {default: apiClient} = await import('../../../../api/client');
    const {AUTH_ENDPOINTS} = await import('../../../../api/endpoints');
    try {
      const DeviceInfo = (await import('react-native-device-info')).default;
      const deviceFingerprint = await DeviceInfo.getUniqueId();
      await clearAllBiometricData();
      setHasBiometricSetup(false);
      await apiClient.post(AUTH_ENDPOINTS.BIOMETRIC_REVOKE, {deviceFingerprint});
    } catch {
      // Local data cleared; backend revoke is best-effort
    }
  }, [setHasBiometricSetup]);

  const handleActivate = React.useCallback(() => {
    setConfirmDialog({
      visible: true,
      title: 'Activate User',
      message: `Are you sure you want to activate ${userQuery.data?.name}?`,
      confirmText: 'Activate',
      onConfirm: () => {
        setConfirmDialog(d => ({ ...d, visible: false }));
        updateUser(
          { userId, data: { status: 'active' as UserStatus } },
          {
            onSuccess: () => toast.success('User activated successfully.'),
            onError: (error) => toast.error('Error', error instanceof Error ? error.message : 'Failed to activate user.'),
          }
        );
      },
    });
  }, [userId, userQuery.data?.name, updateUser, toast]);

  const handleDeactivate = React.useCallback(() => {
    setConfirmDialog({
      visible: true,
      title: 'Deactivate User',
      message: `Are you sure you want to deactivate ${userQuery.data?.name}? They will not be able to login.`,
      confirmText: 'Deactivate',
      onConfirm: () => {
        setConfirmDialog(d => ({ ...d, visible: false }));
        updateUser(
          { userId, data: { status: 'inactive' as UserStatus } },
          {
            onSuccess: () => toast.success('User deactivated successfully.'),
            onError: (error) => toast.error('Error', error instanceof Error ? error.message : 'Failed to deactivate user.'),
          }
        );
      },
    });
  }, [userId, userQuery.data?.name, updateUser, toast]);

  const handleSuspend = React.useCallback(() => {
    setConfirmDialog({
      visible: true,
      title: 'Suspend User',
      message: `Are you sure you want to suspend ${userQuery.data?.name}? They will not be able to login.`,
      confirmText: 'Suspend',
      onConfirm: () => {
        setConfirmDialog(d => ({ ...d, visible: false }));
        updateUser(
          { userId, data: { status: 'suspended' as UserStatus } },
          {
            onSuccess: () => toast.success('User suspended successfully.'),
            onError: (error) => toast.error('Error', error instanceof Error ? error.message : 'Failed to suspend user.'),
          }
        );
      },
    });
  }, [userId, userQuery.data?.name, updateUser, toast]);

  const onRefresh = React.useCallback(async () => {
    await userQuery.refetch();
  }, [userQuery]);

  if (userQuery.isLoading) {
    return (
      <View style={[styles.container, styles.contentContainer]}>
        <CardShimmer count={3} />
      </View>
    );
  }

  if (userQuery.error) {
    return (
      <View style={styles.container}>
        <ErrorFallback error={userQuery.error} onRetry={userQuery.refetch} variant="fullScreen" />
      </View>
    );
  }

  const user = userQuery.data;
  if (!user) return null;

  // Permission checks
  const canManageStatus = currentUserRole === 'super_admin';
  const isSelfView = currentUser?.id === userId;

  // Get status-based action buttons
  const getStatusActions = () => {
    if (!canManageStatus || isSelfView) return null;

    switch (user.status) {
      case 'active':
        return (
          <Row gap={12} style={styles.actionRow}>
            <OutlinedButton
              onPress={handleDeactivate}
              disabled={isUpdatingStatus}
              style={styles.actionButton}
              icon="cancel">
              Deactivate
            </OutlinedButton>
            <FilledTonalButton
              onPress={handleSuspend}
              disabled={isUpdatingStatus}
              style={styles.actionButton}
              icon="pause-circle">
              Suspend
            </FilledTonalButton>
          </Row>
        );
      case 'inactive':
        return (
          <Row gap={12} style={styles.actionRow}>
            <FilledButton
              onPress={handleActivate}
              disabled={isUpdatingStatus}
              style={styles.actionButton}
              icon="check-circle">
              Activate
            </FilledButton>
            <OutlinedButton
              onPress={handleSuspend}
              disabled={isUpdatingStatus}
              style={styles.actionButton}
              icon="pause-circle">
              Suspend
            </OutlinedButton>
          </Row>
        );
      case 'suspended':
        return (
          <Row gap={12} style={styles.actionRow}>
            <FilledButton
              onPress={handleActivate}
              disabled={isUpdatingStatus}
              style={styles.actionButton}
              icon="check-circle">
              Activate
            </FilledButton>
            <OutlinedButton
              onPress={handleDeactivate}
              disabled={isUpdatingStatus}
              style={styles.actionButton}
              icon="cancel">
              Deactivate
            </OutlinedButton>
          </Row>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.tertiary;
      case 'suspended':
        return theme.colors.error;
      case 'inactive':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurface;
    }
  };

  return (
    <PullToRefresh
      onRefresh={onRefresh}
      refreshing={userQuery.isRefetching}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      nestedScrollEnabled
    >
        {/* Profile Section */}
        <ElevatedCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium">Profile</Text>
          </View>

          <ThreeLineListItem
            title={user.name}
            subtitle={user.email}
            supportingText={`${user.role.toUpperCase()} • ${user.email}`}
            leftIcon="account-circle"
            rightIcon="chevron-right"
            onPress={handleEditProfile}
          />

          <Divider style={styles.divider} />

          <ThreeLineListItem
            title="Edit Profile"
            subtitle="Update name and profile information"
            leftIcon="pencil"
            rightIcon="chevron-right"
            onPress={handleEditProfile}
          />
        </ElevatedCard>

        {/* Account Security (SUPER_ADMIN only, not for self) */}
        {canManageStatus && !isSelfView && (
          <ElevatedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium">Account Security</Text>
            </View>

            <ThreeLineListItem
              title="Change Password"
              subtitle="Update user's account password"
              supportingText="Reset password with security options"
              leftIcon="lock-reset"
              rightIcon="chevron-right"
              onPress={handleChangePassword}
            />
          </ElevatedCard>
        )}

        {/* Status Management (SUPER_ADMIN only, not for self) */}
        {canManageStatus && !isSelfView && (
          <ElevatedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium">Account Status</Text>
            </View>

            <View style={styles.statusSection}>
              <Row style={styles.statusRow}>
                <View style={styles.statusInfo}>
                  <Text variant="labelSmall" style={styles.statusLabel}>
                    Current Status
                  </Text>
                  <Row gap={8} style={styles.statusBadgeRow}>
                    <Icon
                      name={
                        user.status === 'active'
                          ? 'check-circle'
                          : user.status === 'suspended'
                          ? 'pause-circle'
                          : 'cancel'
                      }
                      size={20}
                      color={getStatusColor(user.status)}
                    />
                    <Text
                      variant="titleMedium"
                      style={{ color: getStatusColor(user.status) }}>
                      {user.status.toUpperCase()}
                    </Text>
                  </Row>
                  <Text
                    variant="bodySmall"
                    color={theme.colors.onSurfaceVariant}
                    style={styles.statusDescription}>
                    {user.status === 'active'
                      ? 'User can login and access the system'
                      : user.status === 'suspended'
                      ? 'User is temporarily blocked from login'
                      : 'User account is deactivated'}
                  </Text>
                </View>
              </Row>

              <Spacer size="md" />
              <Divider />
              <Spacer size="md" />

              <Text variant="labelSmall" style={styles.actionsLabel}>
                Available Actions
              </Text>
              <Spacer size="sm" />
              {getStatusActions()}
            </View>
          </ElevatedCard>
        )}

        {/* Quick Login (biometric) — self-view only */}
        {isSelfView && (
          <ElevatedCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium">Quick Login</Text>
            </View>

            <ThreeLineListItem
              title="PIN & Fingerprint Login"
              subtitle={
                hasBiometricSetup
                  ? 'Quick login is enabled on this device'
                  : 'Not set up — sign out and sign in again to enable'
              }
              supportingText={
                hasBiometricSetup
                  ? 'Tap to disable quick login for this device'
                  : 'Use a PIN or fingerprint instead of your password'
              }
              leftIcon={hasBiometricSetup ? 'fingerprint' : 'fingerprint-off'}
              rightIcon={hasBiometricSetup ? 'close-circle-outline' : undefined}
              onPress={hasBiometricSetup ? () => setBiometricDialogVisible(true) : undefined}
            />
          </ElevatedCard>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Biometric disable confirmation dialog */}
        {isSelfView && (
          <ConfirmDialog
            visible={biometricDialogVisible}
            title="Disable Quick Login?"
            message="Your PIN and fingerprint login will be removed from this device. You will need to sign in with your password next time."
            confirmText="Disable"
            cancelText="Cancel"
            onConfirm={handleConfirmDisableBiometric}
            onCancel={() => setBiometricDialogVisible(false)}
          />
        )}

    </PullToRefresh>
  );
});

SettingsTab.displayName = 'SettingsTab';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  divider: {
    marginVertical: 8,
  },
  spacer: {
    height: 24,
  },
  statusSection: {
    padding: 16,
  },
  statusRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusBadgeRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDescription: {
    marginTop: 4,
  },
  actionsLabel: {
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  actionRow: {
    width: '100%',
  },
  actionButton: {
    flex: 1,
  },
});
