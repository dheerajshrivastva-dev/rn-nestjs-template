/**
 * Order Time Filters Component
 * Filter chips for filtering orders by time period
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChipFilterGroup, type ChipFilterOption, useTheme } from '@forge/ui';
import type { OrderFilter } from '../../hooks/queries/useOrders';

interface OrderTimeFiltersProps {
  selected: OrderFilter;
  onSelect: (filter: OrderFilter) => void;
}

const FILTER_OPTIONS: ChipFilterOption<OrderFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
];

export const OrderTimeFilters: React.FC<OrderTimeFiltersProps> = ({
  selected,
  onSelect,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ChipFilterGroup<OrderFilter>
        options={FILTER_OPTIONS}
        value={selected}
        onChange={onSelect}
        scrollable={false}
        gap={12}
        containerStyle={styles.filterGroup}
        contentContainerStyle={styles.filterContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterContent: {
    gap: 12,
  },
});
