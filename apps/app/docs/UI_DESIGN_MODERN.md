# demiAdmin - Modern UI Design System (Material Design 3)

## 🎨 Design Philosophy

### Core Principles

1. **Material You / Material Design 3**: Dynamic color system with personalization
2. **Multi-Theme Support**: Dark, Red, Blue, Purple, Green themes with auto/manual switching
3. **Accessibility First**: WCAG 2.1 Level AA compliant with AAA contrast ratios
4. **Age-Inclusive**: Optimized for all age groups (18-70+)
5. **Fluid & Responsive**: Smooth animations, adaptive layouts
6. **Touch-Optimized**: Minimum 48dp touch targets
7. **Offline-Ready**: Clear state indicators and cached UI

---

## 🌈 Multi-Theme Color System

### Theme Architecture

**Material Design 3 Dynamic Color System** with 5 predefined themes + system auto theme.

```typescript
// src/theme/colors.ts

export type ThemeVariant = 'auto' | 'dark' | 'blue' | 'red' | 'purple' | 'green';
export type ThemeMode = 'light' | 'dark';

// Material Design 3 Color Roles
interface MD3ColorScheme {
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

  // Neutral colors
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  // Outline colors
  outline: string;
  outlineVariant: string;

  // Surface tints and elevation
  surfaceTint: string;
  surfaceBright: string;
  surfaceDim: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;

  // Inverse colors
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;

  // Shadow and scrim
  shadow: string;
  scrim: string;
}
```

### 1. Dark Theme (Default)

**Modern deep blacks with electric blue accents**

```typescript
export const darkTheme: MD3ColorScheme = {
  // Primary - Electric Blue
  primary: '#A8C7FA',                    // Light Blue 200
  onPrimary: '#003258',                  // Dark Blue 900
  primaryContainer: '#004A77',           // Blue 800
  onPrimaryContainer: '#D3E4FD',         // Light Blue 100

  // Secondary - Teal/Cyan
  secondary: '#B3CDDB',                  // Light Cyan 300
  onSecondary: '#1D3A4A',                // Dark Cyan 900
  secondaryContainer: '#344C5A',         // Cyan 800
  onSecondaryContainer: '#CFE5FF',       // Light Cyan 100

  // Tertiary - Purple/Violet
  tertiary: '#D7BADD',                   // Light Purple 300
  onTertiary: '#3E2A47',                 // Dark Purple 900
  tertiaryContainer: '#55405F',          // Purple 800
  onTertiaryContainer: '#F3DFFB',        // Light Purple 100

  // Error - Red
  error: '#FFB4AB',                      // Light Red 300
  onError: '#690005',                    // Dark Red 900
  errorContainer: '#93000A',             // Red 800
  onErrorContainer: '#FFDAD6',           // Light Red 100

  // Background & Surface
  background: '#0F1419',                 // Almost Black
  onBackground: '#E3E2E6',               // Light Gray
  surface: '#0F1419',                    // Same as background
  onSurface: '#E3E2E6',                  // Light Gray
  surfaceVariant: '#41484D',             // Medium Gray
  onSurfaceVariant: '#C1C7CE',           // Light Gray

  // Outlines
  outline: '#8B9297',                    // Gray
  outlineVariant: '#41484D',             // Medium Gray

  // Surface tints
  surfaceTint: '#A8C7FA',                // Primary
  surfaceBright: '#363B40',              // Lighter surface
  surfaceDim: '#0F1419',                 // Darker surface
  surfaceContainerLowest: '#0A0E13',     // Darkest container
  surfaceContainerLow: '#181C20',        // Dark container
  surfaceContainer: '#1D2024',           // Medium container
  surfaceContainerHigh: '#272A2E',       // Light container
  surfaceContainerHighest: '#313539',    // Lightest container

  // Inverse
  inverseSurface: '#E3E2E6',             // Light Gray
  inverseOnSurface: '#2E3136',           // Dark Gray
  inversePrimary: '#005FA8',             // Dark Blue

  // Shadow & Scrim
  shadow: '#000000',
  scrim: '#000000',
};
```

### 2. Blue Theme

**Professional blue with warm accents**

