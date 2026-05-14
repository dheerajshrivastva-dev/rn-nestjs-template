import {
  IsString,
  IsOptional,
  IsArray,
  IsDate,
  MaxLength,
  ArrayMaxSize,
  IsIP,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSystemTokenDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['orders:read'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  scopes?: string[];

  @ApiPropertyOptional({ description: 'Set null to make non-expiring' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date | null;

  @ApiPropertyOptional({ type: [String], description: 'Set [] to remove IP restriction' })
  @IsOptional()
  @IsArray()
  @IsIP('4', { each: true })
  @ArrayMaxSize(20)
  ipWhitelist?: string[];
}
