/**
 * LoadingDialog Component
 * Dialog with loading spinner and message
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Portal, ActivityIndicator } from 'react-native-paper';
import { BodyMedium } from '../typography/BodyMedium';
import { useTheme } from '../../hooks/useTheme';

export interface LoadingDialogProps {
  /**
   * Whether dialog is visible
   */
  visible: boolean;

  /**
   * Loading message
   * @default 'Loading...'
   */
  message?: string;

  /**
   * Whether dialog can be dismissed
   * @default false
   */
  dismissable?: boolean;

  /**
   * Dismiss handler (if dismissable)
   */
  onDismiss?: () => void;
}

/**
 * LoadingDialog
 *
 * Dialog showing loading spinner with optional message.
 * Used for long-running operations.
 *
 * @example
 * // Basic loading dialog
 * <LoadingDialog
 *   visible={isLoading}
 *   message="Processing your request..."
 * />
 *
 * @example
 * // Dismissable loading dialog
 * <LoadingDialog
 *   visible={isUploading}
 *   message="Uploading files..."
 *   dismissable
 *   onDismiss={cancelUpload}
 * />
 */
export const LoadingDialog: React.FC<LoadingDialogProps> = ({
  visible,
  message = 'Loading...',
  dismissable = false,
  onDismiss,
}) => {
  const theme = useTheme();

  return (
    <Portal>
      <Dialog visible={visible} dismissable={dismissable} onDismiss={onDismiss}>
        <Dialog.Content>
          <View style={styles.container}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <BodyMedium style={styles.message}>{message}</BodyMedium>
          </View>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
});
