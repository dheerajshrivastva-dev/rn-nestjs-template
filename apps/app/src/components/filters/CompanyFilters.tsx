/**
 * Company-specific filters
 * Used in FilterBottomSheet for companies
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  TitleMedium,
  TextField,
  FilterChip,
  Dropdown,
  Row,
  Spacer,
} from '@forge/ui';
import { useFilterStore } from '../../stores/filterStore';

export const CompanyFilters = React.memo(() => {
  const { companyFilters, setCompanyFilter } = useFilterStore();

  return (
    <View>
      {/* Search */}
      <TextField
        label="Company Name"
        placeholder="Search by name..."
        value={companyFilters.search || ''}
        onChangeText={(text) => setCompanyFilter('search', text)}
      />

      <Spacer size="xxxl" />

      {/* Status Filter */}
      <TitleMedium style={{ marginBottom: 12 }}>Status</TitleMedium>
      <Row gap={8}>
        <FilterChip
          selected={companyFilters.status === 'all'}
          onPress={() => setCompanyFilter('status', 'all')}
          label="All"
        />
        <FilterChip
          selected={companyFilters.status === 'active'}
          onPress={() => setCompanyFilter('status', 'active')}
          label="Active"
        />
        <FilterChip
          selected={companyFilters.status === 'inactive'}
          onPress={() => setCompanyFilter('status', 'inactive')}
          label="Inactive"
        />
      </Row>

      <Spacer size="xxxl" />

      {/* User Count Range */}
      <TitleMedium style={{ marginBottom: 12 }}>User Count</TitleMedium>
      <Row gap={12}>
        <View style={styles.halfWidth}>
          <TextField
            label="Min Agents"
            placeholder="0"
            keyboardType="number-pad"
            value={companyFilters.minAgents?.toString() || ''}
            onChangeText={(text) => setCompanyFilter('minAgents', text ? parseInt(text) : undefined)}
          />
        </View>
        <View style={styles.halfWidth}>
          <TextField
            label="Max Agents"
            placeholder="Any"
            keyboardType="number-pad"
            value={companyFilters.maxAgents?.toString() || ''}
            onChangeText={(text) => setCompanyFilter('maxAgents', text ? parseInt(text) : undefined)}
          />
        </View>
      </Row>

      <Spacer size="xxxl" />

      {/* Client Count Range */}
      <TitleMedium style={{ marginBottom: 12 }}>Client Count</TitleMedium>
      <Row gap={12}>
        <View style={styles.halfWidth}>
          <TextField
            label="Min Clients"
            placeholder="0"
            keyboardType="number-pad"
            value={companyFilters.minClients?.toString() || ''}
            onChangeText={(text) => setCompanyFilter('minClients', text ? parseInt(text) : undefined)}
          />
        </View>
        <View style={styles.halfWidth}>
          <TextField
            label="Max Clients"
            placeholder="Any"
            keyboardType="number-pad"
            value={companyFilters.maxClients?.toString() || ''}
            onChangeText={(text) => setCompanyFilter('maxClients', text ? parseInt(text) : undefined)}
          />
        </View>
      </Row>

      <Spacer size="xxxl" />

      {/* Revenue Range */}
      <TitleMedium style={{ marginBottom: 12 }}>Monthly Revenue (₹)</TitleMedium>
      <Row gap={12}>
        <View style={styles.halfWidth}>
          <TextField
            label="Min Revenue"
            placeholder="0"
            keyboardType="number-pad"
            value={companyFilters.minRevenue?.toString() || ''}
            onChangeText={(text) => setCompanyFilter('minRevenue', text ? parseInt(text) : undefined)}
          />
        </View>
        <View style={styles.halfWidth}>
          <TextField
            label="Max Revenue"
            placeholder="Any"
            keyboardType="number-pad"
            value={companyFilters.maxRevenue?.toString() || ''}
            onChangeText={(text) => setCompanyFilter('maxRevenue', text ? parseInt(text) : undefined)}
          />
        </View>
      </Row>

      <Spacer size="xxxl" />

      {/* Sort By */}
      <TitleMedium style={{ marginBottom: 12 }}>Sort By</TitleMedium>
      <Row gap={12}>
        <View style={styles.halfWidth}>
          <Dropdown
            label="Sort By"
            value={companyFilters.sortBy || 'createdAt'}
            options={[
              { label: 'Company Name', value: 'name' },
              { label: 'Created Date', value: 'createdAt' },
              { label: 'Total Agents', value: 'totalAgents' },
              { label: 'Monthly Revenue', value: 'monthlyRevenue' },
            ]}
            onValueChange={(value) => setCompanyFilter('sortBy', value)}
            searchable={false}
          />
        </View>
        <View style={styles.halfWidth}>
          <Dropdown
            label="Order"
            value={companyFilters.sortOrder || 'desc'}
            options={[
              { label: 'Ascending', value: 'asc' },
              { label: 'Descending', value: 'desc' },
            ]}
            onValueChange={(value) => setCompanyFilter('sortOrder', value)}
            searchable={false}
          />
        </View>
      </Row>

      <Spacer size="xl" />
    </View>
  );
});

CompanyFilters.displayName = 'CompanyFilters';

const styles = StyleSheet.create({
  halfWidth: {
    flex: 1,
  },
});
