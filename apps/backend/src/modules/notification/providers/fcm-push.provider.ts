import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import {
  IPushProvider,
  SendPushRequest,
  SendPushResponse,
} from '../interfaces';

/**
 * Firebase Cloud Messaging (FCM) Push Provider
 * Implements push notifications via FCM
 * Docs: https://firebase.google.com/docs/cloud-messaging
 */
@Injectable()
export class FCMPushProvider implements IPushProvider {
  private readonly logger = new Logger(FCMPushProvider.name);
  private readonly messaging: admin.messaging.Messaging;

  constructor(private readonly configService: ConfigService) {
    try {
      const serviceAccountPath = this.configService.get<string>('FCM_SERVICE_ACCOUNT_PATH');
      const serviceAccountJson = this.configService.get<string>('FCM_SERVICE_ACCOUNT_JSON');

      let credential: admin.credential.Credential;

      if (serviceAccountJson) {
        // Use JSON string from environment variable
        const serviceAccount = JSON.parse(serviceAccountJson);
        credential = admin.credential.cert(serviceAccount);
      } else if (serviceAccountPath) {
        // Use file path
        credential = admin.credential.cert(serviceAccountPath);
      } else {
        this.logger.warn('FCM credentials not configured');
        return;
      }

      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential,
        });
      }

      this.messaging = admin.messaging();
      this.logger.log('FCM Push Provider initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize FCM: ${error.message}`);
    }
  }

  getName(): string {
    return 'fcm';
  }

  async sendPush(request: SendPushRequest): Promise<SendPushResponse> {
    try {
      const tokens = Array.isArray(request.deviceToken)
        ? request.deviceToken
        : [request.deviceToken];

      this.logger.log(`Sending push via FCM to ${tokens.length} device(s)`);

      // FCM requires all data values to be strings
      const stringData: Record<string, string> | undefined = request.data
        ? Object.fromEntries(
            Object.entries(request.data)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)]),
          )
        : undefined;

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: request.title,
          body: request.body,
          ...(request.imageUrl ? { imageUrl: request.imageUrl } : {}),
        },
        data: stringData,
        android: {
          priority: request.priority === 'high' ? 'high' : 'normal',
          ...(request.ttl ? { ttl: request.ttl * 1000 } : {}),
          ...(request.collapseKey ? { collapseKey: request.collapseKey } : {}),
          notification: {
            channelId: request.channelId || 'default',
            sound: request.sound || 'default',
            ...(request.clickAction ? { clickAction: request.clickAction } : {}),
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: request.title,
                body: request.body,
              },
              sound: request.sound || 'default',
              ...(request.badge != null ? { badge: request.badge } : {}),
            },
          },
        },
        tokens,
      };

      const response = await this.messaging.sendEachForMulticast(message);

      this.logger.log(
        `FCM push sent - Success: ${response.successCount}, Failed: ${response.failureCount}`,
      );

      const results = response.responses.map((resp, index) => ({
        deviceToken: tokens[index],
        success: resp.success,
        messageId: resp.messageId,
        error: resp.error?.message,
      }));

      return {
        success: response.failureCount === 0,
        messageId: response.responses[0]?.messageId || `fcm-${Date.now()}`,
        provider: this.getName(),
        successCount: response.successCount,
        failureCount: response.failureCount,
        results,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send push via FCM: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: '',
        provider: this.getName(),
        successCount: 0,
        failureCount: Array.isArray(request.deviceToken)
          ? request.deviceToken.length
          : 1,
        error: error.message,
      };
    }
  }

  async sendToTopic(
    topic: string,
    notification: Omit<SendPushRequest, 'deviceToken'>,
  ): Promise<SendPushResponse> {
    try {
      this.logger.log(`Sending push via FCM to topic: ${topic}`);

      // FCM requires all data values to be strings
      const stringData: Record<string, string> | undefined = notification.data
        ? Object.fromEntries(
            Object.entries(notification.data)
              .filter(([, v]) => v != null)
              .map(([k, v]) => [k, String(v)]),
          )
        : undefined;

      const message: admin.messaging.Message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: stringData,
        android: {
          priority: notification.priority === 'high' ? 'high' : 'normal',
          ttl: notification.ttl ? notification.ttl * 1000 : undefined,
          notification: {
            channelId: notification.channelId || 'default',
            sound: notification.sound || 'default',
          },
        },
        topic,
      };

      const messageId = await this.messaging.send(message);

      this.logger.log(`FCM topic push sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
        provider: this.getName(),
        successCount: 1,
        failureCount: 0,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send topic push via FCM: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: '',
        provider: this.getName(),
        successCount: 0,
        failureCount: 1,
        error: error.message,
      };
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.messaging) {
        this.logger.error('FCM not initialized');
        return false;
      }

      // Verify by checking if we can access the messaging instance
      this.logger.log('FCM configuration verified');
      return true;
    } catch (error) {
      this.logger.error(`FCM configuration verification failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<{ healthy: boolean; message?: string }> {
    try {
      if (!this.messaging) {
        return {
          healthy: false,
          message: 'FCM - Not initialized',
        };
      }

      return {
        healthy: true,
        message: 'FCM - Configured',
      };
    } catch (error) {
      return {
        healthy: false,
        message: `FCM - Error: ${error.message}`,
      };
    }
  }

  validateToken(token: string): boolean {
    // Accept any non-empty string — FCM itself will report invalid tokens
    return !!token && token.trim().length > 0;
  }

  /**
   * Send a data-only (silent) message to a device token.
   * No notification is shown — used to wake the device app for an
   * immediate sync so it picks up queued commands from the server.
   *
   * Sent as high-priority Android data message to bypass Doze mode.
   */
  async sendDataMessage(
    fcmToken: string,
    data: Record<string, string>,
  ): Promise<void> {
    if (!this.messaging) {
      this.logger.warn('FCM not initialized — skipping data message');
      return;
    }
    try {
      await this.messaging.send({
        token: fcmToken,
        data,
        android: { priority: 'high' },
      });
      this.logger.log(`FCM data message sent to ${fcmToken.slice(0, 12)}…`);
    } catch (error) {
      // Non-fatal: device will pick up the command on the next scheduled sync
      this.logger.warn(`FCM data message failed: ${error.message}`);
    }
  }
}
