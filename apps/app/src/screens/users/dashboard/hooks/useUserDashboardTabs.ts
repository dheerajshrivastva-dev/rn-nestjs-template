/**
 * useUserDashboardTabs Hook
 *
 * Generates role-based tab configuration for UserDashboardScreen.
 * Returns array of tabs to display based on user role.
 *
 * Tab Structure by Role:
 * - SUPER: Overview, Orders, Transfers, Balance, Settings
 * - DISTRIBUTOR: Overview, Requests, Transfers, Balance, Settings
 * - RETAILER: Overview, Requests, Balance, Clients, Settings
 */

import React from 'react';
import type { UserRole } from '../../../../api/types';
import { OverviewTab, SettingsTab } from '../tabs';

export interface TabConfig {
  key: string;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
  props: Record<string, any>;
}

export interface UserDashboardTabsConfig {
  tabs: TabConfig[];
  initialRoute: string;
}

/**
 * Generate tab configuration based on user role
 */
export const useUserDashboardTabs = (
  _userRole: UserRole,
  userId: string,
  currentUserRole: UserRole
): UserDashboardTabsConfig => {
  const tabs = React.useMemo<TabConfig[]>(() => [
    {
      key: 'overview',
      title: 'Overview',
      icon: 'view-dashboard',
      component: OverviewTab,
      props: { userId },
    },
    {
      key: 'settings',
      title: 'Settings',
      icon: 'cog',
      component: SettingsTab,
      props: { userId, currentUserRole },
    },
  ], [userId, currentUserRole]);

  const initialRoute = React.useMemo(() => {
    return tabs.length > 0 ? tabs[0].key : 'overview';
  }, [tabs]);

  return { tabs, initialRoute };
};
