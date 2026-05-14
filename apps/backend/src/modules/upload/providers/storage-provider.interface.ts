export interface UploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary';
}

export interface IStorageProvider {
  upload(buffer: Buffer, folder: string, filename: string): Promise<UploadResult>;
  delete(publicId: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