```typescript
export const blueTheme: MD3ColorScheme = {
  // Primary - Deep Blue
  primary: '#5E92F3',                    // Blue 400
  onPrimary: '#FFFFFF',
  primaryContainer: '#1565C0',           // Blue 800
  onPrimaryContainer: '#BBDEFB',         // Light Blue 100

  // Secondary - Sky Blue
  secondary: '#4FC3F7',                  // Light Blue 300
  onSecondary: '#FFFFFF',
  secondaryContainer: '#0277BD',         // Light Blue 800
  onSecondaryContainer: '#B3E5FC',       // Light Blue 50

  // Tertiary - Indigo
  tertiary: '#7986CB',                   // Indigo 300
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#303F9F',          // Indigo 700
  onTertiaryContainer: '#C5CAE9',        // Indigo 100

  // Rest follows Material Design 3 spec...
  background: '#0A1929',                 // Deep Navy
  onBackground: '#E3F2FD',
  surface: '#0A1929',
  onSurface: '#E3F2FD',
  surfaceVariant: '#1E3A5F',
  onSurfaceVariant: '#BBDEFB',

  outline: '#64B5F6',
  outlineVariant: '#1E3A5F',

  error: '#EF5350',
  onError: '#FFFFFF',
  errorContainer: '#C62828',
  onErrorContainer: '#FFCDD2',

  surfaceTint: '#5E92F3',
  surfaceBright: '#1E3A5F',
  surfaceDim: '#051427',
  surfaceContainerLowest: '#020812',
  surfaceContainerLow: '#0F1F33',
  surfaceContainer: '#152638',
  surfaceContainerHigh: '#1A2F45',
  surfaceContainerHighest: '#243850',

  inverseSurface: '#E3F2FD',
  inverseOnSurface: '#0A1929',
  inversePrimary: '#1565C0',

  shadow: '#000000',
  scrim: '#000000',
};
```

### 3. Red Theme

**Bold red with warm undertones**

```typescript
export const redTheme: MD3ColorScheme = {
  // Primary - Vibrant Red
  primary: '#EF5350',                    // Red 400
  onPrimary: '#FFFFFF',
  primaryContainer: '#C62828',           // Red 800
  onPrimaryContainer: '#FFCDD2',         // Red 100

  // Secondary - Pink
  secondary: '#EC407A',                  // Pink 400
  onSecondary: '#FFFFFF',
  secondaryContainer: '#AD1457',         // Pink 800
  onSecondaryContainer: '#F8BBD0',       // Pink 100

  // Tertiary - Orange
  tertiary: '#FF7043',                   // Deep Orange 400
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#D84315',          // Deep Orange 800
  onTertiaryContainer: '#FFCCBC',        // Deep Orange 100

  background: '#1A0A0A',                 // Deep Dark Red
  onBackground: '#FFEBEE',
  surface: '#1A0A0A',
  onSurface: '#FFEBEE',
  surfaceVariant: '#3E2723',
  onSurfaceVariant: '#FFCDD2',

  outline: '#FF8A80',
  outlineVariant: '#3E2723',

  error: '#F44336',
  onError: '#FFFFFF',
  errorContainer: '#B71C1C',
  onErrorContainer: '#FFEBEE',

  surfaceTint: '#EF5350',
  surfaceBright: '#3E2723',
  surfaceDim: '#0F0505',
  surfaceContainerLowest: '#050202',
  surfaceContainerLow: '#1F0F0F',
  surfaceContainer: '#241414',
  surfaceContainerHigh: '#2E1919',
  surfaceContainerHighest: '#382020',

  inverseSurface: '#FFEBEE',
  inverseOnSurface: '#1A0A0A',
  inversePrimary: '#C62828',

  shadow: '#000000',
  scrim: '#000000',
};
```

### 4. Purple Theme

**Rich purple with vibrant accents**

