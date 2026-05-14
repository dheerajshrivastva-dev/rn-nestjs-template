import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreens } from '../screens';
import { DashboardScreen } from '../../screens/dashboard';
import { appBarScreenOptions } from '../components';

const Stack = createNativeStackNavigator();

export const DashboardStack = () => (
  <Stack.Navigator screenOptions={appBarScreenOptions}>
    <Stack.Screen
      name={DashboardScreens.Main}
      component={DashboardScreen}
      options={{ title: 'Home' }}
    />
    {/* TODO: Add your domain screens here */}
  </Stack.Navigator>
);
