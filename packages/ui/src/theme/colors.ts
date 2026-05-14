/**
 * Material Design 3 Color System
 * Based on Material You dynamic color tokens
 *
 * Reference: https://m3.material.io/styles/color/system/overview
 */

export interface MD3ColorScheme {
  // Primary colors
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  // Secondary colors
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;

  // Tertiary colors
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  // Error colors
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;

  // Background colors
  background: string;
  onBackground: string;

  // Surface colors
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  // Surface containers
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Outline
  outline: string;
  outlineVariant: string;

  // Other
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

/**
 * Light Theme Colors
 */
export const lightColors: MD3ColorScheme = {
  // Primary - Deep Blue (for trust & professionalism)
  primary: '#1976D2',
  onPrimary: '#FFFFFF',
  primaryContainer: '#BBDEfb',
  onPrimaryContainer: '#001D36',

  // Secondary - Teal (for accents)
  secondary: '#00897B',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#A7FFEB',
  onSecondaryContainer: '#002018',

  // Tertiary - Purple (for highlights)
  tertiary: '#6200EA',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#E1BEE7',
  onTertiaryContainer: '#1A0033',

  // Error - Red
  error: '#D32F2F',
  onError: '#FFFFFF',
  errorContainer: '#FFCDD2',
  onErrorContainer: '#410002',

  // Background
  background: '#FAFAFA',
  onBackground: '#1A1C1E',

  // Surface
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#E0E2EC',
  onSurfaceVariant: '#43474E',

  // Surface containers (elevation tint)
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F5F5F7',
  surfaceContainer: '#EEEFF3',
  surfaceContainerHigh: '#E8E9ED',
  surfaceContainerHighest: '#E2E3E7',

  // Outline
  outline: '#73777F',
  outlineVariant: '#C3C6CF',

  // Other
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2E3135',
  inverseOnSurface: '#F0F0F3',
  inversePrimary: '#90CAF9',
};

/**
 * Dark Theme Colors
 */
export const darkColors: MD3ColorScheme = {
  // Primary
  primary: '#90CAF9',
  onPrimary: '#003258',
  primaryContainer: '#00497D',
  onPrimaryContainer: '#C8E6FF',

  // Secondary
  secondary: '#4DB6AC',
  onSecondary: '#00352C',
  secondaryContainer: '#005047',
  onSecondaryContainer: '#73F8E7',

  // Tertiary
  tertiary: '#B388FF',
  onTertiary: '#2E0054',
  tertiaryContainer: '#47007A',
  onTertiaryContainer: '#EADDFF',

  // Error
  error: '#EF5350',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFBABF',

  // Background
  background: '#1A1C1E',
  onBackground: '#E2E2E5',

  // Surface
  surface: '#121212',
  onSurface: '#E2E2E5',
  surfaceVariant: '#43474E',
  onSurfaceVariant: '#C3C6CF',

  // Surface containers (elevation tint)
  surfaceContainerLowest: '#0B0E11',
  surfaceContainerLow: '#1A1C1E',
  surfaceContainer: '#1E2022',
  surfaceContainerHigh: '#282A2C',
  surfaceContainerHighest: '#333537',

  // Outline
  outline: '#8D9199',
  outlineVariant: '#43474E',

  // Other
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E2E2E5',
  inverseOnSurface: '#2E3135',
  inversePrimary: '#1976D2',
};

/**
 * Semantic Colors (status indicators)
 */
export const semanticColors = {
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    container: '#C8E6C9',
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    container: '#FFE0B2',
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    container: '#BBDEFB',
  },
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
    container: '#FFCDD2',
  },
} as const;

/**
 * Status Colors
 */
export const statusColors = {
  online: '#4CAF50',
  offline: '#9E9E9E',
  busy: '#F44336',
  away: '#FF9800',
  protected: '#4CAF50',
  locked: '#F44336',
  notRegistered: '#FF9800',
  active: '#4CAF50',
  inactive: '#9E9E9E',
  overdue: '#F44336',
} as const;

// ─── Super Admin Palette (Red) ────────────────────────────────────────────────

export const adminLightColors: MD3ColorScheme = {
  primary: '#C62828',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FFCDD2',
  onPrimaryContainer: '#3E0007',
  secondary: '#8E24AA',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F3E5F5',
  onSecondaryContainer: '#1A0026',
  tertiary: '#E65100',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFE0B2',
  onTertiaryContainer: '#260900',
  error: '#B00020',
  onError: '#FFFFFF',
  errorContainer: '#FFCDD2',
  onErrorContainer: '#370001',
  background: '#FFF8F7',
  onBackground: '#1A1C1E',
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#F5E0E0',
  onSurfaceVariant: '#534341',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FFF1EF',
  surfaceContainer: '#FCE8E8',
  surfaceContainerHigh: '#F5DEDE',
  surfaceContainerHighest: '#EDD4D4',
  outline: '#857371',
  outlineVariant: '#D8C2C0',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#362F2E',
  inverseOnSurface: '#FBF0EF',
  inversePrimary: '#FF8A80',
};

