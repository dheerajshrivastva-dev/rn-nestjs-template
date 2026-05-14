// src/navigation/PublicStack.tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {PublicStackParamList} from './types';
import {AuthScreens} from './screens';
import {LoginScreen, SuperAdmin2FAScreen, ForgotPasswordScreen, ResetPasswordScreen} from '../screens/auth';
import {PinSetupScreen} from '../screens/auth/PinSetupScreen';
import {BiometricLoginScreen} from '../screens/auth/BiometricLoginScreen';
import {useAuthStore, selectHasBiometricSetup} from '../store/authStore';

const Stack = createNativeStackNavigator<PublicStackParamList>();

export default function PublicStack() {
  const hasBiometricSetup = useAuthStore(selectHasBiometricSetup);

  return (
    <Stack.Navigator
      // If biometric is set up, open the quick-login screen first
      initialRouteName={
        hasBiometricSetup ? AuthScreens.BiometricLogin : AuthScreens.Login
      }
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: 'transparent'},
      }}>

      {/* ── Full login (always registered so users can navigate back to it) ── */}
      <Stack.Screen
        name={AuthScreens.Login}
        options={{title: '', headerShown: false}}>
        {(props) => (
          <LoginScreen
            onNavigateTo2FA={({message, primaryMethod}) =>
              props.navigation.navigate(AuthScreens.OTP, {message, primaryMethod})
            }
            onLoginSuccess={(identifier?: string) => {
              // After first successful password login, guide through PIN setup
              if (identifier) {
                props.navigation.navigate(AuthScreens.PinSetup, {identifier});
              }
              // If no identifier (shouldn't happen), RootNavigator handles auth redirect
            }}
            onForgotPassword={() =>
              props.navigation.navigate(AuthScreens.ForgotPassword)
            }
          />
        )}
      </Stack.Screen>

      {/* ── OTP / 2FA verification ── */}
      <Stack.Screen
        name={AuthScreens.OTP}
        options={{title: '', headerShown: false, gestureEnabled: false}}>
        {(props) => (
          <SuperAdmin2FAScreen
            message={props.route.params?.message}
            primaryMethod={props.route.params?.primaryMethod}
            onBack={() => props.navigation.goBack()}
            onVerificationSuccess={() => {
              // RootNavigator detects isAuthenticated and switches to Private
            }}
          />
        )}
      </Stack.Screen>

      {/* ── Biometric quick-login ── */}
      <Stack.Screen
        name={AuthScreens.BiometricLogin}
        options={{title: '', headerShown: false, gestureEnabled: false}}>
        {(props) => (
          <BiometricLoginScreen
            onLoginSuccess={() => {
              // RootNavigator will detect isAuthenticated and switch to Private
            }}
            onUsePassword={() =>
              props.navigation.navigate(AuthScreens.Login)
            }
          />
        )}
      </Stack.Screen>

      {/* ── PIN setup (shown after first password login) ── */}
      <Stack.Screen
        name={AuthScreens.PinSetup}
        options={{
          title: '',
          headerShown: false,
          gestureEnabled: false, // Prevent swipe-back skipping setup
          animation: 'slide_from_bottom',
        }}>
        {(props) => (
          <PinSetupScreen
            identifier={props.route.params?.identifier ?? ''}
            onSetupComplete={() => {
              // RootNavigator will switch to Private once isAuthenticated
            }}
            onSkip={() => {
              // User skipped — RootNavigator handles the redirect
            }}
          />
        )}
      </Stack.Screen>

      {/* ── OTP / 2FA screen ── (already existed, kept here) ── */}
      {/* Note: the existing OTP screen is registered in AuthNavigator.tsx;
          if your OTP screen is registered there or in the private stack,
          you may remove the navigate call above or adjust the route. */}

      {/* ── Forgot Password ── */}
      <Stack.Screen
        name={AuthScreens.ForgotPassword}
        options={{title: '', headerShown: false}}>
        {(props) => (
          <ForgotPasswordScreen
            onSuccess={(tempToken) =>
              props.navigation.replace(AuthScreens.ResetPassword, {token: tempToken})
            }
            onBack={() => props.navigation.goBack()}
          />
        )}
      </Stack.Screen>

      {/* ── Reset Password ── */}
      <Stack.Screen
        name={AuthScreens.ResetPassword}
        options={{title: '', headerShown: false}}>
        {(props) => (
          <ResetPasswordScreen
            token={props.route.params?.token ?? ''}
            onBack={() => props.navigation.goBack()}
            onSuccess={() => props.navigation.navigate(AuthScreens.Login)}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
