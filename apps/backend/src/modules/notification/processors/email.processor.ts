import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailQueue } from '../entities/email-queue.entity';
import { NotificationStatus } from '../../../common/enums';
import { NotificationProviderFactory } from '../factories/notification-provider.factory';

/**
 * Email Processor
 * Processes email sending jobs from Bull queue with provider failover
 */
@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectRepository(EmailQueue)
    private readonly emailQueueRepository: Repository<EmailQueue>,
    private readonly providerFactory: NotificationProviderFactory,
  ) {}

  /**
   * Process email sending jobs
   */
  @Process('send-email')
  async handleSendEmail(job: Job<{ emailQueueId: string }>) {
    const { emailQueueId } = job.data;

    this.logger.log(`Processing email job for queue ID: ${emailQueueId}`);

    try {
      // Get email from queue
      const emailEntry = await this.emailQueueRepository.findOne({
        where: { id: emailQueueId },
      });

      if (!emailEntry) {
        this.logger.error(`Email queue entry not found: ${emailQueueId}`);
        throw new Error('Email queue entry not found');
      }

      // Update status to sending
      await this.emailQueueRepository.update(emailQueueId, {
        status: NotificationStatus.SENDING,
        attemptCount: emailEntry.attemptCount + 1,
        lastAttemptAt: new Date(),
      });

      // Get primary and fallback providers
      const providers = this.providerFactory.getAllEmailProviders();

      let lastError: Error;
      let response: any;

      // Try providers in order (primary first, then fallback)
      for (const provider of providers) {
        try {
          this.logger.log(`Attempting email send via ${provider.getName()}`);

          response = await provider.sendEmail({
            to: emailEntry.toEmail,
            toName: emailEntry.toName,
            from: emailEntry.fromEmail,
            fromName: emailEntry.fromName,
            replyTo: emailEntry.replyTo,
            subject: emailEntry.subject,
            body: emailEntry.body,
            bodyHtml: emailEntry.bodyHtml,
            attachments: emailEntry.attachments,
          });

          if (response.success) {
            // Success! Break the loop
            this.logger.log(`Email sent successfully via ${provider.getName()}: ${response.messageId}`);
            break;
          } else {
            // Provider returned error, try next provider
            throw new Error(response.error || 'Email sending failed');
          }
        } catch (error) {
          lastError = error;
          this.logger.warn(`Failed to send email via ${provider.getName()}: ${error.message}`);
          // Continue to next provider
          continue;
        }
      }

      // Check if any provider succeeded
      if (!response || !response.success) {
        throw lastError || new Error('All email providers failed');
      }

      // Update status to sent
      await this.emailQueueRepository.update(emailQueueId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        externalId: response.externalId,
        provider: response.provider,
      });

      return {
        success: true,
        messageId: response.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email ${emailQueueId}: ${error.message}`,
        error.stack,
      );

      // Update status to failed
      await this.emailQueueRepository.update(emailQueueId, {
        status: NotificationStatus.FAILED,
        errorMessage: error.message,
        errorCode: error.code,
      });

      throw error; // Re-throw to let Bull handle retries
    }
  }

}
