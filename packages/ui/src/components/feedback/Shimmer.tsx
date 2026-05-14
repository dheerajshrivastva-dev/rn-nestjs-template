/**
 * Shimmer Components
 * Micro-level shimmer effects for different content types
 *
 * Features:
 * - Animated shimmer effect with Material Design 3 colors
 * - Multiple shimmer types for different content (cards, lists, charts, text)
 * - Customizable dimensions
 * - Theme-aware styling
 *
 * Usage:
 * ```tsx
 * // While loading data
 * {isLoading ? <CardShimmer /> : <YourCard data={data} />}
 * ```
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, ViewStyle} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ShimmerProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base Shimmer Component
 * Renders a single animated shimmer block
 */
export const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Card Shimmer
 * Shimmer effect for card components
 */
export const CardShimmer: React.FC<{count?: number}> = ({count = 1}) => {
  const theme = useTheme();

  return (
    <>
      {Array.from({length: count}).map((_, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              marginBottom: theme.spacing.md,
            },
          ]}>
          <Shimmer height={120} borderRadius={8} style={{marginBottom: 12}} />
          <Shimmer width="70%" height={16} style={{marginBottom: 8}} />
          <Shimmer width="50%" height={14} />
        </View>
      ))}
    </>
  );
};

/**
 * List Item Shimmer
 * Shimmer effect for list items
 */
export const ListItemShimmer: React.FC<{count?: number}> = ({count = 3}) => {
  const theme = useTheme();

  return (
    <>
      {Array.from({length: count}).map((_, index) => (
        <View
          key={index}
          style={[
            styles.listItem,
            {
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.surfaceVariant,
            },
          ]}>
          <View style={styles.listItemLeft}>
            <Shimmer width={48} height={48} borderRadius={24} />
          </View>
          <View style={styles.listItemContent}>
            <Shimmer width="80%" height={16} style={{marginBottom: 8}} />
            <Shimmer width="60%" height={14} />
          </View>
          <Shimmer width={24} height={24} borderRadius={12} />
        </View>
      ))}
    </>
  );
};

/**
 * Chart Shimmer
 * Shimmer effect for chart/graph components
 */
export const ChartShimmer: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.chart, {backgroundColor: theme.colors.surface}]}>
      <Shimmer width="50%" height={20} style={{marginBottom: 16}} />
      <View style={styles.chartBars}>
        {[60, 80, 70, 90, 65, 85, 75].map((height, index) => (
          <Shimmer
            key={index}
            width={32}
            height={height}
            borderRadius={4}
          />
        ))}
      </View>
      <View style={styles.chartLegend}>
        <Shimmer width={80} height={12} />
        <Shimmer width={80} height={12} />
      </View>
    </View>
  );
};

/**
 * Text Block Shimmer
 * Shimmer effect for text content
 */
export const TextShimmer: React.FC<{lines?: number}> = ({lines = 3}) => {
  return (
    <View>
      {Array.from({length: lines}).map((_, index) => (
        <Shimmer
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={14}
          style={{marginBottom: 8}}
        />
      ))}
    </View>
  );
};

/**
 * Stats Card Shimmer
 * Shimmer for KPI/stats cards
 */
export const StatsCardShimmer: React.FC<{count?: number}> = ({count = 4}) => {
  const theme = useTheme();

  return (
    <View style={styles.statsGrid}>
      {Array.from({length: count}).map((_, index) => (
        <View
          key={index}
          style={[
            styles.statsCard,
            {
              backgroundColor: theme.colors.surface,
              padding: theme.spacing.md,
            },
          ]}>
          <Shimmer width={40} height={40} borderRadius={20} style={{marginBottom: 12}} />
          <Shimmer width="60%" height={24} style={{marginBottom: 8}} />
          <Shimmer width="80%" height={14} />
        </View>
      ))}
    </View>
  );
};

/**
 * Table Row Shimmer
 * Shimmer for table rows
 */
export const TableRowShimmer: React.FC<{rows?: number; columns?: number}> = ({
  rows = 5,
  columns = 4,
}) => {
  const theme = useTheme();

  return (
    <>
      {Array.from({length: rows}).map((_, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.tableRow,
            {
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.surfaceVariant,
              paddingVertical: theme.spacing.sm,
            },
          ]}>
          {Array.from({length: columns}).map((_, colIndex) => (
            <View key={colIndex} style={styles.tableCell}>
              <Shimmer width="90%" height={14} />
            </View>
          ))}
        </View>
      ))}
    </>
  );
};

/**
 * Profile Header Shimmer
 * Shimmer for profile/user header sections
 */
export const ProfileHeaderShimmer: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.profileHeader, {padding: theme.spacing.lg}]}>
      <Shimmer width={80} height={80} borderRadius={40} style={{marginBottom: 16}} />
      <Shimmer width="60%" height={20} style={{marginBottom: 8}} />
      <Shimmer width="40%" height={14} />
    </View>
  );
};

/**
 * Dashboard Grid Shimmer
 * Shimmer for dashboard grid layouts
 */
export const DashboardGridShimmer: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={{padding: theme.spacing.md}}>
      {/* Stats cards */}
      <StatsCardShimmer count={4} />

      {/* Chart section */}
      <View style={{marginTop: theme.spacing.lg}}>
        <ChartShimmer />
      </View>

      {/* List section */}
      <View style={{marginTop: theme.spacing.lg}}>
        <Shimmer width="40%" height={18} style={{marginBottom: 16}} />
        <ListItemShimmer count={5} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shimmer: {},
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemLeft: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  chart: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  profileHeader: {
    alignItems: 'center',
  },
});
