/**
 * forge-app Entry Point
 * Material Design 3 Multi-role Admin Application
 *
 * Features:
 * - Role-based dashboards (Super Admin, Admin/Owner, User)
 * - Material Design 3 UI with multi-theme support
 * - Proper safe area handling for all devices
 * - Drawer navigation with AppBar
 * - State management with Zustand
 * - API integration with TanStack Query
 *
 * Safe Area Strategy:
 * - SafeAreaProvider at root level
 * - StatusBar with translucent mode
 * - AppBar handles top safe area
 * - BottomNavigation handles bottom safe area (home indicator)
 * - Drawer handles all safe areas
 */

import React, {useEffect} from 'react';
import {StyleSheet, StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import RNBootSplash from 'react-native-bootsplash';
import {ThemeProvider, ToastRoot} from '@forge/ui';
import {QueryProvider} from './src/providers/QueryProvider';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useAuthStore, selectUser} from './src/store/authStore';
import {useSettingsStore, getThemeKeyForRole} from './src/store/settingsStore';
import {UserRole} from './src/api/types';
import {useAppUpdate} from './src/hooks/useAppUpdate';
import {AppUpdateDialog} from './src/components/AppUpdateDialog';
import {requestAllPermissions} from './src/utils/permissions';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://9c54ce24cea3e7371c39687bc441c1c8@o4510928224387072.ingest.us.sentry.io/4510928233037824',

  // Disable Sentry in development mode
  enabled: !__DEV__,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,
  integrations: [Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function App() {
  const isDark = useSettingsStore((s) => s.isDark);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const fontScale = fontSize === 'small' ? 0.85 : fontSize === 'large' ? 1.15 : 1;
  const user = useAuthStore(selectUser);
  const role = user?.role ?? UserRole.RETAILER;
  const themeKey = getThemeKeyForRole(role, isDark);
  const {initialize} = useAuthStore();
  const {state, checkForUpdate, downloadAndInstall, dismiss, retryInstall} =
    useAppUpdate();

  // Initialize auth state on app start, then check for updates
  useEffect(() => {
    const init = async () => {
      await initialize();
      await RNBootSplash.hide({fade: true});
      // Request all runtime permissions after splash
      requestAllPermissions();
      // Check for update after splash — non-blocking
      checkForUpdate();
    };

    init();
  }, [initialize, checkForUpdate]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider theme={themeKey} fontScale={fontScale}>
          <QueryProvider>
            <BottomSheetModalProvider>
              <StatusBar
                barStyle={themeKey.endsWith('-dark') ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
              />

              {/* Root navigation with auth and main app */}
              <RootNavigator />

              {/* In-app update dialog — renders on top of everything */}
              <AppUpdateDialog
                state={state}
                onUpdate={downloadAndInstall}
                onDismiss={dismiss}
                onRetryInstall={retryInstall}
              />

              {/* Toast notifications — must be last so it renders above all */}
              <ToastRoot />
            </BottomSheetModalProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Sentry.wrap(App);