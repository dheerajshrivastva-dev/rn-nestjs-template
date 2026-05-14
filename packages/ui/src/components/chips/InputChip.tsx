/**
 * InputChip Component
 * Chip for tags and removable selections
 */

import React from 'react';
import { Chip as PaperChip } from 'react-native-paper';
import { ViewStyle } from 'react-native';

export interface InputChipProps {
  /**
   * Chip label text
   */
  label: string;

  /**
   * Close/remove handler
   */
  onClose?: () => void;

  /**
   * Press handler
   */
  onPress?: () => void;

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
 * InputChip
 *
 * Chip component for removable tags and selections.
 * Displays close button when onClose is provided.
 *
 * @example
 * // Basic input chip with remove
 * <InputChip
 *   label="React Native"
 *   onClose={() => removeTag('react-native')}
 * />
 *
 * @example
 * // Multiple input chips
 * <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
 *   {tags.map(tag => (
 *     <InputChip
 *       key={tag}
 *       label={tag}
 *       onClose={() => removeTag(tag)}
 *     />
 *   ))}
 * </View>
 *
 * @example
 * // With icon and press handler
 * <InputChip
 *   label="Location"
 *   icon="map-marker"
 *   onPress={editLocation}
 *   onClose={removeLocation}
 * />
 */
export const InputChip: React.FC<InputChipProps> = ({
  label,
  onClose,
  onPress,
  icon,
  disabled = false,
  style,
}) => {
  return (
    <PaperChip
      onPress={onPress}
      onClose={onClose}
      icon={icon}
      disabled={disabled}
      mode="outlined"
      style={style}
    >
      {label}
    </PaperChip>
  );
};
