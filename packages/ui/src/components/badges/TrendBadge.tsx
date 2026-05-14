/**
 * TrendBadge Component
 * Badge showing trend direction with changeVal
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LabelSmall } from '../typography/LabelSmall';
import { useTheme } from '../../hooks/useTheme';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface TrendBadgeProps {
  /**
   * Trend changeVal value
   */
  changeVal: number;

  /**
   * Trend direction
   */
  direction: TrendDirection;

  /**
   * Whether to show arrow icon
   * @default true
   */
  showArrow?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * TrendBadge
 *
 * Badge component showing trend direction with changeVal.
 * Uses semantic colors (green for up, red for down, gray for neutral).
 *
 * @example
 * // Upward trend
 * <TrendBadge
 *   changeVal={12.5}
 *   direction="up"
 * />
 *
 * @example
 * // Downward trend
 * <TrendBadge
 *   changeVal={8.3}
 *   direction="down"
 * />
 *
 * @example
 * // Neutral trend
 * <TrendBadge
 *   changeVal={0}
 *   direction="neutral"
 *   showArrow={false}
 * />
 */
export const TrendBadge: React.FC<TrendBadgeProps> = ({
  changeVal,
  direction,
  showArrow = true,
  style,
}) => {
  const theme = useTheme();

  const getTrendColor = () => {
    switch (direction) {
      case 'up':
        return theme.semanticColors.success.main;
      case 'down':
        return theme.semanticColors.error.main;
      case 'neutral':
        return theme.colors.onSurfaceVariant;
    }
  };

  const getTrendBackgroundColor = () => {
    switch (direction) {
      case 'up':
        return theme.semanticColors.success.container;
      case 'down':
        return theme.semanticColors.error.container;
      case 'neutral':
        return theme.colors.surfaceContainerHighest;
    }
  };

  const getArrowSymbol = () => {
    switch (direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      case 'neutral':
        return '→';
    }
  };

  const color = getTrendColor();
  const backgroundColor = getTrendBackgroundColor();
  const arrow = showArrow ? getArrowSymbol() : '';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}
    >
      <LabelSmall style={{ color }}>
        {arrow} {changeVal}
      </LabelSmall>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
});