```typescript
export const purpleTheme: MD3ColorScheme = {
  // Primary - Deep Purple
  primary: '#AB47BC',                    // Purple 400
  onPrimary: '#FFFFFF',
  primaryContainer: '#6A1B9A',           // Purple 800
  onPrimaryContainer: '#E1BEE7',         // Purple 100

  // Secondary - Violet
  secondary: '#7E57C2',                  // Deep Purple 400
  onSecondary: '#FFFFFF',
  secondaryContainer: '#4527A0',         // Deep Purple 800
  onSecondaryContainer: '#D1C4E9',       // Deep Purple 100

  // Tertiary - Magenta
  tertiary: '#EC407A',                   // Pink 400
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#AD1457',          // Pink 800
  onTertiaryContainer: '#F8BBD0',        // Pink 100

  background: '#0F0A14',                 // Deep Purple Black
  onBackground: '#F3E5F5',
  surface: '#0F0A14',
  onSurface: '#F3E5F5',
  surfaceVariant: '#2E1A47',
  onSurfaceVariant: '#E1BEE7',

  outline: '#CE93D8',
  outlineVariant: '#2E1A47',

  error: '#EF5350',
  onError: '#FFFFFF',
  errorContainer: '#C62828',
  onErrorContainer: '#FFCDD2',

  surfaceTint: '#AB47BC',
  surfaceBright: '#2E1A47',
  surfaceDim: '#050205',
  surfaceContainerLowest: '#020102',
  surfaceContainerLow: '#14091F',
  surfaceContainer: '#190E24',
  surfaceContainerHigh: '#1F142E',
  surfaceContainerHighest: '#291D38',

  inverseSurface: '#F3E5F5',
  inverseOnSurface: '#0F0A14',
  inversePrimary: '#6A1B9A',

  shadow: '#000000',
  scrim: '#000000',
};
```

### 5. Green Theme

**Natural green with earth tones**

```typescript
export const greenTheme: MD3ColorScheme = {
  // Primary - Vibrant Green
  primary: '#66BB6A',                    // Green 400
  onPrimary: '#FFFFFF',
  primaryContainer: '#2E7D32',           // Green 800
  onPrimaryContainer: '#C8E6C9',         // Green 100

  // Secondary - Teal
  secondary: '#26A69A',                  // Teal 400
  onSecondary: '#FFFFFF',
  secondaryContainer: '#00695C',         // Teal 800
  onSecondaryContainer: '#B2DFDB',       // Teal 100

  // Tertiary - Lime
  tertiary: '#9CCC65',                   // Light Green 400
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#558B2F',          // Light Green 800
  onTertiaryContainer: '#DCEDC8',        // Light Green 100

  background: '#0A140A',                 // Deep Forest Green
  onBackground: '#E8F5E9',
  surface: '#0A140A',
  onSurface: '#E8F5E9',
  surfaceVariant: '#1B3A1B',
  onSurfaceVariant: '#C8E6C9',

  outline: '#81C784',
  outlineVariant: '#1B3A1B',

  error: '#EF5350',
  onError: '#FFFFFF',
  errorContainer: '#C62828',
  onErrorContainer: '#FFCDD2',

  surfaceTint: '#66BB6A',
  surfaceBright: '#1B3A1B',
  surfaceDim: '#050A05',
  surfaceContainerLowest: '#020502',
  surfaceContainerLow: '#0F1F0F',
  surfaceContainer: '#142614',
  surfaceContainerHigh: '#192E19',
  surfaceContainerHighest: '#203820',

  inverseSurface: '#E8F5E9',
  inverseOnSurface: '#0A140A',
  inversePrimary: '#2E7D32',

  shadow: '#000000',
  scrim: '#000000',
};
```

### Status Colors (Semantic)

**Consistent across all themes**

```typescript
export const statusColors = {
  // Success
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    container: '#1B5E20',
    onContainer: '#C8E6C9',
  },

  // Warning
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
    container: '#E65100',
    onContainer: '#FFE0B2',
  },

  // Info
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    container: '#0D47A1',
    onContainer: '#BBDEFB',
  },

  // Device Status
  device: {
    online: '#4CAF50',          // Green
    offline: '#9E9E9E',         // Gray
    locked: '#F44336',          // Red
    stolen: '#D32F2F',          // Dark Red
    protected: '#2196F3',       // Blue
    expired: '#FF9800',         // Orange
    notRegistered: '#757575',   // Medium Gray
  },
};
```

---

## 📐 Typography System

### Font Stack

**Primary**: System font with fallbacks for optimal performance

```typescript
export const fontFamilies = {
  // Android uses Roboto Flex (Material Design 3)
  // iOS uses SF Pro (Apple's system font)
  regular: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'SF Pro Display Medium',
    android: 'Roboto Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'SF Pro Display Bold',
    android: 'Roboto Bold',
    default: 'System',
  }),
};
```

