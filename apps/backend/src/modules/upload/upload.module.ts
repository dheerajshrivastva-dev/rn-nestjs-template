import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { STORAGE_PROVIDER } from './providers/storage-provider.interface';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    {
      provide: STORAGE_PROVIDER,
      useClass: CloudinaryProvider,
    },
    CloudinaryProvider,
  ],
  exports: [UploadService],
})
export class UploadModule {}
