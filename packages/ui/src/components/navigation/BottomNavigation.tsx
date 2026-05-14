/**
 * MD3 Bottom Navigation Bar
 * Material Design 3 compliant bottom navigation with safe area
 *
 * @see https://m3.material.io/components/navigation-bar/overview
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {BottomNavigation as PaperBottomNavigation} from 'react-native-paper';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../hooks/useTheme';

export interface BottomNavRoute {
  key: string;
  title: string;
  focusedIcon: string;
  unfocusedIcon?: string;
  badge?: string | number | boolean;
}

export interface BottomNavigationProps {
  /**
   * Navigation routes
   */
  routes: BottomNavRoute[];

  /**
   * Current navigation index
   */
  navigationState: {
    index: number;
    routes: BottomNavRoute[];
  };

  /**
   * Callback when route changes
   */
  onIndexChange: (index: number) => void;

  /**
   * Render scene for each route
   */
  renderScene: PaperBottomNavigation.SceneMap;

  /**
   * Show labels
   * @default 'auto'
   */
  labeled?: boolean | 'auto';

  /**
   * Shifting mode
   * @default false
   */
  shifting?: boolean;
}

/**
 * MD3 Bottom Navigation
 * Handles safe area automatically for notch/home indicator
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  routes,
  navigationState,
  onIndexChange,
  renderScene,
  labeled = 'auto',
  shifting = false,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <PaperBottomNavigation
        navigationState={navigationState}
        onIndexChange={onIndexChange}
        renderScene={renderScene}
        shifting={shifting}
        labeled={labeled}
        barStyle={[
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: insets.bottom,
            height: 80 + insets.bottom,
            borderTopColor: theme.colors.outlineVariant,
          },
        ]}
        theme={{
          colors: {
            secondaryContainer: theme.colors.secondaryContainer,
            onSecondaryContainer: theme.colors.onSecondaryContainer,
            onSurface: theme.colors.onSurfaceVariant,
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});
