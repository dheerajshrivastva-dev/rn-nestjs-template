/**
 * Error Store - Zustand
 * Drives the global AlertDialog for API errors.
 * The API interceptor calls showError(); GlobalErrorDialog renders the result.
 */

import { create } from 'zustand';

interface ErrorState {
  title: string;
  message: string;
  visible: boolean;
  showError: (title: string, message: string) => void;
  dismiss: () => void;
}

export const useErrorStore = create<ErrorState>(set => ({
  title: '',
  message: '',
  visible: false,
  showError: (title, message) => set({ title, message, visible: true }),
  dismiss: () => set({ visible: false }),
}));
