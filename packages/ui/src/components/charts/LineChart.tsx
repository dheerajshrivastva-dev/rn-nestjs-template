/**
 * LineChart Component
 * Line chart for trends and time series
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../hooks/useTheme';

export interface LineChartDataPoint {
  value: number;
  label?: string;
  labelComponent?: () => React.ReactElement;
  dataPointText?: string;
}

export interface LineChartProps {
  /**
   * Chart data points
   */
  data: LineChartDataPoint[];

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
   * Line color
   */
  color?: string;

  /**
   * Whether to show data points
   * @default true
   */
  showDataPoints?: boolean;

  /**
   * Whether to show values on data points
   * @default false
   */
  showValuesOnDataPoints?: boolean;

  /**
   * Whether to fill area under line
   * @default false
   */
  areaChart?: boolean;

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
 * LineChart
 *
 * Line chart component for displaying trends and time series data.
 * Built on react-native-gifted-charts.
 *
 * @example
 * // Basic revenue trend chart
 * <LineChart
 *   data={[
 *     { value: 10000, label: 'Jan' },
 *     { value: 15000, label: 'Feb' },
 *     { value: 12000, label: 'Mar' },
 *     { value: 18000, label: 'Apr' },
 *   ]}
 *   height={250}
 * />
 *
 * @example
 * // Area chart with currency
 * <LineChart
 *   data={revenueData}
 *   areaChart
 *   showValuesOnDataPoints
 *   yAxisLabelPrefix="₹"
 *   color="#4CAF50"
 * />
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  width,
  height = 200,
  color,
  showDataPoints = true,
  showValuesOnDataPoints = false,
  areaChart = false,
  animated = true,
  yAxisLabelPrefix,
  yAxisLabelSuffix,
  style,
}) => {
  const theme = useTheme();

  const lineColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      <GiftedLineChart
        data={data}
        width={width}
        height={height}
        color={lineColor}
        hideDataPoints={!showDataPoints}
        textColor1={theme.colors.onSurface}
        textShiftY={-8}
        textShiftX={-5}
        textFontSize={12}
        hideRules={false}
        rulesColor={theme.colors.outlineVariant}
        rulesType="solid"
        xAxisColor={theme.colors.outline}
        yAxisColor={theme.colors.outline}
        yAxisTextStyle={{ color: theme.colors.onSurfaceVariant }}
        xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant }}
        areaChart={areaChart}
        startFillColor={areaChart ? lineColor : undefined}
        endFillColor={areaChart ? theme.colors.surface : undefined}
        startOpacity={areaChart ? 0.8 : undefined}
        endOpacity={areaChart ? 0.3 : undefined}
        isAnimated={animated}
        animationDuration={1000}
        hideYAxisText={false}
        yAxisLabelPrefix={yAxisLabelPrefix}
        yAxisLabelSuffix={yAxisLabelSuffix}
        curved={true}
        dataPointsHeight={6}
        dataPointsWidth={6}
        dataPointsColor={lineColor}
        textColor={theme.colors.onSurface}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
});
