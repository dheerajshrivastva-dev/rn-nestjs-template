import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Notification } from './entities/notification.entity';

/**
 * Purges read notifications older than 30 days.
 * Read notifications are dead weight once acted upon —
 * keeping them indefinitely wastes storage and slows inbox queries.
 */
@Injectable()
export class NotificationCleanupService {
  private readonly logger = new Logger(NotificationCleanupService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  /** Runs daily at 02:00 UTC */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeReadNotifications(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const { affected } = await this.notificationRepo.delete({
      isRead: true,
      readAt: LessThan(cutoff),
    });

    if (affected) {
      this.logger.log(`Purged ${affected} read notifications older than 30 days`);
    }
  }
}
