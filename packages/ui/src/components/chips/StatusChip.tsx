/**
 * StatusChip Component
 * Color-coded chip for status display
 */

import React from 'react';
import { Chip as PaperChip } from 'react-native-paper';
import { ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface StatusChipProps {
  /**
   * Status label text
   */
  label: string;

  /**
   * Status type
   * @default 'default'
   */
  status?: StatusType;

  /**
   * Icon name (MaterialCommunityIcons)
   */
  icon?: string;

  /**
   * Press handler (optional)
   */
  onPress?: () => void;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Custom text style
   */
  textStyle?: ViewStyle;
}

/**
 * StatusChip
 *
 * Color-coded chip component for displaying status information.
 * Uses semantic colors (success, warning, error, info).
 *
 * @example
 * // Success status
 * <StatusChip
 *   label="Active"
 *   status="success"
 *   icon="check-circle"
 * />
 *
 * @example
 * // Warning status
 * <StatusChip
 *   label="Pending"
 *   status="warning"
 *   icon="clock"
 * />
 *
 * @example
 * // Error status
 * <StatusChip
 *   label="Failed"
 *   status="error"
 *   icon="alert-circle"
 * />
 *
 * @example
 * // Info status with press
 * <StatusChip
 *   label="Processing"
 *   status="info"
 *   icon="information"
 *   onPress={viewDetails}
 * />
 */
export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  status = 'default',
  icon,
  onPress,
  style,
  textStyle,
}) => {
  const theme = useTheme();

  const getStatusColors = () => {
    switch (status) {
      case 'success':
        return {
          backgroundColor: theme.semanticColors.success.container,
          textColor: theme.semanticColors.success.dark,
        };
      case 'warning':
        return {
          backgroundColor: theme.semanticColors.warning.container,
          textColor: theme.semanticColors.warning.dark,
        };
      case 'error':
        return {
          backgroundColor: theme.semanticColors.error.container,
          textColor: theme.semanticColors.error.dark,
        };
      case 'info':
        return {
          backgroundColor: theme.semanticColors.info.container,
          textColor: theme.semanticColors.info.dark,
        };
      default:
        return {
          backgroundColor: theme.colors.surfaceContainerHighest,
          textColor: theme.colors.onSurface,
        };
    }
  };

  const { backgroundColor, textColor } = getStatusColors();

  return (
    <PaperChip
      onPress={onPress}
      icon={icon}
      mode="flat"
      style={[{ backgroundColor }, style]}
      textStyle={[{ color: textColor }, textStyle]}
    >
      {label}
    </PaperChip>
  );
};
