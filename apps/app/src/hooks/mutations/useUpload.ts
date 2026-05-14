/**
 * useUpload Hook
 *
 * Uses raw XMLHttpRequest for multipart uploads so React Native sets the
 * correct Content-Type boundary automatically (axios instance defaults
 * would otherwise override it with application/json).
 *
 * Usage — profile picture:
 *   const { uploadProfile } = useUpload();
 *   await uploadProfile({ uri, entityId });
 *
 * Usage — client document:
 *   const { uploadDocument } = useUpload();
 *   await uploadDocument({ uri, clientId, docType, onProgress: (info) => ... });
 */

import { TokenManager } from '../../api/client';
import { API_BASE_URL, UPLOAD_ENDPOINTS } from '../../api/endpoints';

export type DocumentType = 'aadhar1' | 'aadhar2' | 'selfie';

export interface UploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary';
}

export interface UploadProgressInfo {
  /** 0–1 */
  progress: number;
  /** bytes per second */
  speedBps: number;
  /** bytes uploaded */
  loaded: number;
  /** total bytes */
  total: number;
}

export interface UploadProfileParams {
  uri: string;
  entityId?: string;
  oldPublicId?: string;
  onProgress?: (info: UploadProgressInfo) => void;
}

export interface UploadDocumentParams {
  uri: string;
  clientId: string;
  docType: DocumentType;
  oldPublicId?: string;
  onProgress?: (info: UploadProgressInfo) => void;
}

// RN FormData accepts { uri, type, name } for file entries.
type RNFormData = Omit<FormData, 'append'> & {
  append(key: string, value: { uri: string; type: string; name: string } | string): void;
};

const mimeFromUri = (uri: string): string => {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'pdf') return 'application/pdf';
  return 'image/jpeg';
};

/**
 * Upload FormData via XHR — bypasses axios so RN sets the multipart
 * Content-Type + boundary automatically.
 */
const xhrUpload = <T>(
  endpoint: string,
  form: RNFormData,
  onProgress?: (info: UploadProgressInfo) => void,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE_URL}/api/v1${endpoint}`;

    xhr.open('POST', url);

    const token = TokenManager.getAccessToken() || TokenManager.getTempToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    // Do NOT set Content-Type — XHR sets multipart/form-data; boundary=... automatically

    if (onProgress) {
      const startTime = Date.now();
      let lastLoaded = 0;
      let lastTime = startTime;

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const now = Date.now();
        const chunkBytes = event.loaded - lastLoaded;
        const chunkSec = (now - lastTime) / 1000;
        const speedBps = chunkSec > 0 ? chunkBytes / chunkSec : 0;
        lastLoaded = event.loaded;
        lastTime = now;

        onProgress({
          progress: Math.min(event.loaded / event.total, 1),
          speedBps,
          loaded: event.loaded,
          total: event.total,
        });
      };

      // Once all bytes are sent, hold at 100% with zero speed (server is processing)
      xhr.upload.onload = () => {
        onProgress({ progress: 1, speedBps: 0, loaded: lastLoaded, total: lastLoaded });
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
          const err: any = new Error(msg || `HTTP ${xhr.status}`);
          err.response = { status: xhr.status, data: body };
          reject(err);
        } catch {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network Error'));
    xhr.ontimeout = () => reject(new Error('Request timed out'));
    xhr.timeout = 60000;

    xhr.send(form as unknown as FormData);
  });
};

export const useUpload = () => {
  const uploadProfile = async ({
    uri,
    entityId,
    oldPublicId,
    onProgress,
  }: UploadProfileParams): Promise<UploadResult> => {
    const form = new FormData() as unknown as RNFormData;
    form.append('file', { uri, type: mimeFromUri(uri), name: 'profile.jpg' });
    if (entityId) form.append('entityId', entityId);
    if (oldPublicId) form.append('oldPublicId', oldPublicId);

    return xhrUpload<UploadResult>(UPLOAD_ENDPOINTS.PROFILE, form, onProgress);
  };

  const uploadDocument = async ({
    uri,
    clientId,
    docType,
    oldPublicId,
    onProgress,
  }: UploadDocumentParams): Promise<UploadResult> => {
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg';
    const form = new FormData() as unknown as RNFormData;
    form.append('file', { uri, type: mimeFromUri(uri), name: `${docType}.${ext}` });
    form.append('clientId', clientId);
    form.append('docType', docType);
    if (oldPublicId) form.append('oldPublicId', oldPublicId);

    return xhrUpload<UploadResult>(UPLOAD_ENDPOINTS.DOCUMENT, form, onProgress);
  };

  return { uploadProfile, uploadDocument };
};
