import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { User } from './entities/user.entity';
import { UserRole, UserStatus } from '../../common/enums';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'List all users',
    description: 'Paginated list with optional filters. Results exclude sensitive fields (password, 2FA secrets).',
  })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by role' })
  @ApiQuery({ name: 'status', required: false, enum: UserStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by firstName, lastName, or email' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Max 100' })
  @ApiResponse({
    status: 200,
    description: 'Paginated user list',
    schema: {
      example: {
        data: [{ id: 'uuid', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', role: 'manager', status: 'active' }],
        total: 42,
        page: 1,
        limit: 20,
      },
    },
  })
  @Get()
  findAll(
    @Query('role') role?: UserRole,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll({
      role,
      status,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto) {
    return this.userService.update(user.id, dto);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @ApiOperation({
    summary: 'Assign a role to a user',
    description:
      '**Authority rules:**\n\n' +
      '| Actor role | Can assign |\n' +
      '|---|---|\n' +
      '| `admin` (100) | `admin`, `manager`, `user` |\n' +
      '| `manager` (50) | `manager`, `user` |\n' +
      '| `user` (0) | nothing |\n\n' +
      'Additional constraint: actor must have **strictly higher** authority than the target\'s **current** role — so a manager cannot change another manager\'s role.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Target user ID' })
  @ApiResponse({
    status: 200,
    description: 'Role updated — returns the updated user',
    schema: {
      example: {
        id: 'a1b2c3d4-...',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'manager',
        status: 'active',
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Insufficient authority to assign this role or modify this user' })
  @ApiResponse({ status: 400, description: 'Cannot change your own role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch(':id/role')
  assignRole(
    @CurrentUser() actor: User,
    @Param('id') targetId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.userService.assignRole(actor.id, targetId, dto.role);
  }
}
