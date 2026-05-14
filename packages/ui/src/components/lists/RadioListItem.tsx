/**
 * RadioListItem Component
 * List item with radio button for single selection
 */

import React from 'react';
import { List, RadioButton } from 'react-native-paper';

export interface RadioListItemProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text
   */
  subtitle?: string;

  /**
   * Value of this radio option
   */
  value: string;

  /**
   * Currently selected value
   */
  selectedValue: string;

  /**
   * Change handler
   */
  onValueChange: (value: string) => void;

  /**
   * Left icon name
   */
  leftIcon?: string;

  /**
   * Whether item is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Radio button position
   * @default 'trailing'
   */
  radioPosition?: 'leading' | 'trailing';
}

/**
 * RadioListItem
 *
 * List item with radio button for single selection scenarios.
 * Supports leading or trailing radio button position.
 *
 * @example
 * // Basic radio list item group
 * <View>
 *   <RadioListItem
 *     title="Option 1"
 *     value="option1"
 *     selectedValue={selected}
 *     onValueChange={setSelected}
 *   />
 *   <RadioListItem
 *     title="Option 2"
 *     value="option2"
 *     selectedValue={selected}
 *     onValueChange={setSelected}
 *   />
 * </View>
 *
 * @example
 * // With subtitles and icons
 * <RadioListItem
 *   title="Standard Delivery"
 *   subtitle="3-5 business days"
 *   leftIcon="truck"
 *   value="standard"
 *   selectedValue={deliveryMethod}
 *   onValueChange={setDeliveryMethod}
 * />
 *
 * @example
 * // With leading radio button
 * <RadioListItem
 *   title="Accept"
 *   value="accept"
 *   selectedValue={choice}
 *   onValueChange={setChoice}
 *   radioPosition="leading"
 * />
 */
export const RadioListItem: React.FC<RadioListItemProps> = ({
  title,
  subtitle,
  value,
  selectedValue,
  onValueChange,
  leftIcon,
  disabled = false,
  radioPosition = 'trailing',
}) => {
  const isChecked = value === selectedValue;

  const handlePress = () => {
    if (!disabled) {
      onValueChange(value);
    }
  };

  const renderRadio = () => (
    <RadioButton.Android
      value={value}
      status={isChecked ? 'checked' : 'unchecked'}
      onPress={handlePress}
      disabled={disabled}
    />
  );

  return (
    <List.Item
      title={title}
      description={subtitle}
      left={
        radioPosition === 'leading'
          ? () => renderRadio()
          : leftIcon
          ? (props) => <List.Icon {...props} icon={leftIcon} />
          : undefined
      }
      right={radioPosition === 'trailing' ? () => renderRadio() : undefined}
      onPress={handlePress}
      disabled={disabled}
    />
  );
};
