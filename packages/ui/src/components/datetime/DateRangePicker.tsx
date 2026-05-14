/**
 * DateRangePicker Component
 * Start and end date selection
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { DatePicker } from './DatePicker';
import { Row } from '../layout/Row';

export interface DateRangePickerProps {
  /**
   * Start date
   */
  startDate?: Date;

  /**
   * End date
   */
  endDate?: Date;

  /**
   * Start date change handler
   */
  onStartDateChange?: (date: Date) => void;

  /**
   * End date change handler
   */
  onEndDateChange?: (date: Date) => void;

  /**
   * Start date label
   * @default 'Start Date'
   */
  startLabel?: string;

  /**
   * End date label
   * @default 'End Date'
   */
  endLabel?: string;

  /**
   * Whether pickers are disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Error message for start date
   */
  startError?: string;

  /**
   * Error message for end date
   */
  endError?: string;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Layout direction
   * @default 'column'
   */
  layout?: 'row' | 'column';
}

/**
 * DateRangePicker
 *
 * Date range selection component with start and end dates.
 * Automatically sets minimum/maximum constraints.
 *
 * @example
 * // Basic date range picker
 * <DateRangePicker
 *   startDate={startDate}
 *   endDate={endDate}
 *   onStartDateChange={setStartDate}
 *   onEndDateChange={setEndDate}
 * />
 *
 * @example
 * // Horizontal layout
 * <DateRangePicker
 *   startDate={checkIn}
 *   endDate={checkOut}
 *   onStartDateChange={setCheckIn}
 *   onEndDateChange={setCheckOut}
 *   startLabel="Check In"
 *   endLabel="Check Out"
 *   layout="row"
 * />
 *
 * @example
 * // With validation errors
 * <DateRangePicker
 *   startDate={start}
 *   endDate={end}
 *   onStartDateChange={setStart}
 *   onEndDateChange={setEnd}
 *   startError={!start ? "Required" : undefined}
 *   endError={end && end < start ? "Must be after start date" : undefined}
 * />
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  disabled = false,
  startError,
  endError,
  style,
  layout = 'column',
}) => {
  const Container = layout === 'row' ? Row : View;
  const containerStyle = layout === 'row' ? { gap: 12 } : styles.columnContainer;

  return (
    <Container style={[containerStyle, style]}>
      <View style={layout === 'row' ? styles.flexItem : undefined}>
        <DatePicker
          label={startLabel}
          value={startDate}
          onDateChange={onStartDateChange}
          maximumDate={endDate}
          disabled={disabled}
          error={startError}
        />
      </View>

      <View style={layout === 'row' ? styles.flexItem : undefined}>
        <DatePicker
          label={endLabel}
          value={endDate}
          onDateChange={onEndDateChange}
          minimumDate={startDate}
          disabled={disabled}
          error={endError}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  columnContainer: {
    gap: 16,
  },
  flexItem: {
    flex: 1,
  },
});
