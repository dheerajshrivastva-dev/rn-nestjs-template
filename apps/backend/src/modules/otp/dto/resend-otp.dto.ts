import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResendOtpDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'Temporary token containing OTP metadata',
  })
  @IsNotEmpty()
  @IsString()
  tempToken: string;
}
