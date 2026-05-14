/**
 * Material Design 3 Theme Configuration
 * Combined theme with colors, typography, spacing, and elevation
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { createTypographyWithAppScale } from './typography';
import {
  lightColors,
  darkColors,
  semanticColors,
  statusColors,
  adminLightColors,
  adminDarkColors,
  managerLightColors,
  managerDarkColors,
  userLightColors,
  userDarkColors,
  userLightColors,
  userDarkColors,
} from './colors';
import type { MD3ColorScheme } from './colors';
import { typography } from './typography';
import { spacing, componentSpacing } from './spacing';
import { elevation } from './elevation';

/**
 * Extended MD3 Theme with custom tokens
 */
export interface ForgeTheme extends Omit<MD3Theme, 'colors'> {
  colors: MD3ColorScheme;
  semanticColors: typeof semanticColors;
  statusColors: typeof statusColors;
  typography: typeof typography;
  spacing: typeof spacing;
  componentSpacing: typeof componentSpacing;
  elevation: typeof elevation;
}

// ─── Theme key type ───────────────────────────────────────────────────────────

/**
 * All supported theme keys.
 *
 * Naming convention: <role>-<mode>
 *   admin      → Red palette   (ADMIN role)
 *   manager    → Green palette (MANAGER role)
 *   user       → Purple palette (USER role)
 *   user       → Blue palette  (USER role, same as legacy light/dark)
 */
export type ThemeKey =
  | 'admin-light'
  | 'admin-dark'
  | 'manager-light'
  | 'manager-dark'
  | 'user-light'
  | 'user-dark'

// ─── Helper to build a ForgeTheme ──────────────────────────────────────────

const buildTheme = (base: MD3Theme, colors: MD3ColorScheme, appFontScale = 1): ForgeTheme => ({
  ...base,
  colors: { ...base.colors, ...colors },
  semanticColors,
  statusColors,
  typography: appFontScale === 1 ? typography : createTypographyWithAppScale(appFontScale),
  spacing,
  componentSpacing,
  elevation,
});

/**
 * Build a scaled version of any theme by key.
 * Used by ThemeProvider to apply the user's font size preference.
 */
export const buildScaledTheme = (key: ThemeKey, appFontScale: number): ForgeTheme => {
  const base = key.endsWith('-dark') ? MD3DarkTheme : MD3LightTheme;
  const colorMap: Record<ThemeKey, MD3ColorScheme> = {
    'admin-light': adminLightColors,
    'admin-dark':  adminDarkColors,
    'manager-light':      managerLightColors,
    'manager-dark':       managerDarkColors,
    'user-light': userLightColors,
    'user-dark':  userDarkColors,
  };
  return buildTheme(base, colorMap[key], appFontScale);
};

// ─── Legacy light / dark themes (kept for backwards compat) ──────────────────

export const lightTheme: ForgeTheme = buildTheme(MD3LightTheme, lightColors);
export const darkTheme: ForgeTheme = buildTheme(MD3DarkTheme, darkColors);

// ─── Role-specific themes ─────────────────────────────────────────────────────

export const adminLightTheme: ForgeTheme = buildTheme(MD3LightTheme, adminLightColors);
export const adminDarkTheme: ForgeTheme = buildTheme(MD3DarkTheme, adminDarkColors);

export const superLightTheme: ForgeTheme = buildTheme(MD3LightTheme, managerLightColors);
export const superDarkTheme: ForgeTheme = buildTheme(MD3DarkTheme, managerDarkColors);

export const userLightTheme: ForgeTheme = buildTheme(MD3LightTheme, userLightColors);
export const userDarkTheme: ForgeTheme = buildTheme(MD3DarkTheme, userDarkColors);


// ─── Theme map ────────────────────────────────────────────────────────────────

export const THEME_MAP: Record<ThemeKey, ForgeTheme> = {
  'admin-light': adminLightTheme,
  'admin-dark':  adminDarkTheme,
  'manager-light':      superLightTheme,
  'manager-dark':       superDarkTheme,
  'user-light': userLightTheme,
  'user-dark':  userDarkTheme,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const getThemeByKey = (key: ThemeKey): ForgeTheme => THEME_MAP[key];

/** Legacy helper — kept for any existing callers */
export const getTheme = (isDark: boolean): ForgeTheme =>
  isDark ? darkTheme : lightTheme;

export const defaultTheme = lightTheme;
