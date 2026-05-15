/**
 * UserDashboardScreen
 * Displays user details and tabbed content (Overview, Settings).
 */

import React from 'react';

import { View, StyleSheet, useWindowDimensions } from 'react-native';

import {
  SafeScreen,
  useTheme,
  Text,
  ElevatedCard,
  StatusChip,
  Row,
} from '@bevarc/ui';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { type RouteProp, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useUserById } from '../../hooks/queries/useUserById';
import { type UserScreens } from '../../navigation/screens';
import { type UserStackParamList } from '../../navigation/types';
import { selectUser, useAuthStore } from '../../store/authStore';

import { OverviewTab, SettingsTab } from './dashboard/tabs';


// ============================================================================
// Types
// ============================================================================

type UserDashboardRouteProp = RouteProp<UserStackParamList, typeof UserScreens.Dashboard>;

const Tab = createMaterialTopTabNavigator();

const OverviewTabScreen = ({ route }: any) => {
  const { userId } = route.params || {};
  return <OverviewTab userId={userId} />;
};

const SettingsTabScreen = ({ route }: any) => {
  const { userId, currentUserRole } = route.params || {};
  return <SettingsTab userId={userId} currentUserRole={currentUserRole} />;
};

// ============================================================================
// Main Component
// ============================================================================

export const UserDashboardScreen = React.memo(() => {
  const route = useRoute<UserDashboardRouteProp>();
  const theme = useTheme();
  const layout = useWindowDimensions();

  // Fetch current user (viewer)
  const currentUser = useAuthStore(selectUser);

  // Get userId from route params, fallback to logged-in user's ID
  const userId = route.params?.userId || currentUser?.id;

  // Fetch user details to get role
  const { data: user, isLoading } = useUserById(userId);

  // Tab bar styling (Material Design 3)
  const screenOptions = React.useMemo(
    () => ({
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      tabBarLabelStyle: {
        fontSize: 14,
        fontWeight: '500' as const,
        textTransform: 'none' as const,
        fontFamily: 'Inter-Medium',
      },
      tabBarItemStyle: {
        width: 'auto' as const,
        minWidth: 90,
      },
      tabBarStyle: {
        backgroundColor: theme.colors.surface,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outlineVariant,
      },
      tabBarIndicatorStyle: {
        backgroundColor: theme.colors.primary,
        height: 3,
        borderRadius: 3,
      },
      tabBarScrollEnabled: true,
      lazy: true,
      lazyPreloadDistance: 1,
      // IMPORTANT: Set background color for tab content
      sceneStyle: {
        backgroundColor: theme.colors.background,
      },
    }),
    [theme]
  );

  // Show loading shimmer while fetching user
  if (isLoading || !user) {
    return (
      <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
        <Text>Loading...</Text>
      </SafeScreen>
    );
  }

  const userRole = user.role;
  const currentUserRole = currentUser?.role || 'retailer';

  // Tab params passed to all screens
  const tabParams = { userId, currentUserRole };

  // Format role for display
  const roleDisplay = userRole.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'suspended':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <SafeScreen noSafeArea edges={['left', 'right', 'bottom']}>
      {/* User Details Header - Compact */}
      <ElevatedCard style={styles.userDetailsCard}>
        <View style={styles.userDetailsContent}>
          {/* Name and Status Row */}
          <Row style={styles.nameRow}>
            <Text variant="titleMedium" style={styles.userName}>
              {user.name}
            </Text>
            <StatusChip
              status={getStatusColor(user.status)}
              label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            />
          </Row>

          {/* User Details with Icons - Compact Grid */}
          <View style={styles.detailsCompact}>
            <Row style={styles.detailRow}>
              <Icon name="badge-account-outline" size={14} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.detailText}>
                {user.userId}
              </Text>
            </Row>

            <Row style={styles.detailRow}>
              <Icon name="shield-account-outline" size={14} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.detailText}>
                {roleDisplay}
              </Text>
            </Row>

            <Row style={styles.detailRow}>
              <Icon name="email-outline" size={14} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.detailText} numberOfLines={1}>
                {user.email}
              </Text>
            </Row>

            {user.phone && (
              <Row style={styles.detailRow}>
                <Icon name="phone-outline" size={14} color={theme.colors.onSurfaceVariant} />
                <Text variant="bodySmall" style={styles.detailText}>
                  {user.phone}
                </Text>
              </Row>
            )}
          </View>
        </View>
      </ElevatedCard>

      {/* Tabs */}
      <Tab.Navigator
        initialRouteName="overview"
        initialLayout={{ width: layout.width }}
        screenOptions={screenOptions}
      >
        <Tab.Screen
          name="overview"
          component={OverviewTabScreen}
          initialParams={tabParams}
          options={{ title: 'Overview' }}
        />
        <Tab.Screen
          name="settings"
          component={SettingsTabScreen}
          initialParams={tabParams}
          options={{ title: 'Settings' }}
        />
      </Tab.Navigator>
    </SafeScreen>
  );
});

UserDashboardScreen.displayName = 'UserDashboardScreen';

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  userDetailsCard: {
    margin: 16,
    marginBottom: 8,
  },
  userDetailsContent: {
    padding: 12,
  },
  nameRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userName: {
    fontWeight: '600',
  },
  detailsCompact: {
    gap: 6,
  },
  detailRow: {
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    color: '#666',
  },
});
