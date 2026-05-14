/**
 * SearchBar Component
 * Material Design 3 Docked SearchBar (56dp height)
 */

import React, { useState } from 'react';
import { Searchbar as PaperSearchbar } from 'react-native-paper';
import { SearchbarProps as PaperSearchbarProps } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';
import { ViewStyle } from 'react-native';

export interface SearchBarProps extends Omit<PaperSearchbarProps, 'theme'> {
  /**
   * Current search query
   */
  value: string;

  /**
   * Search query change handler
   */
  onChangeText: (query: string) => void;

  /**
   * Search submit handler (when user presses search/enter)
   */
  onSubmit?: (query: string) => void;

  /**
   * Placeholder text
   * @default 'Search...'
   */
  placeholder?: string;

  /**
   * Whether to show loading indicator
   * @default false
   */
  loading?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Whether search bar is elevated
   * @default true
   */
  elevated?: boolean;
}

/**
 * SearchBar
 *
 * Material Design 3 Docked SearchBar component (56dp height).
 * Includes search icon, clear button, and optional loading state.
 *
 * @example
 * // Basic search bar
 * <SearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   placeholder="Search clients..."
 * />
 *
 * @example
 * // Search bar with submit handler
 * <SearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   onSubmit={handleSearch}
 *   loading={isSearching}
 * />
 *
 * @example
 * // Flat search bar (no elevation)
 * <SearchBar
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 *   elevated={false}
 * />
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search...',
  loading = false,
  style,
  elevated = true,
  ...props
}) => {
  const theme = useTheme();

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(value);
    }
  };

  const searchBarStyle: ViewStyle = {
    height: 56,
    borderRadius: 12,
    backgroundColor: elevated ? theme.colors.surfaceContainerHigh : theme.colors.surfaceContainerLow,
    ...(elevated && theme.elevation.level2.shadow),
    ...style,
  };

  return (
    <PaperSearchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={handleSubmit}
      loading={loading}
      style={searchBarStyle}
      inputStyle={{ minHeight: 56 }}
      elevation={elevated ? 2 : 0}
      {...props}
    />
  );
};
