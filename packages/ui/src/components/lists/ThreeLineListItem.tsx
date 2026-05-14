/**
 * ThreeLineListItem Component
 * List item with title, subtitle, and supporting text (72dp height)
 */

import React from 'react';
import { List, ListItemProps } from 'react-native-paper';

export interface ThreeLineListItemProps extends Omit<ListItemProps, 'description' | 'left' | 'right'> {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text
   */
  subtitle?: string;

  /**
   * Supporting text (third line)
   */
  supportingText?: string;

  /**
   * Left icon name (MaterialCommunityIcons)
   * @deprecated Use `leading` prop for custom components
   */
  leftIcon?: string;

  /**
   * Right icon name (MaterialCommunityIcons)
   * @deprecated Use `trailing` prop for custom components
   */
  rightIcon?: string;

  /**
   * Custom leading component (replaces leftIcon)
   */
  leading?: React.ReactNode;

  /**
   * Custom trailing component (replaces rightIcon)
   */
  trailing?: React.ReactNode;

  /**
   * Press handler
   */
  onPress?: () => void;

  /**
   * Long press handler
   */
  onLongPress?: () => void;

  /**
   * Whether item is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * ThreeLineListItem
 *
 * Material Design 3 list item with title, subtitle, and supporting text (72dp height).
 * Supports left and right icons.
 *
 * @example
 * // Basic three-line list item
 * <ThreeLineListItem
 *   title="Transaction #12345"
 *   subtitle="Payment received"
 *   supportingText="2 hours ago"
 *   leftIcon="cash"
 *   onPress={() => viewTransaction('12345')}
 * />
 *
 * @example
 * // With right icon
 * <ThreeLineListItem
 *   title="Important Message"
 *   subtitle="Your loan has been approved"
 *   supportingText="Click to view details"
 *   leftIcon="email"
 *   rightIcon="chevron-right"
 *   onPress={viewMessage}
 * />
 */
export const ThreeLineListItem: React.FC<ThreeLineListItemProps> = ({
  title,
  subtitle,
  supportingText,
  leftIcon,
  rightIcon,
  leading,
  trailing,
  onPress,
  onLongPress,
  disabled = false,
  ...props
}) => {
  const description = subtitle && supportingText
    ? `${subtitle}\n${supportingText}`
    : subtitle || supportingText;

  // Determine left component: custom leading > leftIcon > undefined
  const leftComponent = leading
    ? () => <>{leading}</>
    : !!leftIcon
    ? (iconProps: any) => <List.Icon {...iconProps} icon={leftIcon} />
    : undefined;

  // Determine right component: custom trailing > rightIcon > undefined
  const rightComponent = trailing
    ? () => <>{trailing}</>
    : !!rightIcon
    ? (iconProps: any) => <List.Icon {...iconProps} icon={rightIcon} />
    : undefined;

  return (
    <List.Item
      title={title}
      description={description}
      descriptionNumberOfLines={2}
      left={leftComponent}
      right={rightComponent}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={{
        paddingHorizontal: 0,
        paddingRight: 0, // Remove default right padding
      }}
      contentStyle={{
        paddingRight: 0, // Remove content right padding to push trailing closer to edge
      }}
      {...props}
    />
  );
};
