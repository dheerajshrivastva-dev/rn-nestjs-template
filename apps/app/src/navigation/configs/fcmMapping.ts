/**
 * FCM / In-App Notification → Screen Mapping
 *
 * Maps every FCMNotificationType to:
 *   - the screen to navigate to
 *   - the params extractor (from NotificationData)
 *   - the roles that can receive / handle this notification type
 *
 * Keep FCMNotificationType in types.ts in sync with this file.
 *
 * Usage:
 *   const mapping = getFCMScreenMapping(notification.type, userRole);
 *   if (mapping) navigation.navigate(mapping.screen, mapping.getParams(notification.data));
 */

import { UserRole } from '../../api/types';
import { DashboardScreens } from '../screens';
import type { FCMScreenMapping, FCMNotificationType } from '../types';

export const fcmScreenMapping: FCMScreenMapping = {
  system_alert: {
    screen: DashboardScreens.Main,
    getParams: () => ({}),
    roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER],
  },

  // TODO: Add app-specific notification mappings here
  // e.g.
  // task_assigned: {
  //   screen: TaskScreens.Detail,
  //   getParams: (data) => ({ taskId: data.taskId }),
  //   roles: [UserRole.USER, UserRole.MANAGER],
  // },
};

export function getFCMScreenMapping(type: FCMNotificationType, userRole: UserRole) {
  const mapping = fcmScreenMapping[type];

  if (!mapping) {
    console.warn(`[FCM] No mapping found for notification type: ${type}`);
    return undefined;
  }

  if (!mapping.roles.includes(userRole)) {
    console.warn(`[FCM] Role "${userRole}" cannot handle notification type: ${type}`);
    return undefined;
  }

  return mapping;
}

export function canHandleNotification(type: FCMNotificationType, userRole: UserRole): boolean {
  const mapping = fcmScreenMapping[type];
  return mapping ? mapping.roles.includes(userRole) : false;
}