### Material Design 3 Type Scale

```typescript
export const typography = {
  // Display (Large hero text)
  displayLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: fontFamilies.regular,
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },

  // Headline (Prominent text)
  headlineLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: fontFamilies.regular,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },

  // Title (Medium emphasis)
  titleLarge: {
    fontFamily: fontFamilies.medium,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },

  // Label (Buttons, chips)
  labelLarge: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },

  // Body (Regular text)
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
  },
};
```

---

## 🎯 Spacing & Layout

### Material Design 3 Spacing Scale

```typescript
export const spacing = {
  // Base 4dp unit (Material Design 3)
  xs: 4,       // 0.5 unit
  sm: 8,       // 1 unit
  md: 12,      // 1.5 units
  lg: 16,      // 2 units
  xl: 20,      // 2.5 units
  xxl: 24,     // 3 units
  xxxl: 32,    // 4 units
  xxxxl: 40,   // 5 units
  xxxxxl: 48,  // 6 units
};

// Screen padding
export const screenPadding = {
  horizontal: spacing.lg,   // 16dp
  vertical: spacing.xxl,    // 24dp
  compact: spacing.sm,      // 8dp (for dense layouts)
  spacious: spacing.xxxl,   // 32dp (for empty states)
};

// Component spacing
export const componentSpacing = {
  card: {
    padding: spacing.lg,              // 16dp internal
    gap: spacing.md,                  // 12dp between elements
    margin: spacing.sm,               // 8dp between cards
  },
  list: {
    itemPadding: spacing.lg,          // 16dp
    itemGap: spacing.xs,              // 4dp
    sectionGap: spacing.xxl,          // 24dp
  },
  form: {
    fieldGap: spacing.lg,             // 16dp
    sectionGap: spacing.xxxl,         // 32dp
    labelGap: spacing.sm,             // 8dp
  },
};
```

### Border Radius (Rounded Corners)

```typescript
export const borderRadius = {
  none: 0,
  xs: 4,       // Small elements
  sm: 8,       // Chips, small buttons
  md: 12,      // Cards, inputs
  lg: 16,      // Large cards
  xl: 20,      // Sheets, dialogs
  xxl: 28,     // Bottom sheets
  full: 9999,  // Circular (pills, avatars)
};
```

---

## 🎨 Elevation & Shadows

### Material Design 3 Elevation Levels

```typescript
export const elevation = {
  level0: {
    // No elevation
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  level1: {
    // 1dp elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  level2: {
    // 3dp elevation (Cards)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
  },
  level3: {
    // 6dp elevation (App bars)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  level4: {
    // 8dp elevation (FABs)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 8,
  },
  level5: {
    // 12dp elevation (Dialogs)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 12,
  },
};
```

---

## 🧩 Component Specifications

### Modern Component Design

#### 1. Buttons

```typescript
export const buttonStyles = {
  filled: {
    // Primary action (Material Design 3 Filled Button)
    height: 40,
    paddingHorizontal: spacing.xxl,   // 24dp
    borderRadius: borderRadius.full,  // Fully rounded
    elevation: elevation.level0,      // No shadow by default
    minWidth: 120,
  },
  filledTonal: {
    // Secondary action (Material Design 3 Filled Tonal Button)
    height: 40,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    elevation: elevation.level0,
  },
  outlined: {
    // Tertiary action (Material Design 3 Outlined Button)
    height: 40,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    elevation: elevation.level0,
  },
  text: {
    // Low emphasis action (Material Design 3 Text Button)
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    elevation: elevation.level0,
  },
  // Icon buttons
  icon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // FAB (Floating Action Button)
  fab: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    elevation: elevation.level3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabSmall: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    elevation: elevation.level3,
  },
  fabLarge: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    elevation: elevation.level3,
  },
};
```

#### 2. Cards

```typescript
export const cardStyles = {
  elevated: {
    // Elevated card (default)
    borderRadius: borderRadius.md,    // 12dp
    padding: spacing.lg,              // 16dp
    elevation: elevation.level1,
    gap: spacing.md,                  // 12dp between elements
  },
  filled: {
    // Filled card (colored background)
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    elevation: elevation.level0,
    gap: spacing.md,
  },
  outlined: {
    // Outlined card (border)
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    elevation: elevation.level0,
    gap: spacing.md,
  },
};
```

