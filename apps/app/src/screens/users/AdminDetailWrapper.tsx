/**
 * Admin Detail Wrapper Screen
 * Route-based wrapper for UserDetailScreen (viewing admins)
 *
 * Usage:
 * - Used in navigation stack for viewing admin details
 * - Extracts userId from route params
 * - Passes to UserDetailScreen component
 * - Same underlying component as UserDetailWrapper, different semantic context
 *
 * Route: UserScreens.Detail or custom admin route
 * Params: { userId: string }
 *
 * Access Control:
 * - SUPER_ADMIN: Can view any admin/user
 * - ADMIN: Cannot view other admins (same company restriction)
 *
 * Note:
 * - This is semantically named for viewing ADMIN role users
 * - But technically uses the same UserDetailScreen component
 * - The component automatically adapts UI based on viewer's role and target's role
 */

import React from 'react';
import {useRoute} from '@react-navigation/native';
import {UserDetailScreen} from './UserDetailScreen';

export const AdminDetailWrapper = () => {
  const route = useRoute();
  const {userId} = route.params as {userId: string};

  return <UserDetailScreen userId={userId} />;
};
