import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter, TransportOptions } from 'nodemailer';
import {
  IEmailProvider,
  SendEmailRequest,
  SendEmailResponse,
} from '../interfaces';

/**
 * SMTP Email Provider
 * Sends emails via any SMTP server (Hostinger, Gmail, etc.)
 * Uses nodemailer under the hood.
 *
 * Required env vars:
 *   SMTP_HOST         - SMTP server hostname (e.g. smtp.hostinger.com)
 *   SMTP_PORT         - SMTP port (465 for SSL, 587 for TLS/STARTTLS)
 *   SMTP_SECURE       - 'true' for SSL (port 465), 'false' for STARTTLS (port 587)
 *   SMTP_USER         - SMTP username / email address
 *   SMTP_PASSWORD     - SMTP password
 *   SMTP_FROM_EMAIL   - Default sender email
 *   SMTP_FROM_NAME    - Default sender name (optional)
 */
@Injectable()
export class SmtpEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly transportOptions: TransportOptions;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.hostinger.com');
    const port = this.configService.get<number>('SMTP_PORT', 465);
    // Default secure=true only for port 465 (SSL); port 587 and Mailpit (1025) use plain/STARTTLS
    const secureEnv = this.configService.get<string>('SMTP_SECURE');
    const secure = secureEnv !== undefined ? secureEnv === 'true' : port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    this.fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'noreply@duetech.in');
    this.fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Demigod');

    this.transportOptions = {
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      family: 4, // prefer IPv4 — IPv6 routes via Tailscale/VPN and causes greeting timeout
      tls: {
        servername: host,
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    } as TransportOptions;

    this.logger.log(`SMTP Email Provider initialized → ${host}:${port} (secure=${secure})`);
  }

  /** Create a fresh transporter for each send to avoid stale connection reuse */
  private createTransporter(): Transporter {
    return nodemailer.createTransport(this.transportOptions);
  }

  getName(): string {
    return 'smtp';
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      this.logger.log(`Sending email via SMTP to: ${request.to}`);

      const mail = {
        from: `"${request.fromName || this.fromName}" <${request.from || this.fromEmail}>`,
        to: request.toName ? `"${request.toName}" <${request.to}>` : request.to,
        subject: request.subject,
        text: request.body,
        html: request.bodyHtml,
        attachments: request.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          encoding: att.encoding,
        })),
      }

      if (request.replyTo && request.replyTo.trim() !== '') {
        // Note: nodemailer doesn't support replyTo in sendMail options directly, it should be part of the mail options
        // However, since we're using transporter.sendMail, we can include it in the options object
        mail["replyTo"] = request.replyTo;
      }

      const info = await this.createTransporter().sendMail(mail);

      this.logger.log(`SMTP email sent: messageId=${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        provider: this.getName(),
        externalId: info.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email via SMTP: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: '',
        provider: this.getName(),
        error: error.message,
      };
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      await this.createTransporter().verify();
      this.logger.log('SMTP configuration verified successfully');
      return true;
    } catch (error) {
      this.logger.error(`SMTP configuration verification failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<{ healthy: boolean; message?: string }> {
    // Report config validity without opening a live connection — avoids connection
    // contention with the send path and prevents Hostinger rate-limiting our IP.
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const healthy = !!(host && port && user);
    return {
      healthy,
      message: healthy
        ? `SMTP - Configured for ${host}:${port}`
        : 'SMTP - Missing required configuration',
    };
  }
}
