/**
 * NotificationBadge Component
 * Count badge for notifications
 */

import React from 'react';
import { Badge as PaperBadge } from 'react-native-paper';
import { ViewStyle } from 'react-native';

export interface NotificationBadgeProps {
  /**
   * Badge count
   */
  count: number;

  /**
   * Maximum count to display (shows count+ if exceeded)
   * @default 99
   */
  maxCount?: number;

  /**
   * Badge size
   * @default 20
   */
  size?: number;

  /**
   * Custom background color
   */
  backgroundColor?: string;

  /**
   * Custom text color
   */
  textColor?: string;

  /**
   * Whether badge is visible
   * @default true
   */
  visible?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * NotificationBadge
 *
 * Count badge for displaying notification counts.
 * Shows "99+" for counts exceeding maxCount.
 *
 * @example
 * // Basic notification badge
 * <View>
 *   <IconButton icon="bell" />
 *   <NotificationBadge count={5} />
 * </View>
 *
 * @example
 * // Large count badge
 * <NotificationBadge
 *   count={150}
 *   maxCount={99}
 *   size={24}
 * />
 *
 * @example
 * // Custom colors
 * <NotificationBadge
 *   count={3}
 *   backgroundColor="#4CAF50"
 *   textColor="#FFFFFF"
 * />
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 20,
  backgroundColor,
  textColor,
  visible = true,
  style,
}) => {
  if (!visible || count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <PaperBadge
      size={size}
      style={[
        backgroundColor && { backgroundColor },
        textColor && { color: textColor },
        style,
      ]}
    >
      {displayCount}
    </PaperBadge>
  );
};
