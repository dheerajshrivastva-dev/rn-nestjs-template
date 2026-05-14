import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/require-scopes.decorator';

/**
 * ScopesGuard — enforces @RequireScopes() on API-key-authenticated requests.
 *
 * Must run AFTER ApiKeyGuard or JwtOrApiKeyGuard (which populate req.apiKeyScopes).
 *
 * JWT users (no API key) pass through without scope checks — they rely on RolesGuard.
 * Only requests with req.apiKeyScopes (API key auth) are subject to scope validation.
 *
 * Logic:
 * - No @RequireScopes() on handler → allow (guard is a no-op)
 * - JWT user (no req.apiKeyScopes) → allow (JWT + RolesGuard handle access)
 * - API key with ALL required scopes → allow
 * - API key missing any required scope → 403
 *
 * @example
 * @UseGuards(JwtOrApiKeyGuard, ScopesGuard)
 * @RequireScopes('orders:read')
 * @Get('orders')
 */
@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No scope requirement on this handler — allow
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest();

    // JWT user (no API key scopes) — pass through to RolesGuard
    if (!req.apiKeyScopes) return true;

    const tokenScopes: string[] = req.apiKeyScopes;
    const missing = required.filter((s) => !tokenScopes.includes(s));

    if (missing.length > 0) {
      throw new ForbiddenException(
        `API key is missing required scopes: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
