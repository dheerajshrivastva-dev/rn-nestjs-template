import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import {
  IStorageProvider,
  STORAGE_PROVIDER,
  UploadResult,
} from './providers/storage-provider.interface';

export type UploadFolder = 'profiles' | 'documents/aadhar' | 'documents/selfie';

@Injectable()
export class UploadService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadProfile(
    file: Express.Multer.File,
    entityId: string,
    oldPublicId?: string,
  ): Promise<UploadResult> {
    this.validateImageFile(file);

    if (oldPublicId) {
      await this.storageProvider.delete(oldPublicId);
    }

    const filename = `${entityId}_${Date.now()}`;
    return this.storageProvider.upload(file.buffer, 'profiles', filename);
  }

  async uploadDocument(
    file: Express.Multer.File,
    entityId: string,
    docType: string,
    oldPublicId?: string,
  ): Promise<UploadResult> {
    this.validateFile(file);

    if (oldPublicId) {
      await this.storageProvider.delete(oldPublicId);
    }

    const filename = `${entityId}_${docType}_${Date.now()}`;
    const folder = docType === 'selfie' ? 'documents/selfie' : 'documents/aadhar';
    return this.storageProvider.upload(file.buffer, folder, filename);
  }

  async deleteFile(publicId: string): Promise<void> {
    await this.storageProvider.delete(publicId);
  }

  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
      );
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
      );
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }
  }
}