#### 3. Text Fields (Inputs)

```typescript
export const textFieldStyles = {
  filled: {
    // Filled text field (Material Design 3)
    height: 56,
    paddingHorizontal: spacing.lg,    // 16dp
    paddingTop: spacing.sm,           // 8dp (for label space)
    borderTopLeftRadius: borderRadius.xs,
    borderTopRightRadius: borderRadius.xs,
    borderBottomWidth: 1,
  },
  outlined: {
    // Outlined text field
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
  },
};
```

#### 4. Chips

```typescript
export const chipStyles = {
  assist: {
    // Assist chip (action)
    height: 32,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    elevation: elevation.level0,
  },
  filter: {
    // Filter chip (selectable)
    height: 32,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  input: {
    // Input chip (removable)
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    elevation: elevation.level0,
  },
  suggestion: {
    // Suggestion chip
    height: 32,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
};
```

#### 5. Navigation Bar (Bottom)

```typescript
export const navigationBarStyles = {
  container: {
    height: 80,
    paddingBottom: spacing.sm,        // Safe area
    paddingTop: spacing.md,
    elevation: elevation.level2,
  },
  item: {
    minWidth: 64,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
};
```

---

## 🎬 Animations & Motion

### Material Design 3 Motion System

```typescript
import { Easing } from 'react-native-reanimated';

export const motionTokens = {
  // Duration
  duration: {
    short1: 50,       // Tiny movements
    short2: 100,      // Small movements
    short3: 150,      // Small to medium movements
    short4: 200,      // Medium movements
    medium1: 250,     // Medium to large movements
    medium2: 300,     // Large movements
    medium3: 350,     // Extra large movements
    medium4: 400,     // Extra large movements
    long1: 450,       // Extra large to full-screen
    long2: 500,       // Full-screen transitions
    long3: 550,       // Full-screen transitions
    long4: 600,       // Full-screen transitions
    extraLong1: 700,  // Complex transitions
    extraLong2: 800,  // Complex transitions
    extraLong3: 900,  // Complex transitions
    extraLong4: 1000, // Complex transitions
  },

  // Easing curves
  easing: {
    // Standard easing (most common)
    standard: Easing.bezier(0.2, 0.0, 0, 1.0),
    // Emphasized easing (dramatic movement)
    emphasized: Easing.bezier(0.2, 0.0, 0, 1.0),
    // Decelerated easing (entering screen)
    emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1.0),
    // Accelerated easing (exiting screen)
    emphasizedAccelerate: Easing.bezier(0.3, 0.0, 0.8, 0.15),
    // Linear (constant speed)
    linear: Easing.linear,
  },
};

// Common animation presets
export const animations = {
  fadeIn: {
    entering: FadeIn.duration(motionTokens.duration.short4),
  },
  fadeOut: {
    exiting: FadeOut.duration(motionTokens.duration.short3),
  },
  slideInRight: {
    entering: SlideInRight
      .duration(motionTokens.duration.medium2)
      .easing(motionTokens.easing.emphasizedDecelerate),
  },
  slideOutLeft: {
    exiting: SlideOutLeft
      .duration(motionTokens.duration.short4)
      .easing(motionTokens.easing.emphasizedAccelerate),
  },
  scaleUp: {
    entering: ZoomIn
      .duration(motionTokens.duration.medium1)
      .easing(motionTokens.easing.emphasizedDecelerate),
  },
  scaleDown: {
    exiting: ZoomOut
      .duration(motionTokens.duration.short4)
      .easing(motionTokens.easing.emphasizedAccelerate),
  },
};
```

---

## 🌐 Theme Management System

### Complete Theme System Implementation

