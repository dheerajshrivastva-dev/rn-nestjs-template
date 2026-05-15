/**
 * Helper Functions for User Detail Screen
 * Utility functions for formatting dates, roles, and status
 */

import {UserRole, UserStatus} from '../../../api/types';

/**
 * Get icon name for user role
 */
export const getRoleIcon = (role: UserRole): string => {
  const icons: Partial<Record<UserRole, string>> = {
    [UserRole.SUPER_ADMIN]: 'shield-crown',
    [UserRole.SUPER]: 'shield-account',
    [UserRole.ADMIN]: 'shield-account',
    [UserRole.MANAGER]: 'account-supervisor',
    [UserRole.DISTRIBUTOR]: 'shield-account',
    [UserRole.RETAILER]: 'account-tie',
    [UserRole.USER]: 'account',
  };
  return icons[role] ?? 'account';
};

/**
 * Get theme color for user status
 */
export const getStatusColor = (status: UserStatus, theme: any) => {
  const colors: Record<UserStatus, string> = {
    [UserStatus.ACTIVE]: theme.semanticColors.success.main,
    [UserStatus.INACTIVE]: theme.semanticColors.warning.main,
    [UserStatus.SUSPENDED]: theme.semanticColors.error.main,
  };
  return colors[status] || theme.colors.onSurfaceVariant;
};

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return 'Never';
  try {
    return new Date(date).toDateString();
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date and time to readable string
 */
export const formatDateTime = (date: string | Date | undefined): string => {
  if (!date) return 'Never';
  try {
    return new Date(date).toLocaleString();
  } catch {
    return 'Invalid date';
  }
};

// Get status color
export const getClientStatusColor = (
  status: string,
): 'success' | 'warning' | 'error' | 'info' => {
  switch (status) {
    case 'protected':
      return 'success';
    case 'locked':
      return 'error';
    case 'deviceVerified':
      return 'info';
    case 'deviceNotRegistered':
      return 'warning';
    case 'expired':
      return 'warning';
    case 'notProtected':
      return 'error';
    default:
      return 'info';
  }
};

// Format status label
export const formatStatusLabel = (status: string): string => {
  switch (status) {
    case 'deviceNotRegistered':
      return 'Not Registered';
    case 'deviceVerified':
      return 'Verified';
    case 'protected':
      return 'Protected';
    case 'notProtected':
      return 'Not Protected';
    case 'locked':
      return 'Locked';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
};
