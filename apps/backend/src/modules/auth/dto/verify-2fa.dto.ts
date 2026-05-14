import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code sent to email',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({
    example: 'temp-jwt-token-from-login',
    description: 'Temporary token received during login',
  })
  @IsNotEmpty()
  @IsString()
  tempToken: string;
}