```typescript
// src/theme/themeStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

interface ThemeStore {
  // Theme variant (color scheme)
  variant: ThemeVariant;
  setVariant: (variant: ThemeVariant) => void;

  // Theme mode (light/dark)
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;

  // Auto mode follows system
  autoMode: boolean;
  setAutoMode: (auto: boolean) => void;

  // Get current colors
  colors: MD3ColorScheme;

  // Get current theme
  theme: MD3Theme;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      variant: 'dark',
      mode: Appearance.getColorScheme() || 'dark',
      autoMode: true,
      colors: darkTheme,
      theme: createTheme('dark', 'dark'),

      setVariant: (variant) => {
        const mode = get().mode;
        const colors = getThemeColors(variant, mode);
        const theme = createTheme(variant, mode);
        set({ variant, colors, theme });
      },

      setMode: (mode) => {
        const variant = get().variant;
        const colors = getThemeColors(variant, mode);
        const theme = createTheme(variant, mode);
        set({ mode, colors, theme, autoMode: false });
      },

      toggleMode: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        get().setMode(newMode);
      },

      setAutoMode: (auto) => {
        set({ autoMode: auto });
        if (auto) {
          const systemMode = Appearance.getColorScheme() || 'dark';
          get().setMode(systemMode);
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Listen to system theme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const store = useThemeStore.getState();
  if (store.autoMode && colorScheme) {
    store.setMode(colorScheme);
  }
});

// Helper function to get theme colors
function getThemeColors(variant: ThemeVariant, mode: ThemeMode): MD3ColorScheme {
  const themeMap = {
    dark: darkTheme,
    blue: blueTheme,
    red: redTheme,
    purple: purpleTheme,
    green: greenTheme,
  };

  const baseTheme = themeMap[variant === 'auto' ? 'dark' : variant];

  // If light mode requested, generate light variant
  if (mode === 'light') {
    return generateLightTheme(baseTheme);
  }

  return baseTheme;
}

// Generate light theme from dark theme
function generateLightTheme(darkColors: MD3ColorScheme): MD3ColorScheme {
  // Material Design 3 light theme generation logic
  // (invert backgrounds, adjust contrasts)
  return {
    ...darkColors,
    background: '#FEFBFF',
    onBackground: '#1C1B1F',
    surface: '#FEFBFF',
    onSurface: '#1C1B1F',
    // ... rest of light theme transformations
  };
}
```

### Theme Provider Component

```typescript
// src/theme/ThemeProvider.tsx
import React from 'react';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { NavigationContainer, DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from '@react-navigation/native';
import { useThemeStore } from './themeStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, mode, colors } = useThemeStore();

  // React Native Paper theme
  const paperTheme = {
    ...(mode === 'dark' ? MD3DarkTheme : MD3LightTheme),
    colors: {
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      primaryContainer: colors.primaryContainer,
      onPrimaryContainer: colors.onPrimaryContainer,
      secondary: colors.secondary,
      onSecondary: colors.onSecondary,
      secondaryContainer: colors.secondaryContainer,
      onSecondaryContainer: colors.onSecondaryContainer,
      tertiary: colors.tertiary,
      onTertiary: colors.onTertiary,
      tertiaryContainer: colors.tertiaryContainer,
      onTertiaryContainer: colors.onTertiaryContainer,
      error: colors.error,
      onError: colors.onError,
      errorContainer: colors.errorContainer,
      onErrorContainer: colors.onErrorContainer,
      background: colors.background,
      onBackground: colors.onBackground,
      surface: colors.surface,
      onSurface: colors.onSurface,
      surfaceVariant: colors.surfaceVariant,
      onSurfaceVariant: colors.onSurfaceVariant,
      outline: colors.outline,
      outlineVariant: colors.outlineVariant,
      inverseSurface: colors.inverseSurface,
      inverseOnSurface: colors.inverseOnSurface,
      inversePrimary: colors.inversePrimary,
      shadow: colors.shadow,
      scrim: colors.scrim,
      surfaceDisabled: `${colors.onSurface}1F`, // 12% opacity
      onSurfaceDisabled: `${colors.onSurface}61`, // 38% opacity
      backdrop: `${colors.scrim}4D`, // 30% opacity
      // Surface tints
      elevation: {
        level0: colors.surface,
        level1: colors.surfaceContainerLow,
        level2: colors.surfaceContainer,
        level3: colors.surfaceContainerHigh,
        level4: colors.surfaceContainerHighest,
        level5: colors.surfaceContainerHighest,
      },
    },
    roundness: borderRadius.md,
  };

  // React Navigation theme
  const navigationTheme = {
    ...(mode === 'dark' ? NavDarkTheme : NavDefaultTheme),
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outlineVariant,
      notification: colors.error,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navigationTheme}>
        {children}
      </NavigationContainer>
    </PaperProvider>
  );
};
```

---

## 🎨 Modern UI Patterns

### 1. Glassmorphism Cards

