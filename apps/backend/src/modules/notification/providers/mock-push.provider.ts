import { Injectable, Logger } from '@nestjs/common';
import {
  IPushProvider,
  SendPushRequest,
  SendPushResponse,
} from '../interfaces';

/**
 * Mock Push Notification Provider for Testing
 * Simulates push notification sending without making actual API calls
 */
@Injectable()
export class MockPushProvider implements IPushProvider {
  private readonly logger = new Logger(MockPushProvider.name);
  private sentNotifications: Array<{
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
    timestamp: Date;
    messageId: string;
  }> = [];

  constructor() {
    this.logger.log('Mock Push Provider initialized');
  }

  getName(): string {
    return 'mock';
  }

  async sendPush(request: SendPushRequest): Promise<SendPushResponse> {
    const tokens = Array.isArray(request.deviceToken)
      ? request.deviceToken
      : [request.deviceToken];
    this.logger.log(`[MOCK] Sending push notification to ${tokens.length} device(s)`);
    this.logger.debug(`[MOCK] Title: ${request.title}`);
    this.logger.debug(`[MOCK] Body: ${request.body}`);

    const messageId = `mock-push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store notification for testing/verification
    this.sentNotifications.push({
      tokens,
      title: request.title,
      body: request.body,
      data: request.data,
      timestamp: new Date(),
      messageId,
    });

    return {
      success: true,
      messageId,
      provider: this.getName(),
      successCount: tokens.length,
      failureCount: 0,
    };
  }

  async sendToTopic(
    topic: string,
    notification: Omit<SendPushRequest, 'deviceToken'>,
  ): Promise<SendPushResponse> {
    this.logger.log(`[MOCK] Sending push to topic: ${topic}`);

    const messageId = `mock-topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.sentNotifications.push({
      tokens: [`topic:${topic}`],
      title: notification.title,
      body: notification.body,
      data: notification.data,
      timestamp: new Date(),
      messageId,
    });

    return {
      success: true,
      messageId,
      provider: this.getName(),
      successCount: 1,
      failureCount: 0,
    };
  }

  validateToken(token: string): boolean {
    // Mock provider accepts any non-empty token
    return !!token && token.length > 0;
  }

  async verifyConfiguration(): Promise<boolean> {
    this.logger.log('[MOCK] Configuration verified');
    return true;
  }

  async getHealthStatus(): Promise<{
    healthy: boolean;
    message?: string;
  }> {
    return {
      healthy: true,
      message: 'Mock Push Provider - Always healthy',
    };
  }

  /**
   * Test utility: Get all sent notifications
   */
  getSentNotifications() {
    return this.sentNotifications;
  }

  /**
   * Test utility: Clear sent notifications
   */
  clearSentNotifications() {
    this.sentNotifications = [];
  }

  /**
   * Test utility: Get last sent notification
   */
  getLastSentNotification() {
    return this.sentNotifications[this.sentNotifications.length - 1] || null;
  }

  /**
   * Test utility: Find notification by token
   */
  findNotificationByToken(token: string) {
    return this.sentNotifications.find((notification) =>
      notification.tokens.includes(token),
    );
  }
}
