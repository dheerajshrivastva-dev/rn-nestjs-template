// src/navigation/private/DistributerBottomTabs.tsx
/**
 * Super Bottom Tab Navigation (SUPER role)
 * Amazon-style bottom navigation with 5 tabs
 */

import React, { useEffect } from 'react';

import { StyleSheet, TouchableOpacity, Platform, View } from 'react-native';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { type MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useTheme } from 'react-native-paper';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NetworkBannerStrip } from '../../components/NetworkBanner';

interface TabButtonProps {
  focused: boolean;
  icon: string;
  label: string;
  onPress: () => void;
}

const SPRING_PILL: Parameters<typeof withSpring>[1] = {
  damping: 18,
  stiffness: 200,
  mass: 0.8,
};

const AmazonTabButton: React.FC<TabButtonProps> = ({ focused, icon, label, onPress }) => {
  const theme = useTheme();

  // 0 = unfocused, 1 = focused — drives pill background only
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, SPRING_PILL);
  }, [focused, progress]);

  // Only the pill background animates — grow from center
  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [`${theme.colors.primary}00`, `${theme.colors.primary}1a`],
    ),
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  const iconColor = focused ? theme.colors.primary : theme.colors.onSurfaceVariant;
  const labelColor = focused ? theme.colors.primary : theme.colors.onSurfaceVariant;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.8}
    >
      <View style={styles.tabContent}>
        <View style={styles.iconContainer}>
          {/* Pill bg only — animates behind icon+text */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.pill, pillStyle]} />
          <Icon name={icon} size={22} color={iconColor} />
          <Animated.Text style={[styles.tabLabel, { color: labelColor }]} numberOfLines={1}>
            {label}
          </Animated.Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

AmazonTabButton.displayName = 'AmazonTabButton';

/**
 * Amazon-Style Tab Bar
 */
const AmazonTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const paddingBottom = Platform.OS === 'ios' ? insets.bottom : 4;

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ backgroundColor: theme.colors.surface }}
    >
    <View
      style={[
        styles.tabBarContainer,
        { paddingBottom },
      ]}
    >
      <NetworkBannerStrip />
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AmazonTabButton
              key={route.key}
              focused={isFocused}
              icon={
            typeof options.tabBarIcon === 'string'
              ? options.tabBarIcon
              : options.tabBarIcon?.({ focused: isFocused, color: '', size: 0 })?.props?.name || 'circle'
          }
              label={options.tabBarLabel || route.name}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
    </SafeAreaView>
  );
};

AmazonTabBar.displayName = 'AmazonTabBar';

const CustomTabBar = (props: BottomTabBarProps | MaterialTopTabBarProps) => <AmazonTabBar {...props} />;

export default CustomTabBar;

const styles = StyleSheet.create({
  tabBarContainer: {
    margin: 0,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64, // slightly taller for the pill to breathe
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
    minHeight: 48,
  },
  pill: {
    borderRadius: 24,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
});
