/**
 * FilterChip Component
 * Chip for filtering content (horizontal scrollable)
 */

import React from 'react';
import { Chip as PaperChip } from 'react-native-paper';
import { ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface FilterChipProps {
  /**
   * Chip label text
   */
  label: string;

  /**
   * Whether chip is selected
   */
  selected: boolean;

  /**
   * Press handler
   */
  onPress: () => void;

  /**
   * Icon name (MaterialCommunityIcons)
   */
  icon?: string;

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
 * FilterChip
 *
 * Chip component for filtering content.
 * Typically used in horizontal scrollable lists.
 *
 * @example
 * // Basic filter chip
 * <FilterChip
 *   label="Active"
 *   selected={filter === 'active'}
 *   onPress={() => setFilter('active')}
 * />
 *
 * @example
 * // Filter chips in ScrollView
 * <ScrollView horizontal>
 *   <FilterChip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
 *   <FilterChip label="Pending" selected={filter === 'pending'} onPress={() => setFilter('pending')} />
 *   <FilterChip label="Completed" selected={filter === 'completed'} onPress={() => setFilter('completed')} />
 * </ScrollView>
 *
 * @example
 * // With icon
 * <FilterChip
 *   label="Starred"
 *   icon="star"
 *   selected={showStarred}
 *   onPress={() => setShowStarred(!showStarred)}
 * />
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
  icon,
  disabled = false,
  style,
}) => {
  const theme = useTheme();

  return (
    <PaperChip
      selected={selected}
      onPress={onPress}
      icon={icon}
      disabled={disabled}
      mode="flat"
      selectedColor={theme.colors.onSecondaryContainer}
      style={[
        {
          backgroundColor: selected
            ? theme.colors.secondaryContainer
            : (theme.colors as any).surfaceContainerHighest || theme.colors.surfaceVariant,
        },
        style,
      ]}
    >
      {label}
    </PaperChip>
  );
};
