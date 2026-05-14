/**
 * Material Design 3 Spacing System
 * Based on 4dp grid system
 *
 * Reference: https://m3.material.io/foundations/layout/applying-layout/spacing
 */

/**
 * Base spacing unit (4dp)
 */
const BASE_SPACING = 4;

/**
 * Spacing scale (multiples of 4dp)
 */
export const spacing = {
  /**
   * 0dp - No spacing
   */
  none: 0,

  /**
   * 2dp - Extra small spacing
   */
  xs: BASE_SPACING * 0.5,

  /**
   * 4dp - Small spacing
   */
  sm: BASE_SPACING,

  /**
   * 8dp - Medium spacing (commonly used for gaps)
   */
  md: BASE_SPACING * 2,

  /**
   * 12dp - Medium-large spacing
   */
  lg: BASE_SPACING * 3,

  /**
   * 16dp - Large spacing (commonly used for padding)
   */
  xl: BASE_SPACING * 4,

  /**
   * 20dp - Extra large spacing
   */
  xxl: BASE_SPACING * 5,

  /**
   * 24dp - Extra extra large spacing
   */
  xxxl: BASE_SPACING * 6,

  /**
   * 32dp - Huge spacing
   */
  huge: BASE_SPACING * 8,

  /**
   * 40dp - Extra huge spacing
   */
  xhuge: BASE_SPACING * 10,

  /**
   * 48dp - Maximum spacing
   */
  max: BASE_SPACING * 12,
} as const;

/**
 * Component-specific spacing (based on MD3 specs from docs)
 */
export const componentSpacing = {
  /**
   * 40dp - Button height (MD3 Filled Button)
   */
  buttonHeight: 40,

  /**
   * 48dp - Button height (extended)
   */
  buttonHeightExtended: 48,

  /**
   * 56dp - Text field height (MD3 Filled/Outlined)
   */
  textFieldHeight: 56,

  /**
   * 48dp - Minimum touch target
   */
  minTouchTarget: 48,

  /**
   * 56x56 - FAB size
   */
  fabSize: 56,

  /**
   * 40x40 - Icon button size
   */
  iconButtonSize: 40,

  /**
   * 48x48 - Extended icon button size
   */
  iconButtonSizeExtended: 48,

  /**
   * 64dp - Top App Bar height (MD3 Small)
   */
  topAppBarHeight: 64,

  /**
   * 80dp - Bottom Navigation height
   */
  bottomNavHeight: 80,

  /**
   * 72dp - Three-line list item height
   */
  listItemThreeLineHeight: 72,

  /**
   * 64dp - Two-line list item height
   */
  listItemTwoLineHeight: 64,

  /**
   * 40x40 - Avatar size (small)
   */
  avatarSmall: 40,

  /**
   * 80x80 - Avatar size (medium)
   */
  avatarMedium: 80,

  /**
   * 120x120 - Avatar size (large)
   */
  avatarLarge: 120,

  /**
   * 12dp - Card border radius
   */
  cardBorderRadius: 12,

  /**
   * 240x240 - QR Code size
   */
  qrCodeSize: 240,

  /**
   * 48x48 - OTP input box size
   */
  otpInputSize: 48,

  /**
   * 8dp - Gap between OTP inputs
   */
  otpInputGap: 8,
} as const;

/**
 * Helper function to get spacing value
 */
export const getSpacing = (multiplier: number): number => {
  return BASE_SPACING * multiplier;
};

/**
 * Insets for safe area (used with SafeAreaView)
 */
export const insets = {
  horizontal: spacing.xl, // 16dp
  vertical: spacing.xl, // 16dp
} as const;
