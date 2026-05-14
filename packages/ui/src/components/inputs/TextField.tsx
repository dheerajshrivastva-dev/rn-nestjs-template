/**
 * TextField Component
 * Material Design 3 text input with Filled and Outlined variants
 */

import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { TextInputProps as PaperTextInputProps } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

export interface TextFieldProps extends Omit<PaperTextInputProps, 'mode' | 'theme'> {
  /**
   * Text field variant
   * @default 'outlined'
   */
  variant?: 'filled' | 'outlined';

  /**
   * Label for the input
   */
  label?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Current value
   */
  value?: string;

  /**
   * Change handler
   */
  onChangeText?: (text: string) => void;

  /**
   * Helper text to display below input
   */
  helperText?: string;

  /**
   * Whether input is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether input is required
   * @default false
   */
  required?: boolean;

  /**
   * Left icon name (MaterialCommunityIcons)
   */
  leftIcon?: string;

  /**
   * Right icon name (MaterialCommunityIcons)
   */
  rightIcon?: string;

  /**
   * Right icon press handler
   */
  onRightIconPress?: () => void;

  /**
   * Callback when Enter/Return key is pressed
   * Used for smart form navigation
   */
  onSubmitEditing?: () => void;

  /**
   * Return key type for keyboard
   * @default 'next'
   */
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';

  /**
   * Whether to blur input on submit
   * Set to false for smart navigation
   * @default false
   */
  blurOnSubmit?: boolean;
}

/**
 * TextField
 *
 * Material Design 3 text input component with filled and outlined variants.
 * Integrates with react-hook-form and supports validation display.
 * Supports smart form navigation with ref forwarding.
 *
 * @example
 * // Basic filled text field
 * <TextField
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 *
 * @example
 * // Outlined text field with error
 * <TextField
 *   variant="outlined"
 *   label="Username"
 *   value={username}
 *   onChangeText={setUsername}
 *   error="Username is required"
 * />
 *
 * @example
 * // Text field with icons
 * <TextField
 *   label="Search"
 *   leftIcon="magnify"
 *   rightIcon="close"
 *   onRightIconPress={() => setValue('')}
 *   value={searchQuery}
 *   onChangeText={setSearchQuery}
 * />
 *
 * @example
 * // With helper text
 * <TextField
 *   label="Password"
 *   secureTextEntry
 *   helperText="Must be at least 8 characters"
 *   value={password}
 *   onChangeText={setPassword}
 * />
 *
 * @example
 * // With smart navigation
 * <TextField
 *   ref={inputRef}
 *   label="Phone"
 *   value={phone}
 *   onChangeText={setPhone}
 *   onSubmitEditing={() => nextInputRef.current?.focus()}
 *   returnKeyType="next"
 *   blurOnSubmit={false}
 * />
 */
export const TextField = React.forwardRef<TextInput, TextFieldProps>(({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  required = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onSubmitEditing,
  returnKeyType = 'next',
  blurOnSubmit = false,
  multiline,
  numberOfLines,
  style,
  ...props
}, ref) => {
  const theme = useTheme();

  const displayLabel = required && label ? `${label} *` : label;

  // Single-line height (px). Content area = outerHeight - 2px borders.
  const SINGLE_HEIGHT = 48;
  const CONTENT_HEIGHT = SINGLE_HEIGHT - 2;

  // Calculate height for multiline inputs
  const inputHeight = React.useMemo(() => {
    if (!multiline) {
      return SINGLE_HEIGHT;
    }
    // Base height + additional lines * line height (20)
    const lineHeight = 20;
    const lines = numberOfLines || 1;
    return SINGLE_HEIGHT + ((lines - 1) * lineHeight);
  }, [multiline, numberOfLines]);

  return (
    <PaperTextInput
      ref={ref}
      mode="outlined"
      label={displayLabel}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      disabled={disabled}
      error={!!error}
      multiline={multiline}
      numberOfLines={numberOfLines}
      onSubmitEditing={onSubmitEditing}
      returnKeyType={returnKeyType}
      blurOnSubmit={blurOnSubmit}
      left={leftIcon ? <PaperTextInput.Icon icon={leftIcon} /> : undefined}
      right={rightIcon ? <PaperTextInput.Icon icon={rightIcon} onPress={onRightIconPress} /> : undefined}
      style={[
        styles.input,
        !multiline && { height: inputHeight },
        multiline && { minHeight: inputHeight },
        style,
      ]}
      contentStyle={multiline ? styles.multilineContent : [styles.content, { height: CONTENT_HEIGHT }]}
      outlineStyle={styles.outline}
      outlineColor={theme.colors.outline}
      activeOutlineColor={theme.colors.primary}
      theme={{
        colors: {
          background: theme.colors.surface,
          surfaceVariant: theme.colors.surface,
        },
        fonts: {
          bodyLarge: { ...theme.fonts.bodyLarge, fontSize: 14 },
          labelLarge: { ...theme.fonts.labelLarge, fontSize: 12 },
        },
      }}
      {...props}
    />
  );
});

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'transparent',
  },
  content: {
    paddingTop: 0,
    fontSize: 14,
  },
  multilineContent: {
    paddingVertical: 0, // Add vertical padding for multiline inputs
  },
  outline: {
    borderRadius: 8, // More rounded corners
    borderWidth: 0.5, // Slightly thicker for better visibility
  },
});
