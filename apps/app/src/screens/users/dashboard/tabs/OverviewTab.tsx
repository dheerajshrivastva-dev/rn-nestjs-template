/**
 * OverviewTab
 * Basic user overview with quick stats.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PullToRefresh } from '@bevarc/ui';
import { useUserById } from '../../../../hooks/queries/useUserById';
import { QuickStats } from '../../components/QuickStats';

interface OverviewTabProps {
  userId: string;
}

export const OverviewTab = React.memo<OverviewTabProps>(({ userId }) => {
  const { data: user, refetch } = useUserById(userId);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <PullToRefresh
      onRefresh={onRefresh}
      refreshing={refreshing}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      nestedScrollEnabled
    >
      {user && (
        <View style={styles.section}>
          <QuickStats user={user} />
        </View>
      )}
    </PullToRefresh>
  );
});

OverviewTab.displayName = 'OverviewTab';

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingVertical: 16 },
  section: { paddingHorizontal: 16 },
});
