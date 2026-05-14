import Toast from 'react-native-toast-message';

/**
 * useToast
 *
 * Thin wrapper around react-native-toast-message with typed helpers
 * for success / error / info toasts.
 *
 * Requires <ToastRoot /> mounted once at the app root (above everything).
 *
 * @example
 * const toast = useToast();
 * toast.success('Saved!');
 * toast.error('Login failed', 'Invalid credentials');
 * toast.info('Syncing…');
 */
export const useToast = () => ({
  success: (message: string, description?: string) =>
    Toast.show({ type: 'success', text1: message, text2: description }),

  error: (message: string, description?: string) =>
    Toast.show({ type: 'error', text1: message, text2: description }),

  info: (message: string, description?: string) =>
    Toast.show({ type: 'info', text1: message, text2: description }),

  hide: () => Toast.hide(),
});
