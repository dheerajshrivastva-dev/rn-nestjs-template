/**
 * StatusDot Component
 * Colored dot indicator for online/offline status
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type StatusDotType = 'online' | 'offline' | 'busy' | 'away' | 'protected' | 'locked';

export interface StatusDotProps {
  /**
   * Status type
   * @default 'online'
   */
  status?: StatusDotType;

  /**
   * Dot size in dp
   * @default 12
   */
  size?: number;

  /**
   * Custom color (overrides status color)
   */
  color?: string;

  /**
   * Whether to show pulsing animation
   * @default false
   */
  animated?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * StatusDot
 *
 * Colored dot indicator for status display.
 * Uses theme status colors by default.
 *
 * @example
 * // Online status
 * <StatusDot status="online" />
 *
 * @example
 * // With avatar
 * <View>
 *   <Avatar.Image source={{ uri: 'avatar.jpg' }} />
 *   <StatusDot status="online" size={16} style={{ position: 'absolute', bottom: 0, right: 0 }} />
 * </View>
 *
 * @example
 * // Custom color
 * <StatusDot color="#FF9800" size={10} />
 */
export const StatusDot: React.FC<StatusDotProps> = ({
  status = 'online',
  size = 12,
  color,
  style,
}) => {
  const theme = useTheme();

  const getStatusColor = (): string => {
    if (color) return color;

    switch (status) {
      case 'online':
        return theme.statusColors.online;
      case 'offline':
        return theme.statusColors.offline;
      case 'busy':
        return theme.statusColors.locked;
      case 'away':
        return theme.statusColors.pending;
      case 'protected':
        return theme.statusColors.protected;
      case 'locked':
        return theme.statusColors.locked;
      default:
        return theme.statusColors.offline;
    }
  };

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getStatusColor(),
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
