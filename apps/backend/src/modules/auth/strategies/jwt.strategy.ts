import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Repository } from 'typeorm';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';
import { User } from '../../user/entities/user.entity';
import { UserStatus } from '../../../common/enums';

/**
 * JWT Strategy for validating JWT access tokens
 * Supports both Authorization header and HTTP-only cookies
 * Used by JwtAuthGuard to protect user routes
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super({
      // Extract JWT from Authorization header OR from cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          // Extract from cookie if header is not present
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * This method is called automatically after JWT is verified
   * The payload contains the data we put in the token (see auth.service.ts)
   * We validate the user still exists and return the user object
   *
   * @param payload - Decoded JWT payload { sub: userId, email, role }
   * @returns User object (will be attached to request.user)
   */
  async validate(payload: { sub: string; email: string; role: string; jti?: string }) {
    // Fast blocklist check — revoked JTIs written to Redis on logout
    if (payload.jti) {
      const blocked = await this.redis.get(`blocklist:${payload.jti}`);
      if (blocked) throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or token invalid');
    }

    if (user.status === UserStatus.PENDING_APPROVAL) {
      throw new UnauthorizedException('Account is pending approval');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('User account is deactivated');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('User account is suspended');
    }

    // This user object will be available as request.user in controllers
    // You can access it using @CurrentUser() decorator
    return user;
  }
}
