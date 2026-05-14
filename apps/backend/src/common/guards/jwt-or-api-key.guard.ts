import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SystemTokenService } from '../../modules/auth/system-tokens/system-token.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JwtOrApiKeyGuard — accepts either a JWT Bearer token OR an X-API-Key.
 *
 * Tries JWT first (Authorization: Bearer ...). If no JWT is present,
 * tries X-API-Key. This lets the same endpoint serve both human users
 * (logged-in via app) and external integrations (API key).
 *
 * Respects @Public() — public routes bypass all auth.
 *
 * @example
 * @UseGuards(JwtOrApiKeyGuard)
 * @Get('orders')
 * getOrders(@CurrentUser() user: User) { ... }
 */
@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => SystemTokenService))
    private readonly systemTokenService: SystemTokenService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const rawKey = req.headers['x-api-key'] as string | undefined;
    const bearerHeader = req.headers['authorization'] as string | undefined;

    // ── API key path ──────────────────────────────────────────────────────
    if (rawKey) {
      const token = await this.systemTokenService.validateKey(rawKey, req.ip);
      if (!token) {
        throw new UnauthorizedException('Invalid, expired, or revoked API key');
      }
      req.systemToken = token;
      req.apiKeyScopes = token.scopes;
      req.user = token.issuedByUser;
      return true;
    }

    // ── JWT path ──────────────────────────────────────────────────────────
    if (bearerHeader?.startsWith('Bearer ')) {
      try {
        return (await super.canActivate(context)) as boolean;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    throw new UnauthorizedException('Provide a Bearer token or X-API-Key header');
  }

  handleRequest(err: any, user: any) {
    if (err || !user) throw err || new UnauthorizedException('Authentication failed');
    return user;
  }
}
