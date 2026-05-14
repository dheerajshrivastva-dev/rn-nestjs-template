/**
 * useOtpResendCooldown
 *
 * Manages a monotonically increasing cooldown between OTP resend attempts.
 * Each successive call doubles the wait time up to a configured maximum.
 *
 * Cooldown schedule (defaults): 30s → 60s → 120s → 240s → 300s (capped)
 *
 * State persists for the lifetime of the component — if the user dismisses
 * and reopens the sheet the countdown continues from where it left off.
 *
 * Usage:
 *   const { secondsLeft, canResend, startCooldown, reset } = useOtpResendCooldown();
 *
 *   // After sending/resending an OTP:
 *   startCooldown();
 *
 *   // Render:
 *   canResend
 *     ? <Button onPress={handleResend}>Resend OTP</Button>
 *     : <Text>Resend in {secondsLeft}s</Text>
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseOtpResendCooldownOptions {
  /** Initial cooldown in seconds. @default 30 */
  initialSeconds?: number;
  /** Multiplier applied on each successive resend. @default 2 */
  multiplier?: number;
  /** Hard cap in seconds. @default 300 (5 min) */
  maxSeconds?: number;
}

interface UseOtpResendCooldownResult {
  /** Seconds remaining in the current cooldown (0 when ready). */
  secondsLeft: number;
  /** True when the cooldown has elapsed and a resend is allowed. */
  canResend: boolean;
  /** Call after every OTP send/resend to start the next cooldown. */
  startCooldown: () => void;
  /** Resets attempt count and cooldown (e.g. on sheet unmount). */
  reset: () => void;
  /** How many times the user has requested an OTP in this session. */
  attemptCount: number;
}

export const useOtpResendCooldown = ({
  initialSeconds = 30,
  multiplier = 2,
  maxSeconds = 300,
}: UseOtpResendCooldownOptions = {}): UseOtpResendCooldownResult => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  // Track next cooldown duration across re-renders without triggering effects
  const nextCooldownRef = useRef(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCooldown = useCallback(() => {
    clearTimer();

    const duration = nextCooldownRef.current;
    setSecondsLeft(duration);
    setAttemptCount((n) => n + 1);

    // Next cooldown is doubled, capped at maxSeconds
    nextCooldownRef.current = Math.min(duration * multiplier, maxSeconds);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, multiplier, maxSeconds]);

  const reset = useCallback(() => {
    clearTimer();
    setSecondsLeft(0);
    setAttemptCount(0);
    nextCooldownRef.current = initialSeconds;
  }, [clearTimer, initialSeconds]);

  // Clean up on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    secondsLeft,
    canResend: secondsLeft === 0,
    startCooldown,
    reset,
    attemptCount,
  };
};
