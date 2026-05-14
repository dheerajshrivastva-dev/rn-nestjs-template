/**
 * AssistChip Component
 * Chip with count badge for assistance
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip as PaperChip, Badge } from 'react-native-paper';
import { ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface AssistChipProps {
  /**
   * Chip label text
   */
  label: string;

  /**
   * Press handler
   */
  onPress?: () => void;

  /**
   * Icon name (MaterialCommunityIcons)
   */
  icon?: string;

  /**
   * Count badge number
   */
  count?: number;

  /**
   * Whether chip is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * AssistChip
 *
 * Chip component with optional count badge.
 * Used for contextual assistance and information display.
 *
 * @example
 * // Basic assist chip
 * <AssistChip
 *   label="Help"
 *   icon="help-circle"
 *   onPress={showHelp}
 * />
 *
 * @example
 * // With count badge
 * <AssistChip
 *   label="Notifications"
 *   icon="bell"
 *   count={5}
 *   onPress={viewNotifications}
 * />
 *
 * @example
 * // Info chip with badge
 * <AssistChip
 *   label="Updates"
 *   icon="information"
 *   count={3}
 *   onPress={viewUpdates}
 * />
 */
export const AssistChip: React.FC<AssistChipProps> = ({
  label,
  onPress,
  icon,
  count,
  disabled = false,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <PaperChip
        onPress={onPress}
        icon={icon}
        disabled={disabled}
        mode="outlined"
        style={style}
      >
        {label}
      </PaperChip>
      {count !== undefined && count > 0 && (
        <Badge
          size={20}
          style={[
            styles.badge,
            { backgroundColor: theme.colors.error },
          ]}
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
});
