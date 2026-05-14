import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  IEmailProvider,
  SendEmailRequest,
  SendEmailResponse,
} from '../interfaces';

/**
 * MSG91 Email Provider
 * Implements email sending via MSG91 Email API
 * Docs: https://docs.msg91.com/p/tf9GTextN/e/email-api
 */
@Injectable()
export class MSG91EmailProvider implements IEmailProvider {
  private readonly logger = new Logger(MSG91EmailProvider.name);
  private readonly client: AxiosInstance;
  private readonly authKey: string;
  private readonly domain: string;

  constructor(private readonly configService: ConfigService) {
    this.authKey = this.configService.get<string>('MSG91_AUTH_KEY');
    this.domain = this.configService.get<string>('MSG91_EMAIL_DOMAIN') || 'forge.com';

    this.client = axios.create({
      baseURL: 'https://control.msg91.com/api/v5',
      headers: {
        'Content-Type': 'application/json',
        'authkey': this.authKey,
      },
      timeout: 30000,
    });

    this.logger.log('MSG91 Email Provider initialized');
  }

  getName(): string {
    return 'msg91-email';
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      this.logger.log(`Sending email via MSG91 to: ${request.to}`);

      const payload = {
        to: [
          {
            email: request.to,
            name: request.toName,
          },
        ],
        from: {
          email: request.from,
          name: request.fromName || 'Demigod',
        },
        domain: this.domain,
        subject: request.subject,
        ...(request.bodyHtml
          ? { html: request.bodyHtml }
          : { text: request.body }),
        attachments: request.attachments?.map(att => ({
          name: att.filename,
          content: att.content,
          content_type: att.contentType,
        })),
      };

      if (request.replyTo && request.replyTo.trim() !== '') {
        payload["reply_to"] = request.replyTo; // string is fine
      }

      const response = await this.client.post('/email/send', payload);

      this.logger.log(`MSG91 email sent successfully: ${response.data.message}`);

      return {
        success: true,
        messageId: response.data.request_id || `msg91-${Date.now()}`,
        provider: this.getName(),
        externalId: response.data.request_id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email via MSG91: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: '',
        provider: this.getName(),
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.authKey) {
        this.logger.error('MSG91_AUTH_KEY is not configured');
        return false;
      }

      // Verify by checking balance
      const response = await this.client.get('/balance');
      this.logger.log(`MSG91 Email balance: ${response.data.balance}`);
      return true;
    } catch (error) {
      this.logger.error(`MSG91 Email configuration verification failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const response = await this.client.get('/balance');
      const balance = response.data.balance;

      return {
        healthy: true,
        message: `MSG91 Email - Balance: ${balance}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: `MSG91 Email - Error: ${error.message}`,
      };
    }
  }
}
