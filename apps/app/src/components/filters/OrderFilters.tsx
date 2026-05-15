/**
 * Order-specific filters
 * Used in FilterBottomSheet for orders
 */

import React from 'react';
import { View } from 'react-native';
import { TitleMedium, FilterChip, Row, Spacer } from '@bevarc/ui';
import { useFilterStore } from '../../stores/filterStore';

export const OrderFilters = React.memo(() => {
  const { orderFilters, setOrderFilter } = useFilterStore();

  return (
    <View>
      <TitleMedium style={{ marginBottom: 12 }}>Status</TitleMedium>
      <Row gap={8}>
        <FilterChip
          selected={orderFilters.status === 'all'}
          onPress={() => setOrderFilter('status', 'all')}
          label="All"
        />
        <FilterChip
          selected={orderFilters.status === 'pending'}
          onPress={() => setOrderFilter('status', 'pending')}
          label="Pending"
        />
        <FilterChip
          selected={orderFilters.status === 'approved'}
          onPress={() => setOrderFilter('status', 'approved')}
          label="Approved"
        />
      </Row>

      <Spacer size="md" />
    </View>
  );
});

OrderFilters.displayName = 'OrderFilters';