export const adminDarkColors: MD3ColorScheme = {
  primary: '#FF8A80',
  onPrimary: '#690005',
  primaryContainer: '#930009',
  onPrimaryContainer: '#FFBAB6',
  secondary: '#CE93D8',
  onSecondary: '#4A0072',
  secondaryContainer: '#6A0096',
  onSecondaryContainer: '#F3DAFF',
  tertiary: '#FFAB40',
  onTertiary: '#4D1B00',
  tertiaryContainer: '#6E2700',
  onTertiaryContainer: '#FFDCC6',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#1A1210',
  onBackground: '#EFE0DE',
  surface: '#110E0E',
  onSurface: '#EFE0DE',
  surfaceVariant: '#534341',
  onSurfaceVariant: '#D8C2C0',
  surfaceContainerLowest: '#0C0807',
  surfaceContainerLow: '#1A1210',
  surfaceContainer: '#1F1614',
  surfaceContainerHigh: '#29201E',
  surfaceContainerHighest: '#342B29',
  outline: '#A08C8A',
  outlineVariant: '#534341',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#EFE0DE',
  inverseOnSurface: '#362F2E',
  inversePrimary: '#C62828',
};

// ─── Super Palette (Green) ────────────────────────────────────────────────────

export const managerLightColors: MD3ColorScheme = {
  primary: '#2E7D32',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C8E6C9',
  onPrimaryContainer: '#062008',
  secondary: '#00796B',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#A7FFEB',
  onSecondaryContainer: '#002018',
  tertiary: '#1565C0',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#BBDEFB',
  onTertiaryContainer: '#001D36',
  error: '#B00020',
  onError: '#FFFFFF',
  errorContainer: '#FFCDD2',
  onErrorContainer: '#370001',
  background: '#F6FBF6',
  onBackground: '#1A1C1E',
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#DDE6DA',
  onSurfaceVariant: '#404943',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#EFF5EE',
  surfaceContainer: '#E9EFE8',
  surfaceContainerHigh: '#E3E9E2',
  surfaceContainerHighest: '#DDE3DC',
  outline: '#707973',
  outlineVariant: '#C0C9BF',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2E3130',
  inverseOnSurface: '#EFF1EE',
  inversePrimary: '#81C784',
};

export const managerDarkColors: MD3ColorScheme = {
  primary: '#81C784',
  onPrimary: '#0A3D0C',
  primaryContainer: '#1B5E20',
  onPrimaryContainer: '#B7F0BA',
  secondary: '#4DB6AC',
  onSecondary: '#00352C',
  secondaryContainer: '#005047',
  onSecondaryContainer: '#73F8E7',
  tertiary: '#82B1FF',
  onTertiary: '#003380',
  tertiaryContainer: '#0047B3',
  onTertiaryContainer: '#D6E4FF',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#101512',
  onBackground: '#DEE4DC',
  surface: '#0B0F0C',
  onSurface: '#DEE4DC',
  surfaceVariant: '#404943',
  onSurfaceVariant: '#C0C9BF',
  surfaceContainerLowest: '#060A07',
  surfaceContainerLow: '#101512',
  surfaceContainer: '#151A16',
  surfaceContainerHigh: '#1F2420',
  surfaceContainerHighest: '#2A2F2B',
  outline: '#8A9389',
  outlineVariant: '#404943',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#DEE4DC',
  inverseOnSurface: '#2E3130',
  inversePrimary: '#2E7D32',
};

// ─── Distributor Palette (Purple) ─────────────────────────────────────────────

export const userLightColors: MD3ColorScheme = {
  primary: '#6A1B9A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E1BEE7',
  onPrimaryContainer: '#1A0033',
  secondary: '#7B1FA2',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F3E5F5',
  onSecondaryContainer: '#270038',
  tertiary: '#AD1457',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FCE4EC',
  onTertiaryContainer: '#35001A',
  error: '#B00020',
  onError: '#FFFFFF',
  errorContainer: '#FFCDD2',
  onErrorContainer: '#370001',
  background: '#FAF7FC',
  onBackground: '#1A1C1E',
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#EADDF0',
  onSurfaceVariant: '#4B434F',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F5EEF8',
  surfaceContainer: '#EFE8F2',
  surfaceContainerHigh: '#E8E2EB',
  surfaceContainerHighest: '#E2DCE5',
  outline: '#7D7182',
  outlineVariant: '#CFC4D4',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#33282E',
  inverseOnSurface: '#F7EEF5',
  inversePrimary: '#CF85F7',
};

export const userDarkColors: MD3ColorScheme = {
  primary: '#CF85F7',
  onPrimary: '#45006B',
  primaryContainer: '#62009A',
  onPrimaryContainer: '#EBCEFF',
  secondary: '#E040FB',
  onSecondary: '#5C007A',
  secondaryContainer: '#7900A9',
  onSecondaryContainer: '#FBBFFF',
  tertiary: '#F48FB1',
  onTertiary: '#6E0030',
  tertiaryContainer: '#9A0045',
  onTertiaryContainer: '#FFD9E4',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#151018',
  onBackground: '#E9DFEE',
  surface: '#100D14',
  onSurface: '#E9DFEE',
  surfaceVariant: '#4B434F',
  onSurfaceVariant: '#CFC4D4',
  surfaceContainerLowest: '#0A0810',
  surfaceContainerLow: '#151018',
  surfaceContainer: '#1A151D',
  surfaceContainerHigh: '#241F27',
  surfaceContainerHighest: '#2F2A32',
  outline: '#998D9E',
  outlineVariant: '#4B434F',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E9DFEE',
  inverseOnSurface: '#33282E',
  inversePrimary: '#6A1B9A',
};

// ─── Retailer Palette (Blue — current default) ────────────────────────────────
// Same as the existing lightColors / darkColors, re-exported with explicit names


/**
 * Get color scheme based on theme mode
 */
export const getColorScheme = (isDark: boolean): MD3ColorScheme => {
  return isDark ? darkColors : lightColors;
};
