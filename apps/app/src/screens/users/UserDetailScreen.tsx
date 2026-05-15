/**
 * User Detail Screen - Role-Based View
 * Shows user/admin profile and statistics
 *
 * Access Control & Views:
 * 1. Self-View: User viewing their own profile (all roles)
 * 2. ADMIN viewing AGENT: Full user details + management actions
 * 3. SUPER_ADMIN viewing AGENT: Full details + company context
 * 4. SUPER_ADMIN viewing ADMIN: Full details + company context
 *
 * Features:
 * - Profile information with avatar
 * - Statistics (balance, clients, etc.)
 * - Account details (email, phone, verification status)
 * - Role and permissions info
 * - Company affiliation (for non-SUPER_ADMIN)
 * - Activity metadata (created by, last login, etc.)
 * - Quick actions (edit, manage balance, etc.)
 */

import React from 'react';

import {StyleSheet, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';

import {
  SafeScreen,
  Spacer,
  CardShimmer,
  ErrorFallback,
  PullToRefresh,
  KeyboardAwareScrollContainer,
  OutlinedButton,
  ConfirmDialog,
  Text,
  useTheme,
  useToast,
} from '@bevarc/ui';
import {type RouteProp, useNavigation, useRoute} from '@react-navigation/native';

import {UserRole, UserStatus} from '../../api/types';
import {
  useLogout,
  usePullToRefresh,
  useUpdateUser,
} from '../../hooks';
import { queryKeys } from '../../hooks/queryKeys';
import { useUserById } from '../../hooks/queries/useUserById';
import {UserScreens} from '../../navigation/screens';
import type {UserStackParamList, UsersStackNavigationProp} from '../../navigation/types';
import { selectUser, useAuthStore } from '../../store/authStore';

import {
  ProfileHeader,
  QuickStats,
  ContactInfo,
  AccountDetails,
  MetadataSection,
  StatusManagementCard,
  ActionButtons,
} from './components';


// ============================================================================
// Main Component
// ============================================================================
type ProfileDetailsRouteProp = RouteProp<UserStackParamList, typeof UserScreens.Detail>;
interface UserDetailScreenProps {
  userId?: string;
}

export const UserDetailScreen = ({userId: userPropId}: UserDetailScreenProps) => {
	const route = useRoute<ProfileDetailsRouteProp>();
  const userRouteId = route.params?.userId;
  const userId = userPropId || userRouteId;
  const navigation = useNavigation<UsersStackNavigationProp>();

  const { mutate: logout, isPending } = useLogout();
  const { colors } = useTheme();
  const toast = useToast();
  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [activateDialog, setActivateDialog] = React.useState(false);
  const [changeStatusDialog, setChangeStatusDialog] = React.useState<{
    visible: boolean;
    status: UserStatus | null;
    label: string;
  }>({ visible: false, status: null, label: '' });

  const handleLogout = React.useCallback(() => {
    setShowLogoutDialog(true);
  }, []);

  const handleConfirmLogout = React.useCallback(() => {
    setShowLogoutDialog(false);
    logout();
  }, [logout]);

  // Fetch current user (viewer)
  const currentUser = useAuthStore(selectUser);

  // Fetch user details
  const {data: user, isLoading, error, refetch} = useUserById(userId);

  // Fetch companies (only for SUPER_ADMIN when user has no company)
  const viewerRole = currentUser?.role || UserRole.RETAILER;

  // Pull to refresh
  const {refreshing, onRefresh} = usePullToRefresh({
    queryKey: queryKeys.users.detail(userId),
    queryFn: refetch,
  });

  // Update user mutation
  const {mutate: updateUser} = useUpdateUser();

  // Determine if self-view
  const isSelfView = currentUser?.id === userId;


  // Action Handlers
  const handleEdit = React.useCallback(() => {
    navigation.navigate(UserScreens.Edit, {userId: userId || ''});
  }, [navigation, userId]);

  const handleViewClients = React.useCallback(() => {
    // TODO: Navigate to clients list filtered by user
    console.log('View clients for user:', userId);
  }, [userId]);

  const handleAssignCompanyClick = React.useCallback(() => {
    if (user?.companyId) {
      toast.info('Cannot Assign Company', 'This user already has a company assigned. Agents cannot be transferred between companies.');
      return;
    }
  }, [user?.companyId, toast]);

  // Status management handlers
  const handleActivateAgent = React.useCallback(() => {
    setActivateDialog(true);
  }, []);

  const handleConfirmActivate = React.useCallback(() => {
    setActivateDialog(false);
    updateUser(
      {userId: userId || '', data: {status: UserStatus.ACTIVE}},
      {
        onSuccess: () => toast.success('User activated successfully.'),
        onError: err => {
          const errorMessage = err instanceof Error ? err.message : 'Failed to activate user. Please try again.';
          toast.error('Error', errorMessage);
        },
      },
    );
  }, [userId, updateUser, toast]);

  const handleChangeStatus = React.useCallback(
    (newStatus: UserStatus) => {
      const statusLabel =
        newStatus === UserStatus.INACTIVE ? 'deactivate' : newStatus === UserStatus.ACTIVE ? 'activate' : 'suspend';
      setChangeStatusDialog({ visible: true, status: newStatus, label: statusLabel });
    },
    [],
  );

  const handleConfirmChangeStatus = React.useCallback(() => {
    const { status, label } = changeStatusDialog;
    setChangeStatusDialog(d => ({ ...d, visible: false }));
    if (!status) return;
    updateUser(
      {userId: userId || '', data: {status}},
      {
        onSuccess: () => toast.success(`User ${label}d successfully.`),
        onError: err => {
          const errorMessage = err instanceof Error ? err.message : `Failed to ${label} user. Please try again.`;
          toast.error('Error', errorMessage);
        },
      },
    );
  }, [changeStatusDialog, userId, updateUser, toast]);

  // Loading State
  if (isLoading) {
    return (
      <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
        <KeyboardAwareScrollContainer padding={16}>
          <CardShimmer count={5} />
        </KeyboardAwareScrollContainer>
      </SafeScreen>
    );
  }

  // Error State
  if (error || !user) {
    return (
      <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
        <ErrorFallback
          error={error || new Error('User not found')}
          onRetry={refetch}
          variant="fullScreen"
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
      <PullToRefresh onRefresh={onRefresh} refreshing={refreshing}>
        <KeyboardAwareScrollContainer padding={16}>
          {/* Profile Header */}
          <ProfileHeader
            user={user}
            isSelfView={isSelfView}
            viewerRole={viewerRole}
            onEdit={isSelfView ? handleEdit : undefined}
            onAssignCompany={handleAssignCompanyClick}
          />

          <Spacer size="xl" />

          {/* Quick Stats */}
          {user.role !== UserRole.SUPER_ADMIN && <QuickStats user={user} />}

          <Spacer size="xl" />

                    {/* Status Management Card (ADMIN/SUPER_ADMIN only) */}
          <StatusManagementCard
            user={user}
            viewerRole={viewerRole}
            isSelfView={isSelfView}
            onActivate={handleActivateAgent}
            onChangeStatus={handleChangeStatus}
          />

          {!isSelfView && (viewerRole === UserRole.SUPER || viewerRole === UserRole.SUPER_ADMIN) && (
            <Spacer size="xl" />
          )}

          {!isSelfView && viewerRole === UserRole.SUPER_ADMIN && (
            <Spacer size="xl" />
          )}

          {/* Contact Information */}
          <ContactInfo user={user} />

          <Spacer size="xl" />

          {/* Account Details */}
          <AccountDetails
            user={user}
            viewerRole={viewerRole}
            currentUserId={currentUser?.id || ''}
          />

          <Spacer size="xl" />

          {/* Metadata (for Admin/Super Admin viewing others) */}
          {!isSelfView && (
            <>
              <MetadataSection user={user} />
              <Spacer size="xl" />
            </>
          )}

          {/* Logout Button - Only visible when viewing own profile */}
          <OutlinedButton
            onPress={handleLogout}
            loading={isPending}
            disabled={isPending}
            icon="logout"
            variant='danger'
          >
            Logout
          </OutlinedButton>

          {/* App version info */}
          <View style={styles.versionContainer}>
            <Text variant="labelSmall" style={[styles.versionText, {color: colors.onSurfaceVariant}]}>
              DueTech Admin v{appVersion} ({buildNumber})
            </Text>
          </View>
        </KeyboardAwareScrollContainer>
      </PullToRefresh>

      <ConfirmDialog
        visible={showLogoutDialog}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        loading={isPending}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />

      <ConfirmDialog
        visible={activateDialog}
        title="Activate User"
        message="Are you sure you want to activate this user? They will regain access to the system."
        confirmText="Activate"
        cancelText="Cancel"
        onConfirm={handleConfirmActivate}
        onCancel={() => setActivateDialog(false)}
      />

      <ConfirmDialog
        visible={changeStatusDialog.visible}
        title={`${changeStatusDialog.label.charAt(0).toUpperCase() + changeStatusDialog.label.slice(1)} User`}
        message={`Are you sure you want to ${changeStatusDialog.label} this user?`}
        confirmText={changeStatusDialog.label.charAt(0).toUpperCase() + changeStatusDialog.label.slice(1)}
        cancelText="Cancel"
        onConfirm={handleConfirmChangeStatus}
        onCancel={() => setChangeStatusDialog(d => ({ ...d, visible: false }))}
      />
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    opacity: 0.5,
  },
});
