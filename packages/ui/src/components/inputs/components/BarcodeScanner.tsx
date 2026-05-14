/**
 * BarcodeScanner Component
 *
 * Full-screen camera overlay for scanning barcodes and QR codes
 * Uses react-native-vision-camera built-in Code Scanner (no frame processors needed)
 * VisionCamera_enableCodeScanner=true in gradle.properties is all that's required
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Vibration,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../hooks/useTheme';
import { Text } from '../../typography/Text';
import { TitleLarge } from '../../typography/TitleLarge';
import { BodyMedium } from '../../typography/BodyMedium';
import { BottomSheet } from '../../modals/BottomSheet';
import type { BarcodeType } from '../../../types/scanner';

export interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string, type: string) => void;
  title?: string;
  subtitle?: string;
  barcodeTypes?: BarcodeType[];
  cameraType?: 'back' | 'front';
  showTorch?: boolean;
  showCameraSwitch?: boolean;
}

type VisionCodeType =
  | 'qr'
  | 'ean-13'
  | 'ean-8'
  | 'code-128'
  | 'code-39'
  | 'code-93'
  | 'upc-e'
  | 'upc-a'
  | 'itf'
  | 'pdf-417'
  | 'aztec'
  | 'data-matrix';

const toVisionCodeTypes = (types?: BarcodeType[]): VisionCodeType[] => {
  if (!types || types.length === 0) {
    return ['qr', 'ean-13', 'code-128'];
  }
  const mapping: Record<BarcodeType, VisionCodeType> = {
    QR_CODE: 'qr',
    EAN_13: 'ean-13',
    EAN_8: 'ean-8',
    CODE_128: 'code-128',
    CODE_39: 'code-39',
    CODE_93: 'code-93',
    UPC_E: 'upc-e',
    UPC_A: 'upc-a',
    ITF: 'itf',
    ITF_14: 'itf',
    PDF_417: 'pdf-417',
    AZTEC: 'aztec',
    DATA_MATRIX: 'data-matrix',
  };
  return types.map((t) => mapping[t]).filter(Boolean) as VisionCodeType[];
};

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  visible,
  onClose,
  onScan,
  title = 'Scan Barcode',
  subtitle = 'Position the barcode in the frame',
  barcodeTypes,
  cameraType = 'back',
  showTorch = true,
  showCameraSwitch = false,
}) => {
  const theme = useTheme();
  const [torchOn, setTorchOn] = useState(false);
  const [currentCameraType, setCurrentCameraType] = useState<'back' | 'front'>(cameraType);
  const [scanned, setScanned] = useState(false);
  const [scanAnimation] = useState(new Animated.Value(0));

  const device = useCameraDevice(currentCameraType);

  // Vision Camera built-in code scanner — no frame processors, no worklets-core
  const codeScanner = useCodeScanner({
    codeTypes: toVisionCodeTypes(barcodeTypes),
    onCodeScanned: (codes) => {
      if (scanned || !visible || codes.length === 0) return;
      const code = codes[0];
      if (!code.value) return;

      setScanned(true);
      Vibration.vibrate(Platform.OS === 'ios' ? undefined : 100);
      onScan(code.value, code.type ?? 'unknown');
    },
  });

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setTorchOn(false);
      setCurrentCameraType(cameraType);
      // start scan line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(scanAnimation, { toValue: 0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scanAnimation.stopAnimation();
    }
  }, [visible, cameraType]);

  const scanLineY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  const sheetContent = (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surfaceVariant, borderBottomColor: theme.colors.outline }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <TitleLarge style={{ color: theme.colors.onSurface }}>{title}</TitleLarge>
            <BodyMedium style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>{subtitle}</BodyMedium>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        {!device ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 16, color: theme.colors.onSurface }}>Loading camera...</Text>
          </View>
        ) : (
          <>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={visible && !scanned}
              codeScanner={codeScanner}
              torch={torchOn ? 'on' : 'off'}
              enableZoomGesture
            />
            {/* Dimmed overlay + viewfinder */}
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.markerFrame} >
                <View style={[styles.corner, styles.topLeft, { borderColor: theme.colors.primary }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: theme.colors.primary }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: theme.colors.primary }]} />
                <View style={[styles.corner, styles.bottomRight, { borderColor: theme.colors.primary }]} />
                {!scanned && (
                  <Animated.View
                    style={[styles.scanLine, { backgroundColor: theme.colors.primary, transform: [{ translateY: scanLineY }] }]}
                  />
                )}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Controls */}
      <View style={[styles.controls, { backgroundColor: theme.colors.surfaceVariant }]}>
        {showTorch && !!device?.hasTorch && (
          <TouchableOpacity
            style={[styles.controlButton, torchOn && { backgroundColor: theme.colors.primaryContainer }]}
            onPress={() => setTorchOn((p) => !p)}
          >
            <Icon
              name={torchOn ? 'flashlight' : 'flashlight-off'}
              size={24}
              color={torchOn ? theme.colors.onPrimaryContainer : theme.colors.onSurface}
            />
            <Text style={{ color: torchOn ? theme.colors.onPrimaryContainer : theme.colors.onSurface, marginTop: 4, fontSize: 12 }}>
              Torch
            </Text>
          </TouchableOpacity>
        )}
        {showCameraSwitch && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setCurrentCameraType((p) => (p === 'back' ? 'front' : 'back'))}
          >
            <Icon name="camera-flip" size={24} color={theme.colors.onSurface} />
            <Text style={{ color: theme.colors.onSurface, marginTop: 4, fontSize: 12 }}>Flip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <BottomSheet visible={visible} onDismiss={onClose} snapPoints={['100%']} enablePanDownToClose={false} dismissable={false}>
      {sheetContent}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { flex: 1 },
  closeButton: { padding: 8, marginLeft: 16 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraContainer: { flex: 1, position: 'relative' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  markerFrame: {
    width: 260,
    height: 260,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderWidth: 4 },
  topLeft:     { top: -2,    left: -2,  borderBottomWidth: 0, borderRightWidth: 0,  borderTopLeftRadius: 8 },
  topRight:    { top: -2,    right: -2, borderBottomWidth: 0, borderLeftWidth: 0,   borderTopRightRadius: 8 },
  bottomLeft:  { bottom: -2, left: -2,  borderTopWidth: 0,    borderRightWidth: 0,  borderBottomLeftRadius: 8 },
  bottomRight: { bottom: -2, right: -2, borderTopWidth: 0,    borderLeftWidth: 0,   borderBottomRightRadius: 8 },
  scanLine: { width: '100%', height: 2, position: 'absolute', left: 0, opacity: 0.85 },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, gap: 32 },
  controlButton: { alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, minWidth: 80 },
});
