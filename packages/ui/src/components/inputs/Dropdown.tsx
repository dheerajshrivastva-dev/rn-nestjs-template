/**
 * Dropdown Component (2026 - Bottom Sheet)
 * Advanced select input with bottom sheet, search, and multi-select
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, ScrollView, Dimensions, Modal as RNModal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { List, Checkbox, RadioButton, Divider, Portal, Surface } from 'react-native-paper';
import { TextField } from './TextField';
import { BodyMedium } from '../typography/BodyMedium';
import { FilledButton } from '../buttons/FilledButton';
import { TextButton } from '../buttons/TextButton';
import { useTheme } from '../../hooks/useTheme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface DropdownOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  subtitle?: string;
  icon?: string;
  [key: string]: any; // Allow custom fields for renderOption
}

export interface DropdownProps<T = string> {
  /**
   * Label for the dropdown
   */
  label?: string;

  /**
   * Placeholder text
   * @default 'Select an option'
   */
  placeholder?: string;

  /**
   * Available options
   */
  options: DropdownOption<T>[];

  /**
   * Selected value (single select)
   */
  value?: T;

  /**
   * Selected values (multi select)
   */
  values?: T[];

  /**
   * Change handler (single select)
   */
  onValueChange?: (value: T) => void;

  /**
   * Change handler (multi select)
   */
  onValuesChange?: (values: T[]) => void;

  /**
   * Whether to enable multiple selection
   * @default false
   */
  multiple?: boolean;

  /**
   * Whether to enable search
   * Auto-enabled if options > 10 or onSearch is provided
   * @default auto (enabled if options.length > 10)
   */
  searchable?: boolean;

  /**
   * Custom search function for network/async search
   * If provided, local filtering is disabled
   */
  onSearch?: (query: string) => void;

  /**
   * Loading state for async search
   * @default false
   */
  searchLoading?: boolean;

  /**
   * Custom render function for options
   * Allows full control over option appearance
   */
  renderOption?: (option: DropdownOption<T>, selected: boolean) => React.ReactNode;

  /**
   * Error message
   */
  error?: string;

  /**
   * Whether dropdown is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether dropdown is required
   * @default false
   */
  required?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Text field variant
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined';

  /**
   * Continue button text (multi select only)
   * @default 'Continue'
   */
  continueText?: string;

  /**
   * Clear button text (multi select only)
   * @default 'Clear All'
   */
  clearText?: string;
}

/**
 * Dropdown
 *
 * Modern dropdown component with bottom sheet, search, and multi-select.
 *
 * Features:
 * - Bottom sheet modal for better UX
 * - Auto-search when options > 10 or network search
 * - Single or multiple selection
 * - Auto-close on select (single mode)
 * - Continue button (multi mode)
 * - Custom render function for options
 * - Network/async search support
 *
 * @example
 * // Basic single select dropdown
 * <Dropdown
 *   label="Country"
 *   options={[
 *     { label: 'India', value: 'in' },
 *     { label: 'USA', value: 'us' },
 *   ]}
 *   value={country}
 *   onValueChange={setCountry}
 * />
 *
 * @example
 * // Multi-select dropdown
 * <Dropdown
 *   label="Skills"
 *   options={skills}
 *   values={selectedSkills}
 *   onValuesChange={setSelectedSkills}
 *   multiple
 * />
 *
 * @example
 * // Network search dropdown
 * <Dropdown
 *   label="Search Users"
 *   options={searchResults}
 *   value={selectedUser}
 *   onValueChange={setSelectedUser}
 *   onSearch={handleUserSearch}
 *   searchLoading={isSearching}
 * />
 *
 * @example
 * // Custom render option
 * <Dropdown
 *   label="Team Member"
 *   options={users}
 *   value={selectedUser}
 *   onValueChange={setSelectedUser}
 *   renderOption={(option, selected) => (
 *     <UserListItem
 *       user={option}
 *       selected={selected}
 *     />
 *   )}
 * />
 */
