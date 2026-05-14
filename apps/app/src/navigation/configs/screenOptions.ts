/**
 * Common Screen Options Configuration
 * Defines reusable screen options for navigation
 *
 * Usage:
 * ```ts
 * import { modalScreenOptions, detailScreenOptions } from '../configs/screenOptions';
 *
 * <Stack.Screen
 *   name="CreateCompany"
 *   component={CreateCompanyScreen}
 *   options={modalScreenOptions('Create Company')}
 * />
 * ```
 */

import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createStackHeaderOptions } from '@forge/ui';

/**
 * Default screen options (no header)
 */
export const defaultScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
};

/**
 * Modal screen options
 * Used for screens presented as modals (slide up from bottom)
 *
 * @param title - Screen title
 * @param showBack - Show back button (default: false)
 * @param showClose - Show close button (default: true)
 */
export function modalScreenOptions(
  title: string,
  options?: {
    showBack?: boolean;
    showClose?: boolean;
    showSave?: boolean;
    onSavePress?: () => void;
  }
): NativeStackNavigationOptions {
  return {
    presentation: 'modal',
    animation: 'slide_from_bottom',
    ...createStackHeaderOptions({
      title,
      showBack: options?.showBack ?? false,
      showClose: options?.showClose ?? true,
    }),
  };
}

/**
 * Detail screen options
 * Used for detail/view screens (push navigation)
 *
 * @param title - Screen title
 */
export function detailScreenOptions(title: string): NativeStackNavigationOptions {
  return {
    animation: 'slide_from_right',
    ...createStackHeaderOptions({
      title,
      showBack: true,
      showClose: false,
    }),
  };
}

/**
 * Edit screen options
 * Used for edit/form screens with save action
 *
 * @param title - Screen title
 */
export function editScreenOptions(title: string): NativeStackNavigationOptions {
  return {
    animation: 'slide_from_right',
    ...createStackHeaderOptions({
      title,
      showBack: true,
      showClose: false,
    }),
  };
}

/**
 * Fullscreen modal options
 * Used for multi-step forms or complex modals
 *
 * @param title - Screen title
 */
export function fullscreenModalOptions(title: string): NativeStackNavigationOptions {
  return {
    presentation: 'fullScreenModal',
    animation: 'slide_from_bottom',
    ...createStackHeaderOptions({
      title,
      showBack: false,
      showClose: true,
    }),
  };
}

/**
 * Card modal options
 * Used for smaller modals with card presentation
 *
 * @param title - Screen title
 */
export function cardModalOptions(title: string): NativeStackNavigationOptions {
  return {
    presentation: 'card',
    animation: 'fade_from_bottom',
    ...createStackHeaderOptions({
      title,
      showBack: false,
      showClose: true,
    }),
  };
}

/**
 * Transparent modal options
 * Used for overlays and bottom sheets
 */
export const transparentModalOptions: NativeStackNavigationOptions = {
  presentation: 'transparentModal',
  animation: 'fade',
  headerShown: false,
};

/**
 * Drawer screen options
 * Used for main drawer screens (no header - handled by AppBar)
 */
export const drawerScreenOptions: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'fade',
};
