import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

export class AssignRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.MANAGER,
    description: 'Role to assign. Actor must have authority >= the target role.',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
