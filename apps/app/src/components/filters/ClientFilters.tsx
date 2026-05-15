/**
 * Client-specific filters
 * Used in FilterBottomSheet for clients
 */

import React from 'react';
import { View } from 'react-native';
import { TitleMedium, TextField, FilterChip, Row, Spacer, IconButton } from '@bevarc/ui';
import { useFilterStore } from '../../stores/filterStore';

export const ClientFilters = React.memo(() => {
  const { clientFilters, setClientFilter } = useFilterStore();

  return (
    <View>
      <TextField
        label="Client Name"
        placeholder="Search by name..."
        value={clientFilters.search || ''}
        onChangeText={(text) => setClientFilter('search', text)}
        left={<IconButton icon="magnify" />}
      />

      <Spacer size="xxxl" />

      <TitleMedium style={{ marginBottom: 12 }}>Status</TitleMedium>
      <Row gap={8}>
        <FilterChip
          selected={clientFilters.status === 'all'}
          onPress={() => setClientFilter('status', 'all')}
          label="All"
        />
        <FilterChip
          selected={clientFilters.status === 'active'}
          onPress={() => setClientFilter('status', 'active')}
          label="Active"
        />
        <FilterChip
          selected={clientFilters.status === 'inactive'}
          onPress={() => setClientFilter('status', 'inactive')}
          label="Inactive"
        />
      </Row>

      <Spacer size="xl" />
    </View>
  );
});

ClientFilters.displayName = 'ClientFilters';
