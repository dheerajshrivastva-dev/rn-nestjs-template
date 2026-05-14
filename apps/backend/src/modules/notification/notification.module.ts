import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { BrandingService } from './branding.service';
import { NotificationController } from './notification.controller';
import { NotificationHelper } from './notification.helper';
import { NotificationCleanupService } from './notification-cleanup.service';
import { EmailQueue, SmsQueue, PushQueue, Notification } from './entities';
import { User } from '../user/entities/user.entity';
import { EmailProcessor, SmsProcessor, PushProcessor } from './processors';
import { NotificationProviderFactory } from './factories/notification-provider.factory';
import { WsModule } from '../ws/ws.module';
import {
  MSG91EmailProvider,
  MSG91SMSProvider,
  SendGridEmailProvider,
  SmtpEmailProvider,
  TwilioSMSProvider,
  FCMPushProvider,
  MockEmailProvider,
  MockSMSProvider,
  MockPushProvider,
} from './providers';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailQueue, SmsQueue, PushQueue, Notification, User]),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'sms' },
      { name: 'push' },
    ),
    ScheduleModule.forRoot(),
    WsModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationHelper,
    NotificationCleanupService,
    EmailProcessor,
    SmsProcessor,
    PushProcessor,
    BrandingService,
    NotificationProviderFactory,
    MSG91EmailProvider,
    MSG91SMSProvider,
    SendGridEmailProvider,
    SmtpEmailProvider,
    TwilioSMSProvider,
    FCMPushProvider,
    MockEmailProvider,
    MockSMSProvider,
    MockPushProvider,
  ],
  exports: [NotificationService, NotificationHelper, FCMPushProvider],
})
export class NotificationModule {}
