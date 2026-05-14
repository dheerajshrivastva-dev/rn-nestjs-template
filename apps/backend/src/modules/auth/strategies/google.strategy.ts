import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { UserStatus, UserRole } from '../../../common/enums';

/**
 * Google OAuth2 Strategy
 * Handles "Sign in with Google" for users
 */
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
    });
  }

  /**
   * Called after Google successfully authenticates the user
   * Supports both login and signup flows
   *
   * @param accessToken - Google's access token (can be stored if you need Google API access)
   * @param refreshToken - Google's refresh token
   * @param profile - User's Google profile data
   * @param done - Callback function
   */
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    if (!emails || emails.length === 0) {
      throw new UnauthorizedException('No email found in Google account');
    }

    const email = emails[0].value;

    try {
      // Check if user already exists
      let user = await this.userRepository.findOne({
        where: { email },
        relations: ['company'],
      });

      if (!user) {
        // Auto-register new user with Google OAuth
        user = this.userRepository.create({
          email,
          name: displayName || email.split('@')[0],
          googleId: id,
          role: UserRole.RETAILER,
          status: UserStatus.INACTIVE, // Needs admin approval
          // No password needed for Google OAuth users
          // No company initially
        });

        user = await this.userRepository.save(user);

        // Return newly created user (will have INACTIVE status)
        done(null, user);
        return;
      }

      // Existing user - update Google ID and profile picture if not set
      if (!user.googleId) {
        await this.userRepository.update(user.id, {
          googleId: id,
        });
        user.googleId = id;
      }

      // Check user status
      if (user.status === UserStatus.INACTIVE) {
        throw new UnauthorizedException(
          'Your account is pending approval. Please contact an administrator.',
        );
      }

      if (user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Your account has been suspended.');
      }

      // Pass user to the callback
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
