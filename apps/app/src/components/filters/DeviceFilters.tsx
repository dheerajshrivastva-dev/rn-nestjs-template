/**
 * Device-specific filters
 * Used in FilterBottomSheet for devices
 */

import React from 'react';
import { View } from 'react-native';
import { TitleMedium, FilterChip, Row, Spacer } from '@bevarc/ui';
import { useFilterStore } from '../../stores/filterStore';

export const DeviceFilters = React.memo(() => {
  const { deviceFilters, setDeviceFilter } = useFilterStore();

  return (
    <View>
      <TitleMedium style={{ marginBottom: 12 }}>Status</TitleMedium>
      <Row gap={8}>
        <FilterChip
          selected={deviceFilters.status === 'all'}
          onPress={() => setDeviceFilter('status', 'all')}
          label="All"
        />
        <FilterChip
          selected={deviceFilters.status === 'locked'}
          onPress={() => setDeviceFilter('status', 'locked')}
          label="Locked"
        />
        <FilterChip
          selected={deviceFilters.status === 'unlocked'}
          onPress={() => setDeviceFilter('status', 'unlocked')}
          label="Unlocked"
        />
      </Row>

      <Spacer size="xl" />
    </View>
  );
});

DeviceFilters.displayName = 'DeviceFilters';
