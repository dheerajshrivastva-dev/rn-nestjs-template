import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const SCOPES_KEY = 'required_scopes';

/**
 * @RequireScopes('orders:read', 'users:write')
 *
 * Applied on a controller or handler to declare which API key scopes are required.
 * Enforced by ScopesGuard — chain it after ApiKeyGuard or JwtOrApiKeyGuard.
 *
 * Routes accessed by JWT users (not via API key) are NOT affected by this decorator —
 * scope checks only activate when req.apiKeyScopes is present.
 *
 * @example
 * @UseGuards(JwtOrApiKeyGuard, ScopesGuard)
 * @RequireScopes('orders:read')
 * @Get('orders')
 * getOrders() { ... }
 */
export const RequireScopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);

/**
 * @ApiKeyScopes() — param decorator to inject the scopes from the current API key token.
 *
 * Returns undefined when the request was authenticated via JWT (no API key).
 *
 * @example
 * getOrders(@ApiKeyScopes() scopes: string[] | undefined) { ... }
 */
export const ApiKeyScopes = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string[] | undefined => {
    return ctx.switchToHttp().getRequest().apiKeyScopes;
  },
);
