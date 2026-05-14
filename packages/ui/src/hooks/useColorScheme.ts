/**
 * Custom hook to manage color scheme (light/dark mode)
 */

import { useColorScheme as useRNColorScheme } from 'react-native';
import { useState, useEffect } from 'react';

export type ColorScheme = 'light' | 'dark';

/**
 * Hook to get and manage color scheme
 *
 * @param manualOverride - Optional manual theme override (bypasses system preference)
 * @returns Current color scheme and setter function
 *
 * @example
 * // Auto-detect system theme
 * const [colorScheme] = useColorScheme();
 *
 * @example
 * // Manual theme control
 * const [colorScheme, setColorScheme] = useColorScheme('light');
 * setColorScheme('dark'); // Switch to dark mode
 */
export const useColorScheme = (
  manualOverride?: ColorScheme
): [ColorScheme, (scheme: ColorScheme) => void] => {
  const systemColorScheme = useRNColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    manualOverride || (systemColorScheme as ColorScheme) || 'light'
  );

  useEffect(() => {
    if (manualOverride) {
      // Prop changed — apply new override immediately
      setColorScheme(manualOverride);
    } else if (systemColorScheme) {
      setColorScheme(systemColorScheme as ColorScheme);
    }
  }, [systemColorScheme, manualOverride]);

  return [colorScheme, setColorScheme];
};

/**
 * Simple hook to check if dark mode is active
 *
 * @returns true if dark mode is active
 *
 * @example
 * const isDark = useIsDarkMode();
 */
export const useIsDarkMode = (): boolean => {
  const [colorScheme] = useColorScheme();
  return colorScheme === 'dark';
};
