/**
 * Profile Screen - Self View
 * Wrapper around UserDetailScreen for viewing own profile
 *
 * Usage:
 * - Accessed from navigation drawer or bottom nav
 * - Shows current user's profile
 * - Automatically passes current user's ID to UserDetailScreen
 * - Used by all roles (SUPER_ADMIN, SUPER, DISTRIBUTOR, RETAILER)
 *
 * Navigation:
 * - Accessible from SharedScreens.Profile
 * - No params required (auto-detects current user from Zustand store)
 *
 * Performance:
 * - Uses Zustand store (no API call needed - user already loaded at login)
 * - Instant rendering with cached user data
 */

import React from 'react';
import {useAuthStore, selectUser} from '../../store/authStore';
import {UserDetailScreen} from '../users/UserDetailScreen';

export const ProfileScreen = () => {
  const currentUser = useAuthStore(selectUser);

  // Render UserDetailScreen with current user's ID
  // The UserDetailScreen will automatically detect this is a self-view
  return (
    <UserDetailScreen userId={currentUser?.id} />
  );
};
