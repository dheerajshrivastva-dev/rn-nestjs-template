/**
 * FilledCard Component
 * Card with filled background (MD3 Filled Card)
 */

import React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface FilledCardProps {
  /**
   * Child components to render inside card
   */
  children: React.ReactNode;

  /**
   * Card press handler
   */
  onPress?: () => void;

  /**
   * Card long press handler
   */
  onLongPress?: () => void;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Custom border radius (default 12dp)
   */
  borderRadius?: number;

  /**
   * Custom background color (overrides tertiaryContainer)
   */
  backgroundColor?: string;

  /**
   * Whether card is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * FilledCard
 *
 * Material Design 3 Filled Card component with colored background.
 * Uses tertiaryContainer color by default for content cards.
 *
 * @example
 * // Basic filled card
 * <FilledCard>
 *   <Card.Title title="Card Title" />
 *   <Card.Content>
 *     <Text>Card content here</Text>
 *   </Card.Content>
 * </FilledCard>
 *
 * @example
 * // Interactive card with custom background
 * <FilledCard
 *   backgroundColor="#E3F2FD"
 *   onPress={() => console.log('Pressed')}
 * >
 *   <Card.Content>
 *     <TitleMedium>Notification</TitleMedium>
 *     <BodyMedium>You have new messages</BodyMedium>
 *   </Card.Content>
 * </FilledCard>
 */
export const FilledCard: React.FC<FilledCardProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  borderRadius,
  backgroundColor,
  disabled = false,
}) => {
  const theme = useTheme();

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius ?? 12,
    backgroundColor: backgroundColor ?? theme.colors.tertiaryContainer,
    ...style,
  };

  return (
    <PaperCard
      mode="contained"
      onPress={onPress}
      onLongPress={onLongPress}
      style={cardStyle}
      disabled={disabled}
    >
      {children}
    </PaperCard>
  );
};
