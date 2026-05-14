import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushQueue } from '../entities/push-queue.entity';
import { NotificationStatus } from '../../../common/enums';
import { NotificationProviderFactory } from '../factories/notification-provider.factory';

/**
 * Push Notification Processor
 * Processes push notification jobs from Bull queue
 */
@Processor('push')
export class PushProcessor {
  private readonly logger = new Logger(PushProcessor.name);

  constructor(
    @InjectRepository(PushQueue)
    private readonly pushQueueRepository: Repository<PushQueue>,
    private readonly providerFactory: NotificationProviderFactory,
  ) {}

  /**
   * Process push notification sending jobs
   */
  @Process('send-push')
  async handleSendPush(job: Job<{ pushQueueId: string }>) {
    const { pushQueueId } = job.data;

    this.logger.log(`Processing push job for queue ID: ${pushQueueId}`);

    try {
      // Get push notification from queue
      const pushEntry = await this.pushQueueRepository.findOne({
        where: { id: pushQueueId },
      });

      if (!pushEntry) {
        this.logger.error(`Push queue entry not found: ${pushQueueId}`);
        throw new Error('Push queue entry not found');
      }

      // Update status to sending
      await this.pushQueueRepository.update(pushQueueId, {
        status: NotificationStatus.SENDING,
        attemptCount: pushEntry.attemptCount + 1,
        lastAttemptAt: new Date(),
      });

      // Get push provider
      const provider = this.providerFactory.getPushProvider();

      // Filter out invalid tokens
      const validTokens = pushEntry.deviceTokens.filter(token =>
        provider.validateToken(token),
      );

      if (validTokens.length === 0) {
        this.logger.warn(`Push skipped ${pushQueueId}: no valid device tokens`);
        await this.pushQueueRepository.update(pushQueueId, {
          status: NotificationStatus.FAILED,
          errorMessage: 'No valid device tokens',
        });
        return { success: false, successCount: 0, failureCount: pushEntry.deviceTokens.length };
      }

      this.logger.log(
        `Sending push via ${provider.getName()} to ${validTokens.length} device(s)`,
      );

      // Send push notification
      const response = await provider.sendPush({
        deviceToken: validTokens,
        title: pushEntry.title,
        body: pushEntry.body,
        data: pushEntry.data,
        imageUrl: pushEntry.imageUrl,
        sound: pushEntry.sound,
        badge: pushEntry.badge,
        clickAction: pushEntry.clickAction,
        priority: pushEntry.priority,
        ttl: pushEntry.ttl,
        collapseKey: pushEntry.collapseKey,
        channelId: pushEntry.channelId,
      });

      if (!response.success && response.failureCount === validTokens.length) {
        // All sends failed — log per-token results for debugging
        const failDetails = response.results
          ?.map((r, i) => `token[${i}]=${r.deviceToken?.slice(0, 12)}… err=${r.error}`)
          .join('; ');
        this.logger.error(
          `Push FAILED for ${pushQueueId}: ${response.error || 'all tokens rejected'} | ${failDetails ?? 'no per-token details'}`,
        );
        throw new Error(response.error || 'Push notification sending failed');
      }

      this.logger.log(
        `Push sent - Success: ${response.successCount}, Failed: ${response.failureCount}`,
      );

      // Update status to sent (even if some failed)
      await this.pushQueueRepository.update(pushQueueId, {
        status:
          response.successCount > 0
            ? NotificationStatus.SENT
            : NotificationStatus.FAILED,
        sentAt: new Date(),
        externalId: response.messageId,
        provider: response.provider,
        successCount: response.successCount,
        failureCount: response.failureCount,
        deliveryResults: response.results,
      });

      return {
        success: response.successCount > 0,
        messageId: response.messageId,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send push ${pushQueueId}: ${error.message}`,
        error.stack,
      );

      // Update status to failed
      await this.pushQueueRepository.update(pushQueueId, {
        status: NotificationStatus.FAILED,
        errorMessage: error.message,
        errorCode: error.code,
      });

      throw error; // Re-throw to let Bull handle retries
    }
  }
}
