/**
 * DatePicker Component
 * Date selection with calendar picker
 */

import React, { useState } from 'react';
import { Platform, ViewStyle } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextField } from '../inputs/TextField';

export interface DatePickerProps {
  /**
   * Selected date
   */
  value?: Date;

  /**
   * Change handler
   */
  onDateChange?: (date: Date) => void;

  /**
   * Label text
   */
  label?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Minimum date
   */
  minimumDate?: Date;

  /**
   * Maximum date
   */
  maximumDate?: Date;

  /**
   * Date format function
   */
  formatDate?: (date: Date) => string;

  /**
   * Whether picker is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * DatePicker
 *
 * Date selection component with native picker integration.
 * Shows formatted date in text field with calendar picker.
 *
 * @example
 * // Basic date picker
 * <DatePicker
 *   label="Date of Birth"
 *   value={dob}
 *   onDateChange={setDob}
 * />
 *
 * @example
 * // With restrictions and custom format
 * <DatePicker
 *   label="Appointment Date"
 *   value={appointmentDate}
 *   onDateChange={setAppointmentDate}
 *   minimumDate={new Date()}
 *   formatDate={(date) => date.toLocaleDateString('en-IN')}
 * />
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  label,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  formatDate = (date) => date.toLocaleDateString(),
  disabled = false,
  error,
  style,
}) => {
  const [show, setShow] = useState(false);

  const handlePress = () => {
    if (!disabled) {
      setShow(true);
    }
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selectedDate && event.type === 'set') {
      onDateChange?.(selectedDate);
      if (Platform.OS === 'ios') {
        setShow(false);
      }
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  const displayValue = value ? formatDate(value) : '';

  return (
    <>
      <TextField
        label={label}
        placeholder={placeholder}
        value={displayValue}
        onPress={handlePress}
        rightIcon="calendar"
        onRightIconPress={handlePress}
        editable={false}
        disabled={disabled}
        error={error}
        style={style}
      />

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </>
  );
};
