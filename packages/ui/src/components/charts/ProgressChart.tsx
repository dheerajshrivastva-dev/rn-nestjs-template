/**
 * ProgressChart Component
 * Circular progress chart with percentage
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { DisplaySmall } from '../typography/DisplaySmall';
import { LabelMedium } from '../typography/LabelMedium';
import { useTheme } from '../../hooks/useTheme';

export interface ProgressChartProps {
  /**
   * Progress value (0 to 100)
   */
  value: number;

  /**
   * Chart size
   * @default 120
   */
  size?: number;

  /**
   * Progress color
   */
  color?: string;

  /**
   * Background color
   */
  backgroundColor?: string;

  /**
   * Label text
   */
  label?: string;

  /**
   * Whether to show percentage text
   * @default true
   */
  showPercentage?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * ProgressChart
 *
 * Circular progress chart component showing percentage completion.
 * Displays progress with central percentage text.
 *
 * @example
 * // Basic progress chart
 * <ProgressChart
 *   value={75}
 *   label="Completed"
 * />
 *
 * @example
 * // Large chart with custom colors
 * <ProgressChart
 *   value={45}
 *   size={160}
 *   color="#4CAF50"
 *   backgroundColor="#E8F5E9"
 *   label="EMI Paid"
 * />
 *
 * @example
 * // Without percentage text
 * <ProgressChart
 *   value={90}
 *   showPercentage={false}
 *   label="Progress"
 * />
 */
export const ProgressChart: React.FC<ProgressChartProps> = ({
  value,
  size = 120,
  color,
  backgroundColor,
  label,
  showPercentage = true,
  style,
}) => {
  const theme = useTheme();

  const progressColor = color || theme.colors.primary;
  const bgColor = backgroundColor || theme.colors.surfaceContainerHighest;

  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  const data = [
    { value: clampedValue, color: progressColor },
    { value: 100 - clampedValue, color: bgColor },
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.chartContainer}>
        <PieChart
          data={data}
          donut
          radius={size / 2}
          innerRadius={(size / 2) * 0.7}
          strokeWidth={1}
          strokeColor={theme.colors.surface}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              {showPercentage && (
                <DisplaySmall style={{ fontSize: size * 0.25 }}>
                  {Math.round(clampedValue)}%
                </DisplaySmall>
              )}
            </View>
          )}
        />
      </View>
      {label && (
        <LabelMedium
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          {label}
        </LabelMedium>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
