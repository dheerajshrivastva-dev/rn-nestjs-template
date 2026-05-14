import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  MinLength,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AddressDto, MediaFileDto } from './create-super.dto';
import { UserStatus } from '../../../common/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Mobile number with country code',
    example: '+919876543210',
  })
  @IsOptional()
  @IsPhoneNumber('IN')
  phone?: string;

  @ApiPropertyOptional({
    description: 'Commission percentage (0-30%)',
    example: 10,
    minimum: 0,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  commissionPercentage?: number;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Address details',
    type: AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Profile picture (upload via POST /upload/profile first)',
    type: MediaFileDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MediaFileDto)
  profilePicture?: MediaFileDto;

  @ApiPropertyOptional({
    description: 'Contact phone (alternate)',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Contact email (alternate)',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
