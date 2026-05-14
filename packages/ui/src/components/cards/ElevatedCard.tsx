/**
 * ElevatedCard Component
 * Card with elevation shadow (MD3 Elevated Card)
 */

import React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { Pressable, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface ElevatedCardProps {
  /**
   * Child components to render inside card
   */
  children: React.ReactNode;

  /**
   * Elevation level (0-5)
   * @default 1
   */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;

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
   * Whether card is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * ElevatedCard
 *
 * Material Design 3 Elevated Card component with shadow elevation.
 * Used for dashboard KPI cards, content cards with depth.
 *
 * @example
 * // Basic elevated card
 * <ElevatedCard>
 *   <Card.Title title="Card Title" />
 *   <Card.Content>
 *     <Text>Card content here</Text>
 *   </Card.Content>
 * </ElevatedCard>
 *
 * @example
 * // Interactive card with custom elevation
 * <ElevatedCard elevation={2} onPress={() => console.log('Pressed')}>
 *   <Card.Cover source={{ uri: 'https://example.com/image.jpg' }} />
 *   <Card.Content>
 *     <TitleMedium>Dashboard KPI</TitleMedium>
 *     <BodyMedium>Revenue: $10,000</BodyMedium>
 *   </Card.Content>
 * </ElevatedCard>
 */
export const ElevatedCard: React.FC<ElevatedCardProps> = ({
  children,
  elevation = 1,
  onPress,
  onLongPress,
  style,
  borderRadius,
  disabled = false,
}) => {
  const theme = useTheme();

  const elevationStyle = theme.elevation[`level${elevation}`];

  // Use surface containers for proper elevation tint in dark mode
  // MD3 spec: elevated surfaces should use surfaceContainer tokens
  const getSurfaceColor = () => {
    if (elevation === 0) return theme.colors.surface;
    if (elevation === 1) return theme.colors.surfaceContainerLow;
    if (elevation === 2) return theme.colors.surfaceContainer;
    if (elevation >= 3) return theme.colors.surfaceContainerHigh;
    return theme.colors.surfaceContainerLow; // default
  };

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius ?? 12,
    backgroundColor: getSurfaceColor(),
    elevation: elevationStyle.shadowElevation,
    ...elevationStyle.shadow,
    ...style,
  };

  const flexStyle = style?.flex !== undefined ? { flex: style.flex } : undefined;

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        style={({ pressed }) => [cardStyle, flexStyle, pressed && { opacity: 0.85 }]}
        disabled={disabled}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, flexStyle]}>{children}</View>;
};

// Re-export Card sub-components for convenience
export const { Title: CardTitle, Content: CardContent, Cover: CardCover, Actions: CardActions } = PaperCard;
