import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { IStorageProvider, UploadResult } from './storage-provider.interface';

@Injectable()
export class CloudinaryProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryProvider.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(buffer: Buffer, folder: string, _filename: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          upload_preset: 'file',
          asset_folder: `duetech/assets/${folder}`,
          resource_type: 'auto',
          // overwrite: false and unique_filename: true are set in the preset
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(new Error(`Upload failed: ${error.message}`));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            provider: 'cloudinary',
          });
        },
      );

      uploadStream.end(buffer);
    });
  }

  async delete(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Log but don't throw — deletion failure should not block the new upload
      this.logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${error.message}`);
    }
  }
}
