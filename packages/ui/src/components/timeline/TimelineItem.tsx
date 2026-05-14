/**
 * TimelineItem Component
 * Single timeline entry with dot and line
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { TitleMedium } from '../typography/TitleMedium';
import { BodyMedium } from '../typography/BodyMedium';
import { LabelSmall } from '../typography/LabelSmall';
import { useTheme } from '../../hooks/useTheme';

export interface TimelineItemProps {
  /**
   * Timeline event title
   */
  title: string;

  /**
   * Timeline event description
   */
  description?: string;

  /**
   * Timestamp or date text
   */
  timestamp?: string;

  /**
   * Dot color
   */
  dotColor?: string;

  /**
   * Whether this is the last item (no connecting line below)
   * @default false
   */
  isLast?: boolean;

  /**
   * Icon name for dot (MaterialCommunityIcons)
   */
  icon?: string;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * TimelineItem
 *
 * Single entry in a vertical timeline.
 * Shows dot indicator with connecting line and content.
 *
 * @example
 * // Basic timeline item
 * <TimelineItem
 *   title="Application Submitted"
 *   description="Your loan application has been submitted for review"
 *   timestamp="2 hours ago"
 * />
 *
 * @example
 * // With custom color and icon
 * <TimelineItem
 *   title="Payment Received"
 *   description="EMI payment of ₹5,000 received"
 *   timestamp="1 day ago"
 *   dotColor="#4CAF50"
 *   icon="check-circle"
 * />
 *
 * @example
 * // Last item (no line)
 * <TimelineItem
 *   title="Account Created"
 *   timestamp="30 days ago"
 *   isLast
 * />
 */
export const TimelineItem: React.FC<TimelineItemProps> = ({
  title,
  description,
  timestamp,
  dotColor,
  isLast = false,
  icon,
  style,
}) => {
  const theme = useTheme();

  const color = dotColor || theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      {/* Timeline Indicator */}
      <View style={styles.indicatorContainer}>
        <View
          style={[
            styles.dot,
            { backgroundColor: color, borderColor: theme.colors.surface },
          ]}
        />
        {!isLast && (
          <View
            style={[
              styles.line,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <TitleMedium>{title}</TitleMedium>
        {description && (
          <BodyMedium
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
          >
            {description}
          </BodyMedium>
        )}
        {timestamp && (
          <LabelSmall
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            {timestamp}
          </LabelSmall>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: 24,
  },
  indicatorContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
});
