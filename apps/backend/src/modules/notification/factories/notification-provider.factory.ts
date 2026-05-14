import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailProvider, ISMSProvider, IPushProvider } from '../interfaces';
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
} from '../providers';

/**
 * Provider types for configuration
 */
export type EmailProviderType = 'msg91' | 'sendgrid' | 'smtp' | 'mock';
export type SMSProviderType = 'msg91' | 'twilio' | 'sns' | 'mock';
export type PushProviderType = 'fcm' | 'apns' | 'onesignal' | 'mock';

/**
 * Notification Provider Factory
 * Creates appropriate provider instances based on configuration
 * Supports multiple providers simultaneously (fallback/load balancing)
 */
@Injectable()
export class NotificationProviderFactory {
  private readonly logger = new Logger(NotificationProviderFactory.name);

  // Provider instances cache
  private emailProviders: Map<EmailProviderType, IEmailProvider> = new Map();
  private smsProviders: Map<SMSProviderType, ISMSProvider> = new Map();
  private pushProviders: Map<PushProviderType, IPushProvider> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly msg91EmailProvider: MSG91EmailProvider,
    private readonly msg91SmsProvider: MSG91SMSProvider,
    private readonly sendGridProvider: SendGridEmailProvider,
    private readonly smtpEmailProvider: SmtpEmailProvider,
    private readonly twilioProvider: TwilioSMSProvider,
    private readonly fcmProvider: FCMPushProvider,
    private readonly mockEmailProvider: MockEmailProvider,
    private readonly mockSmsProvider: MockSMSProvider,
    private readonly mockPushProvider: MockPushProvider,
  ) {
    this.initializeProviders();
  }

  /**
   * Initialize all available providers
   */
  private initializeProviders() {
    // Email providers
    this.emailProviders.set('msg91', this.msg91EmailProvider);
    this.emailProviders.set('sendgrid', this.sendGridProvider);
    this.emailProviders.set('smtp', this.smtpEmailProvider);
    this.emailProviders.set('mock', this.mockEmailProvider);

    // SMS providers
    this.smsProviders.set('msg91', this.msg91SmsProvider);
    this.smsProviders.set('twilio', this.twilioProvider);
    this.smsProviders.set('mock', this.mockSmsProvider);

    // Push providers
    this.pushProviders.set('fcm', this.fcmProvider);
    this.pushProviders.set('mock', this.mockPushProvider);

    this.logger.log('Notification providers initialized');
  }

  /**
   * Get primary email provider from config
   */
  getEmailProvider(): IEmailProvider {
    const providerType = this.configService.get<EmailProviderType>(
      'EMAIL_PROVIDER',
      'msg91',
    );

    const provider = this.emailProviders.get(providerType);

    if (!provider) {
      this.logger.error(`Email provider '${providerType}' not found, using MSG91`);
      return this.msg91EmailProvider;
    }

    return provider;
  }

  /**
   * Get fallback email provider
   */
  getFallbackEmailProvider(): IEmailProvider | null {
    const fallbackType = this.configService.get<EmailProviderType>(
      'EMAIL_PROVIDER_FALLBACK',
    );

    if (!fallbackType) {
      return null;
    }

    return this.emailProviders.get(fallbackType) || null;
  }

  /**
   * Get all configured email providers
   */
  getAllEmailProviders(): IEmailProvider[] {
    const primary = this.getEmailProvider();
    const fallback = this.getFallbackEmailProvider();

    return fallback ? [primary, fallback] : [primary];
  }

  /**
   * Get primary SMS provider from config
   */
  getSMSProvider(): ISMSProvider {
    const providerType = this.configService.get<SMSProviderType>(
      'SMS_PROVIDER',
      'msg91',
    );

    const provider = this.smsProviders.get(providerType);

    if (!provider) {
      this.logger.error(`SMS provider '${providerType}' not found, using MSG91`);
      return this.msg91SmsProvider;
    }

    return provider;
  }

  /**
   * Get fallback SMS provider
   */
  getFallbackSMSProvider(): ISMSProvider | null {
    const fallbackType = this.configService.get<SMSProviderType>(
      'SMS_PROVIDER_FALLBACK',
    );

    if (!fallbackType) {
      return null;
    }

    return this.smsProviders.get(fallbackType) || null;
  }

  /**
   * Get all configured SMS providers
   */
  getAllSMSProviders(): ISMSProvider[] {
    const primary = this.getSMSProvider();
    const fallback = this.getFallbackSMSProvider();

    return fallback ? [primary, fallback] : [primary];
  }

  /**
   * Get primary push provider from config
   */
  getPushProvider(): IPushProvider {
    const providerType = this.configService.get<PushProviderType>(
      'PUSH_PROVIDER',
      'fcm',
    );

    const provider = this.pushProviders.get(providerType);

    if (!provider) {
      this.logger.error(`Push provider '${providerType}' not found, using FCM`);
      return this.fcmProvider;
    }

    return provider;
  }

  /**
   * Get specific email provider by type
   */
  getEmailProviderByType(type: EmailProviderType): IEmailProvider | null {
    return this.emailProviders.get(type) || null;
  }

  /**
   * Get specific SMS provider by type
   */
  getSMSProviderByType(type: SMSProviderType): ISMSProvider | null {
    return this.smsProviders.get(type) || null;
  }

  /**
   * Get specific push provider by type
   */
  getPushProviderByType(type: PushProviderType): IPushProvider | null {
    return this.pushProviders.get(type) || null;
  }

  /**
   * Get health status of all providers
   */
  async getProvidersHealthStatus() {
    const emailProviders = Array.from(this.emailProviders.entries());
    const smsProviders = Array.from(this.smsProviders.entries());
    const pushProviders = Array.from(this.pushProviders.entries());

    const [emailStatuses, smsStatuses, pushStatuses] = await Promise.all([
      Promise.all(
        emailProviders.map(async ([type, provider]) => ({
          type,
          name: provider.getName(),
          ...(await provider.getHealthStatus()),
        })),
      ),
      Promise.all(
        smsProviders.map(async ([type, provider]) => ({
          type,
          name: provider.getName(),
          ...(await provider.getHealthStatus()),
        })),
      ),
      Promise.all(
        pushProviders.map(async ([type, provider]) => ({
          type,
          name: provider.getName(),
          ...(await provider.getHealthStatus()),
        })),
      ),
    ]);

    return {
      email: emailStatuses,
      sms: smsStatuses,
      push: pushStatuses,
    };
  }
}
