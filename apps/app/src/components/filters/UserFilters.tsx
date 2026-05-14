/**
 * User-specific filters
 * Used in FilterBottomSheet for agents
 */

import React from 'react';
import { View } from 'react-native';
import { TitleMedium, TextField, FilterChip, Row, Spacer, IconButton } from '@forge/ui';
import { useFilterStore } from '../../stores/filterStore';
import { UserRole, UserStatus } from '../../api/types';

export const userFilters = React.memo(() => {
  const { userFilters: userFiltersData, setUserFilter } = useFilterStore();

  return (
    <View>
      <TextField
        label="User Name"
        placeholder="Search by name..."
        value={userFiltersData.search || ''}
        onChangeText={(text) => setUserFilter('search', text)}
        left={<IconButton icon="magnify" />}
      />

      <Spacer size="xxxl" />

      <TitleMedium style={{ marginBottom: 12 }}>Status</TitleMedium>
      <Row gap={8}>
        <FilterChip
          selected={userFiltersData.status === undefined}
          onPress={() => setUserFilter('status', undefined)}
          label="All"
        />
        <FilterChip
          selected={userFiltersData.status === UserStatus.ACTIVE}
          onPress={() => setUserFilter('status', 'active')}
          label="Active"
        />
        <FilterChip
          selected={userFiltersData.status === UserStatus.INACTIVE}
          onPress={() => setUserFilter('status', 'inactive')}
          label="Inactive"
        />
      </Row>

      <Spacer size="xxxl" />

      <TitleMedium style={{ marginBottom: 12 }}>Role</TitleMedium>
      <Row gap={8}>
        <FilterChip
          selected={userFiltersData.role === undefined}
          onPress={() => setUserFilter('role', undefined)}
          label="All"
        />
        <FilterChip
          selected={userFiltersData.role === UserRole.SUPER}
          onPress={() => setUserFilter('role', 'ADMIN')}
          label="Admin"
        />
        <FilterChip
          selected={userFiltersData.role === UserRole.RETAILER}
          onPress={() => setUserFilter('role', 'AGENT')}
          label="User"
        />
      </Row>

      <Spacer size="xl" />
    </View>
  );
});

userFilters.displayName = 'userFilters';
