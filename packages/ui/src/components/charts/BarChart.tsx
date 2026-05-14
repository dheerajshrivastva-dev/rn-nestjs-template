/**
 * BarChart Component
 * Bar chart for comparisons
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';

export interface BarChartDataPoint {
  value: number;
  label?: string;
  frontColor?: string;
  topLabelComponent?: () => React.ReactElement;
}

export interface BarChartProps {
  /**
   * Chart data points
   */
  data: BarChartDataPoint[];

  /**
   * Chart width
   */
  width?: number;

  /**
   * Chart height
   * @default 200
   */
  height?: number;

  /**
   * Bar color (default color for all bars)
   */
  color?: string;

  /**
   * Bar width
   * @default 40
   */
  barWidth?: number;

  /**
   * Whether to show values on top of bars
   * @default true
   */
  showValuesOnTop?: boolean;

  /**
   * Whether to animate
   * @default true
   */
  animated?: boolean;

  /**
   * Y-axis label prefix (e.g., '$', '₹')
   */
  yAxisLabelPrefix?: string;

  /**
   * Y-axis label suffix (e.g., 'K', 'M')
   */
  yAxisLabelSuffix?: string;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * BarChart
 *
 * Bar chart component for displaying comparisons and distributions.
 * Built on react-native-gifted-charts.
 *
 * @example
 * // Basic monthly sales chart
 * <BarChart
 *   data={[
 *     { value: 50, label: 'Jan' },
 *     { value: 80, label: 'Feb' },
 *     { value: 60, label: 'Mar' },
 *     { value: 90, label: 'Apr' },
 *   ]}
 *   height={250}
 * />
 *
 * @example
 * // Multi-color bars with currency
 * <BarChart
 *   data={[
 *     { value: 25000, label: 'Q1', frontColor: '#4CAF50' },
 *     { value: 30000, label: 'Q2', frontColor: '#2196F3' },
 *     { value: 28000, label: 'Q3', frontColor: '#FF9800' },
 *     { value: 35000, label: 'Q4', frontColor: '#F44336' },
 *   ]}
 *   yAxisLabelPrefix="₹"
 *   showValuesOnTop
 * />
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  width,
  height = 200,
  color,
  barWidth = 40,
  showValuesOnTop = true,
  animated = true,
  yAxisLabelPrefix,
  yAxisLabelSuffix,
  style,
}) => {
  const theme = useTheme();

  const defaultBarColor = color || theme.colors.primary;

  // Apply default color to bars that don't have a custom color
  const chartData = data.map((item) => ({
    ...item,
    frontColor: item.frontColor || defaultBarColor,
  }));

  return (
    <View style={[styles.container, style]}>
      <GiftedBarChart
        data={chartData}
        width={width}
        height={height}
        barWidth={barWidth}
        noOfSections={5}
        barBorderRadius={4}
        hideRules={false}
        rulesColor={theme.colors.outlineVariant}
        rulesType="solid"
        xAxisColor={theme.colors.outline}
        yAxisColor={theme.colors.outline}
        yAxisTextStyle={{ color: theme.colors.onSurfaceVariant }}
        xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant }}
        isAnimated={animated}
        animationDuration={800}
        hideYAxisText={false}
        yAxisLabelPrefix={yAxisLabelPrefix}
        yAxisLabelSuffix={yAxisLabelSuffix}
        showValuesAsTopLabel={showValuesOnTop}
        topLabelTextStyle={{
          color: theme.colors.onSurface,
          fontSize: theme.fonts.bodySmall.fontSize, // Use MD3 bodySmall (12sp)
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
});
