import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * TempTokenGuard - Validates temp tokens and attaches decoded payload to request
 * Used for OTP verification flows where user has a temporary token
 * Attaches decoded payload to req.tempUser
 */
@Injectable()
export class TempTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract temp token from Authorization header, cookie, or request body
    // Priority: Authorization header > request body > cookie
    let tempToken: string | undefined;

    // 1. Check Authorization header (Bearer token) - preferred for mobile apps
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tempToken = authHeader.substring(7);
    }

    // 2. Check request body - alternative for mobile apps
    if (!tempToken && request.body?.tempToken) {
      tempToken = request.body.tempToken;
    }

    // 3. Check cookie - for web clients
    if (!tempToken && request.cookies?.temp_token) {
      tempToken = request.cookies.temp_token;
    }

    if (!tempToken) {
      throw new UnauthorizedException('Temp token is required. Provide it via Authorization header (Bearer token), request body (tempToken), or cookie (temp_token)');
    }

    try {
      // Verify and decode temp token
      const payload = this.jwtService.verify(tempToken);

      // Validate token purpose (must start with "otp:")
      if (!payload.purpose || !payload.purpose.startsWith('otp:')) {
        throw new UnauthorizedException('Invalid token purpose');
      }

      // Basic validation
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Attach decoded payload directly to request
      // This way we don't need to decode again in controllers/services
      (request as any).tempUser = payload;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired temp token');
    }
  }
}
