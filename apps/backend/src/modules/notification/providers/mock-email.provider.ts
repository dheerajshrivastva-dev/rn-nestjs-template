import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProvider,
  SendEmailRequest,
  SendEmailResponse,
} from '../interfaces';

/**
 * Mock Email Provider for Testing
 * Simulates email sending without making actual API calls
 */
@Injectable()
export class MockEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);
  private sentEmails: Array<{
    to: string | string[];
    subject: string;
    message: string;
    timestamp: Date;
    messageId: string;
  }> = [];

  constructor() {
    this.logger.log('Mock Email Provider initialized');
  }

  getName(): string {
    return 'mock';
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    const recipients = Array.isArray(request.to) ? request.to : [request.to];
    this.logger.log(`[MOCK] Sending email to: ${recipients.join(', ')}`);
    this.logger.debug(`[MOCK] Subject: ${request.subject}`);

    const messageId = `mock-email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store email for testing/verification
    this.sentEmails.push({
      to: request.to,
      subject: request.subject,
      message: request.bodyHtml || request.body,
      timestamp: new Date(),
      messageId,
    });

    return {
      success: true,
      messageId,
      provider: this.getName(),
      externalId: messageId,
    };
  }

  async sendBulkEmail(
    requests: SendEmailRequest[],
  ): Promise<SendEmailResponse[]> {
    this.logger.log(`[MOCK] Sending ${requests.length} bulk emails`);

    return Promise.all(requests.map((request) => this.sendEmail(request)));
  }

  async verifyConfiguration(): Promise<boolean> {
    this.logger.log('[MOCK] Configuration verified');
    return true;
  }

  async getHealthStatus(): Promise<{
    healthy: boolean;
    credits?: number;
    message?: string;
  }> {
    return {
      healthy: true,
      message: 'Mock Email Provider - Always healthy',
    };
  }

  /**
   * Test utility: Get all sent emails
   */
  getSentEmails() {
    return this.sentEmails;
  }

  /**
   * Test utility: Clear sent emails
   */
  clearSentEmails() {
    this.sentEmails = [];
  }

  /**
   * Test utility: Get last sent email
   */
  getLastSentEmail() {
    return this.sentEmails[this.sentEmails.length - 1] || null;
  }

  /**
   * Test utility: Find email by recipient
   */
  findEmailByRecipient(email: string) {
    return this.sentEmails.find((sent) => {
      const recipients = Array.isArray(sent.to) ? sent.to : [sent.to];
      return recipients.includes(email);
    });
  }
}
