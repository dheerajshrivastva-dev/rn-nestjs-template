/**
 * ConfirmDialog Component
 * Confirmation dialog with Yes/No actions
 */

import React from 'react';
import { Dialog, Portal } from 'react-native-paper';
import { FilledButton } from '../buttons/FilledButton';
import { TextButton } from '../buttons/TextButton';
import { BodyMedium } from '../typography/BodyMedium';

export interface ConfirmDialogProps {
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
   * Confirm button text
   * @default 'Confirm'
   */
  confirmText?: string;

  /**
   * Cancel button text
   * @default 'Cancel'
   */
  cancelText?: string;

  /**
   * Confirm handler
   */
  onConfirm: () => void;

  /**
   * Cancel handler
   */
  onCancel: () => void;

  /**
   * Whether to show loading state
   * @default false
   */
  loading?: boolean;
}

/**
 * ConfirmDialog
 *
 * Confirmation dialog for user actions.
 * Provides confirm and cancel buttons.
 *
 * @example
 * // Basic confirm dialog
 * <ConfirmDialog
 *   visible={showDialog}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDialog(false)}
 * />
 *
 * @example
 * // With custom button text and loading
 * <ConfirmDialog
 *   visible={showDialog}
 *   title="Submit Application"
 *   message="Once submitted, you cannot edit this application."
 *   confirmText="Submit"
 *   cancelText="Review"
 *   loading={isSubmitting}
 *   onConfirm={submitApplication}
 *   onCancel={closeDialog}
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <BodyMedium>{message}</BodyMedium>
        </Dialog.Content>
        <Dialog.Actions>
          <TextButton onPress={onCancel} disabled={loading}>
            {cancelText}
          </TextButton>
          <FilledButton style={{ paddingHorizontal: 8 }} onPress={onConfirm} loading={loading} disabled={loading}>
            {confirmText}
          </FilledButton>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};
