import { Injectable, Logger } from '@nestjs/common';
import {
  ISMSProvider,
  SendSMSRequest,
  SendSMSResponse,
} from '../interfaces';

/**
 * Mock SMS Provider for Testing
 * Simulates SMS sending without making actual API calls
 */
@Injectable()
export class MockSMSProvider implements ISMSProvider {
  private readonly logger = new Logger(MockSMSProvider.name);
  private sentMessages: Array<{
    to: string;
    message: string;
    timestamp: Date;
    messageId: string;
  }> = [];

  constructor() {
    this.logger.log('Mock SMS Provider initialized');
  }

  getName(): string {
    return 'mock';
  }

  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    this.logger.log(`[MOCK] Sending SMS to: ${request.to}`);
    this.logger.debug(`[MOCK] Message: ${request.message}`);

    const messageId = `mock-sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store message for testing/verification
    this.sentMessages.push({
      to: request.to,
      message: request.message,
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

  async sendOTP(
    phoneNumber: string,
    otp: string,
    templateId?: string,
  ): Promise<SendSMSResponse> {
    this.logger.log(`[MOCK] Sending OTP to: ${phoneNumber}`);
    this.logger.debug(`[MOCK] OTP: ${otp}`);

    return this.sendSMS({
      to: phoneNumber,
      message: `Your OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    });
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
      message: 'Mock SMS Provider - Always healthy',
    };
  }

  /**
   * Test utility: Get all sent messages
   */
  getSentMessages() {
    return this.sentMessages;
  }

  /**
   * Test utility: Clear sent messages
   */
  clearSentMessages() {
    this.sentMessages = [];
  }

  /**
   * Test utility: Get last sent message
   */
  getLastSentMessage() {
    return this.sentMessages[this.sentMessages.length - 1] || null;
  }
}
