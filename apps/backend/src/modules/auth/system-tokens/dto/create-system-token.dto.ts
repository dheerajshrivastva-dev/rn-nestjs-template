import {
  IsString,
  IsOptional,
  IsArray,
  IsDate,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  IsIP,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemTokenDto {
  @ApiProperty({ example: 'Zapier Integration', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Used by Zapier to sync orders', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Permission scopes for this token, e.g. ["orders:read", "users:write"]',
    type: [String],
    example: ['orders:read', 'reports:read'],
    default: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  scopes?: string[] = [];

  @ApiPropertyOptional({
    description: 'Token expiry date. Omit or set null for non-expiring tokens.',
    example: '2027-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Restrict token to specific IP addresses. Omit to allow all IPs.',
    type: [String],
    example: ['203.0.113.5', '198.51.100.0'],
  })
  @IsOptional()
  @IsArray()
  @IsIP('4', { each: true })
  @ArrayMaxSize(20)
  ipWhitelist?: string[];
}
