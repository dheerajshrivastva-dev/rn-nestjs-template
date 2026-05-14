import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SystemTokenService } from '../../modules/auth/system-tokens/system-token.service';

/**
 * ApiKeyGuard — validates requests authenticated via X-API-Key header.
 *
 * NOT registered globally. Apply per-controller or per-route:
 *
 * @example
 * // Only API key auth
 * @UseGuards(ApiKeyGuard)
 * @Controller('webhooks')
 *
 * @example
 * // Accept both JWT users and API key integrations (use JwtOrApiKeyGuard instead)
 * @UseGuards(JwtOrApiKeyGuard)
 *
 * On success, attaches to the request:
 * - req.systemToken  — the full SystemToken record
 * - req.apiKeyScopes — string[] of scopes from the token
 * - req.user         — the User who issued the token (@CurrentUser() compatible)
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(forwardRef(() => SystemTokenService))
    private readonly systemTokenService: SystemTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const rawKey = req.headers['x-api-key'] as string | undefined;

    if (!rawKey) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const token = await this.systemTokenService.validateKey(rawKey, req.ip);

    if (!token) {
      throw new UnauthorizedException('Invalid, expired, or revoked API key');
    }

    req.systemToken = token;
    req.apiKeyScopes = token.scopes;
    req.user = token.issuedByUser; // makes @CurrentUser() work transparently

    return true;
  }
}
