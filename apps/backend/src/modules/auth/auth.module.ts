import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GeoIpService } from './geo-ip.service';
import { SystemToken } from './system-tokens/system-token.entity';
import { SystemTokenService } from './system-tokens/system-token.service';
import { SystemTokenController } from './system-tokens/system-token.controller';
import { User } from '../user/entities/user.entity';
import { UserSession } from '../user/entities/user-session.entity';
import { LoginAttempt } from '../user/entities/login-attempt.entity';
import { TwoFactorAuth } from '../user/entities/two-factor-auth.entity';
import { UserBiometric } from '../user/entities/user-biometric.entity';
import { OtpModule } from '../otp/otp.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, UserSession, LoginAttempt, TwoFactorAuth, UserBiometric,
      SystemToken,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION'),
        },
      }),
      inject: [ConfigService],
    }),
    OtpModule,
    NotificationModule,
    AuditModule,
  ],
  controllers: [AuthController, SystemTokenController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GeoIpService, SystemTokenService],
  exports: [AuthService, JwtStrategy, PassportModule, SystemTokenService],
})
export class AuthModule {}
