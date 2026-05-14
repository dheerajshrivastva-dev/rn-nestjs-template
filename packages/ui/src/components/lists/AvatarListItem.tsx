/**
 * AvatarListItem Component
 * List item with leading avatar (40x40)
 */

import React from 'react';
import { List, Avatar } from 'react-native-paper';
import { ImageSourcePropType } from 'react-native';

export interface AvatarListItemProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text
   */
  subtitle?: string;

  /**
   * Avatar image source
   */
  avatarSource?: ImageSourcePropType;

  /**
   * Avatar icon name (if no image)
   */
  avatarIcon?: string;

  /**
   * Avatar text (initials)
   */
  avatarText?: string;

  /**
   * Avatar size
   * @default 40
   */
  avatarSize?: number;

  /**
   * Right icon name
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
 * AvatarListItem
 *
 * List item with avatar image, icon, or text on the left.
 * Useful for contact lists, user profiles, etc.
 *
 * @example
 * // With avatar image
 * <AvatarListItem
 *   title="John Doe"
 *   subtitle="Online"
 *   avatarSource={{ uri: 'https://example.com/avatar.jpg' }}
 *   onPress={() => viewProfile('john')}
 * />
 *
 * @example
 * // With avatar icon
 * <AvatarListItem
 *   title="Support Team"
 *   subtitle="Available 24/7"
 *   avatarIcon="headset"
 *   rightIcon="chevron-right"
 *   onPress={contactSupport}
 * />
 *
 * @example
 * // With initials
 * <AvatarListItem
 *   title="Jane Smith"
 *   subtitle="Last seen 2 hours ago"
 *   avatarText="JS"
 *   onPress={() => viewProfile('jane')}
 * />
 */
export const AvatarListItem: React.FC<AvatarListItemProps> = ({
  title,
  subtitle,
  avatarSource,
  avatarIcon,
  avatarText,
  avatarSize = 40,
  rightIcon,
  onPress,
  onLongPress,
  disabled = false,
}) => {
  const renderAvatar = () => {
    if (avatarSource) {
      return <Avatar.Image size={avatarSize} source={avatarSource} />;
    } else if (avatarIcon) {
      return <Avatar.Icon size={avatarSize} icon={avatarIcon} />;
    } else if (avatarText) {
      return <Avatar.Text size={avatarSize} label={avatarText} />;
    }
    return <Avatar.Icon size={avatarSize} icon="account" />;
  };

  return (
    <List.Item
      title={title}
      description={subtitle}
      left={() => renderAvatar()}
      right={rightIcon ? (props) => <List.Icon {...props} icon={rightIcon} /> : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
    />
  );
};
