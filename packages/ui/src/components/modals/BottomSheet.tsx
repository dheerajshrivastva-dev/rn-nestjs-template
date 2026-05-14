/**
 * BottomSheet Component (2026)
 * Modern bottom sheet modal with gesture handling and snap points
 * Uses @gorhom/bottom-sheet BottomSheetModal for proper overlay behavior
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFooter,
} from '@gorhom/bottom-sheet';
import { useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from './BottomSheetScrollView';

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  /**
   * Node pinned above the keyboard / safe area — always visible.
   * Ideal for action buttons so they never scroll out of view.
   */
  footer?: React.ReactNode;
  snapPoints?: string[];
  dismissable?: boolean;
  enablePanDownToClose?: boolean;
  enableDynamicSizing?: boolean;
  /**
   * Wraps children in BottomSheetScrollView automatically.
   * Pass false only when you need full manual control (e.g. a FlatList).
   * @default true
   */
  scrollable?: boolean;
}

/**
 * BottomSheet Modal Component
 *
 * IMPORTANT: Renders as an overlay above all content (doesn't scroll with screen)
 * Requires BottomSheetModalProvider in App.tsx root
 *
 * Features:
 * - Absolutely positioned (appears over all content)
 * - Gesture-based dismissal (swipe down to close)
 * - Keyboard-aware (auto-adjusts when keyboard opens)
 * - Multiple snap points support
 * - Native Android/iOS feel
 * - `footer` prop: pinned footer row always visible above keyboard
 * - `scrollable` prop (default true): auto-wraps content in BottomSheetScrollView
 *
 * @example
 * // With pinned footer and auto-scroll
 * <BottomSheet
 *   visible={visible}
 *   onDismiss={onDismiss}
 *   snapPoints={['60%']}
 *   footer={
 *     <Row gap={8} style={{ padding: 16 }}>
 *       <TextButton onPress={onDismiss}>Cancel</TextButton>
 *       <FilledButton onPress={handleSubmit}>Confirm</FilledButton>
 *     </Row>
 *   }
 * >
 *   <TextField label="Reason" />
 * </BottomSheet>
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onDismiss,
  children,
  footer,
  snapPoints: customSnapPoints,
  dismissable = true,
  enablePanDownToClose = true,
  enableDynamicSizing = false,
  scrollable = true,
}) => {
  const theme = useTheme();
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(
    () => customSnapPoints || ['50%', '80%'],
    [customSnapPoints],
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={dismissable ? 'close' : 'none'}
        opacity={0.5}
      />
    ),
    [dismissable],
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => {
      if (!footer) {
        return null;
      }
      return (
        <BottomSheetFooter {...props}>
          <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
            {footer}
          </View>
        </BottomSheetFooter>
      );
    },
    [footer, theme],
  );

  const styles = createStyles(theme);

  const content = scrollable ? (
    <BottomSheetScrollView>{children}</BottomSheetScrollView>
  ) : (
    children
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose={enablePanDownToClose}
      enableDynamicSizing={enableDynamicSizing}
      backdropComponent={renderBackdrop}
      footerComponent={footer ? renderFooter : undefined}
      onDismiss={onDismiss}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
      style={styles.sheet}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {content}
    </BottomSheetModal>
  );
};

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    sheet: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
    },
    background: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    handleIndicator: {
      backgroundColor: theme.colors.onSurfaceVariant,
      width: 32,
      height: 4,
      borderRadius: 2,
      opacity: 0.4,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
    },
  });
