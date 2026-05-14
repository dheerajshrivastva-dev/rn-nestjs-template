/**
 * useImagePicker hook
 * Shared image-picking logic: camera & gallery with permission handling.
 * Extracted from FileUploadInput so it can be reused by AvatarPicker and
 * any other component that needs to pick a single photo.
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import ImageResizer from 'react-native-image-resizer';
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
  type CameraType,
} from 'react-native-image-picker';
import { requestPermission } from '../utils/permissions';

/**
 * Compresses a local image URI to JPEG at 80% quality, max 1920×1920.
 * Returns the compressed file URI.
 */
const compressImage = async (uri: string): Promise<string> => {
  // react-native-image-resizer requires a file:// URI on Android
  const normalizedUri =
    uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`;
  const result = await ImageResizer.createResizedImage(
    normalizedUri,
    1920,  // maxWidth
    1920,  // maxHeight
    'JPEG',
    80,    // quality 0–100
    0,     // rotation
    undefined, // outputPath — use temp dir
    false, // keepMeta
    { mode: 'contain', onlyScaleDown: true },
  );
  return result.uri;
};

export interface UploadProgressInfo {
  /** 0–1 */
  progress: number;
  /** bytes per second */
  speedBps: number;
  loaded: number;
  total: number;
}

export interface UseImagePickerOptions {
  /**
   * Facing mode when launching camera.
   * @default 'back'
   */
  cameraType?: CameraType;

  /**
   * Optional async handler that receives the local file URI and a progress
   * callback, and should return the final hosted URL.
   * If omitted the local file URI is used directly.
   */
  onUpload?: (uri: string, onProgress: (info: UploadProgressInfo) => void) => Promise<string>;

  /** Called with the resolved URI/URL once the user picks an image. */
  onImageChange?: (uri: string) => void;
}

export interface UseImagePickerReturn {
  /** True while the onUpload handler is running. */
  isUploading: boolean;
  /** Upload progress info (null when not uploading). */
  uploadProgress: UploadProgressInfo | null;
  /** Launch the device camera (requests permission first). */
  pickFromCamera: () => Promise<void>;
  /** Open the photo gallery (requests permission first). */
  pickFromGallery: () => Promise<void>;
}

export const useImagePicker = ({
  cameraType = 'back',
  onUpload,
  onImageChange,
}: UseImagePickerOptions): UseImagePickerReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);

  const handleResponse = useCallback(
    async (response: ImagePickerResponse) => {
      if (response.didCancel) return;

      if (response.errorCode) {
        const msg =
          response.errorCode === 'camera_unavailable'
            ? 'Camera is not available on this device.'
            : response.errorCode === 'permission'
              ? 'Permission denied. Please enable it in Settings.'
              : response.errorMessage ?? 'Failed to pick image.';
        Alert.alert('Error', msg);
        return;
      }

      const rawUri = response.assets?.[0]?.uri;
      if (!rawUri) return;

      try {
        setIsUploading(true);
        setUploadProgress(null);
        let uri = rawUri;
        try {
          uri = await compressImage(rawUri);
        } catch (compressErr) {
          // Compression failed — log and fall back to raw URI
          console.warn('[useImagePicker] compressImage failed, using raw URI:', compressErr);
        }
        if (onUpload) {
          const url = await onUpload(uri, setUploadProgress);
          onImageChange?.(url);
        } else {
          onImageChange?.(uri);
        }
      } catch (err) {
        console.error('[useImagePicker] upload failed:', err);
        Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [onUpload, onImageChange],
  );

  const pickFromCamera = useCallback(async () => {
    const permission = await requestPermission('camera', {
      rationale: 'Camera access is needed to take photos.',
    });
    if (!permission.granted) return;

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 1,   // full quality — ImageResizer handles compression
      saveToPhotos: false,
      cameraType,
    });
    await handleResponse(result);
  }, [cameraType, handleResponse]);

  const pickFromGallery = useCallback(async () => {
    const permission = await requestPermission('photoLibrary', {
      rationale: 'Photo library access is needed to select photos.',
    });
    if (!permission.granted) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 1,   // full quality — ImageResizer handles compression
      selectionLimit: 1,
    });
    await handleResponse(result);
  }, [handleResponse]);

  return { isUploading, uploadProgress, pickFromCamera, pickFromGallery };
};
