/**
 * ChipFilterGroup Component
 * Group of filter chips with horizontal scroll and value management
 */

import React from 'react';
import { ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { FilterChip } from './FilterChip';

export interface ChipFilterOption<T = string> {
  /**
   * Unique value for this option
   */
  value: T;

  /**
   * Display label
   */
  label: string;

  /**
   * Optional icon (MaterialCommunityIcons name)
   */
  icon?: string;

  /**
   * Whether this option is disabled
   */
  disabled?: boolean;
}

export interface ChipFilterGroupProps<T = string> {
  /**
   * Available filter options
   */
  options: ChipFilterOption<T>[];

  /**
   * Currently selected value
   */
  value: T;

  /**
   * Callback when value changes
   */
  onChange: (value: T) => void;

  /**
   * Enable horizontal scroll
   * @default true
   */
  scrollable?: boolean;

  /**
   * Show horizontal scroll indicator
   * @default false
   */
  showScrollIndicator?: boolean;

  /**
   * Gap between chips (in pixels)
   * @default 8
   */
  gap?: number;

  /**
   * Container style
   */
  containerStyle?: ViewStyle;

  /**
   * Scroll view content container style
   */
  contentContainerStyle?: ViewStyle;

  /**
   * Individual chip style
   */
  chipStyle?: ViewStyle;
}

/**
 * ChipFilterGroup
 *
 * A group of filter chips with automatic value management.
 * Supports both scrollable and non-scrollable layouts.
 *
 * @example
 * // Basic usage
 * const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
 *
 * <ChipFilterGroup
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'active', label: 'Active' },
 *     { value: 'inactive', label: 'Inactive' },
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 * />
 *
 * @example
 * // With TypeScript enum
 * enum OrderStatus {
 *   PENDING = 'pending',
 *   APPROVED = 'approved',
 *   REJECTED = 'rejected',
 * }
 *
 * const [status, setStatus] = useState(OrderStatus.PENDING);
 *
 * <ChipFilterGroup<OrderStatus>
 *   options={[
 *     { value: OrderStatus.PENDING, label: 'Pending' },
 *     { value: OrderStatus.APPROVED, label: 'Approved' },
 *     { value: OrderStatus.REJECTED, label: 'Rejected' },
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 * />
 *
 * @example
 * // With icons and custom styling
 * <ChipFilterGroup
 *   options={[
 *     { value: 'today', label: 'Today', icon: 'calendar-today' },
 *     { value: 'week', label: 'This Week', icon: 'calendar-week' },
 *     { value: 'month', label: 'This Month', icon: 'calendar-month' },
 *   ]}
 *   value={period}
 *   onChange={setPeriod}
 *   gap={12}
 *   containerStyle={{ paddingVertical: 16 }}
 * />
 *
 * @example
 * // Non-scrollable (wrap layout)
 * <ChipFilterGroup
 *   scrollable={false}
 *   options={categories}
 *   value={selectedCategory}
 *   onChange={setSelectedCategory}
 * />
 */
export const ChipFilterGroup = <T extends string = string>({
  options,
  value,
  onChange,
  scrollable = true,
  showScrollIndicator = false,
  gap = 8,
  containerStyle,
  contentContainerStyle,
  chipStyle,
}: ChipFilterGroupProps<T>) => {
  const handlePress = React.useCallback(
    (optionValue: T) => {
      onChange(optionValue);
    },
    [onChange]
  );

  const renderChips = () => (
    <>
      {options.map((option, index) => (
        <FilterChip
          key={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => handlePress(option.value)}
          icon={option.icon}
          disabled={option.disabled}
          style={[
            index < options.length - 1 && { marginRight: gap },
            chipStyle,
          ]}
        />
      ))}
    </>
  );

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={showScrollIndicator}
        style={[styles.scrollView, containerStyle]}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {renderChips()}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.wrapContainer, containerStyle]}>
      <View style={[styles.wrapContent, { gap }, contentContainerStyle]}>
        {renderChips()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  wrapContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  wrapContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
