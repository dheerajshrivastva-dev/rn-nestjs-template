/**
 * Global Filter Bottom Sheet (80% height)
 * Reusable filter modal for all entity types
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BottomSheet,
  BottomSheetScrollView,
  HeadlineSmall,
  FilledButton,
  OutlinedButton,
  Row,
  useTheme,
} from '@forge/ui';
import { useFilterStore } from '../../stores/filterStore';
import { CompanyFilters } from './CompanyFilters';
import { ClientFilters } from './ClientFilters';
import { OrderFilters } from './OrderFilters';
import { DeviceFilters } from './DeviceFilters';
// import { CompanyFilters } from './CompanyFilters';
// import { userFilters } from './userFilters';
// import { ClientFilters } from './ClientFilters';
// import { OrderFilters } from './OrderFilters';
// import { DeviceFilters } from './DeviceFilters';

export const FilterBottomSheet = React.memo(() => {
  const theme = useTheme();
  const { isOpen, filterType, closeFilter, applyFilters, clearFilters } = useFilterStore();

  const handleApply = React.useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  const handleClear = React.useCallback(() => {
    if (filterType) {
      clearFilters(filterType);
    }
  }, [filterType, clearFilters]);

  const getFilterTitle = React.useCallback(() => {
    switch (filterType) {
      case 'companies':
        return 'Filter Companies';
      case 'agents':
        return 'Filter Agents';
      case 'clients':
        return 'Filter Clients';
      case 'orders':
        return 'Filter Orders';
      case 'devices':
        return 'Filter Devices';
      default:
        return 'Filter';
    }
  }, [filterType]);

  const renderFilterContent = React.useCallback(() => {
    switch (filterType) {
      case 'companies':
        return <CompanyFilters />;
      case 'clients':
        return <ClientFilters />;
      case 'orders':
        return <OrderFilters />;
      case 'devices':
        return <DeviceFilters />;
      default:
        return null;
    }
  }, [filterType]);

  return (
    <BottomSheet
      visible={isOpen}
      onDismiss={closeFilter}
      snapPoints={['80%']}
      scrollable
      footer={
        <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
          <Row gap={12}>
            <OutlinedButton onPress={handleClear} style={styles.button}>
              Clear All
            </OutlinedButton>
            <FilledButton onPress={handleApply} style={styles.button}>
              Apply Filters
            </FilledButton>
          </Row>
        </View>
      }
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
        <HeadlineSmall>{getFilterTitle()}</HeadlineSmall>
      </View>

      {/* Filter Content */}
      <View style={styles.contentContainer}>
        {renderFilterContent()}
      </View>

      {/* Actions */}
      
    </BottomSheet>
  );
});

FilterBottomSheet.displayName = 'FilterBottomSheet';

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  contentContainer: {
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
  },
});
