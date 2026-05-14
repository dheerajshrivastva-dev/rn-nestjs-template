/**
 * Profile Stack
 * Profile → Edit Profile → Settings → Change Password → Notifications
 */

import React from "react";
import { View, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SharedScreens } from "../screens";
import { ProfileScreen } from "../../screens/profile";
import { NotificationsScreen } from "../../screens/notifications/NotificationsScreen";
import { NotificationDetailScreen } from "../../screens/notifications/NotificationDetailScreen";
import { appBarScreenOptions } from "../components";

const Stack = createNativeStackNavigator();

// Placeholder screens (define outside - 2026 React best practice)
const EditProfileScreen = () => <View><Text>Edit Profile - Coming Soon</Text></View>;
const SettingsScreen = () => <View><Text>Settings - Coming Soon</Text></View>;
const ChangePasswordScreen = () => <View><Text>Change Password - Coming Soon</Text></View>;

export const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={appBarScreenOptions}>
      <Stack.Screen
        name={SharedScreens.Profile}
        component={ProfileScreen}
      />
      <Stack.Screen
        name={SharedScreens.EditProfile}
        component={EditProfileScreen}
      />
      <Stack.Screen
        name={SharedScreens.Settings}
        component={SettingsScreen}
      />
      <Stack.Screen
        name={SharedScreens.ChangePassword}
        component={ChangePasswordScreen}
      />
      <Stack.Screen
        name={SharedScreens.Notifications}
        component={NotificationsScreen}
      />
      <Stack.Screen
        name={SharedScreens.NotificationDetail}
        component={NotificationDetailScreen}
      />
    </Stack.Navigator>
  );
};
