/**
 * DocumentUpload Component
 * Document file upload with tap to select
 */

import React from 'react';
import { View, StyleSheet, Pressable, Alert, type ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import { pick, types as documentTypes } from '@react-native-documents/picker';
import { BodyMedium } from '../typography/BodyMedium';
import { LabelSmall } from '../typography/LabelSmall';
import { useTheme } from '../../hooks/useTheme';

export interface DocumentFile {
  uri: string;
  name: string;
  size: number;
  type: string;
}

export interface DocumentUploadProps {
  /**
   * Uploaded documents
   */
  documents?: DocumentFile[];

  /**
   * Upload handler
   */
  onUpload?: (document: DocumentFile) => void;

  /**
   * Remove handler
   */
  onRemove?: (index: number) => void;

  /**
   * Maximum number of files
   */
  maxFiles?: number;

  /**
   * Accepted file types
   */
  acceptedTypes?: string[];

  /**
   * Whether upload is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Placeholder text
   * @default 'Tap to upload document'
   */
  placeholder?: string;
}

/**
 * DocumentUpload
 *
 * Document upload component with file list.
 * Shows uploaded documents with remove option.
 *
 * @example
 * // Basic document upload
 * <DocumentUpload
 *   documents={documents}
 *   onUpload={handleUpload}
 *   onRemove={handleRemove}
 * />
 *
 * @example
 * // With file restrictions
 * <DocumentUpload
 *   documents={docs}
 *   onUpload={uploadDoc}
 *   maxFiles={3}
 *   acceptedTypes={['application/pdf', 'image/jpeg']}
 * />
 *
 * @example
 * // Custom placeholder
 * <DocumentUpload
 *   onUpload={handleUpload}
 *   placeholder="Upload your ID proof"
 * />
 */
export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents = [],
  onUpload,
  onRemove,
  maxFiles,
  acceptedTypes,
  disabled = false,
  style,
  placeholder = 'Tap to upload document',
}) => {
  const theme = useTheme();

  const canUploadMore = !maxFiles || documents.length < maxFiles;

  const handlePress = async () => {
    if (disabled || !canUploadMore) return;
    try {
      const results = await pick({
        type: [documentTypes.pdf, documentTypes.doc, documentTypes.docx, documentTypes.images],
        mode: 'open',
      });
      const file = results[0];
      if (file?.uri) {
        onUpload?.({
          uri: file.uri,
          name: file.name ?? file.uri.split('/').pop() ?? 'file',
          size: file.size ?? 0,
          type: file.type ?? 'application/octet-stream',
        });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'DOCUMENT_PICKER_CANCELED') return;
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Upload Area */}
      {canUploadMore && (
        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={[
            styles.uploadArea,
            {
              backgroundColor: theme.colors.surfaceContainerHighest,
              borderColor: theme.colors.outline,
            },
            disabled && styles.disabled,
          ]}
        >
          <IconButton
            icon="file-upload"
            size={32}
            iconColor={theme.colors.primary}
          />
          <BodyMedium style={{ color: theme.colors.onSurfaceVariant }}>
            {placeholder}
          </BodyMedium>
          {maxFiles && (
            <LabelSmall style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {documents.length} / {maxFiles} files
            </LabelSmall>
          )}
        </Pressable>
      )}

      {/* Document List */}
      {documents.map((doc, index) => (
        <View
          key={index}
          style={[
            styles.documentItem,
            {
              backgroundColor: theme.colors.surfaceContainerHigh,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <IconButton icon="file-document" size={24} iconColor={theme.colors.primary} />
          <View style={styles.documentInfo}>
            <BodyMedium numberOfLines={1}>{doc.name}</BodyMedium>
            <LabelSmall style={{ color: theme.colors.onSurfaceVariant }}>
              {formatFileSize(doc.size)}
            </LabelSmall>
          </View>
          {!disabled && (
            <IconButton
              icon="close"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => onRemove?.(index)}
            />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  uploadArea: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 8,
  },
});