```typescript
export const glassmorphismCard = {
  borderRadius: borderRadius.xl,
  padding: spacing.xxl,
  // Blur effect (use react-native-blur)
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.2)',
  // Shadow for depth
  ...elevation.level2,
};
```

### 2. Gradient Backgrounds

```typescript
// Use react-native-linear-gradient
export const gradients = {
  primary: ['#667eea', '#764ba2'],
  sunset: ['#fa709a', '#fee140'],
  ocean: ['#2E3192', '#1BFFFF'],
  forest: ['#134E5E', '#71B280'],
};
```

### 3. Smooth Skeleton Loaders

```typescript
// Animated loading states
import { Skeleton } from '@rneui/themed';

<Skeleton
  animation="wave"
  width="100%"
  height={120}
  style={{ borderRadius: borderRadius.md }}
/>
```

---

## ♿ Accessibility Features

### WCAG 2.1 Level AA Compliance

1. **Contrast Ratios**:
   - Text: Minimum 7:1 (AAA)
   - Interactive elements: Minimum 4.5:1 (AA)

2. **Touch Targets**:
   - Minimum: 48x48 dp
   - Recommended: 56x56 dp

3. **Focus Indicators**:
   - 2px outline on focus
   - High contrast color

4. **Screen Reader Support**:
   ```typescript
   <Button
     accessibilityLabel="Create new client"
     accessibilityHint="Opens form to add a new client"
     accessibilityRole="button"
   />
   ```

5. **Dynamic Type Support**:
   - Support system font scaling
   - Test up to 200% scaling

---

## 📦 Recommended Libraries

### Core UI Libraries

```bash
# Material Design 3 Components
pnpm add react-native-paper

# Navigation
pnpm add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
pnpm add react-native-screens react-native-safe-area-context

# Icons
pnpm add react-native-vector-icons
pnpm add @expo/vector-icons

# Animations
pnpm add react-native-reanimated

# State Management
pnpm add zustand
pnpm add @react-native-async-storage/async-storage

# Forms
pnpm add react-hook-form zod @hookform/resolvers

# Charts
pnpm add react-native-svg
pnpm add react-native-gifted-charts

# Gestures
pnpm add react-native-gesture-handler

# Blur Effects
pnpm add @react-native-community/blur

# Gradients
pnpm add react-native-linear-gradient

# Date/Time
pnpm add date-fns

# UI Utilities
pnpm add @rneui/themed
```

---

## 🎯 Implementation Checklist

- [ ] Install all required dependencies
- [ ] Set up theme store with Zustand
- [ ] Create theme provider wrapper
- [ ] Implement Material Design 3 color system
- [ ] Add multi-theme support (5 themes)
- [ ] Set up typography system
- [ ] Configure spacing tokens
- [ ] Add elevation/shadow system
- [ ] Implement animations with Reanimated
- [ ] Add accessibility labels
- [ ] Test contrast ratios (WCAG AA)
- [ ] Verify touch target sizes (48dp+)
- [ ] Test font scaling support
- [ ] Add screen reader support
- [ ] Implement dark/light mode toggle
- [ ] Add auto-theme based on system
- [ ] Test on various screen sizes
- [ ] Optimize performance

---

## 🚀 Modern Design Trends Applied

1. ✅ **Material Design 3 (Material You)**: Dynamic color, adaptive theming
2. ✅ **Glassmorphism**: Frosted glass effects on cards
3. ✅ **Neumorphism (subtle)**: Soft shadows for depth
4. ✅ **Micro-interactions**: Smooth animations on all interactions
5. ✅ **Gradient Accents**: Subtle gradients for visual interest
6. ✅ **Large Touch Targets**: 48dp+ for accessibility
7. ✅ **Rounded Corners**: Modern, friendly feel
8. ✅ **Consistent Spacing**: 4dp grid system
9. ✅ **Bold Typography**: Clear hierarchy
10. ✅ **Dark Mode First**: Optimized for low light

---

## 📚 Resources

- [Material Design 3](https://m3.material.io/)
- [React Native Paper v5](https://callstack.github.io/react-native-paper/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Material Theme Builder](https://m3.material.io/theme-builder)

---

**This design system provides a modern, accessible, and beautiful foundation for demiAdmin following Material Design 3 principles with multi-theme support.**
