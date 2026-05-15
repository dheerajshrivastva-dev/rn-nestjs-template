/**
 * FilterChips Component
 *
 * Displays horizontal scrollable filter chips with multiple selection support.
 * Used in various tabs for filtering data (Orders, Transfers, Balance, etc.)
 *
 * Material Design 3 compliant
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FilterChip } from '@bevarc/ui';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterChipsProps {
  filters: FilterOption[];
  selectedFilters: string[];
  onFilterChange: (filters: string[]) => void;
  multiSelect?: boolean;
}

export const FilterChips = React.memo<FilterChipsProps>(({
  filters,
  selectedFilters,
  onFilterChange,
  multiSelect = false,
}) => {
  const handleFilterPress = React.useCallback((value: string) => {
    if (multiSelect) {
      // Multiple selection mode
      const isSelected = selectedFilters.includes(value);
      if (isSelected) {
        onFilterChange(selectedFilters.filter(f => f !== value));
      } else {
        onFilterChange([...selectedFilters, value]);
      }
    } else {
      // Single selection mode
      if (selectedFilters[0] === value) {
        onFilterChange([]);
      } else {
        onFilterChange([value]);
      }
    }
  }, [selectedFilters, onFilterChange, multiSelect]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {filters.map((filter) => (
        <View key={filter.value} style={styles.chipWrapper}>
          <FilterChip
            label={filter.count !== undefined ? `${filter.label} (${filter.count})` : filter.label}
            selected={selectedFilters.includes(filter.value)}
            onPress={() => handleFilterPress(filter.value)}
          />
        </View>
      ))}
    </ScrollView>
  );
});

FilterChips.displayName = 'FilterChips';

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    gap: 8,
  },
  chipWrapper: {
    marginRight: 8,
  },
});
