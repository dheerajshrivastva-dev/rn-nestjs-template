/**
 * AlertDialog Component
 * Alert dialog with single action button
 */

import React from 'react';
import { Dialog, Portal } from 'react-native-paper';
import { FilledButton } from '../buttons/FilledButton';
import { BodyMedium } from '../typography/BodyMedium';

export interface AlertDialogProps {
  /**
   * Whether dialog is visible
   */
  visible: boolean;

  /**
   * Dialog title
   */
  title: string;

  /**
   * Dialog message
   */
  message: string;

  /**
   * Button text
   * @default 'OK'
   */
  buttonText?: string;

  /**
   * Button press handler
   */
  onPress: () => void;

  /**
   * Icon name (MaterialCommunityIcons)
   */
  icon?: string;
}

/**
 * AlertDialog
 *
 * Simple alert dialog with informational message.
 * Single action button to dismiss.
 *
 * @example
 * // Basic alert dialog
 * <AlertDialog
 *   visible={showAlert}
 *   title="Success"
 *   message="Your changes have been saved successfully."
 *   onPress={() => setShowAlert(false)}
 * />
 *
 * @example
 * // Error alert with custom button text
 * <AlertDialog
 *   visible={showError}
 *   title="Error"
 *   message="Something went wrong. Please try again."
 *   buttonText="Retry"
 *   onPress={retryAction}
 * />
 */
export const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  title,
  message,
  buttonText = 'OK',
  onPress,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onPress}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <BodyMedium>{message}</BodyMedium>
        </Dialog.Content>
        <Dialog.Actions>
          <FilledButton style={{ paddingHorizontal: 12 }} onPress={onPress}>{buttonText}</FilledButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
