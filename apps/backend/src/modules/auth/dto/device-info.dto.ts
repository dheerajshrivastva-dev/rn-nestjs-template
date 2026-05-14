import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceInfoDto {
  @ApiPropertyOptional({ example: 'iPhone 13 Pro' })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    example: 'mobile',
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
  })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({ example: 'iOS' })
  @IsOptional()
  @IsString()
  osName?: string;

  @ApiPropertyOptional({ example: '16.0' })
  @IsOptional()
  @IsString()
  osVersion?: string;

  @ApiPropertyOptional({ example: 'Safari' })
  @IsOptional()
  @IsString()
  browserName?: string;

  @ApiPropertyOptional({ example: '16.0' })
  @IsOptional()
  @IsString()
  browserVersion?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ example: 'sha256hash...' })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mumbai' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'IN' })
  @IsOptional()
  @IsString()
  countryCode?: string;

  @ApiPropertyOptional({ example: 19.0760, description: 'GPS latitude (optional, sent if permission granted)' })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.8777, description: 'GPS longitude (optional, sent if permission granted)' })
  @IsOptional()
  longitude?: number;
}
