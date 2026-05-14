/**
 * useSmartInput Hook
 *
 * Simplified smart input navigation for single inputs.
 * Use this when you don't need the full field configuration.
 *
 * @example
 * const phoneInput = useSmartInput({
 *   control,
 *   name: 'phone',
 *   onNext: () => emailInputRef.current?.focus(),
 *   autoAdvanceOnValidation: true,
 *   validationCheck: (value) => value.length === 10,
 * });
 *
 * <TextField
 *   ref={phoneInput.ref}
 *   value={value}
 *   onChangeText={(text) => phoneInput.handleChange(text, onChange)}
 *   onSubmitEditing={phoneInput.handleSubmitEditing}
 *   returnKeyType="next"
 *   blurOnSubmit={false}
 * />
 */

import { useCallback, useRef } from 'react';
import { TextInput } from 'react-native';

/**
 * Props for useSmartInput hook
 */
export interface SmartInputProps {
  /**
   * Callback to focus next input
   */
  onNext?: () => void;

  /**
   * Whether to auto-advance when validation is satisfied
   * @default false
   */
  autoAdvanceOnValidation?: boolean;

  /**
   * Custom validation check function
   * Return true when input is valid and ready to advance
   */
  validationCheck?: (value: any) => boolean;
}

/**
 * Hook for managing a single smart input
 *
 * @param props - Configuration for the input
 * @returns Ref and event handlers for the input
 */
export const useSmartInput = ({
  onNext,
  autoAdvanceOnValidation = false,
  validationCheck,
}: SmartInputProps) => {
  const inputRef = useRef<TextInput>(null);

  /**
   * Handle Enter/Return key press
   */
  const handleSubmitEditing = useCallback(() => {
    onNext?.();
  }, [onNext]);

  /**
   * Handle change with auto-advance on validation
   */
  const handleChange = useCallback((
    value: any,
    onChange: (value: any) => void
  ) => {
    // Call the original onChange from RHF
    onChange(value);

    // Auto-advance if validation is satisfied
    if (autoAdvanceOnValidation && validationCheck) {
      if (validationCheck(value)) {
        // Small delay to allow state updates
        setTimeout(() => onNext?.(), 50);
      }
    }
  }, [autoAdvanceOnValidation, validationCheck, onNext]);

  /**
   * Focus this input
   */
  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Blur this input
   */
  const blur = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  return {
    /**
     * Ref to attach to the input component
     */
    ref: inputRef,

    /**
     * Handle Enter key press
     */
    handleSubmitEditing,

    /**
     * Handle change with auto-advance
     */
    handleChange,

    /**
     * Focus this input
     */
    focus,

    /**
     * Blur this input
     */
    blur,
  };
};
