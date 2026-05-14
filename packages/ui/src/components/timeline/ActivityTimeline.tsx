/**
 * ActivityTimeline Component
 * Vertical timeline with multiple items
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { TimelineItem } from './TimelineItem';

export interface TimelineActivity {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  dotColor?: string;
  icon?: string;
}

export interface ActivityTimelineProps {
  /**
   * Timeline activities
   */
  activities: TimelineActivity[];

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * ActivityTimeline
 *
 * Vertical timeline component showing a list of activities.
 * Automatically marks the last item.
 *
 * @example
 * // Basic activity timeline
 * <ActivityTimeline
 *   activities={[
 *     {
 *       id: '1',
 *       title: 'Loan Approved',
 *       description: 'Your loan has been approved',
 *       timestamp: '2 hours ago',
 *       dotColor: '#4CAF50',
 *     },
 *     {
 *       id: '2',
 *       title: 'Documents Verified',
 *       description: 'All documents verified successfully',
 *       timestamp: '1 day ago',
 *     },
 *     {
 *       id: '3',
 *       title: 'Application Submitted',
 *       timestamp: '2 days ago',
 *     },
 *   ]}
 * />
 *
 * @example
 * // Transaction history timeline
 * <ActivityTimeline
 *   activities={transactions.map(tx => ({
 *     id: tx.id,
 *     title: tx.type,
 *     description: `₹${tx.amount}`,
 *     timestamp: tx.date,
 *     dotColor: tx.type === 'credit' ? '#4CAF50' : '#F44336',
 *   }))}
 * />
 */
export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {activities.map((activity, index) => (
        <TimelineItem
          key={activity.id}
          title={activity.title}
          description={activity.description}
          timestamp={activity.timestamp}
          dotColor={activity.dotColor}
          icon={activity.icon}
          isLast={index === activities.length - 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
});
