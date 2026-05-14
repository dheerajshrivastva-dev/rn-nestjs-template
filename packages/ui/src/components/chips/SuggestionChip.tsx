/**
 * SuggestionChip Component
 * Chip for autocomplete suggestions
 */

import React from 'react';
import { Chip as PaperChip } from 'react-native-paper';
import { ViewStyle } from 'react-native';

export interface SuggestionChipProps {
  /**
   * Suggestion label text
   */
  label: string;

  /**
   * Press handler to select suggestion
   */
  onPress: () => void;

  /**
   * Icon name (MaterialCommunityIcons)
   */
  icon?: string;

  /**
   * Whether chip is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * SuggestionChip
 *
 * Chip component for displaying autocomplete suggestions.
 * Used in search interfaces and form inputs.
 *
 * @example
 * // Basic suggestion chip
 * <SuggestionChip
 *   label="Mumbai"
 *   onPress={() => selectCity('Mumbai')}
 * />
 *
 * @example
 * // Multiple suggestions
 * <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
 *   {suggestions.map(suggestion => (
 *     <SuggestionChip
 *       key={suggestion.id}
 *       label={suggestion.text}
 *       icon={suggestion.icon}
 *       onPress={() => selectSuggestion(suggestion)}
 *     />
 *   ))}
 * </View>
 *
 * @example
 * // With icon
 * <SuggestionChip
 *   label="Recent: John Doe"
 *   icon="history"
 *   onPress={() => fillName('John Doe')}
 * />
 */
export const SuggestionChip: React.FC<SuggestionChipProps> = ({
  label,
  onPress,
  icon,
  disabled = false,
  style,
}) => {
  return (
    <PaperChip
      onPress={onPress}
      icon={icon}
      disabled={disabled}
      mode="outlined"
      style={style}
    >
      {label}
    </PaperChip>
  );
};
