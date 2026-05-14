/**
 * Material Design 3 Typography System
 * Type scale based on MD3 specifications
 *
 * IMPORTANT: This typography system respects device font size settings for accessibility.
 * Font sizes scale automatically when users change their device's text size in Settings.
 *
 * Reference: https://m3.material.io/styles/typography/type-scale-tokens
 */

import { PixelRatio } from 'react-native';

export interface MD3TextVariant {
  fontFamily: string;
  fontSize: number;
  fontWeight: '400' | '500' | '700';
  lineHeight: number;
  letterSpacing: number;
}

export interface MD3Typography {
  // Display
  displayLarge: MD3TextVariant;
  displayMedium: MD3TextVariant;
  displaySmall: MD3TextVariant;

  // Headline
  headlineLarge: MD3TextVariant;
  headlineMedium: MD3TextVariant;
  headlineSmall: MD3TextVariant;

  // Title
  titleLarge: MD3TextVariant;
  titleMedium: MD3TextVariant;
  titleSmall: MD3TextVariant;

  // Body
  bodyLarge: MD3TextVariant;
  bodyMedium: MD3TextVariant;
  bodySmall: MD3TextVariant;

  // Label
  labelLarge: MD3TextVariant;
  labelMedium: MD3TextVariant;
  labelSmall: MD3TextVariant;
}

/**
 * Get the current device font scale
 * Returns a multiplier based on the user's font size preference
 * Default: 1.0, Range: typically 0.85 - 2.0 (can be higher for accessibility)
 */
const getFontScale = (): number => {
  return PixelRatio.getFontScale();
};

/**
 * Inter Font Family Names
 * These must match the exact font file names (without .ttf extension)
 */
const fontFamilies = {
  regular: 'Inter-Regular',      // Weight 400
  medium: 'Inter-Medium',         // Weight 500
  semiBold: 'Inter-SemiBold',     // Weight 600
  bold: 'Inter-Bold',             // Weight 700
};

/**
 * Helper function to get font family based on weight
 */
const getFontFamily = (weight: '400' | '500' | '700'): string => {
  switch (weight) {
    case '400':
      return fontFamilies.regular;
    case '500':
      return fontFamilies.medium;
    case '700':
      return fontFamilies.bold;
    default:
      return fontFamilies.regular;
  }
};

/**
 * Base MD3 font sizes (before scaling)
 * These will be multiplied by the device's font scale
 */
const baseFontSizes = {
  displayLarge: 57,
  displayMedium: 45,
  displaySmall: 36,
  headlineLarge: 32,
  headlineMedium: 28,
  headlineSmall: 24,
  titleLarge: 22,
  titleMedium: 16,
  titleSmall: 14,
  bodyLarge: 16,
  bodyMedium: 14,
  bodySmall: 12,
  labelLarge: 14,
  labelMedium: 12,
  labelSmall: 11,
};

/**
 * Base line heights (before scaling)
 */
const baseLineHeights = {
  displayLarge: 64,
  displayMedium: 52,
  displaySmall: 44,
  headlineLarge: 40,
  headlineMedium: 36,
  headlineSmall: 32,
  titleLarge: 28,
  titleMedium: 24,
  titleSmall: 20,
  bodyLarge: 24,
  bodyMedium: 20,
  bodySmall: 16,
  labelLarge: 20,
  labelMedium: 16,
  labelSmall: 16,
};

/**
 * Create typography scale with font scaling support
 * This function generates the typography scale based on the current device font scale
 */
const createTypography = (): MD3Typography => {
  const fontScale = getFontScale();

  return {
    // Display - Large, expressive text
    displayLarge: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.displayLarge * fontScale,
      fontWeight: '400',
      lineHeight: baseLineHeights.displayLarge * fontScale,
      letterSpacing: -0.25,
    },
    displayMedium: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.displayMedium * fontScale,
      fontWeight: '400',
      lineHeight: baseLineHeights.displayMedium * fontScale,
      letterSpacing: 0,
    },
    displaySmall: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.displaySmall * fontScale, // Used in docs for main titles
      fontWeight: '400',
      lineHeight: baseLineHeights.displaySmall * fontScale,
      letterSpacing: 0,
    },

    // Headline - High-emphasis text
    headlineLarge: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.headlineLarge * fontScale,
      fontWeight: '400',
      lineHeight: baseLineHeights.headlineLarge * fontScale,
      letterSpacing: 0,
    },
    headlineMedium: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.headlineMedium * fontScale, // Used in docs for modal titles
      fontWeight: '400',
      lineHeight: baseLineHeights.headlineMedium * fontScale,
      letterSpacing: 0,
    },
    headlineSmall: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.headlineSmall * fontScale, // Used in docs for section headers
      fontWeight: '400',
      lineHeight: baseLineHeights.headlineSmall * fontScale,
      letterSpacing: 0,
    },

    // Title - Medium-emphasis text
    titleLarge: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.titleLarge * fontScale,
      fontWeight: '400',
      lineHeight: baseLineHeights.titleLarge * fontScale,
      letterSpacing: 0,
    },
    titleMedium: {
      fontFamily: getFontFamily('500'),
      fontSize: baseFontSizes.titleMedium * fontScale, // Used in docs for list section headers
      fontWeight: '500',
      lineHeight: baseLineHeights.titleMedium * fontScale,
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontFamily: getFontFamily('500'),
      fontSize: baseFontSizes.titleSmall * fontScale,
      fontWeight: '500',
      lineHeight: baseLineHeights.titleSmall * fontScale,
      letterSpacing: 0.1,
    },

    // Body - Standard text
    bodyLarge: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.bodyLarge * fontScale,
      fontWeight: '400',
      lineHeight: baseLineHeights.bodyLarge * fontScale,
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.bodyMedium * fontScale, // Used in docs for standard body text
      fontWeight: '400',
      lineHeight: baseLineHeights.bodyMedium * fontScale,
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontFamily: getFontFamily('400'),
      fontSize: baseFontSizes.bodySmall * fontScale,
      fontWeight: '400',
      lineHeight: baseLineHeights.bodySmall * fontScale,
      letterSpacing: 0.4,
    },

    // Label - Utility text
    labelLarge: {
      fontFamily: getFontFamily('500'),
      fontSize: baseFontSizes.labelLarge * fontScale,
      fontWeight: '500',
      lineHeight: baseLineHeights.labelLarge * fontScale,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontFamily: getFontFamily('500'),
      fontSize: baseFontSizes.labelMedium * fontScale, // Used in docs for field labels
      fontWeight: '500',
      lineHeight: baseLineHeights.labelMedium * fontScale,
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontFamily: getFontFamily('500'),
      fontSize: baseFontSizes.labelSmall * fontScale,
      fontWeight: '500',
      lineHeight: baseLineHeights.labelSmall * fontScale,
      letterSpacing: 0.5,
    },
  };
};

