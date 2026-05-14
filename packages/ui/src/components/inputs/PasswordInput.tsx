/**
 * PasswordInput Component
 * Text input with show/hide password toggle
 */

import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { TextField, TextFieldProps } from './TextField';

export interface PasswordInputProps extends Omit<TextFieldProps, 'secureTextEntry' | 'rightIcon' | 'onRightIconPress'> {
  /**
   * Current password value
   */
  value?: string;

  /**
   * Change handler
   */
  onChangeText?: (text: string) => void;

  /**
   * Whether to initially show password
   * @default false
   */
  defaultVisible?: boolean;
}

/**
 * PasswordInput
 *
 * Text input specifically for passwords with show/hide toggle.
 * Automatically handles secure text entry and eye icon toggle.
 * Supports ref forwarding for smart form navigation.
 *
 * @example
 * // Basic password input
 * <PasswordInput
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 * />
 *
 * @example
 * // Password input with validation error
 * <PasswordInput
 *   label="New Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   error="Password must be at least 8 characters"
 *   helperText="Use a mix of letters, numbers, and symbols"
 * />
 *
 * @example
 * // Initially visible password
 * <PasswordInput
 *   label="Confirm Password"
 *   value={confirmPassword}
 *   onChangeText={setConfirmPassword}
 *   defaultVisible
 * />
 *
 * @example
 * // With smart navigation
 * <PasswordInput
 *   ref={passwordRef}
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   onSubmitEditing={handleLogin}
 *   returnKeyType="done"
 * />
 */
export const PasswordInput = React.forwardRef<TextInput, PasswordInputProps>(({
  value,
  onChangeText,
  defaultVisible = false,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(defaultVisible);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <TextField
      ref={ref}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!isVisible}
      rightIcon={isVisible ? 'eye-off' : 'eye'}
      onRightIconPress={toggleVisibility}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="current-password"
      textContentType="password"
      importantForAutofill="yes"
      {...props}
    />
  );
});
