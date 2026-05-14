/**
 * BarcodeInput Component
 *
 * Text input with integrated barcode/QR code scanner
 * Extends TextField with scanner functionality
 * Supports manual input OR camera scanning
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Alert, Platform, TextInput } from 'react-native';
import { TextField, TextFieldProps } from './TextField';
import { BarcodeScanner } from './components/BarcodeScanner';
import { requestPermission } from '../../utils/permissions';
import type { BarcodeType, ScanValidationResult } from '../../types/scanner';

export interface BarcodeInputProps extends Omit<TextFieldProps, 'rightIcon' | 'onRightIconPress'> {
  /**
   * Scanner title
   * @default "Scan Barcode"
   */
  scannerTitle?: string;

  /**
   * Scanner subtitle/instructions
   * @default "Position the barcode in the frame"
   */
  scannerSubtitle?: string;

  /**
   * Barcode types to scan
   * @default ['QR_CODE', 'EAN_13', 'CODE_128']
   */
  barcodeTypes?: BarcodeType[];

  /**
   * Camera type
   * @default 'back'
   */
  cameraType?: 'back' | 'front';

  /**
   * Scanner icon
   * @default 'barcode-scan'
   */
  scannerIcon?: string;

  /**
   * Custom permission rationale message
   */
  permissionRationale?: string;

  /**
   * Callback when barcode is scanned
   * Called before onChangeText
   */
  onScan?: (data: string, type: string) => void;

  /**
   * Optional validation for scanned data
   * Return { valid: false, error: 'message' } to reject scan
   */
  validateScan?: (data: string) => ScanValidationResult;

  /**
   * Whether to show torch toggle in scanner
   * @default true
   */
  showTorch?: boolean;

  /**
   * Whether to show camera switch in scanner
   * @default false
   */
  showCameraSwitch?: boolean;
}

/**
 * BarcodeInput
 *
 * Text input with integrated barcode scanner.
 * User can type manually OR scan with camera.
 * Scanner opens in full-screen modal with permission handling.
 *
 * @example
 * // IMEI Scanner
 * <BarcodeInput
 *   label="IMEI 1"
 *   value={imei1}
 *   onChangeText={setImei1}
 *   scannerTitle="Scan IMEI Barcode"
 *   barcodeTypes={['CODE_128', 'EAN_13']}
 *   validateScan={(data) => {
 *     if (data.length !== 15) {
 *       return { valid: false, error: 'IMEI must be 15 digits' };
 *     }
 *     return { valid: true };
 *   }}
 *   keyboardType="numeric"
 *   maxLength={15}
 * />
 *
 * @example
 * // QR Code Scanner
 * <BarcodeInput
 *   label="QR Code"
 *   value={qrCode}
 *   onChangeText={setQrCode}
 *   scannerTitle="Scan QR Code"
 *   barcodeTypes={['QR_CODE']}
 *   scannerIcon="qrcode"
 * />
 *
 * @example
 * // With React Hook Form
 * <Controller
 *   control={control}
 *   name="imei1"
 *   render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
 *     <BarcodeInput
 *       label="IMEI 1"
 *       value={value}
 *       onChangeText={onChange}
 *       onBlur={onBlur}
 *       scannerTitle="Scan IMEI Barcode"
 *       barcodeTypes={['CODE_128', 'EAN_13']}
 *       error={!!error}
 *       helperText={error?.message || "15-digit IMEI number"}
 *     />
 *   )}
 * />
 */
export const BarcodeInput = React.forwardRef<TextInput, BarcodeInputProps>(
  (
    {
      scannerTitle = 'Scan Barcode',
      scannerSubtitle = 'Position the barcode in the frame',
      barcodeTypes = ['QR_CODE', 'EAN_13', 'CODE_128'],
      cameraType = 'back',
      scannerIcon = 'barcode-scan',
      permissionRationale = 'Camera access is needed to scan barcodes.',
      onScan,
      validateScan,
      showTorch = true,
      showCameraSwitch = false,
      onChangeText,
      ...textFieldProps
    },
    ref
  ) => {
    const [scannerVisible, setScannerVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // Expose ref to parent
    React.useImperativeHandle(ref, () => inputRef.current as TextInput);

    const handleOpenScanner = useCallback(async () => {
      try {
        // Request camera permission
        const permissionResult = await requestPermission('camera', {
          rationale: permissionRationale,
          onDenied: () => {
            Alert.alert(
              'Camera Permission Required',
              'Camera access is needed to scan barcodes. Please grant permission in settings.',
              [{ text: 'OK' }]
            );
          },
          onBlocked: () => {
            Alert.alert(
              'Camera Permission Blocked',
              'Camera permission is blocked. Please enable it in your device settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => {
                    // Permission utility handles opening settings
                  },
                },
              ]
            );
          },
        });

        if (permissionResult.granted) {
          setScannerVisible(true);
        }
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        Alert.alert('Error', 'Failed to request camera permission');
      }
    }, [permissionRationale]);

    const handleCloseScanner = useCallback(() => {
      setScannerVisible(false);
      // Refocus input after closing scanner
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }, []);

    const handleScan = useCallback(
      (data: string, type: string) => {
        // Validate if validator provided
        if (validateScan) {
          const result = validateScan(data);
          if (!result.valid) {
            Alert.alert('Invalid Scan', result.error || 'The scanned barcode is invalid.', [
              { text: 'Try Again', onPress: () => setScannerVisible(true) },
              { text: 'Cancel', onPress: handleCloseScanner },
            ]);
            return;
          }
        }

        // Call onScan callback if provided
        if (onScan) {
          onScan(data, type);
        }

        // Update input value
        if (onChangeText) {
          onChangeText(data);
        }

        // Close scanner
        handleCloseScanner();
      },
      [validateScan, onScan, onChangeText, handleCloseScanner]
    );

    return (
      <>
        <TextField
          ref={inputRef}
          rightIcon={scannerIcon}
          onRightIconPress={handleOpenScanner}
          onChangeText={onChangeText}
          {...textFieldProps}
        />

        <BarcodeScanner
          visible={scannerVisible}
          onClose={handleCloseScanner}
          onScan={handleScan}
          title={scannerTitle}
          subtitle={scannerSubtitle}
          barcodeTypes={barcodeTypes}
          cameraType={cameraType}
          showTorch={showTorch}
          showCameraSwitch={showCameraSwitch}
        />
      </>
    );
  }
);

BarcodeInput.displayName = 'BarcodeInput';

export type { BarcodeScannerProps } from './components/BarcodeScanner';
