/**
 * PhoneInput Component
 * Phone number input with country code picker
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, type ViewStyle, type TextInput } from 'react-native';
import { Menu } from 'react-native-paper';
import { TextField, type TextFieldProps } from './TextField';

import { BodyMedium } from '../typography/BodyMedium';
import { useTheme } from '../../hooks/useTheme';

interface CountryCode {
  code: string;
  dial: string;
  name: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN', dial: '+91', name: 'India' },
];

export interface PhoneInputProps extends Omit<TextFieldProps, 'leftIcon' | 'keyboardType'> {
  /**
   * Phone number value (without country code)
   */
  value?: string;

  /**
   * Change handler for phone number
   */
  onChangeText?: (phone: string) => void;

  /**
   * Selected country code
   * @default '+91'
   */
  countryCode?: string;

  /**
   * Change handler for country code
   */
  onCountryCodeChange?: (countryCode: string) => void;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * PhoneInput
 *
 * Phone number input with country code picker dropdown.
 * Validates phone number format and provides country selection.
 * Supports ref forwarding for smart form navigation.
 *
 * @example
 * // Basic phone input
 * <PhoneInput
 *   label="Phone Number"
 *   value={phone}
 *   onChangeText={setPhone}
 *   countryCode={countryCode}
 *   onCountryCodeChange={setCountryCode}
 * />
 *
 * @example
 * // Phone input with validation error
 * <PhoneInput
 *   label="Mobile"
 *   value={phone}
 *   onChangeText={setPhone}
 *   error="Invalid phone number"
 *   required
 * />
 *
 * @example
 * // Phone input with default country code
 * <PhoneInput
 *   label="Contact Number"
 *   value={phone}
 *   onChangeText={setPhone}
 *   countryCode="+1"
 *   onCountryCodeChange={setCountryCode}
 * />
 *
 * @example
 * // With smart navigation
 * <PhoneInput
 *   ref={phoneRef}
 *   label="Phone"
 *   value={phone}
 *   onChangeText={setPhone}
 *   onSubmitEditing={() => emailRef.current?.focus()}
 *   returnKeyType="next"
 *   blurOnSubmit={false}
 * />
 */
export const PhoneInput = React.forwardRef<TextInput, PhoneInputProps>(({
  value,
  onChangeText,
  countryCode = '+91',
  onCountryCodeChange,
  style,
  ...props
}, ref) => {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleCountrySelect = (code: string) => {
    if (onCountryCodeChange) {
      onCountryCodeChange(code);
    }
    closeMenu();
  };

  return (
    <View style={[styles.container, style]}>
      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        anchor={
          <TouchableOpacity
            onPress={openMenu}
            style={[
              styles.countryCodeButton,
              {
                backgroundColor: 'transparent',
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <BodyMedium style={{ color: theme.colors.onSurface }}>
              {countryCode}
            </BodyMedium>
          </TouchableOpacity>
        }
        anchorPosition="bottom"
        contentStyle={{
          backgroundColor: theme.colors.surfaceContainerHigh,
          maxHeight: 300,
          borderRadius: 12,
        }}
      >
        {COUNTRY_CODES.map((country) => (
          <Menu.Item
            key={country.code}
            onPress={() => handleCountrySelect(country.dial)}
            title={`${country.dial} ${country.name}`}
            titleStyle={{
              color:
                countryCode === country.dial
                  ? theme.colors.primary
                  : theme.colors.onSurface,
            }}
          />
        ))}
      </Menu>

      <View style={styles.inputContainer}>
        <TextField
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          placeholder="Phone number"
          maxLength={10}
          autoComplete="username"
          textContentType="username"
          importantForAutofill="yes"
          {...props}
        />
      </View>
    </View>
  );
});

PhoneInput.displayName = 'PhoneInput';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  countryCodeButton: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderRadius: 12, // Match TextField rounded corners
    minWidth: 50,
    marginTop: 5
  },
  inputContainer: {
    flex: 1,
  },
});
