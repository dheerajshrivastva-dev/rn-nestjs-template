/**
 * GlobalErrorDialog
 * Renders a single AlertDialog driven by useErrorStore.
 * Mount this once at root level (GlobalBottomSheets).
 */

import React from 'react';
import { AlertDialog } from '@forge/ui';
import { useErrorStore } from '../store/errorStore';

export const GlobalErrorDialog: React.FC = () => {
  const { visible, title, message, dismiss } = useErrorStore();

  return (
    <AlertDialog
      visible={visible}
      title={title}
      message={message}
      onPress={dismiss}
    />
  );
};
