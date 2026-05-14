/**
 * CheckboxListItem Component
 * List item with checkbox for multi-selection
 */

import React from 'react';
import { List, Checkbox } from 'react-native-paper';

export interface CheckboxListItemProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text
   */
  subtitle?: string;

  /**
   * Whether checkbox is checked
   */
  checked: boolean;

  /**
   * Change handler
   */
  onCheckedChange: (checked: boolean) => void;

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
   * Checkbox position
   * @default 'trailing'
   */
  checkboxPosition?: 'leading' | 'trailing';
}

/**
 * CheckboxListItem
 *
 * List item with checkbox for multi-selection scenarios.
 * Supports leading or trailing checkbox position.
 *
 * @example
 * // Basic checkbox list item
 * <CheckboxListItem
 *   title="Notifications"
 *   subtitle="Receive push notifications"
 *   checked={notificationsEnabled}
 *   onCheckedChange={setNotificationsEnabled}
 * />
 *
 * @example
 * // With leading checkbox
 * <CheckboxListItem
 *   title="Accept Terms"
 *   checked={termsAccepted}
 *   onCheckedChange={setTermsAccepted}
 *   checkboxPosition="leading"
 * />
 *
 * @example
 * // With icon and subtitle
 * <CheckboxListItem
 *   title="Dark Mode"
 *   subtitle="Enable dark theme"
 *   leftIcon="theme-light-dark"
 *   checked={darkMode}
 *   onCheckedChange={setDarkMode}
 * />
 */
export const CheckboxListItem: React.FC<CheckboxListItemProps> = ({
  title,
  subtitle,
  checked,
  onCheckedChange,
  leftIcon,
  disabled = false,
  checkboxPosition = 'trailing',
}) => {
  const handlePress = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const renderCheckbox = () => (
    <Checkbox.Android
      status={checked ? 'checked' : 'unchecked'}
      onPress={handlePress}
      disabled={disabled}
    />
  );

  return (
    <List.Item
      title={title}
      description={subtitle}
      left={
        checkboxPosition === 'leading'
          ? () => renderCheckbox()
          : leftIcon
          ? (props) => <List.Icon {...props} icon={leftIcon} />
          : undefined
      }
      right={checkboxPosition === 'trailing' ? () => renderCheckbox() : undefined}
      onPress={handlePress}
      disabled={disabled}
    />
  );
};
