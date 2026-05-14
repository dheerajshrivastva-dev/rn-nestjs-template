import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { TwoFactorAuth } from './entities/two-factor-auth.entity';
import { UserBiometric } from './entities/user-biometric.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';
import { OtpModule } from '../otp/otp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserSession, TwoFactorAuth, UserBiometric, AuditLog]),
    NotificationModule,
    AuditModule,
    OtpModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
