/**
 * useFormFieldNavigation Hook
 *
 * Provides smart input navigation for React Hook Form forms.
 * Handles auto-advance on Enter key and validation completion.
 *
 * @example
 * const fields: FormFieldConfig<FormData>[] = [
 *   {
 *     name: 'clientName',
 *     autoAdvanceOn: 'enter',
 *   },
 *   {
 *     name: 'phone',
 *     autoAdvanceOn: 'both', // Enter OR validation
 *     validationRules: {
 *       minLength: 10,
 *       pattern: /^[0-9]{10}$/,
 *     },
 *   },
 * ];
 *
 * const { registerRef, handleChangeWithNav, handleSubmitEditing } =
 *   useFormFieldNavigation(control, fields);
 *
 * <TextField
 *   ref={(ref) => registerRef('phone', ref)}
 *   value={value}
 *   onChangeText={(text) => handleChangeWithNav('phone', text, onChange)}
 *   onSubmitEditing={() => handleSubmitEditing('phone')}
 *   returnKeyType="next"
 *   blurOnSubmit={false}
 * />
 */

import { useCallback, useRef } from 'react';
import { Control, FieldValues, Path, useFormState } from 'react-hook-form';
import { TextInput } from 'react-native';

/**
 * Configuration for a form field with navigation
 */
export interface FormFieldConfig<T extends FieldValues> {
  /**
   * Field name (from react-hook-form)
   */
  name: Path<T>;

  /**
   * When to auto-advance to next field
   * - 'enter': On Enter/Return key press
   * - 'validation': When validation rules are satisfied
   * - 'both': On Enter OR validation satisfied
   * - 'never': Disable auto-advance (default)
   * @default 'never'
   */
  autoAdvanceOn?: 'enter' | 'validation' | 'both' | 'never';

  /**
   * Validation rules for auto-advance on validation
   * Only checked if autoAdvanceOn includes 'validation'
   */
  validationRules?: {
    /**
     * Minimum length required
     */
    minLength?: number;

    /**
     * Maximum length required (auto-advance when reached)
     */
    maxLength?: number;

    /**
     * Pattern to match
     */
    pattern?: RegExp;

    /**
     * Custom validation function
     * Return true if validation passed
     */
    custom?: (value: any) => boolean;
  };
}

/**
 * Hook for managing smart form field navigation
 *
 * @param control - React Hook Form control object
 * @param fields - Array of field configurations
 * @returns Navigation utilities
 */
export const useFormFieldNavigation = <T extends FieldValues>(
  control: Control<T>,
  fields: FormFieldConfig<T>[]
) => {
  const inputRefs = useRef<Map<string, TextInput>>(new Map());
  const { errors } = useFormState({ control });

  /**
   * Register a ref for a field
   * Call this in the ref prop of your input component
   */
  const registerRef = useCallback((fieldName: Path<T>, ref: TextInput | null) => {
    if (ref) {
      inputRefs.current.set(fieldName, ref);
    } else {
      inputRefs.current.delete(fieldName);
    }
  }, []);

  /**
   * Focus the next field in the sequence
   */
  const focusNext = useCallback((currentFieldName: Path<T>) => {
    const currentIndex = fields.findIndex(f => f.name === currentFieldName);
    if (currentIndex >= 0 && currentIndex < fields.length - 1) {
      const nextField = fields[currentIndex + 1];
      const nextInput = inputRefs.current.get(nextField.name);
      nextInput?.focus();
      return true;
    }
    return false;
  }, [fields]);

  /**
   * Focus a specific field by name
   */
  const focusField = useCallback((fieldName: Path<T>) => {
    const input = inputRefs.current.get(fieldName);
    if (input) {
      input.focus();
      return true;
    }
    return false;
  }, []);

  /**
   * Check if validation rules are satisfied for a field
   */
  const isValidationSatisfied = useCallback((
    fieldName: Path<T>,
    value: any
  ): boolean => {
    const field = fields.find(f => f.name === fieldName);
    if (!field?.validationRules) return false;

    const { minLength, maxLength, pattern, custom } = field.validationRules;
    const valueStr = String(value || '');

    // Check if there are no RHF errors for this field
    const hasNoErrors = !errors[fieldName];

    // Check minLength
    if (minLength && valueStr.length < minLength) return false;

    // Check maxLength (exact match for auto-advance)
    if (maxLength && valueStr.length !== maxLength) return false;

    // Check pattern
    if (pattern && !pattern.test(valueStr)) return false;

    // Check custom validation
    if (custom && !custom(value)) return false;

    // All validations passed and no RHF errors
    return hasNoErrors;
  }, [fields, errors]);

  /**
   * Handle change with auto-advance on validation
   * Use this in your onChangeText handler
   */
  const handleChangeWithNav = useCallback((
    fieldName: Path<T>,
    value: any,
    onChange: (value: any) => void
  ) => {
    // Call the original onChange from RHF
    onChange(value);

    const field = fields.find(f => f.name === fieldName);
    if (
      field?.autoAdvanceOn === 'validation' ||
      field?.autoAdvanceOn === 'both'
    ) {
      // Check if validation is satisfied and auto-advance
      if (isValidationSatisfied(fieldName, value)) {
        // Small delay to allow state updates
        setTimeout(() => focusNext(fieldName), 50);
      }
    }
  }, [fields, focusNext, isValidationSatisfied]);

  /**
   * Handle submit editing (Enter key press)
   * Use this in your onSubmitEditing handler
   */
  const handleSubmitEditing = useCallback((fieldName: Path<T>) => {
    const field = fields.find(f => f.name === fieldName);
    if (
      field?.autoAdvanceOn === 'enter' ||
      field?.autoAdvanceOn === 'both'
    ) {
      const moved = focusNext(fieldName);
      // If this was the last field, return false to allow default behavior
      return moved;
    }
    return false;
  }, [fields, focusNext]);

  return {
    /**
     * Register a ref for a field
     */
    registerRef,

    /**
     * Focus the next field in sequence
     */
    focusNext,

    /**
     * Focus a specific field by name
     */
    focusField,

    /**
     * Check if field validation is satisfied
     */
    isValidationSatisfied,

    /**
     * Handle change with auto-advance on validation
     */
    handleChangeWithNav,

    /**
     * Handle Enter key with auto-advance
     */
    handleSubmitEditing,
  };
};
