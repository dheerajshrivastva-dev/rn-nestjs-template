import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route
 * @example
 * @Roles(UserRole.SUPER_ADMIN)
 * @Get('users')
 * getAllUsers() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
