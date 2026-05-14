/**
 * AvatarPicker Component
 * Photo selection with crop (80x80, 120x120)
 * Uses the same BottomSheet source-picker as FileUploadInput.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, TouchableOpacity, type ViewStyle } from 'react-native';
import { Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../hooks/useTheme';
import { useImagePicker } from '../../hooks/useImagePicker';
import { BottomSheet } from '../modals/BottomSheet';
import { Text } from '../typography/Text';

export interface AvatarPickerProps {
  /** Current avatar image URI */
  imageUri?: string;
  /** Called with the new image URI/URL after selection */
  onImageChange?: (uri: string) => void;
  /** Called when the user removes the current image */
  onRemove?: () => void;
  /** Avatar size @default 120 */
  size?: 80 | 120;
  /** @default false */
  disabled?: boolean;
  style?: ViewStyle;
  /** @default 'camera' */
  placeholderIcon?: string;
  /**
   * Optional upload handler — receives Blob, should return the hosted URL.
   * If omitted the local file URI is used directly.
   */
  onUpload?: (uri: string) => Promise<string>;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  imageUri,
  onImageChange,
  onRemove,
  size = 120,
  disabled = false,
  style,
  placeholderIcon = 'camera',
  onUpload,
}) => {
  const theme = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);

  const { isUploading, pickFromCamera, pickFromGallery } = useImagePicker({
    onImageChange,
    onUpload,
  });

  const openSheet = () => {
    if (!disabled) setSheetVisible(true);
  };

  const handleCamera = async () => {
    setSheetVisible(false);
    await pickFromCamera();
  };

  const handleGallery = async () => {
    setSheetVisible(false);
    await pickFromGallery();
  };

  const handleRemove = () => {
    if (!disabled) onRemove?.();
  };

  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={openSheet} disabled={disabled || isUploading}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          />
        ) : (
          <Avatar.Icon
            size={size}
            icon={isUploading ? 'loading' : placeholderIcon}
            style={{ backgroundColor: theme.colors.surfaceContainerHighest }}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      </Pressable>

      {/* Remove button — shown when image is present */}
      {imageUri && !disabled && (
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: theme.colors.errorContainer }]}
          onPress={handleRemove}
          hitSlop={8}
        >
          <Icon name="close" size={14} color={theme.colors.onErrorContainer} />
        </TouchableOpacity>
      )}

      {/* Camera FAB — shown when no image */}
      {!imageUri && !disabled && (
        <TouchableOpacity
          style={[
            styles.cameraButton,
            size === 80 ? styles.cameraButtonSmall : styles.cameraButtonLarge,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
          onPress={openSheet}
          disabled={isUploading}
        >
          <Icon
            name="camera"
            size={size === 80 ? 14 : 18}
            color={theme.colors.onPrimaryContainer}
          />
        </TouchableOpacity>
      )}

      {/* Source picker — mirrors FileUploadInput's BottomSheet */}
      <BottomSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        snapPoints={['28%']}
        enablePanDownToClose
      >
        <View style={styles.sheetContent}>
          <Text
            variant="titleMedium"
            style={[styles.sheetTitle, { color: theme.colors.onSurface }]}
          >
            Profile Photo
          </Text>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={handleCamera}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Icon name="camera" size={20} color={theme.colors.onPrimaryContainer} />
              </View>
              <Text
                variant="labelLarge"
                style={[styles.optionLabel, { color: theme.colors.onSurface }]}
              >
                Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={handleGallery}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}
              >
                <Icon name="image-multiple" size={20} color={theme.colors.onSecondaryContainer} />
              </View>
              <Text
                variant="labelLarge"
                style={[styles.optionLabel, { color: theme.colors.onSurface }]}
              >
                Gallery
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatar: {
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButtonSmall: {
    width: 26,
    height: 26,
  },
  cameraButtonLarge: {
    width: 34,
    height: 34,
  },
  // BottomSheet
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    marginTop: 8,
  },
});
