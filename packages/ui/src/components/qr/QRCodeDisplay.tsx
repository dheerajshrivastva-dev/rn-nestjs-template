/**
 * QRCodeDisplay Component
 * Generate and display QR code (240x240)
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../../hooks/useTheme';

export interface QRCodeDisplayProps {
  /**
   * Data to encode in QR code
   */
  value: string;

  /**
   * QR code size
   * @default 240
   */
  size?: number;

  /**
   * Foreground color
   */
  color?: string;

  /**
   * Background color
   */
  backgroundColor?: string;

  /**
   * Logo image (center)
   */
  logo?: any;

  /**
   * Logo size
   */
  logoSize?: number;

  /**
   * Logo background color
   */
  logoBackgroundColor?: string;

  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * QRCodeDisplay
 *
 * QR code generation and display component.
 * Generates QR code from string data with customization options.
 *
 * @example
 * // Basic QR code
 * <QRCodeDisplay
 *   value="https://example.com"
 *   size={200}
 * />
 *
 * @example
 * // QR code with logo
 * <QRCodeDisplay
 *   value={clientId}
 *   logo={require('./logo.png')}
 *   logoSize={50}
 *   logoBackgroundColor="#FFFFFF"
 * />
 *
 * @example
 * // Custom colors
 * <QRCodeDisplay
 *   value={paymentUrl}
 *   size={240}
 *   color="#1976D2"
 *   backgroundColor="#E3F2FD"
 * />
 */
export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 240,
  color,
  backgroundColor,
  logo,
  logoSize,
  logoBackgroundColor,
  style,
}) => {
  const theme = useTheme();

  const qrColor = color || theme.colors.onSurface;
  const qrBackgroundColor = backgroundColor || theme.colors.surface;

  return (
    <View style={[styles.container, style]}>
      <QRCode
        value={value}
        size={size}
        color={qrColor}
        backgroundColor={qrBackgroundColor}
        logo={logo}
        logoSize={logoSize}
        logoBackgroundColor={logoBackgroundColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
