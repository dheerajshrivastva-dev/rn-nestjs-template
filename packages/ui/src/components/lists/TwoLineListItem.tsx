/**
 * TwoLineListItem Component
 * List item with title and subtitle (64dp height)
 */

import React from 'react';
import { List } from 'react-native-paper';
import { ListItemProps as PaperListItemProps } from 'react-native-paper/lib/typescript/components/List/ListItem';

export interface TwoLineListItemProps extends Omit<PaperListItemProps, 'description'> {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text
   */
  subtitle?: string;

  /**
   * Left icon name (MaterialCommunityIcons)
   */
  leftIcon?: string;

  /**
   * Right icon name (MaterialCommunityIcons)
   */
  rightIcon?: string;

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
 * TwoLineListItem
 *
 * Material Design 3 list item with title and subtitle (64dp height).
 * Supports left and right icons.
 *
 * @example
 * // Basic two-line list item
 * <TwoLineListItem
 *   title="John Doe"
 *   subtitle="john.doe@example.com"
 *   leftIcon="account"
 *   onPress={() => console.log('Pressed')}
 * />
 *
 * @example
 * // With right icon
 * <TwoLineListItem
 *   title="Settings"
 *   subtitle="Configure your preferences"
 *   leftIcon="cog"
 *   rightIcon="chevron-right"
 *   onPress={navigateToSettings}
 * />
 */
export const TwoLineListItem: React.FC<TwoLineListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  onLongPress,
  disabled = false,
  ...props
}) => {
  return (
    <List.Item
      title={title}
      description={subtitle}
      left={leftIcon ? (props) => <List.Icon {...props} icon={leftIcon} /> : undefined}
      right={rightIcon ? (props) => <List.Icon {...props} icon={rightIcon} /> : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      {...props}
    />
  );
};
