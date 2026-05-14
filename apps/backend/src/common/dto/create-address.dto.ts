import { IsString, IsOptional, IsNotEmpty, IsNumber, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiPropertyOptional({
    example: '123 MG Road',
    description: 'Street address',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  street?: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'City name',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  city: string;

  @ApiProperty({
    example: 'Karnataka',
    description: 'State name',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  state: string;

  @ApiProperty({
    example: 'India',
    description: 'Country name',
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  country: string;

  @ApiProperty({
    example: '560001',
    description: 'Postal/ZIP code',
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @Length(1, 20)
  postalCode: string;

  @ApiPropertyOptional({
    example: 12.9716,
    description: 'Latitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    example: 77.5946,
    description: 'Longitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
