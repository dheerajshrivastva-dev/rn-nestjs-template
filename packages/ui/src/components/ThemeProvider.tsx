/**
 * Theme Provider Component
 * Wraps the app with Material Design 3 theme
 */

import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { THEME_MAP, buildScaledTheme, darkTheme } from '../theme/theme';
import type { ForgeTheme, ThemeKey } from '../theme/theme';

interface ThemeProviderProps {
  children: React.ReactNode;

  /**
   * Role-based theme key, e.g. 'admin-dark', 'user-light'.
   * When provided, the exact theme is used (no system override).
   */
  theme?: ThemeKey;

  /**
   * Custom theme object (overrides everything else).
   */
  customTheme?: ForgeTheme;

  /**
   * Extra font scale multiplier from the app's font size setting.
   * small=0.85, medium=1.0 (default), large=1.15
   */
  fontScale?: number;
}

/**
 * Theme Provider
 *
 * Selects the correct MD3 theme based on the provided ThemeKey.
 * Falls back to 'user-dark' if no key is given.
 *
 * @example
 * <ThemeProvider theme="admin-dark" fontScale={1.15}>
 *   <App />
 * </ThemeProvider>
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme: themeKey,
  customTheme,
  fontScale = 1,
}) => {
  let activeTheme: ForgeTheme;

  if (customTheme) {
    activeTheme = customTheme;
  } else if (themeKey && THEME_MAP[themeKey]) {
    activeTheme = fontScale === 1 ? THEME_MAP[themeKey] : buildScaledTheme(themeKey, fontScale);
  } else {
    // Fallback — legacy behaviour: dark by default
    activeTheme = darkTheme;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={activeTheme}>{children}</PaperProvider>
    </SafeAreaProvider>
  );
};
