import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DashboardStack } from '../stacks/DashboardStack';
import { AccountStack } from '../stacks';
import { SharedScreens, AccountScreens } from '../screens';
import { DashboardScreens } from '../screens';

const Drawer = createDrawerNavigator();

/**
 * PrivateRoot — the root navigator for authenticated users.
 *
 * Add role-specific stacks here as your app grows.
 * Each stack maps to a drawer item or nested navigator.
 */
export default function PrivateRoot() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name={DashboardScreens.Main} component={DashboardStack} options={{ title: 'Home' }} />
      <Drawer.Screen name={AccountScreens.Center} component={AccountStack} options={{ title: 'Account' }} />
      {/* TODO: Add your domain stacks here */}
    </Drawer.Navigator>
  );
}
