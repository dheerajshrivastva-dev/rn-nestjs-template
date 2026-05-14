// Polyfill for crypto (required for @nestjs/typeorm on older Node versions)
import * as crypto from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { OtpModule } from './modules/otp/otp.module';
import { AuditModule } from './modules/audit/audit.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationModule } from './modules/notification/notification.module';
import { WsModule } from './modules/ws/ws.module';
import { UserModule } from './modules/user/user.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthController } from './health.controller';
import { databaseConfig } from './config/database.config';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseConfig,
      inject: [ConfigService],
    }),

    // Rate limiting backed by Redis
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_TTL') * 1000,
            limit: configService.get<number>('RATE_LIMIT_MAX'),
          },
        ],
        storage: new ThrottlerStorageRedisService({
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB'),
        }),
      }),
      inject: [ConfigService],
    }),

    // Shared Redis client (ioredis) — injected as REDIS_CLIENT token
    RedisModule,

    // Bull queues (email, sms, push notifications)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB'),
        },
      }),
      inject: [ConfigService],
    }),

    // Infrastructure modules (always present)
    AuthModule,
    UserModule,
    OtpModule,
    AuditModule,
    UploadModule,
    NotificationModule,
    WsModule,

    // TODO: Add your domain modules here
    // e.g. ProjectModule, OrderModule, etc.
  ],
  controllers: [HealthController],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // JWT guard applied globally — use @Public() decorator to bypass on specific routes
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
