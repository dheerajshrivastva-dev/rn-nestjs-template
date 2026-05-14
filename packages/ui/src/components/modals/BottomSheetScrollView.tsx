/**
 * BottomSheetScrollView Component (2026)
 * Keyboard-aware scrollable content for BottomSheet with proper gesture handling
 * Automatically adjusts when keyboard appears
 */

import React from 'react';
import type { ScrollViewProps } from 'react-native';
import { Platform } from 'react-native';
import { BottomSheetScrollView as GorhomBottomSheetScrollView } from '@gorhom/bottom-sheet';

export type BottomSheetScrollViewProps = Omit<ScrollViewProps, 'ref'> & {
  children?: React.ReactNode;
  /**
   * Whether keyboard should persist taps
   * @default 'handled'
   */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
};

/**
 * Keyboard-aware scrollable wrapper for BottomSheet content
 *
 * IMPORTANT: Use this instead of regular ScrollView inside BottomSheet
 * for proper gesture handling, scroll-to-dismiss, and keyboard avoidance.
 *
 * Features:
 * - Automatic keyboard avoidance (form fields stay visible)
 * - Gesture-based scrolling with native feel
 * - Pull-to-dismiss bottom sheet support
 * - Cross-platform keyboard handling
 *
 * @example
 * <BottomSheet>
 *   <BottomSheetScrollView>
 *     <TextField label="Name" />
 *     <TextField label="Email" />
 *   </BottomSheetScrollView>
 * </BottomSheet>
 */
export const BottomSheetScrollView: React.FC<BottomSheetScrollViewProps> = ({
  children,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  ...props
}) => {
  return (
    <GorhomBottomSheetScrollView
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      bounces={Platform.OS === 'ios'}
      overScrollMode="never"
      {...props}
    >
      {children}
    </GorhomBottomSheetScrollView>
  );
};
