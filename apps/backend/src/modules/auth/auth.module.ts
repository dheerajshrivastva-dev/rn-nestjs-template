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
    TypeOrmModule.forFeature([User, UserSession, LoginAttempt, TwoFactorAuth, UserBiometric]),
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
    OtpModule, // Import OtpModule to use OtpService
    NotificationModule, // Import NotificationModule to use NotificationService
    AuditModule, // Import AuditModule to use AuditService
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GeoIpService],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
