/**
 * OTPInput Component
 * 6-digit OTP code input (48x48 each box, 8dp gap)
 */

import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export interface OTPInputProps {
  /**
   * Number of OTP digits
   * @default 6
   */
  length?: number;

  /**
   * Current OTP value
   */
  value?: string;

  /**
   * Change handler
   */
  onChangeText?: (otp: string) => void;

  /**
   * Complete handler (called when all digits filled)
   */
  onComplete?: (otp: string) => void;

  /**
   * Whether input has error
   * @default false
   */
  error?: boolean;

  /**
   * Whether input is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Mask entered digits (for PIN entry)
   * @default false
   */
  secureTextEntry?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * OTPInput
 *
 * One-Time Password input component with individual digit boxes.
 * Each box is 48x48dp with 8dp gap between boxes.
 *
 * @example
 * // Basic OTP input
 * <OTPInput
 *   value={otp}
 *   onChangeText={setOtp}
 *   onComplete={(code) => verifyOTP(code)}
 * />
 *
 * @example
 * // OTP input with error state
 * <OTPInput
 *   value={otp}
 *   onChangeText={setOtp}
 *   error={hasError}
 * />
 *
 * @example
 * // 4-digit OTP
 * <OTPInput
 *   length={4}
 *   value={otp}
 *   onChangeText={setOtp}
 *   onComplete={handleVerify}
 * />
 */
export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value = "",
  onChangeText,
  onComplete,
  error = false,
  disabled = false,
  secureTextEntry = false,
  style,
}) => {
  const theme = useTheme();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [containerWidth, setContainerWidth] = useState(0);

  const GAP = 8;
  const boxSize = containerWidth > 0
    ? (containerWidth - GAP * (length - 1)) / length
    : 40;

  // Build a padded digits array from value
  const digits = React.useMemo(() => {
    const arr = value.split("").slice(0, length);
    while (arr.length < length) arr.push("");
    return arr;
  }, [value, length]);

  const emitChange = (nextDigits: string[]) => {
    const newValue = nextDigits.join("");
    onChangeText?.(newValue);
    if (!nextDigits.includes("") && newValue.length === length) {
      onComplete?.(newValue);
    }
  };

  const handleChangeText = (text: string, index: number) => {
    if (disabled) return;

    const cleaned = text.replace(/[^0-9]/g, "");
    const next = [...digits];

    if (cleaned.length === 0) {
      // Deletion
      next[index] = "";
      emitChange(next);

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    // Paste or single char
    const chars = cleaned.split("");
    let i = index;

    for (const ch of chars) {
      if (i >= length) break;
      next[i] = ch;
      i++;
    }

    emitChange(next);

    // Move focus
    if (i < length) {
      inputRefs.current[i]?.focus();
    } else {
      inputRefs.current[length - 1]?.blur();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (disabled) return;

    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      emitChange(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBoxPress = (index: number) => {
    if (disabled) return;
    inputRefs.current[index]?.focus();
  };

  return (
    <View style={[styles.container, style]} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      {digits.map((digit, index) => {
        const isFocused = focusedIndex === index;
        const hasValue = !!digit;

        return (
          <Pressable key={index} onPress={() => handleBoxPress(index)}>
            <View
              style={[
                styles.box,
                {
                  width: boxSize,
                  height: boxSize,
                  backgroundColor: theme.colors.surfaceContainerHighest,
                  borderColor: error
                    ? theme.colors.error
                    : isFocused
                    ? theme.colors.primary
                    : hasValue
                    ? theme.colors.outline
                    : theme.colors.outlineVariant,
                  borderWidth: isFocused ? 2 : 1,
                },
                disabled && styles.disabled,
              ]}
            >
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                value={digit}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(-1)}
                keyboardType="number-pad"
                maxLength={length} // allow paste
                selectTextOnFocus
                secureTextEntry={secureTextEntry}
                editable={!disabled}
                style={[
                  styles.input,
                  {
                    color: error
                      ? theme.colors.error
                      : theme.colors.onSurface, // better contrast
                  },
                ]}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

OTPInput.displayName = "OTPInput";

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  box: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    padding: 0,
  },
  disabled: {
    opacity: 0.5,
  },
});
