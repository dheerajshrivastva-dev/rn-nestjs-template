/**
 * Agents List Screen - Super Admin / Admin
 * Full-featured user list with search, company filter, and role filters
 * Uses real backend API: GET /api/v1/agents
 */

import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import {
  SafeScreen,
  SearchBar,
  FilterChip,
  ThreeLineListItem,
  FAB,
  LabelLarge,
  BodySmall,
  PullToRefreshFlatList,
  useTheme,
  Row,
  StatusChip,
} from '@bevarc/ui';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useFilterStore } from '../../stores/filterStore';
import { UserScreens } from '../../navigation/screens';
import type { User } from '../../api/types';
import type { UserStackNavigationProp, UserStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserStatus } from '../../api/types';
import { getRoleDisplayName } from '../../navigation/configs';
import { useUsers } from '../../hooks/queries/useUsers';

type AgentsListRouteProp = RouteProp<UserStackParamList, typeof UserScreens.List>;

// Helper to format last login
const formatLastLogin = (lastLoginAt?: string) => {
  if (!lastLoginAt) return 'Never logged in';

  const now = new Date();
  const loginDate = new Date(lastLoginAt);
  const diffMs = now.getTime() - loginDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};


const AgentListItem = React.memo(
  ({ user, onPress }: { user: User; onPress: () => void }) => {
    const theme = useTheme();

    return (
      <ThreeLineListItem
        title={user.name}
        subtitle={`${getRoleDisplayName(user.role)} · ${user.email}`}
        supportingText={`${user.phone} · ${user.userId}`}
        leading={
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            {user.profilePicture?.url ? (
              <Image
                source={{ uri: user.profilePicture?.url }}
                style={styles.avatarImage}
              />
            ) : (
              <Icon name="account" size={24} color={theme.colors.primary} />
            )}
          </View>
        }
        trailing={
          <View style={styles.trailingContainer}>
            <StatusChip
              status={user.status === UserStatus.ACTIVE ? 'success' : 'warning'}
              label={user.status === UserStatus.ACTIVE ? 'Active' : 'Inactive'}
            />
            <BodySmall color={theme.colors.onSurfaceVariant}>
              {formatLastLogin(user?.lastLoginAt || undefined)}
            </BodySmall>
          </View>
        }
        onPress={onPress}
      />
    );
  }
);

AgentListItem.displayName = 'AgentListItem';

export const UsersListScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<UserStackNavigationProp>();
  const route = useRoute<AgentsListRouteProp>();

  // Get companyId from route params (if navigated from CompanyDetail)
  const routeCompanyId = route.params?.companyId;

  const { userFilters, openFilter } = useFilterStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [quickFilter, setQuickFilter] = React.useState<UserStatus | undefined>(UserStatus.ACTIVE);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(routeCompanyId || 'all');

  // Update selected company when route param changes
  React.useEffect(() => {
    if (routeCompanyId) {
      setSelectedCompanyId(routeCompanyId);
    }
  }, [routeCompanyId]);

  // Combine quick filter with advanced filters
  const activeFilters = React.useMemo(
    () => ({
      ...userFilters,
      status: quickFilter,
      search: searchQuery || userFilters.search,
      companyId: selectedCompanyId === 'all' ? undefined : selectedCompanyId,
    }),
    [userFilters, quickFilter, searchQuery, selectedCompanyId]
  );

  // Data fetching with real API
  const { data: usersResponse, isLoading, error, refetch } = useUsers(activeFilters);

  // Extract users array from response
  const users = usersResponse?.data;

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAgentPress = React.useCallback(
    (userId: string) => {
      navigation.navigate(UserScreens.Dashboard, { userId });
    },
    [navigation]
  );

  const handleCreateAgent = React.useCallback(() => {
    navigation.navigate(UserScreens.Create as never);
  }, [navigation]);

  const handleOpenAdvancedFilters = React.useCallback(() => {
    openFilter('agents');
  }, [openFilter]);

  const renderAgentItem = React.useCallback(
    ({ item }: { item: User }) => (
      <AgentListItem user={item} onPress={() => handleAgentPress(item.id)} />
    ),
    [handleAgentPress]
  );

  const keyExtractor = React.useCallback((item: User) => item.id, []);

  const renderListHeader = React.useCallback(() => {
    return (
      <>
        {/* Search Bar */}
        <SearchBar
          placeholder="Search agents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Quick Filters */}
        <View style={styles.filterContainer}>
          <Row gap={8} style={styles.filterChipsRow}>
            <FilterChip
              selected={quickFilter === undefined}
              onPress={() => setQuickFilter(undefined)}
              label="All"
            />
            <FilterChip
              selected={quickFilter === UserStatus.ACTIVE}
              onPress={() => setQuickFilter(UserStatus.ACTIVE)}
              label="Active"
            />
            <FilterChip
              selected={quickFilter === UserStatus.INACTIVE}
              onPress={() => setQuickFilter(UserStatus.INACTIVE)}
              label="Inactive"
            />
          </Row>

          <Pressable onPress={handleOpenAdvancedFilters}>
            <LabelLarge color={theme.colors.primary}>More Filters</LabelLarge>
          </Pressable>
        </View>

        {/* Count */}
        <View style={styles.countContainer}>
          <BodySmall color={theme.colors.onSurfaceVariant}>
            {users?.length || 0} agents
          </BodySmall>
        </View>
      </>
    );
  }, [
    searchQuery,
    quickFilter,
    users?.length,
    theme,
    handleOpenAdvancedFilters,
  ]);

  return (
    <>
      <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
        <PullToRefreshFlatList
          data={users}
          isLoading={isLoading}
          refreshing={refreshing}
          error={error || null}
          onRefresh={onRefresh}
          onRetry={refetch}
          renderItem={renderAgentItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderListHeader}
          shimmerCount={8}
          emptyState={{
            icon: 'account-multiple-outline',
            title: 'No Agents Found',
            description:
              searchQuery || quickFilter !== undefined || selectedCompanyId !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first user',
          }}
          errorConfig={{
            type: 'network',
            variant: 'fullScreen',
          }}
          contentContainerStyle={styles.listContent}
        />

        {/* FAB for Create User */}
        <FAB
          icon="plus"
          label="Create User"
          onPress={handleCreateAgent}
          style={styles.fab}
        />
      </SafeScreen>
    </>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    paddingVertical: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingTop: 16,
  },
  filterChipsRow: {
    flex: 1,
  },
  countContainer: {
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  trailingContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
