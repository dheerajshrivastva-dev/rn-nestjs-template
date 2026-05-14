import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { SystemHealthMonitorService } from './system-health-monitor.service';
import { AuditLog } from './entities/audit-log.entity';
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity';
import { Order } from '../order/entities/order.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog, User, Client, Order]),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'sms' },
      { name: 'push' },
    ),
    NotificationModule,
  ],
  controllers: [AuditController],
  providers: [AuditService, SystemHealthMonitorService],
  exports: [AuditService, SystemHealthMonitorService],
})
export class AuditModule {}
