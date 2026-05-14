/**
 * OutlinedCard Component
 * Card with outline border (MD3 Outlined Card)
 */

import React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface OutlinedCardProps {
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
   * Border width (default 1dp)
   */
  borderWidth?: number;

  /**
   * Custom border color (overrides theme outline)
   */
  borderColor?: string;

  /**
   * Whether card is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * OutlinedCard
 *
 * Material Design 3 Outlined Card component with border outline.
 * Uses theme outline color by default for subtle bordered cards.
 *
 * @example
 * // Basic outlined card
 * <OutlinedCard>
 *   <Card.Title title="Card Title" />
 *   <Card.Content>
 *     <Text>Card content here</Text>
 *   </Card.Content>
 * </OutlinedCard>
 *
 * @example
 * // Interactive card with custom border
 * <OutlinedCard
 *   borderWidth={2}
 *   borderColor="#1976D2"
 *   onPress={() => console.log('Pressed')}
 * >
 *   <Card.Content>
 *     <TitleMedium>Selected Item</TitleMedium>
 *     <BodyMedium>This card is selected</BodyMedium>
 *   </Card.Content>
 * </OutlinedCard>
 */
export const OutlinedCard: React.FC<OutlinedCardProps> = ({
  children,
  onPress,
  onLongPress,
  style,
  borderRadius,
  borderWidth = 1,
  borderColor,
  disabled = false,
}) => {
  const theme = useTheme();

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius ?? 12,
    borderWidth: borderWidth,
    borderColor: borderColor ?? theme.colors.outline,
    // Use surfaceContainerLowest for better visibility in dark mode
    backgroundColor: theme.colors.surfaceContainerLowest,
    ...style,
  };

  return (
    <PaperCard
      mode="outlined"
      onPress={onPress}
      onLongPress={onLongPress}
      style={cardStyle}
      disabled={disabled}
    >
      {children}
    </PaperCard>
  );
};
