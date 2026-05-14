import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';

/**
 * JWT Authentication Guard
 *
 * This guard extends the Passport JWT authentication strategy to protect routes
 * from unauthorized access. It validates JWT tokens and enforces authentication
 * requirements across the application.
 *
 * Key features:
 * - Validates JWT tokens from incoming requests (typically from Authorization header)
 * - Supports public route bypass using the @Public() decorator
 * - Supports optional authentication using the @OptionalAuth() decorator
 * - Automatically extracts and attaches the authenticated user to the request object
 * - Throws UnauthorizedException for invalid, expired, or missing tokens (except @OptionalAuth)
 *
 * Usage:
 * - Apply globally in main.ts or module level for app-wide protection
 * - Use @Public() decorator on routes that should skip authentication completely
 * - Use @OptionalAuth() decorator on routes that work with or without authentication
 * - The validated user payload is available via request.user in controllers
 *
 * @example
 * // Global usage in app.module.ts
 * providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }]
 *
 * // Public route bypass
 * @Public()
 * @Get('health')
 * healthCheck() { ... }
 *
 * // Optional auth route
 * @OptionalAuth()
 * @Post('register')
 * register(@CurrentUser() user?: User) { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }


  /**
   * Determines if the current request can proceed
   *
   * Checks if the route is marked as public using the @Public() decorator.
   * If public, allows access without authentication. For @OptionalAuth() routes,
   * it attempts JWT validation but doesn't fail if no token is provided.
   * Otherwise, delegates to the parent JWT strategy for token validation.
   *
   * @param context - Execution context containing request metadata
   * @returns true if access is allowed, Promise<boolean> for async validation
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    // For optional auth, we store the flag so handleRequest can use it
    if (isOptionalAuth) {
      request.isOptionalAuth = true;

      // For optional auth, we try to authenticate but don't fail if no token
      try {
        const result = await super.canActivate(context);
        return result as boolean;
      } catch (error) {
        // If authentication fails (no token or invalid), we allow the request
        // but user will be undefined in the controller
        console.log('Optional auth failed, allowing request without user:', error.message);
        return true;
      }
    }

    // For required auth, standard JWT validation
    return super.canActivate(context) as Promise<boolean>;
  }

  /**
   * Handles the authentication result from the JWT strategy
   *
   * Processes the validated user payload or any errors that occurred during
   * token validation. For optional auth routes, returns undefined if no token
   * is provided instead of throwing an error.
   *
   * @param err - Any error that occurred during authentication
   * @param user - The decoded and validated user payload from the JWT (or false if no token)
   * @param info - Additional information about the authentication attempt
   * @param context - Execution context to check if auth is optional
   * @returns The authenticated user object to be attached to request.user, or undefined for optional auth
   * @throws UnauthorizedException if token is invalid, expired, or missing (for required auth)
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const isOptionalAuth = request?.isOptionalAuth;

    // For optional auth, allow requests without a token (return undefined)
    // But still throw errors if a token was provided and is invalid
    if (isOptionalAuth) {
      if (err) {
        throw err; // Token was provided but invalid
      }
      // When no token is provided, Passport returns user = false
      // We want to return undefined for consistency
      if (!user || user === false) {
        return undefined;
      }
      return user; // Valid token provided, return the user object
    }

    // For required auth, throw error if no user
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}
