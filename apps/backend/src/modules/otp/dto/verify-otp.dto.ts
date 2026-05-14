import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'Temporary token containing OTP metadata',
  })
  @IsNotEmpty()
  @IsString()
  tempToken: string;
}
