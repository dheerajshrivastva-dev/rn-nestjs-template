import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Resend2FADto {
  @ApiProperty({
    example: 'temp-jwt-token-from-login',
    description: 'Temporary token received during login',
  })
  @IsNotEmpty()
  @IsString()
  tempToken: string;
}
