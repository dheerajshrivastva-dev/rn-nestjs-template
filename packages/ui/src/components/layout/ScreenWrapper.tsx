/**
 * Screen Wrapper Component
 * Common DRY wrapper for all screens with theme-aware status bar and safe area
 *
 * Benefits:
 * - Single place to configure status bar theming
 * - Automatic safe area handling with sensible defaults
 * - Less boilerplate in every screen
 */

import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeScreen, type SafeScreenProps } from './SafeScreen';
import { useTheme } from '../../hooks/useTheme';

export interface ScreenWrapperProps extends Omit<SafeScreenProps, 'children'> {
  /**
   * Screen content
   */
  children: React.ReactNode;

  /**
   * Override status bar style
   * If not provided, automatically determined from theme
   */
  statusBarStyle?: 'light-content' | 'dark-content';

  /**
   * Override status bar background color
   * If not provided, uses theme surface color
   */
  statusBarColor?: string;

  /**
   * Hide status bar
   * @default false
   */
  hideStatusBar?: boolean;
}

/**
 * Screen Wrapper
 *
 * Common wrapper for all screens that handles:
 * - Theme-aware status bar styling
 * - Safe area handling with configurable edges
 * - DRY screen setup
 *
 * @example
 * // Screen with AppBar (default - top safe area handled by AppBar)
 * <ScreenWrapper>
 *   <AppBar title="Dashboard" />
 *   <Content />
 * </ScreenWrapper>
 *
 * @example
 * // Auth screen (full safe area)
 * <ScreenWrapper edges={['top', 'bottom', 'left', 'right']}>
 *   <LoginForm />
 * </ScreenWrapper>
 *
 * @example
 * // Custom safe area edges
 * <ScreenWrapper edges={['bottom']} noSafeArea>
 *   <CustomLayout />
 * </ScreenWrapper>
 */
export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  statusBarStyle,
  statusBarColor,
  hideStatusBar = false,
  edges = ['left', 'right', 'bottom'], // Default: AppBar handles top
  backgroundColor,
  ...safeScreenProps
}) => {
  const theme = useTheme();

  // Auto-determine status bar style from theme if not provided
  const barStyle = statusBarStyle || (theme.dark ? 'light-content' : 'dark-content');

  // Use theme surface color if not provided
  const barColor = statusBarColor || backgroundColor || theme.colors.surface;

  return (
    <>
      <StatusBar
        barStyle={barStyle}
        backgroundColor={Platform.OS === 'android' ? barColor : undefined}
        translucent={Platform.OS === 'android'}
        hidden={hideStatusBar}
        animated
      />
      <SafeScreen
        edges={edges}
        backgroundColor={backgroundColor}
        {...safeScreenProps}
      >
        {children}
      </SafeScreen>
    </>
  );
};
