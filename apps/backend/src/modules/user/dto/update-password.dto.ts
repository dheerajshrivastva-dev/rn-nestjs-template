import {
  IsString,
  IsUUID,
  IsBoolean,
  IsOptional,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 2FA Method Options
 */
export enum TwoFactorMethod {
  TOTP = '2fa_totp',
  MOBILE_OTP = '2fa_mobile_otp',
}

/**
 * DTO for updating user password
 * Used by SUPER_ADMIN to update any user's password (except other SUPER_ADMINs)
 * or by users to update their own password
 */
export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Target user ID whose password will be updated',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
    example: 'NewSecurePassword@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiPropertyOptional({
    description:
      'Current password (required when updating own password, not required for SUPER_ADMIN updating other users)',
    example: 'OldPassword@123',
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({
    description: 'Logout user from all devices after password update',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  logoutAllDevices?: boolean;

  @ApiPropertyOptional({
    description: 'Disable two-factor authentication for the user',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  reset2FA?: boolean;

  @ApiPropertyOptional({
    description:
      'Replace current 2FA method with a new one (null to keep current, 2fa_totp for TOTP, 2fa_mobile_otp for Mobile OTP)',
    example: '2fa_totp',
    enum: TwoFactorMethod,
  })
  @IsOptional()
  @IsEnum(TwoFactorMethod, {
    message: 'Invalid 2FA method. Must be 2fa_totp or 2fa_mobile_otp',
  })
  replace2FAWithMethod?: TwoFactorMethod;

  @ApiPropertyOptional({
    description:
      'Reason for password update (recorded in audit log, recommended for SUPER_ADMIN updates)',
    example: 'User reported account compromise',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for changing own password
 * Simpler version for users updating their own password
 */
export class ChangeOwnPasswordDto {
  @ApiProperty({
    description: 'Own user ID (must match authenticated user)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Current password for verification',
    example: 'OldPassword@123',
  })
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description:
      'New password (min 8 chars, must contain uppercase, lowercase, number, and special character)',
    example: 'NewSecurePassword@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiPropertyOptional({
    description: 'Logout from all other devices (keeps current session)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  logoutAllDevices?: boolean;

  @ApiPropertyOptional({
    description: 'Disable own two-factor authentication',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  reset2FA?: boolean;

  @ApiPropertyOptional({
    description: 'Replace current 2FA method with a new one',
    example: '2fa_totp',
    enum: TwoFactorMethod,
  })
  @IsOptional()
  @IsEnum(TwoFactorMethod)
  replace2FAWithMethod?: TwoFactorMethod;
}

/**
 * Response DTO for password update operations
 */
export class UpdatePasswordResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success or error message',
    example: 'Password updated successfully',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Number of devices/sessions logged out',
    example: 3,
  })
  devicesLoggedOut?: number;

  @ApiPropertyOptional({
    description: 'Updated two-factor authentication status',
    example: {
      enabled: true,
      primaryMethod: '2fa_totp',
    },
  })
  twoFactorStatus?: {
    enabled: boolean;
    primaryMethod?: string;
  };

  @ApiProperty({
    description: 'Audit log entry ID for this operation',
    example: 'audit-uuid-123',
  })
  auditLogId: string;
}
