/**
 * SwipeableListItem Component
 * List item with left/right swipe actions
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated from 'react-native-reanimated';
import { IconButton } from '../buttons/IconButton';
import { useTheme } from '../../hooks/useTheme';

export interface SwipeAction {
  icon: string;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  label?: string;
}

export interface SwipeableListItemProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text
   */
  subtitle?: string;

  /**
   * Left icon name
   */
  leftIcon?: string;

  /**
   * Left swipe actions (shown when swiping right)
   */
  leftActions?: SwipeAction[];

  /**
   * Right swipe actions (shown when swiping left)
   */
  rightActions?: SwipeAction[];

  /**
   * Press handler
   */
  onPress?: () => void;
}

/**
 * SwipeableListItem
 *
 * List item with swipe gesture support for actions.
 * Swipe right for left actions, swipe left for right actions.
 *
 * @example
 * // Swipeable list item with delete action
 * <SwipeableListItem
 *   title="John Doe"
 *   subtitle="john@example.com"
 *   rightActions={[
 *     {
 *       icon: 'delete',
 *       backgroundColor: '#F44336',
 *       onPress: () => deleteItem(),
 *     },
 *   ]}
 * />
 *
 * @example
 * // With multiple actions on both sides
 * <SwipeableListItem
 *   title="Message"
 *   subtitle="Swipe for actions"
 *   leftActions={[
 *     { icon: 'check', backgroundColor: '#4CAF50', onPress: markAsRead },
 *   ]}
 *   rightActions={[
 *     { icon: 'archive', backgroundColor: '#FF9800', onPress: archive },
 *     { icon: 'delete', backgroundColor: '#F44336', onPress: deleteMsg },
 *   ]}
 * />
 */
export const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  leftActions = [],
  rightActions = [],
  onPress,
}) => {
  const theme = useTheme();

  const renderLeftActions = () => {
    if (leftActions.length === 0) return null;

    return (
      <Reanimated.View style={styles.actionsContainer}>
        {leftActions.map((action, index) => (
          <View
            key={index}
            style={[
              styles.actionButton,
              { backgroundColor: action.backgroundColor || theme.colors.primary },
            ]}
          >
            <IconButton
              icon={action.icon}
              iconColor={action.color || '#FFFFFF'}
              onPress={action.onPress}
              size={24}
            />
          </View>
        ))}
      </Reanimated.View>
    );
  };

  const renderRightActions = () => {
    if (rightActions.length === 0) return null;

    return (
      <Reanimated.View style={styles.actionsContainer}>
        {rightActions.map((action, index) => (
          <View
            key={index}
            style={[
              styles.actionButton,
              { backgroundColor: action.backgroundColor || theme.colors.error },
            ]}
          >
            <IconButton
              icon={action.icon}
              iconColor={action.color || '#FFFFFF'}
              onPress={action.onPress}
              size={24}
            />
          </View>
        ))}
      </Reanimated.View>
    );
  };

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <List.Item
        title={title}
        description={subtitle}
        left={leftIcon ? (props) => <List.Icon {...props} icon={leftIcon} /> : undefined}
        onPress={onPress}
        style={{ backgroundColor: theme.colors.surface }}
      />
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
