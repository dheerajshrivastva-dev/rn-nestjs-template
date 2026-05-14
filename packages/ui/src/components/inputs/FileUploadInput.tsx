/**
 * FileUploadInput Component
 * File upload with preview for images and documents
 * Supports both file selection and URL input
 * Production-grade with full permission handling
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Platform, Alert, Animated } from 'react-native';
import { TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { pick as pickDocument, types as documentTypes } from '@react-native-documents/picker';
import { useTheme } from '../../hooks/useTheme';
import { useImagePicker, type UploadProgressInfo } from '../../hooks/useImagePicker';
import { Text } from '../typography/Text';
import { BodySmall } from '../typography/BodySmall';
import { OutlinedButton } from '../buttons/OutlinedButton';
import { TextButton } from '../buttons/TextButton';
import { BottomSheet } from '../modals/BottomSheet';

export interface FileUploadInputProps {
  /**
   * Label for the input
   */
  label: string;

  /**
   * Current value (URL or file path)
   */
  value?: string;

  /**
   * Change handler
   */
  onChangeText?: (value: string) => void;

  /**
   * Error state
   */
  error?: boolean;

  /**
   * Helper/Error text
   */
  helperText?: string;

  /**
   * Whether input is disabled
   */
  disabled?: boolean;

  /**
   * File type to accept
   * @default 'image'
   */
  fileType?: 'image' | 'document' | 'any';

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether to show URL input mode toggle
   * @default true
   */
  showUrlInput?: boolean;

  /**
   * Custom upload handler (optional)
   * Receives the local file URI and a progress callback.
   * Should return the final hosted URL.
   */
  onUpload?: (uri: string, onProgress: (info: UploadProgressInfo) => void) => Promise<string>;

  /**
   * Show camera icon for quick camera access
   * @default false
   */
  showCameraIcon?: boolean;

  /**
   * Camera facing mode
   * @default 'back'
   */
  cameraType?: 'front' | 'back';
  /**
   * Initial input mode (optional)
   * If not provided, defaults to 'url'
   */
  initialInputMode?: 'url' | 'upload';
}

// ─── Upload Progress Overlay ──────────────────────────────────────────────────

interface UploadProgressViewProps {
  label: string;
  info: UploadProgressInfo;
}