/**
 * Material Design 3 Typography Scale
 * This is generated dynamically based on the device's font scale setting
 */
export const typography: MD3Typography = createTypography();

/**
 * Create typography with an additional app-level scale multiplier.
 * Combines device font scale with the user's in-app font size preference.
 *
 * @param appScale - extra multiplier: small=0.85, medium=1.0, large=1.15
 */
export const createTypographyWithAppScale = (appScale: number): MD3Typography => {
  const fontScale = getFontScale() * appScale;

  return {
    displayLarge:  { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.displayLarge  * fontScale, fontWeight: '400', lineHeight: baseLineHeights.displayLarge  * fontScale, letterSpacing: -0.25 },
    displayMedium: { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.displayMedium * fontScale, fontWeight: '400', lineHeight: baseLineHeights.displayMedium * fontScale, letterSpacing: 0 },
    displaySmall:  { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.displaySmall  * fontScale, fontWeight: '400', lineHeight: baseLineHeights.displaySmall  * fontScale, letterSpacing: 0 },
    headlineLarge:  { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.headlineLarge  * fontScale, fontWeight: '400', lineHeight: baseLineHeights.headlineLarge  * fontScale, letterSpacing: 0 },
    headlineMedium: { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.headlineMedium * fontScale, fontWeight: '400', lineHeight: baseLineHeights.headlineMedium * fontScale, letterSpacing: 0 },
    headlineSmall:  { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.headlineSmall  * fontScale, fontWeight: '400', lineHeight: baseLineHeights.headlineSmall  * fontScale, letterSpacing: 0 },
    titleLarge:  { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.titleLarge  * fontScale, fontWeight: '400', lineHeight: baseLineHeights.titleLarge  * fontScale, letterSpacing: 0 },
    titleMedium: { fontFamily: getFontFamily('500'), fontSize: baseFontSizes.titleMedium * fontScale, fontWeight: '500', lineHeight: baseLineHeights.titleMedium * fontScale, letterSpacing: 0.15 },
    titleSmall:  { fontFamily: getFontFamily('500'), fontSize: baseFontSizes.titleSmall  * fontScale, fontWeight: '500', lineHeight: baseLineHeights.titleSmall  * fontScale, letterSpacing: 0.1 },
    bodyLarge:  { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.bodyLarge  * fontScale, fontWeight: '400', lineHeight: baseLineHeights.bodyLarge  * fontScale, letterSpacing: 0.5 },
    bodyMedium: { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.bodyMedium * fontScale, fontWeight: '400', lineHeight: baseLineHeights.bodyMedium * fontScale, letterSpacing: 0.25 },
    bodySmall:  { fontFamily: getFontFamily('400'), fontSize: baseFontSizes.bodySmall  * fontScale, fontWeight: '400', lineHeight: baseLineHeights.bodySmall  * fontScale, letterSpacing: 0.4 },
    labelLarge:  { fontFamily: getFontFamily('500'), fontSize: baseFontSizes.labelLarge  * fontScale, fontWeight: '500', lineHeight: baseLineHeights.labelLarge  * fontScale, letterSpacing: 0.1 },
    labelMedium: { fontFamily: getFontFamily('500'), fontSize: baseFontSizes.labelMedium * fontScale, fontWeight: '500', lineHeight: baseLineHeights.labelMedium * fontScale, letterSpacing: 0.5 },
    labelSmall:  { fontFamily: getFontFamily('500'), fontSize: baseFontSizes.labelSmall  * fontScale, fontWeight: '500', lineHeight: baseLineHeights.labelSmall  * fontScale, letterSpacing: 0.5 },
  };
};

/**
 * Helper function to get text variant style
 */
export const getTextStyle = (variant: keyof MD3Typography): MD3TextVariant => {
  return typography[variant];
};

/**
 * Font weights as constants
 */
export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  bold: '700' as const,
};
