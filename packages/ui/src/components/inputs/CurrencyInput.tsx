/**
 * CurrencyInput Component
 * Currency input with auto-formatting (commas and decimals)
 */

import React from 'react';
import { TextInput } from 'react-native';
import { TextField, TextFieldProps } from './TextField';

export interface CurrencyInputProps extends Omit<TextFieldProps, 'keyboardType' | 'value' | 'onChangeText'> {
  /**
   * Current numeric value (unformatted)
   */
  value?: number;

  /**
   * Change handler with numeric value
   */
  onChangeValue?: (value: number) => void;

  /**
   * Currency symbol
   * @default '₹'
   */
  currencySymbol?: string;

  /**
   * Number of decimal places
   * @default 2
   */
  decimalPlaces?: number;

  /**
   * Minimum value
   */
  min?: number;

  /**
   * Maximum value
   */
  max?: number;
}

/**
 * CurrencyInput
 *
 * Currency input component with automatic formatting.
 * Formats numbers with thousand separators (commas) and decimal places.
 * Supports ref forwarding for smart form navigation.
 *
 * @example
 * // Basic currency input (INR)
 * <CurrencyInput
 *   label="Amount"
 *   value={amount}
 *   onChangeValue={setAmount}
 * />
 *
 * @example
 * // Currency input with USD symbol
 * <CurrencyInput
 *   label="Price"
 *   value={price}
 *   onChangeValue={setPrice}
 *   currencySymbol="$"
 * />
 *
 * @example
 * // Currency input with min/max validation
 * <CurrencyInput
 *   label="Loan Amount"
 *   value={loanAmount}
 *   onChangeValue={setLoanAmount}
 *   min={10000}
 *   max={1000000}
 *   error={loanAmount < 10000 ? "Minimum ₹10,000" : undefined}
 * />
 *
 * @example
 * // With smart navigation
 * <CurrencyInput
 *   ref={amountRef}
 *   label="Amount"
 *   value={amount}
 *   onChangeValue={setAmount}
 *   onSubmitEditing={() => nextRef.current?.focus()}
 *   returnKeyType="next"
 * />
 */
export const CurrencyInput = React.forwardRef<TextInput, CurrencyInputProps>(({
  value = 0,
  onChangeValue,
  currencySymbol = '₹',
  decimalPlaces = 2,
  min,
  max,
  ...props
}, ref) => {
  const formatCurrency = (num: number): string => {
    if (isNaN(num)) return '';

    // Format with commas and decimal places
    const parts = num.toFixed(decimalPlaces).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return parts.join('.');
  };

  const parseCurrency = (text: string): number => {
    // Remove commas and currency symbol, parse as float
    const cleaned = text.replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) return 0;

    // Apply min/max constraints
    let result = parsed;
    if (min !== undefined && result < min) result = min;
    if (max !== undefined && result > max) result = max;

    return result;
  };

  const handleChangeText = (text: string) => {
    const numericValue = parseCurrency(text);
    onChangeValue?.(numericValue);
  };

  const displayValue = value ? `${currencySymbol} ${formatCurrency(value)}` : '';

  return (
    <TextField
      ref={ref}
      value={displayValue}
      onChangeText={handleChangeText}
      keyboardType="decimal-pad"
      placeholder={`${currencySymbol} 0.00`}
      {...props}
    />
  );
});
