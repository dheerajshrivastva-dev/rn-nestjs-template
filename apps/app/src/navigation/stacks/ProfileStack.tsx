/**
 * Profile Stack
 * Profile → Edit Profile → Settings → Change Password → Notifications
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SharedScreens } from "../screens";
import { NotificationsScreen } from "../../screens/notifications/NotificationsScreen";
import { NotificationDetailScreen } from "../../screens/notifications/NotificationDetailScreen";
import { appBarScreenOptions } from "../components";

const Stack = createNativeStackNavigator();

export const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={appBarScreenOptions}>
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
