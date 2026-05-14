import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { UserStatus, UserRole, ROLE_AUTHORITY } from '../../../common/enums';

// Roles that can be self-requested via Google OAuth registration
const GOOGLE_ALLOWED_ROLES: UserRole[] = [UserRole.USER, UserRole.MANAGER];

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      // Pass state through so we can carry the requested role
      passReqToCallback: false,
      state: true,
    });
  }

  // passport-google-oauth20 with state=true calls validate with
  // (accessToken, refreshToken, params, profile, done)
  // where params.state is the raw state string we encoded
  async validate(
    _accessToken: string,
    _refreshToken: string,
    params: any,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { emails, displayName } = profile;

    if (!emails || emails.length === 0) {
      return done(new UnauthorizedException('No email found in Google account'), false);
    }

    const email = emails[0].value;

    // Decode requested role from OAuth state (set by the /auth/google route)
    let requestedRole = UserRole.USER;
    try {
      const stateData = JSON.parse(
        Buffer.from(params?.state ?? '', 'base64url').toString('utf8'),
      );
      if (stateData?.role && Object.values(UserRole).includes(stateData.role)) {
        requestedRole = stateData.role as UserRole;
      }
    } catch {
      // Malformed state — default to USER
    }

    // Only allow roles the caller is permitted to self-request
    if (!GOOGLE_ALLOWED_ROLES.includes(requestedRole)) {
      requestedRole = UserRole.USER;
    }

    try {
      let user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        const nameParts = (displayName || '').split(' ');
        user = this.userRepository.create({
          email,
          firstName: nameParts[0] || email.split('@')[0],
          lastName: nameParts.slice(1).join(' ') || undefined,
          role: requestedRole,
          status: UserStatus.PENDING_APPROVAL,
        });
        user = await this.userRepository.save(user);

        // Attach a flag so the callback handler can tell the frontend
        (user as any).isNewRegistration = true;
        return done(null, user);
      }

      // Existing user — enforce status
      if (user.status === UserStatus.PENDING_APPROVAL) {
        return done(
          new UnauthorizedException('Your account is pending approval. Please contact an administrator.'),
          false,
        );
      }

      if (user.status === UserStatus.INACTIVE) {
        return done(new UnauthorizedException('Your account is inactive.'), false);
      }

      if (user.status === UserStatus.SUSPENDED) {
        return done(new UnauthorizedException('Your account has been suspended.'), false);
      }

      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
}
