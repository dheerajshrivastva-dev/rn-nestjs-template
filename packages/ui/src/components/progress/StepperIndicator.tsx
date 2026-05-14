/**
 * StepperIndicator Component
 * Multi-step progress indicator (▰▰▰▱▱▱▱)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface StepperIndicatorProps {
  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Current step (0-indexed)
   */
  currentStep: number;

  /**
   * Active step color
   */
  activeColor?: string;

  /**
   * Inactive step color
   */
  inactiveColor?: string;

  /**
   * Completed step color
   */
  completedColor?: string;
}

/**
 * StepperIndicator
 *
 * Progress indicator for multi-step forms and processes.
 * Shows completed, current, and remaining steps.
 *
 * @example
 * // Basic 4-step indicator
 * <StepperIndicator
 *   totalSteps={4}
 *   currentStep={1}
 * />
 *
 * @example
 * // Custom colors
 * <StepperIndicator
 *   totalSteps={5}
 *   currentStep={2}
 *   completedColor="#4CAF50"
 *   activeColor="#1976D2"
 *   inactiveColor="#E0E0E0"
 * />
 *
 * @example
 * // Onboarding flow
 * <StepperIndicator
 *   totalSteps={7}
 *   currentStep={currentOnboardingStep}
 * />
 */
export const StepperIndicator: React.FC<StepperIndicatorProps> = ({
  totalSteps,
  currentStep,
  activeColor,
  inactiveColor,
  completedColor,
}) => {
  const theme = useTheme();

  const steps = Array.from({ length: totalSteps }, (_, index) => index);

  const getStepColor = (index: number) => {
    if (index < currentStep) {
      return completedColor || theme.colors.primary;
    } else if (index === currentStep) {
      return activeColor || theme.colors.primary;
    } else {
      return inactiveColor || theme.colors.outlineVariant;
    }
  };

  return (
    <View style={styles.container}>
      {steps.map((index) => (
        <View
          key={index}
          style={[
            styles.step,
            {
              backgroundColor: getStepColor(index),
              width: index === currentStep ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  step: {
    height: 8,
    borderRadius: 4,
  },
});
