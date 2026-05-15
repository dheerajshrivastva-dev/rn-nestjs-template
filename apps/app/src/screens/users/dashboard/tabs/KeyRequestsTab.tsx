/**
 * KeyRequestsTab Component
 *
 * Displays key requests for DISTRIBUTOR/RETAILER users.
 * Shows pending requests and allows creating new requests.
 * Only visible for users with role 'distributor' or 'retailer'.
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  PullToRefreshFlatList,
  FAB,
} from '@bevarc/ui';
import { usePendingKeyTransfers, useCreateKeyRequest } from '../../../../hooks';
import { KeyRequestListItem } from '../components';
// import { useNavigation } from '@react-navigation/native';

interface KeyRequestsTabProps {
  userId: string;
  parentUserId?: string | null;
}

// Main KeyRequestsTab Component
export const KeyRequestsTab = React.memo<KeyRequestsTabProps>(({ userId, parentUserId }) => {
  // const navigation = useNavigation();
  const { data, isLoading, error, refetch } = usePendingKeyTransfers(userId);
  const createKeyRequest = useCreateKeyRequest();

  const handleApprove = React.useCallback(
    async (transferId: string) => {
      // TODO: Implement approve logic
      console.log('Approve transfer:', transferId);
    },
    []
  );

  const handleReject = React.useCallback(
    async (transferId: string) => {
      // TODO: Implement reject logic
      console.log('Reject transfer:', transferId);
    },
    []
  );

  const handleRequestPress = React.useCallback(
    (transferId: string) => {
      // Navigate to transfer detail screen
      console.log('View transfer details:', transferId);
    },
    []
  );

  const handleCreateRequest = React.useCallback(() => {
    // Open bottom sheet for creating key request
    // TODO: Implement CreateKeyRequestSheet
    console.log('Create new key request from parent:', parentUserId);
  }, [parentUserId]);

  const renderItem = React.useCallback(
    ({ item }: any) => (
      <KeyRequestListItem
        transfer={item}
        userId={userId}
        onApprove={() => handleApprove(item.id)}
        onReject={() => handleReject(item.id)}
        onPress={() => handleRequestPress(item.id)}
      />
    ),
    [userId, handleApprove, handleReject, handleRequestPress]
  );

  const onRefresh = React.useCallback(async () => {
    await refetch();
  }, [refetch]);


  return (
    <View style={styles.container}>
      <PullToRefreshFlatList
        data={data?.transfers || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        error={error}
        onRefresh={onRefresh}
        refreshing={isLoading}
        shimmerCount={6}
        emptyState={{
          icon: 'hand-coin-outline',
          title: 'No Key Requests',
          description: parentUserId
            ? 'You haven\'t requested any keys yet. Request keys from your parent user to get started.'
            : 'No parent user assigned. Contact your administrator.',
          actionLabel: parentUserId ? 'Request Keys' : undefined,
          onAction: parentUserId ? handleCreateRequest : undefined,
        }}
        errorConfig={{
          type: 'network',
          variant: 'inline',
        }}
      />

      {/* FAB for creating new key request (only if parent exists) */}
      {parentUserId && (
        <FAB
          icon="hand-coin-outline"
          label="Request Keys"
          onPress={handleCreateRequest}
          style={styles.fab}
        />
      )}
    </View>
  );
});

KeyRequestsTab.displayName = 'KeyRequestsTab';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
