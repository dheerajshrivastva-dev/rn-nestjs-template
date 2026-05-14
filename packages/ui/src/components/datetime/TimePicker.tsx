/**
 * TimePicker Component
 * Time selection with clock picker
 */

import React, { useState } from 'react';
import { Platform, ViewStyle } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextField } from '../inputs/TextField';

export interface TimePickerProps {
  /**
   * Selected time (Date object)
   */
  value?: Date;

  /**
   * Change handler
   */
  onTimeChange?: (time: Date) => void;

  /**
   * Label text
   */
  label?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Time format function
   */
  formatTime?: (time: Date) => string;

  /**
   * Whether to use 24-hour format
   * @default false
   */
  is24Hour?: boolean;

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
 * TimePicker
 *
 * Time selection component with native picker integration.
 * Shows formatted time in text field with clock picker.
 *
 * @example
 * // Basic time picker
 * <TimePicker
 *   label="Appointment Time"
 *   value={time}
 *   onTimeChange={setTime}
 * />
 *
 * @example
 * // 24-hour format
 * <TimePicker
 *   label="Meeting Time"
 *   value={meetingTime}
 *   onTimeChange={setMeetingTime}
 *   is24Hour
 *   formatTime={(time) => time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
 * />
 */
export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onTimeChange,
  label,
  placeholder = 'Select time',
  formatTime = (time) => time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  is24Hour = false,
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

  const handleChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selectedTime && event.type === 'set') {
      onTimeChange?.(selectedTime);
      if (Platform.OS === 'ios') {
        setShow(false);
      }
    } else if (event.type === 'dismissed') {
      setShow(false);
    }
  };

  const displayValue = value ? formatTime(value) : '';

  return (
    <>
      <TextField
        label={label}
        placeholder={placeholder}
        value={displayValue}
        onPress={handlePress}
        rightIcon="clock-outline"
        onRightIconPress={handlePress}
        editable={false}
        disabled={disabled}
        error={error}
        style={style}
      />

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          is24Hour={is24Hour}
        />
      )}
    </>
  );
};
