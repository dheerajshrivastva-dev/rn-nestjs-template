/**
 * Root Navigator (2026 - Public/Private Stack Architecture)
 * Routes users based on authentication
 * - Not authenticated -> PublicStack (Login, OTP, etc.)
 * - Authenticated -> PrivateRoot (Role-based drawer navigation)
 *
 * IMPORTANT: Uses centralized screen names from screens.ts
 */

import React, { useEffect } from 'react';

import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {GlobalBottomSheets} from '../components/GlobalBottomSheets';
import {SplashVideoScreen} from '../screens/splash/SplashVideoScreen';
import {useMe} from '../hooks';
import {
  useAuthStore,
  selectIsAuthenticated,
  selectPendingBiometricVerification,
  selectPendingPinSetup,
  selectPendingPinSetupIdentifier,
  selectPendingRoute,
  selectSessionExpired,
} from '../store/authStore';
import {clearAllBiometricData} from '../utils/biometricStorage';
import {BiometricLoginScreen} from '../screens/auth/BiometricLoginScreen';
import {PinSetupScreen} from '../screens/auth/PinSetupScreen';
import NotificationService from '../services/NotificationService';
import SocketService from '../services/SocketService';
import {TokenManager} from '../api/client';

import {linkingPrefixes, deepLinkingConfig} from './configs';
import PrivateRoot from './private/PrivateRoot';
import PublicStack from './PublicStack';
import type {RootStackParamList} from './types';

/**
 * Wraps PrivateRoot so that NotificationService knows the Private stack is
 * truly mounted (not just "auth state changed"). FCM intents stored while
 * the user was logged out are flushed here via the mount lifecycle.
 */