const formatSpeed = (bps: number): string => {
  if (bps >= 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bps >= 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${bps.toFixed(0)} B/s`;
};

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const UploadProgressView: React.FC<UploadProgressViewProps> = ({ label, info }) => {
  const theme = useTheme();
  const { progress, speedBps, loaded, total } = info;
  const pct = Math.round(progress * 100);

  return (
    <View style={[progressStyles.container, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
      {/* Top row: file icon + name + percentage */}
      <View style={progressStyles.topRow}>
        <View style={[progressStyles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon name="file-image" size={18} color={theme.colors.onPrimaryContainer} />
        </View>
        <View style={progressStyles.nameBlock}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
            {label}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {total > 0 ? `${formatBytes(loaded)} / ${formatBytes(total)}` : 'Uploading…'}
          </Text>
        </View>
        <Text variant="labelMedium" style={{ color: theme.colors.primary, minWidth: 36, textAlign: 'right' }}>
          {pct}%
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[progressStyles.track, { backgroundColor: theme.colors.surfaceContainerHighest ?? theme.colors.outline }]}>
        <Animated.View
          style={[
            progressStyles.fill,
            {
              backgroundColor: theme.colors.primary,
              width: `${pct}%` as any,
            },
          ]}
        />
      </View>

      {/* Speed */}
      <Text variant="bodySmall" style={[progressStyles.speed, { color: theme.colors.onSurfaceVariant }]}>
        {pct >= 100 ? 'Processing…' : speedBps > 0 ? formatSpeed(speedBps) : ''}
      </Text>
    </View>
  );
};

const progressStyles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  speed: {
    textAlign: 'right',
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  label,
  value,
  onChangeText,
  error = false,
  helperText,
  disabled = false,
  fileType = 'image',
  placeholder = 'Select file or enter URL',
  showUrlInput = false,
  onUpload,
  showCameraIcon = false,
  cameraType = 'back',
  initialInputMode = 'upload',
}) => {
  const theme = useTheme();
  const [inputMode, setInputMode] = useState<'url' | 'upload'>(initialInputMode);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

  const { isUploading, uploadProgress, pickFromCamera, pickFromGallery } = useImagePicker({
    cameraType,
    onUpload,
    onImageChange: onChangeText,
  });

  // Check if value is an image that can be displayed
  const isImage = fileType === 'image' && value && (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:image') ||
    value.startsWith('file://') ||
    value.startsWith('content://') || // Android content URIs
    value.startsWith('/') || // Absolute file paths (iOS)
    value.startsWith('ph://') // iOS Photo Library asset identifiers
  );

  // Open bottom sheet for file selection
  const openFilePicker = useCallback(() => {
    setIsBottomSheetVisible(true);
  }, []);

  // Close bottom sheet
  const closeFilePicker = useCallback(() => {
    setIsBottomSheetVisible(false);
  }, []);

  const handleFileSelect = async () => {
    if (Platform.OS === 'web') {
      // Web implementation
      // Type guard for web environment
      if (typeof document === 'undefined') {
        console.error('Document is not available in this environment');
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = fileType === 'image' ? 'image/*' : fileType === 'document' ? '.pdf,.doc,.docx' : '*/*';

      input.onchange = async (e: Event) => {
        const target = e.target as unknown as HTMLInputElement;
        const file = target?.files?.[0];

        if (file) {
          const localUrl =
            typeof URL !== 'undefined' && URL.createObjectURL
              ? URL.createObjectURL(file)
              : '';
          if (onUpload && localUrl) {
            try {
              const url = await onUpload(localUrl, () => {});
              onChangeText?.(url);
            } catch (err) {
              console.error('Upload failed:', err);
              Alert.alert('Upload Failed', 'Failed to upload file. Please try again.');
            }
          } else if (localUrl) {
            onChangeText?.(localUrl);
          }
        }
      };

      input.click();
    } else {
      // Mobile implementation - open bottom sheet
      openFilePicker();
    }
  };

  /**
   * Handle document picker
   */
  const handleDocumentPicker = useCallback(async () => {
    try {
      closeFilePicker();

      // Determine file types based on fileType prop
      let allowedTypes;
      if (fileType === 'image') {
        allowedTypes = [documentTypes.images];
      } else if (fileType === 'document') {
        allowedTypes = [documentTypes.pdf, documentTypes.doc, documentTypes.docx];
      } else {
        allowedTypes = [documentTypes.allFiles];
      }

      const result = await pickDocument({
        type: allowedTypes,
        mode: 'open',
      });

      if (result && result.length > 0) {
        const file = result[0];

        if (onUpload && file.uri) {
          try {
            const url = await onUpload(file.uri, () => {});
            onChangeText?.(url);
          } catch (err) {
            console.error('Upload error:', err);
            Alert.alert('Upload Failed', 'Failed to upload file. Please try again.');
          }
        } else if (file.uri) {
          onChangeText?.(file.uri);
        }
      }
    } catch (error: unknown) {
      // User cancelled - no error needed
      if (error && typeof error === 'object' && 'code' in error && error.code === 'DOCUMENT_PICKER_CANCELED') {
        return;
      }
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  }, [fileType, onUpload, onChangeText, closeFilePicker]);

  const handleCameraLaunch = useCallback(async () => {
    closeFilePicker();
    await pickFromCamera();
  }, [closeFilePicker, pickFromCamera]);

  const handleGalleryLaunch = useCallback(async () => {
    closeFilePicker();
    await pickFromGallery();
  }, [closeFilePicker, pickFromGallery]);

  const handleRemove = () => {
    onChangeText?.('');
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text variant="bodySmall" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>

      {/* Upload progress (shown while uploading) */}
      {isUploading && uploadProgress && (
        <UploadProgressView label={label} info={uploadProgress} />
      )}

      {/* Indeterminate state (compression phase before upload starts) */}
      {isUploading && !uploadProgress && (
        <View style={[progressStyles.container, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
          <View style={progressStyles.topRow}>
            <View style={[progressStyles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon name="file-image" size={18} color={theme.colors.onPrimaryContainer} />
            </View>
            <View style={progressStyles.nameBlock}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{label}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Preparing…</Text>
            </View>
          </View>
          <View style={[progressStyles.track, { backgroundColor: theme.colors.surfaceContainerHighest ?? theme.colors.outline }]}>
            {/* Indeterminate shimmer handled by animated fill at ~30% */}
            <View style={[progressStyles.fill, { backgroundColor: theme.colors.primary, width: '30%' }]} />
          </View>
        </View>
      )}

      {/* Preview (if image and value exists and not uploading) */}
      {!isUploading && isImage && value && (
        <View style={[styles.previewContainer, { borderColor: theme.colors.outline }]}>
          <Image
            source={{ uri: value }}
            style={styles.preview}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[styles.removeButton, { backgroundColor: theme.colors.errorContainer }]}
            onPress={handleRemove}
            disabled={disabled}
          >
            <Icon name="close" size={16} color={theme.colors.onErrorContainer} />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload/URL Input Mode Toggle */}
      {showUrlInput && !value && !isUploading && (
        <View style={styles.modeToggle}>
          <TextButton
            onPress={() => setInputMode('upload')}
            disabled={disabled}
            color={inputMode === 'upload' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          >
            Upload File
          </TextButton>

          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <TextButton
            onPress={() => setInputMode('url')}
            disabled={disabled}
            color={inputMode === 'url' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          >
            Enter URL
          </TextButton>
        </View>
      )}

      {/* URL Input Mode */}
      {inputMode === 'url' && !value && !isUploading && (
        <TextInput
          mode="outlined"
          label={placeholder}
          value={value || ''}
          onChangeText={onChangeText}
          disabled={disabled}
          error={error}
          style={styles.input}
          outlineStyle={styles.outline}
          outlineColor={theme.colors.outline}
          activeOutlineColor={theme.colors.primary}
          theme={{
            colors: {
              background: theme.colors.surface,
              surfaceVariant: theme.colors.surface,
            },
          }}
          left={<TextInput.Icon icon="link" />}
        />
      )}

      {/* Upload Mode */}
      {inputMode === 'upload' && !value && !isUploading && (
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={[
              styles.uploadBox,
              {
                borderColor: error ? theme.colors.error : theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
              },
            ]}
            onPress={handleFileSelect}
            disabled={disabled || isUploading}
          >
            <Icon
              name={fileType === 'image' ? 'image-plus' : 'file-upload'}
              size={32}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              {`Tap to select ${fileType}`}
            </Text>
            <BodySmall color={theme.colors.onSurfaceVariant} style={{ marginTop: 4 }}>
              {fileType === 'image' ? 'JPG, PNG, or GIF' : 'PDF, DOC, or DOCX'}
            </BodySmall>
          </TouchableOpacity>

          {/* Camera Icon Button (if enabled) */}
          {showCameraIcon && fileType === 'image' && (
            <TouchableOpacity
              style={[styles.cameraIconButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleCameraLaunch}
              disabled={disabled || isUploading}
            >
              <Icon name="camera" size={24} color={theme.colors.onPrimary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* File info (if non-image file selected) */}
      {!isUploading && !isImage && value && (
        <View style={[styles.fileInfo, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
          <Icon name="file" size={24} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 12 }} numberOfLines={1}>
            {value.split('/').pop() || 'File selected'}
          </Text>
          <TouchableOpacity onPress={handleRemove} disabled={disabled}>
            <Icon name="close" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      )}

      {/* Helper/Error Text */}
      {helperText && !isUploading && (
        <BodySmall
          color={error ? theme.colors.error : theme.colors.onSurfaceVariant}
          style={styles.helperText}
        >
          {helperText}
        </BodySmall>
      )}

      {/* Actions (if file exists and not uploading) */}
      {!isUploading && value && (
        <View style={styles.actions}>
          <OutlinedButton
            onPress={handleRemove}
            disabled={disabled}
            icon="delete"
          >
            Remove
          </OutlinedButton>

          {showUrlInput && (
            <TextButton
              onPress={() => {
                setInputMode('url');
                handleRemove();
              }}
              disabled={disabled}
            >
              Change to URL
            </TextButton>
          )}
        </View>
      )}

      {/* File Picker Bottom Sheet */}
      <BottomSheet
        visible={isBottomSheetVisible}
        onDismiss={closeFilePicker}
        snapPoints={['30%']}
        enablePanDownToClose
      >
        <View style={styles.bottomSheetContent}>
          <Text variant="titleMedium" style={[styles.bottomSheetTitle, { color: theme.colors.onSurface }]}>
            Select Source
          </Text>

          <View style={styles.optionsGrid}>
            {/* Camera Option */}
            <TouchableOpacity
              style={[styles.optionItem, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={handleCameraLaunch}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <Icon name="camera" size={20} color={theme.colors.onPrimaryContainer} />
              </View>
              <Text variant="labelLarge" style={[styles.optionLabel, { color: theme.colors.onSurface }]}>
                Camera
              </Text>
            </TouchableOpacity>

            {/* Photo Library Option */}
            <TouchableOpacity
              style={[styles.optionItem, { backgroundColor: theme.colors.surfaceVariant }]}
              onPress={handleGalleryLaunch}
            >
              <View style={[styles.optionIcon, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Icon name="image-multiple" size={20} color={theme.colors.onSecondaryContainer} />
              </View>
              <Text variant="labelLarge" style={[styles.optionLabel, { color: theme.colors.onSurface }]}>
                Gallery
              </Text>
            </TouchableOpacity>

            {/* Files Option (only for document/any) */}
            {fileType !== 'image' && (
              <TouchableOpacity
                style={[styles.optionItem, { backgroundColor: theme.colors.surfaceVariant }]}
                onPress={handleDocumentPicker}
              >
                <View style={[styles.optionIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <Icon name="file-document" size={20} color={theme.colors.onTertiaryContainer} />
                </View>
                <Text variant="labelLarge" style={[styles.optionLabel, { color: theme.colors.onSurface }]}>
                  Files
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
  },
  previewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: 8,
  },
  input: {
    backgroundColor: 'transparent',
    height: 56,
  },
  outline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  uploadContainer: {
    position: 'relative',
  },
  uploadBox: {
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cameraIconButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  helperText: {
    marginTop: 4,
    marginLeft: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  bottomSheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  bottomSheetTitle: {
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    paddingTop: 16,
  },
  optionItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    marginTop: 8,
  },
});
