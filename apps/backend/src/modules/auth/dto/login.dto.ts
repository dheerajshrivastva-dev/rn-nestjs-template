import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DeviceInfoDto } from './device-info.dto';

export class LoginDto {
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.email && !o.phone)
  userId?: string;

  @IsOptional()
  @IsEmail()
  @ValidateIf((o) => !o.userId && !o.phone)
  email?: string;

  @ApiPropertyOptional({
    example: '+919876543210',
    description: 'Phone number with country code',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.userId && !o.email)
  phone?: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'User password (min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password: string;


  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo?: DeviceInfoDto;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'Access token (15 min expiry)' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token (7 days expiry)' })
  refreshToken: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
  };
}

export class TwoFactorLoginResponseDto {
  @ApiProperty({ description: 'Temporary token for 2FA verification' })
  tempToken: string;

  @ApiProperty({ description: 'Message indicating 2FA is required' })
  message: string;

  @ApiProperty({ description: 'Whether OTP was sent successfully' })
  otpSent: boolean;
}

export class Verify2FADto {
  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code',
  })
  @IsString()
  @MinLength(6)
  otpCode: string;

  @ApiProperty({
    description: 'Temporary token received from login',
  })
  @IsString()
  tempToken: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
  })
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send reset OTP',
  })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code',
  })
  @IsString()
  @MinLength(6)
  otpCode: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description: 'New password (min 8 characters)',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
