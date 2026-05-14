/**
 * ImagePreview Component
 * Image thumbnail with actions
 */

import React from 'react';
import { View, Image, StyleSheet, type ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTheme } from '../../hooks/useTheme';

export interface ImagePreviewProps {
  /**
   * Image URI
   */
  imageUri: string;

  /**
   * Image width
   * @default 120
   */
  width?: number;

  /**
   * Image height
   * @default 120
   */
  height?: number;

  /**
   * View/expand handler
   */
  onView?: () => void;

  /**
   * Delete handler
   */
  onDelete?: () => void;

  /**
   * Whether preview is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Border radius
   * @default 8
   */
  borderRadius?: number;
}

/**
 * ImagePreview
 *
 * Image thumbnail component with view and delete actions.
 * Shows preview with action buttons overlay.
 *
 * @example
 * // Basic image preview
 * <ImagePreview
 *   imageUri={photoUri}
 *   onView={viewFullImage}
 *   onDelete={deleteImage}
 * />
 *
 * @example
 * // Large preview without delete
 * <ImagePreview
 *   imageUri={image}
 *   width={200}
 *   height={200}
 *   onView={expandImage}
 * />
 *
 * @example
 * // Multiple previews
 * <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
 *   {images.map((img, idx) => (
 *     <ImagePreview
 *       key={idx}
 *       imageUri={img.uri}
 *       width={100}
 *       height={100}
 *       onView={() => viewImage(idx)}
 *       onDelete={() => deleteImage(idx)}
 *     />
 *   ))}
 * </View>
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUri,
  width = 120,
  height = 120,
  onView,
  onDelete,
  disabled = false,
  style,
  borderRadius = 8,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { width, height }, style]}>
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, { borderRadius }]}
        resizeMode="cover"
      />

      {/* Overlay Actions */}
      {!disabled && (
        <View style={styles.overlay}>
          {onView && (
            <IconButton
              icon="eye"
              size={20}
              iconColor={theme.colors.surface}
              style={[styles.actionButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={onView}
            />
          )}
          {onDelete && (
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.surface}
              style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
              onPress={onDelete}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
