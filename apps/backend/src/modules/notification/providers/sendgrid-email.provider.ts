import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import {
  IEmailProvider,
  SendEmailRequest,
  SendEmailResponse,
} from '../interfaces';

/**
 * SendGrid Email Provider
 * Implements email sending via SendGrid API
 * Docs: https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */
@Injectable()
export class SendGridEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridEmailProvider.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY');

    if (this.apiKey) {
      sgMail.setApiKey(this.apiKey);
      this.logger.log('SendGrid Email Provider initialized');
    } else {
      this.logger.warn('SENDGRID_API_KEY not configured');
    }
  }

  getName(): string {
    return 'sendgrid';
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      this.logger.log(`Sending email via SendGrid to: ${request.to}`);

      const msg = {
        to: {
          email: request.to,
          name: request.toName,
        },
        from: {
          email: request.from,
          name: request.fromName || 'Demigod',
        },
        subject: request.subject,
        text: request.body,
        html: request.bodyHtml || request.body,
        attachments: request.attachments?.map(att => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : att.content,
          type: att.contentType,
          disposition: 'attachment',
        })),
      };

      if (request.replyTo && request.replyTo.trim() !== '') {
        msg["replyTo"] = request.replyTo; // string is fine
      }

      const [response] = await sgMail.send(msg);

      this.logger.log(`SendGrid email sent successfully: ${response.headers['x-message-id']}`);

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
        provider: this.getName(),
        externalId: response.headers['x-message-id'] as string,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email via SendGrid: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: '',
        provider: this.getName(),
        error: error.response?.body?.errors?.[0]?.message || error.message,
      };
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        this.logger.error('SENDGRID_API_KEY is not configured');
        return false;
      }

      // Verify by checking API key validity
      await sgMail.send({
        to: 'test@example.com',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Test',
        mailSettings: {
          sandboxMode: {
            enable: true, // Sandbox mode - won't actually send
          },
        },
      });

      this.logger.log('SendGrid configuration verified');
      return true;
    } catch (error) {
      this.logger.error(`SendGrid configuration verification failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<{ healthy: boolean; message?: string }> {
    try {
      // SendGrid doesn't have a health check endpoint
      // We can verify API key is set and valid format
      if (!this.apiKey || !this.apiKey.startsWith('SG.')) {
        return {
          healthy: false,
          message: 'SendGrid - Invalid API key',
        };
      }

      return {
        healthy: true,
        message: 'SendGrid - Configured',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `SendGrid - Error: ${error.message}`,
      };
    }
  }
}