const PrivateRootWithFCM: React.FC = () => {
  React.useEffect(() => {
    NotificationService.onPrivateMounted();
    return () => NotificationService.onPrivateUnmounted();
  }, []);
  return <PrivateRoot />;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const disableBio = false; // DEV FLAG - set to true to skip biometric verification step and go straight to PIN setup after login (for testing PIN setup without needing biometrics)

export const RootNavigator: React.FC = () => {
  // Skip splash when a token already exists (returning user / re-open after background)
  const [splashDone, setSplashDone] = React.useState(() => TokenManager.hasAccessToken());
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const pendingBiometricVerification = useAuthStore(selectPendingBiometricVerification);
  const pendingPinSetup = useAuthStore(selectPendingPinSetup);
  const pendingPinSetupIdentifier = useAuthStore(selectPendingPinSetupIdentifier);
  const {logout, clearPendingPinSetup, setHasBiometricSetup, setPendingRoute} = useAuthStore();
  const sessionExpired = useAuthStore(selectSessionExpired);
  const pendingRoute = useAuthStore(selectPendingRoute);
  const user = useAuthStore(state => state.user);
  const navigationRef = React.useRef<any>(null);

  // "Use password instead" from the biometric verification screen:
  // clear biometric data and log out so the user lands on the full login form.
  const handleBiometricUsePassword = React.useCallback(async () => {
    await clearAllBiometricData();
    setHasBiometricSetup(false);
    await logout();
  }, [logout, setHasBiometricSetup]);

  // Initialise / cleanup FCM + WebSocket whenever authentication state changes
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      NotificationService.init(navigationRef, user.role);
      // Connect WebSocket using the stored access token
      const token = TokenManager.getAccessToken();
      if (token) {
        SocketService.connect(token);
      }
    }
    return () => {
      if (!isAuthenticated) {
        // cleanup is also called inside logout — this handles edge cases
        NotificationService.cleanup();
        SocketService.disconnect();
      }
    };
  }, [isAuthenticated, user?.role]);

  // When session expires while the user is inside the app, snapshot the current
  // route so we can navigate back there after they log in again.
  useEffect(() => {
    if (sessionExpired && navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute();
      if (currentRoute) {
        setPendingRoute({ name: currentRoute.name, params: currentRoute.params });
      }
    }
  }, [sessionExpired, setPendingRoute]);

  // After successful re-login, navigate back to where the user was.
  useEffect(() => {
    if (isAuthenticated && pendingRoute && navigationRef.current) {
      // Give the navigator a tick to mount the private stack before navigating
      setTimeout(() => {
        try {
          navigationRef.current?.navigate(pendingRoute.name, pendingRoute.params);
        } catch {
          // Screen may not be in the current stack (e.g. role changed) — silently ignore
        }
      }, 100);
    }
  }, [isAuthenticated, pendingRoute]);


  // Mount useMe so it fires automatically when isAuthenticated becomes true.
  // No manual refetch needed — the query's `enabled: isAuthenticated` handles it,
  // and login/2FA mutations already seed the cache via setQueryData.
  const { refetch } = useMe();

  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [isAuthenticated, refetch]);

  // Navigation state logger
  const onNavigationStateChange = React.useCallback((state: any) => {
    if (!state) return;

    // Get current route
    const getCurrentRoute = (navState: any): any => {
      if (!navState || !navState.routes || navState.routes.length === 0) {
        return null;
      }
      const route = navState.routes[navState.index || 0];
      if (route.state) {
        return getCurrentRoute(route.state);
      }
      return route;
    };

    // Get navigation stack
    const getNavigationStack = (navState: any, stack: string[] = []): string[] => {
      if (!navState || !navState.routes || navState.routes.length === 0) {
        return stack;
      }

      navState.routes.forEach((route: any, index: number) => {
        const isActive = index === (navState.index || 0);
        const prefix = isActive ? '→' : ' ';
        stack.push(`${prefix} ${route.name}${route.params ? ` (${JSON.stringify(route.params)})` : ''}`);

        if (route.state && isActive) {
          getNavigationStack(route.state, stack);
        }
      });

      return stack;
    };

    const currentRoute = getCurrentRoute(state);
    const navigationStack = getNavigationStack(state);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 NAVIGATION STATE CHANGED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Current Screen:', currentRoute?.name || 'Unknown');
    if (currentRoute?.params) {
      console.log('📦 Params:', JSON.stringify(currentRoute.params, null, 2));
    }
    console.log('\n📚 Navigation Stack:');
    navigationStack.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }, []);

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        linking={{
          prefixes: linkingPrefixes,
          config: deepLinkingConfig,
        }}
        onStateChange={onNavigationStateChange}
      >
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {!splashDone ? (
            // Video splash screen — shown once on app launch
            <Stack.Screen name="Splash">
              {() => <SplashVideoScreen onFinish={() => setSplashDone(true)} />}
            </Stack.Screen>
          ) : !disableBio && pendingBiometricVerification ? (
            // Tokens exist but biometric not yet verified this session
            <Stack.Screen name="BiometricVerification">
              {() => (
                <BiometricLoginScreen
                  onLoginSuccess={() => {/* setBiometricVerified() called in hook; store drives navigation */}}
                  onUsePassword={handleBiometricUsePassword}
                />
              )}
            </Stack.Screen>
          ) : isAuthenticated && pendingPinSetup && !disableBio ? (
            // Just completed password login — guide through PIN/fingerprint setup
            <Stack.Screen name="PinSetup">
              {() => (
                <PinSetupScreen
                  identifier={pendingPinSetupIdentifier}
                  onSetupComplete={clearPendingPinSetup}
                  onSkip={clearPendingPinSetup}
                />
              )}
            </Stack.Screen>
          ) : !isAuthenticated ? (
            // Public Stack - Auth screens (Login, OTP, etc.)
            <Stack.Screen name="Public" component={PublicStack} />
          ) : (
            // Private Root - Role-based drawer navigation
            <Stack.Screen name="Private" component={PrivateRootWithFCM} />
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Global Bottom Sheets - Rendered once at root level */}
      <GlobalBottomSheets />
    </>
  );
};
