/**
 * MultilineTextField Component
 * Text area input for longer text (3+ rows)
 */

import React from 'react';
import { TextField, TextFieldProps } from './TextField';

export interface MultilineTextFieldProps extends Omit<TextFieldProps, 'multiline' | 'numberOfLines'> {
  /**
   * Current text value
   */
  value?: string;

  /**
   * Change handler
   */
  onChangeText?: (text: string) => void;

  /**
   * Number of visible rows
   * @default 4
   */
  rows?: number;

  /**
   * Maximum character count
   */
  maxLength?: number;

  /**
   * Whether to show character counter
   * @default false
   */
  showCharacterCount?: boolean;
}

/**
 * MultilineTextField
 *
 * Multi-line text input component for longer text entry.
 * Supports automatic height adjustment and character counting.
 *
 * @example
 * // Basic multiline text field
 * <MultilineTextField
 *   label="Description"
 *   value={description}
 *   onChangeText={setDescription}
 *   rows={4}
 * />
 *
 * @example
 * // With character limit and counter
 * <MultilineTextField
 *   label="Comments"
 *   value={comments}
 *   onChangeText={setComments}
 *   maxLength={500}
 *   showCharacterCount
 *   helperText="Share your thoughts"
 * />
 *
 * @example
 * // Large text area with validation
 * <MultilineTextField
 *   label="Feedback"
 *   value={feedback}
 *   onChangeText={setFeedback}
 *   rows={6}
 *   required
 *   error={!feedback ? "Feedback is required" : undefined}
 * />
 */
export const MultilineTextField: React.FC<MultilineTextFieldProps> = ({
  value = '',
  onChangeText,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  helperText,
  ...props
}) => {
  const characterCount = value.length;
  const displayHelperText = showCharacterCount && maxLength
    ? `${characterCount}/${maxLength} ${helperText || ''}`
    : helperText;

  return (
    <TextField
      value={value}
      onChangeText={onChangeText}
      multiline
      numberOfLines={rows}
      maxLength={maxLength}
      helperText={displayHelperText}
      style={{ height: undefined, minHeight: rows * 24 + 32 }}
      {...props}
    />
  );
};
