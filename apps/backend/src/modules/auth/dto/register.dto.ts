import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, Matches, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password (min 8 chars, must contain uppercase, lowercase, number, and special char)',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'User phone number',
  })
  @IsNotEmpty()
  @IsPhoneNumber('IN')
  phone: string;
}
