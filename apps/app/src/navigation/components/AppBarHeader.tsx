/**
 * AppBarHeader - Centralized header component for all stack navigators
 * Provides consistent AppBar across all screens with navigation integration
 */

import React from "react";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { AppBar } from "@forge/ui";
import {
  DashboardScreens,
  CompanyScreens,
  UserScreens,
  OrderScreens,
  SystemScreens,
  SharedScreens,
  AccountScreens,
} from "../screens";
import { useAppBarProps } from "../../hooks";

/**
 * Maps screen names to human-readable titles
 */
const getScreenTitle = (screenName: string): string => {
  // Dashboard screens
  if (screenName === DashboardScreens.SuperAdmin) return "Super Admin Dashboard";
  if (screenName === DashboardScreens.Super) return "Dashboard";
  if (screenName === DashboardScreens.Distributor) return "Dashboard";
  if (screenName === DashboardScreens.Retailer) return "Dashboard";

  // Company screens
  if (screenName === CompanyScreens.List) return "Companies";
  if (screenName === CompanyScreens.Detail) return "Company Details";
  if (screenName === CompanyScreens.Create) return "Create Company";
  if (screenName === CompanyScreens.Edit) return "Edit Company";
  if (screenName === CompanyScreens.Settings) return "Company Settings";

  // User screens
  if (screenName === UserScreens.List) return "Users";
  if (screenName === UserScreens.Detail) return "User Details";
  if (screenName === UserScreens.Create) return "Create User";
  if (screenName === UserScreens.Edit) return "Edit User";
  if (screenName === UserScreens.TransferBalance) return "Transfer Balance";

  // Order screens
  if (screenName === OrderScreens.List) return "Orders";
  if (screenName === OrderScreens.Detail) return "Order Details";
  if (screenName === OrderScreens.Create) return "Create Order";
  if (screenName === OrderScreens.Approve) return "Approve Order";
  if (screenName === OrderScreens.Balance) return "Balance";
  if (screenName === OrderScreens.PurchaseKeys) return "Purchase Keys";

  // System screens
  if (screenName === SystemScreens.Settings) return "System Settings";
  if (screenName === SystemScreens.AuditLogs) return "Audit Logs";
  if (screenName === SystemScreens.Health) return "System Health";
  if (screenName === SystemScreens.Maintenance) return "Maintenance";

  // Shared screens
  if (screenName === SharedScreens.Profile) return "Profile";
  if (screenName === SharedScreens.EditProfile) return "Edit Profile";
  if (screenName === SharedScreens.Settings) return "Settings";
  if (screenName === SharedScreens.ChangePassword) return "Change Password";
  if (screenName === SharedScreens.Notifications) return "Notifications";
  if (screenName === SharedScreens.NotificationDetail) return "Notification";

  // Fallback - convert kebab-case to Title Case
  return screenName
    .split("/")[1] // Get part after domain prefix (e.g., "company/list" -> "list")
    ?.split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Screen";
};

/**
 * AppBarHeader Component
 * Used as screenOptions.header in all stack navigators
 */
export const AppBarHeader: React.FC<NativeStackHeaderProps> = ({
  navigation,
  route,
  options,
}) => {
  const canGoBack = navigation.canGoBack();
  const title = getScreenTitle(route.name);
  const { profileInitials, profileImageUrl, notificationCount } = useAppBarProps();

  return (
    <AppBar
      title={options?.title || title}
      showMenu={!canGoBack}
      showBack={canGoBack}
      onMenuPress={() => {
        // Safe type assertion - drawer navigation is always available
        (navigation as any).openDrawer?.();
      }}
      onBackPress={() => navigation.goBack()}
      showNotifications
      notificationCount={notificationCount}
      onNotificationPress={() => {
        navigation.navigate(SharedScreens.Notifications);
      }}
      showProfile
      profileImageUrl={profileImageUrl}
      profileInitials={profileInitials}
      onProfilePress={() => {
        navigation.navigate(AccountScreens.Center);
      }}
      logoSource={require('../../../assets/logo.png')}
    />
  );
};

/**
 * Screen options factory for stack navigators
 * Use this to avoid inline function definition warnings
 */
export const appBarScreenOptions = {
  header: (props: NativeStackHeaderProps) => <AppBarHeader {...props} />,
};
