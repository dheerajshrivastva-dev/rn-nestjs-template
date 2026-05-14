import { IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: '123456',
    description: 'OTP code received via email',
  })
  @IsString()
  otp: string;

  @ApiProperty({
    example: 'NewSecureP@ssw0rd',
    description: 'New password (min 8 characters, must contain uppercase, lowercase, number, and special character)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  newPassword: string;

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Temporary token from forgot-password endpoint (can be sent in Authorization header instead)',
  })
  @IsOptional()
  @IsString()
  tempToken?: string;
}
