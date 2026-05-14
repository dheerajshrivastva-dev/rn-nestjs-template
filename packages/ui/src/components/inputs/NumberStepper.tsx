/**
 * NumberStepper Component
 * Number input with increment/decrement buttons
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { IconButton } from '../buttons/IconButton';
import { BodyLarge } from '../typography/BodyLarge';
import { useTheme } from '../../hooks/useTheme';

export interface NumberStepperProps {
  /**
   * Current value
   */
  value: number;

  /**
   * Change handler
   */
  onChangeValue: (value: number) => void;

  /**
   * Minimum value
   * @default 0
   */
  min?: number;

  /**
   * Maximum value
   */
  max?: number;

  /**
   * Step increment/decrement amount
   * @default 1
   */
  step?: number;

  /**
   * Whether stepper is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Size of the stepper
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
}

/**
 * NumberStepper
 *
 * Number input with increment and decrement buttons.
 * Useful for quantity selectors, counters, and numeric adjustments.
 *
 * @example
 * // Basic number stepper
 * <NumberStepper
 *   value={quantity}
 *   onChangeValue={setQuantity}
 *   min={1}
 *   max={10}
 * />
 *
 * @example
 * // Small stepper with custom step
 * <NumberStepper
 *   value={count}
 *   onChangeValue={setCount}
 *   step={5}
 *   size="small"
 * />
 *
 * @example
 * // Large stepper with decimal step
 * <NumberStepper
 *   value={amount}
 *   onChangeValue={setAmount}
 *   step={0.5}
 *   min={0}
 *   max={100}
 *   size="large"
 * />
 */
export const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChangeValue,
  min = 0,
  max,
  step = 1,
  disabled = false,
  style,
  size = 'medium',
}) => {
  const theme = useTheme();

  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChangeValue(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChangeValue(newValue);
    }
  };

  const isDecrementDisabled = disabled || value <= min;
  const isIncrementDisabled = disabled || (max !== undefined && value >= max);

  const buttonSize = size === 'small' ? 32 : size === 'large' ? 48 : 40;
  const valueSize = size === 'small' ? 'bodyMedium' : size === 'large' ? 'headlineSmall' : 'bodyLarge';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceContainerHighest,
          borderColor: theme.colors.outline,
        },
        style,
      ]}
    >
      <IconButton
        icon="minus"
        onPress={handleDecrement}
        disabled={isDecrementDisabled}
        size={buttonSize}
      />

      <View style={styles.valueContainer}>
        <BodyLarge style={{ fontSize: size === 'small' ? 14 : size === 'large' ? 20 : 16 }}>
          {value}
        </BodyLarge>
      </View>

      <IconButton
        icon="plus"
        onPress={handleIncrement}
        disabled={isIncrementDisabled}
        size={buttonSize}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  valueContainer: {
    paddingHorizontal: 16,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
