/**
 * Custom hook to access Demigod theme
 * Extends react-native-paper useTheme with custom tokens
 */

import { useTheme as usePaperTheme } from 'react-native-paper';
import type { ForgeTheme } from '../theme/theme';

/**
 * Hook to access the current theme
 *
 * @example
 * const theme = useTheme();
 * const backgroundColor = theme.colors.surface;
 * const padding = theme.spacing.xl;
 */
export const useTheme = (): ForgeTheme => {
  return usePaperTheme<ForgeTheme>();
};
