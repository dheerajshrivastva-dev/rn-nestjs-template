/**
 * User Detail Wrapper Screen
 * Route-based wrapper for UserDetailScreen
 *
 * Usage:
 * - Used in navigation stack for viewing user details
 * - Extracts userId from route params
 * - Passes to UserDetailScreen component
 *
 * Route: UserScreens.Detail
 * Params: { userId: string }
 *
 * Access Control:
 * - ADMIN: Can view agents in their company
 * - SUPER_ADMIN: Can view any user
 */

import React from 'react';
import {useRoute} from '@react-navigation/native';
import {UserDetailScreen} from './UserDetailScreen';

export const UserDetailWrapper = () => {
  const route = useRoute();
  const {userId} = route.params as {userId: string};

  return <UserDetailScreen userId={userId} />;
};
