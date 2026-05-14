import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Complete2FADto {
  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code sent to your email',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  otp: string;
}
