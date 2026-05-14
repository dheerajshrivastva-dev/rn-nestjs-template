import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';


/**
 * RBAC Guard - Checks if the authenticated user has required role
 * Must be used AFTER JwtAuthGuard (requires request.user to be set)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no @Roles() decorator, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: any = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user found');
    }

    // SuperAdmin can access everything
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`,
      );
    }

    return true;
  }
}
