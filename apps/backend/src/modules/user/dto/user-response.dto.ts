import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../../common/enums';

@Exclude()
export class UserResponseDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() firstName: string;
  @Expose() @ApiProperty({ required: false }) lastName?: string;
  @Expose() @ApiProperty() email: string;
  @Expose() @ApiProperty({ required: false }) phone?: string;
  @Expose() @ApiProperty({ enum: UserRole }) role: UserRole;
  @Expose() @ApiProperty({ enum: UserStatus }) status: UserStatus;
  @Expose() @ApiProperty({ required: false }) avatarUrl?: string;
  @Expose() @ApiProperty() emailVerified: boolean;
  @Expose() @ApiProperty() is2FAEnabled: boolean;
  @Expose() @ApiProperty() createdAt: Date;
  @Expose() @ApiProperty() updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