export const Dropdown = <T extends string | number = string>({
  label,
  placeholder = 'Select an option',
  options,
  value,
  values,
  onValueChange,
  onValuesChange,
  multiple = false,
  searchable,
  onSearch,
  searchLoading = false,
  renderOption,
  error,
  disabled = false,
  required = false,
  style,
  variant = 'filled',
  continueText = 'Continue',
  clearText = 'Clear All',
}: DropdownProps<T>) => {
  const theme = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<T[]>([]);

  // Initialize selected values for multi-select
  useEffect(() => {
    if (multiple && values) {
      setSelectedValues(values);
    }
  }, [multiple, values]);

  // Auto-enable search if options > 10 or onSearch provided
  const shouldShowSearch = useMemo(() => {
    if (searchable !== undefined) return searchable;
    return options.length > 10 || !!onSearch;
  }, [searchable, options.length, onSearch]);

  // Display value calculation
  const displayValue = useMemo(() => {
    if (multiple && values && values.length > 0) {
      if (values.length === 1) {
        const selected = options.find((opt) => opt.value === values[0]);
        return selected?.label || '';
      }
      return `${values.length} selected`;
    }
    if (!multiple && value !== undefined) {
      const selected = options.find((opt) => opt.value === value);
      return selected?.label || '';
    }
    return '';
  }, [multiple, value, values, options]);

  const openSheet = useCallback(() => {
    if (!disabled) {
      setSheetVisible(true);
      setSearchQuery('');
      if (multiple && values) {
        setSelectedValues(values);
      }
    }
  }, [disabled, multiple, values]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setSearchQuery('');
  }, []);

  const handleSingleSelect = useCallback(
    (optionValue: T) => {
      onValueChange?.(optionValue);
      closeSheet(); // Auto-close for single select
    },
    [onValueChange, closeSheet]
  );

  const handleMultiToggle = useCallback((optionValue: T) => {
    setSelectedValues((prev) => {
      if (prev.includes(optionValue)) {
        return prev.filter((v) => v !== optionValue);
      }
      return [...prev, optionValue];
    });
  }, []);

  const handleMultiContinue = useCallback(() => {
    onValuesChange?.(selectedValues);
    closeSheet();
  }, [selectedValues, onValuesChange, closeSheet]);

  const handleClearAll = useCallback(() => {
    setSelectedValues([]);
  }, []);

  // Search handling
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (onSearch) {
        onSearch(query); // Trigger network search
      }
    },
    [onSearch]
  );

  // Filter options (local search only if no onSearch provided)
  const filteredOptions = useMemo(() => {
    if (onSearch) {
      // Network search - don't filter locally
      return options;
    }
    if (shouldShowSearch && searchQuery) {
      return options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return options;
  }, [options, searchQuery, shouldShowSearch, onSearch]);

  // Check if option is selected
  const isOptionSelected = useCallback(
    (optionValue: T) => {
      if (multiple) {
        return selectedValues.includes(optionValue);
      }
      return value === optionValue;
    },
    [multiple, value, selectedValues]
  );

  // Default option renderer
  const defaultRenderOption = useCallback(
    (option: DropdownOption<T>, selected: boolean) => {
      if (multiple) {
        return (
          <List.Item
            key={String(option.value)}
            title={option.label}
            description={option.subtitle}
            disabled={option.disabled}
            onPress={() => !option.disabled && handleMultiToggle(option.value)}
            left={
              option.icon
                ? (props) => <List.Icon {...props} icon={option.icon!} />
                : undefined
            }
            right={(props) => (
              <View pointerEvents="none">
                <Checkbox.Android
                  {...props}
                  status={selected ? 'checked' : 'unchecked'}
                  disabled={option.disabled}
                />
              </View>
            )}
            titleStyle={{
              color: option.disabled
                ? theme.colors.onSurfaceDisabled
                : theme.colors.onSurface,
            }}
          />
        );
      }

      return (
        <List.Item
          key={String(option.value)}
          title={option.label}
          description={option.subtitle}
          disabled={option.disabled}
          onPress={() => !option.disabled && handleSingleSelect(option.value)}
          left={
            option.icon
              ? (props) => <List.Icon {...props} icon={option.icon!} />
              : undefined
          }
          right={(props) => (
            <View pointerEvents="none">
              <RadioButton.Android
                {...props}
                value={String(option.value)}
                status={selected ? 'checked' : 'unchecked'}
                disabled={option.disabled}
              />
            </View>
          )}
          titleStyle={{
            color: selected
              ? theme.colors.primary
              : option.disabled
              ? theme.colors.onSurfaceDisabled
              : theme.colors.onSurface,
          }}
        />
      );
    },
    [multiple, theme, handleSingleSelect, handleMultiToggle]
  );

  return (
    <View style={[styles.container, style]}>
      {/* Trigger Input */}
      <TouchableOpacity onPress={openSheet} activeOpacity={0.7}>
        <View pointerEvents="none">
          <TextField
            label={label}
            placeholder={placeholder}
            value={displayValue}
            error={!!error}
            helperText={error}
            disabled={disabled}
            required={required}
            variant={variant}
            rightIcon="menu-down"
            editable={false}
          />
        </View>
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <RNModal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={multiple ? undefined : closeSheet}
      >
        <TouchableWithoutFeedback onPress={multiple ? undefined : closeSheet}>
          <View style={styles.backdrop}>
            <View style={styles.bottomSheetContainer}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <Surface style={styles.sheetSurface} elevation={5}>
                  {/* Drag Handle */}
                  <View style={styles.handleContainer}>
                    <View style={[styles.handle, { backgroundColor: theme.colors.onSurfaceVariant }]} />
                  </View>

                  {/* Header */}
                  <View style={styles.sheetHeader}>
                    <BodyMedium style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      {label || placeholder}
                    </BodyMedium>
                    {multiple && selectedValues.length > 0 && (
                      <TextButton onPress={handleClearAll}>{clearText}</TextButton>
                    )}
                  </View>

                  <Divider />

                  {/* Search */}
                  {shouldShowSearch && (
                    <View style={styles.searchContainer}>
                      <TextField
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        leftIcon="magnify"
                        variant="outlined"
                        autoFocus={false}
                      />
                    </View>
                  )}

                  {/* Options List */}
                  <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                    {filteredOptions.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <BodyMedium style={{ color: theme.colors.onSurfaceVariant }}>
                          {searchLoading ? 'Searching...' : 'No options found'}
                        </BodyMedium>
                      </View>
                    ) : (
                      filteredOptions.map((option) => {
                        const selected = isOptionSelected(option.value);
                        return renderOption
                          ? renderOption(option, selected)
                          : defaultRenderOption(option, selected);
                      })
                    )}
                  </ScrollView>

                  {/* Footer (Multi-select only) */}
                  {multiple && (
                    <>
                      <Divider />
                      <View style={styles.sheetFooter}>
                        <FilledButton
                          onPress={handleMultiContinue}
                          disabled={selectedValues.length === 0}
                          style={{ flex: 1 }}
                        >
                          {selectedValues.length > 0
                            ? `${continueText} (${selectedValues.length})`
                            : continueText}
                        </FilledButton>
                      </View>
                    </>
                  )}
                </Surface>
              </KeyboardAvoidingView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    justifyContent: 'flex-end',
  },
  sheetSurface: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.9,
    minHeight: 200,
    paddingBottom: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  optionsList: {
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    gap: 8,
  },
});
