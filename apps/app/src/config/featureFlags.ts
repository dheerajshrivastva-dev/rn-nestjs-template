/**
 * Feature Flags
 *
 * Toggle incomplete or in-progress features without touching business logic.
 * Set a flag to `false` to disable the feature entirely.
 */

export const FEATURES = {
  /**
   * PIN entry on the quick-login (BiometricLoginScreen) and PIN setup step
   * in PinSetupScreen.
   *
   * Currently disabled — after PIN verification the flow incorrectly triggers
   * the OS fingerprint prompt via useBiometricLogin / signBiometricChallenge.
   * Re-enable once a dedicated PIN-only server auth flow is implemented.
   *
   * Fingerprint login is unaffected by this flag.
   */
  PIN_LOGIN: false,
} as const;
