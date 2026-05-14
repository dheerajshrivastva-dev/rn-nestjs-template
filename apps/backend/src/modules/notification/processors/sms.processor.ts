import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsQueue } from '../entities/sms-queue.entity';
import { NotificationStatus } from '../../../common/enums';
import { NotificationProviderFactory } from '../factories/notification-provider.factory';

/**
 * SMS Processor
 * Processes SMS sending jobs from Bull queue with provider failover
 */
@Processor('sms')
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    @InjectRepository(SmsQueue)
    private readonly smsQueueRepository: Repository<SmsQueue>,
    private readonly providerFactory: NotificationProviderFactory,
  ) {}

  /**
   * Process SMS sending jobs
   */
  @Process('send-sms')
  async handleSendSMS(job: Job<{ smsQueueId: string }>) {
    const { smsQueueId } = job.data;

    this.logger.log(`Processing SMS job for queue ID: ${smsQueueId}`);

    try {
      // Get SMS from queue
      const smsEntry = await this.smsQueueRepository.findOne({
        where: { id: smsQueueId },
      });

      if (!smsEntry) {
        this.logger.error(`SMS queue entry not found: ${smsQueueId}`);
        throw new Error('SMS queue entry not found');
      }

      // Update status to sending
      await this.smsQueueRepository.update(smsQueueId, {
        status: NotificationStatus.SENDING,
        attemptCount: smsEntry.attemptCount + 1,
        lastAttemptAt: new Date(),
      });

      // Get primary and fallback providers
      const providers = this.providerFactory.getAllSMSProviders();

      let lastError: Error;
      let response: any;

      // Try providers in order (primary first, then fallback)
      for (const provider of providers) {
        try {
          this.logger.log(`Attempting SMS send via ${provider.getName()}`);

          // Check if this is an OTP and provider has dedicated OTP method
          if (smsEntry.smsType === 'otp' && provider.sendOTP) {
            // Extract OTP from message (assuming format: "Your OTP is: 123456")
            const otpMatch = smsEntry.message.match(/\b\d{4,6}\b/);
            const otp = otpMatch ? otpMatch[0] : null;

            if (otp) {
              response = await provider.sendOTP(
                smsEntry.toPhone,
                otp,
                smsEntry.templateId,
              );
            } else {
              // Fallback to regular SMS if OTP extraction fails
              response = await provider.sendSMS({
                to: smsEntry.toPhone,
                message: smsEntry.message,
                senderId: smsEntry.senderId,
                templateId: smsEntry.templateId,
                templateVariables: smsEntry.templateVariables,
                unicode: smsEntry.unicode,
                flash: smsEntry.flash,
                dlt: {
                  entityId: smsEntry.dltEntityId,
                  templateId: smsEntry.dltTemplateId,
                },
              });
            }
          } else {
            // Regular SMS
            response = await provider.sendSMS({
              to: smsEntry.toPhone,
              message: smsEntry.message,
              senderId: smsEntry.senderId,
              templateId: smsEntry.templateId,
              templateVariables: smsEntry.templateVariables,
              unicode: smsEntry.unicode,
              flash: smsEntry.flash,
              dlt: {
                entityId: smsEntry.dltEntityId,
                templateId: smsEntry.dltTemplateId,
              },
            });
          }

          if (response.success) {
            // Success! Break the loop
            this.logger.log(`SMS sent successfully via ${provider.getName()}: ${response.messageId}`);
            break;
          } else {
            // Provider returned error, try next provider
            throw new Error(response.error || 'SMS sending failed');
          }
        } catch (error) {
          lastError = error;
          this.logger.warn(`Failed to send SMS via ${provider.getName()}: ${error.message}`);
          // Continue to next provider
          continue;
        }
      }

      // Check if any provider succeeded
      if (!response || !response.success) {
        throw lastError || new Error('All SMS providers failed');
      }

      // Update status to sent
      await this.smsQueueRepository.update(smsQueueId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        externalId: response.externalId,
        provider: response.provider,
        creditsUsed: response.credits,
      });

      return {
        success: true,
        messageId: response.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS ${smsQueueId}: ${error.message}`,
        error.stack,
      );

      // Update status to failed
      await this.smsQueueRepository.update(smsQueueId, {
        status: NotificationStatus.FAILED,
        errorMessage: error.message,
        errorCode: error.code,
      });

      throw error; // Re-throw to let Bull handle retries
    }
  }
}
