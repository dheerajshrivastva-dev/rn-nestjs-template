import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadResult } from './providers/storage-provider.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('profile')
  @ApiOperation({
    summary: 'Upload a profile image',
    description: 'Upload profile image for a user or client. Returns { url, publicId } — pass both to the update endpoint to save to DB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg/png/webp, max 5MB)',
        },
        entityId: {
          type: 'string',
          description: 'User or client ID. Defaults to the authenticated user ID if omitted.',
        },
        oldPublicId: {
          type: 'string',
          description: 'Cloudinary publicId of the existing image to delete (omit on first upload)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadProfile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: User,
    @Body('entityId') entityId?: string,
    @Body('oldPublicId') oldPublicId?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const id = entityId || currentUser.id;
    return this.uploadService.uploadProfile(file, id, oldPublicId);
  }

  @Post('document')
  @ApiOperation({
    summary: 'Upload a client document',
    description: 'Upload aadhar1, aadhar2, or selfie for a client. Returns { url, publicId } — pass to update client endpoint to save to DB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'clientId', 'docType'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (jpg/png/webp/pdf, max 10MB)',
        },
        clientId: {
          type: 'string',
          description: 'Client ID this document belongs to',
        },
        docType: {
          type: 'string',
          enum: ['aadhar1', 'aadhar2', 'selfie'],
          description: 'Type of document',
        },
        oldPublicId: {
          type: 'string',
          description: 'Cloudinary publicId of the existing document to delete (omit on first upload)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('clientId') clientId: string,
    @Body('docType') docType: string,
    @Body('oldPublicId') oldPublicId?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!clientId) {
      throw new BadRequestException('clientId is required');
    }
    const allowedDocTypes = ['aadhar1', 'aadhar2', 'selfie'];
    if (!allowedDocTypes.includes(docType)) {
      throw new BadRequestException(`docType must be one of: ${allowedDocTypes.join(', ')}`);
    }
    return this.uploadService.uploadDocument(file, clientId, docType, oldPublicId);
  }
}
