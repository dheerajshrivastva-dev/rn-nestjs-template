/**
 * Push Notification Provider Interface
 * Defines contract for push notification providers (FCM, APNS, OneSignal, etc.)
 */

export interface SendPushRequest {
  deviceToken: string | string[]; // Single token or array of tokens
  title: string;
  body: string;
  data?: Record<string, any>; // Custom data payload
  imageUrl?: string;
  sound?: string;
  badge?: number;
  clickAction?: string; // Deep link or action
  priority?: 'high' | 'normal';
  ttl?: number; // Time to live in seconds
  collapseKey?: string; // For message grouping
  channelId?: string; // Android notification channel
}

export interface SendPushResponse {
  success: boolean;
  messageId: string;
  provider: string;
  successCount: number;
  failureCount: number;
  results?: Array<{
    deviceToken: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
  error?: string;
}

export interface IPushProvider {
  /**
   * Provider name (e.g., 'fcm', 'apns', 'onesignal')
   */
  getName(): string;

  /**
   * Send push notification to one or more devices
   */
  sendPush(request: SendPushRequest): Promise<SendPushResponse>;

  /**
   * Send push to a topic (for broadcast messages)
   */
  sendToTopic?(topic: string, notification: Omit<SendPushRequest, 'deviceToken'>): Promise<SendPushResponse>;

  /**
   * Verify provider configuration
   */
  verifyConfiguration(): Promise<boolean>;

  /**
   * Get provider health status
   */
  getHealthStatus(): Promise<{ healthy: boolean; message?: string }>;

  /**
   * Validate device token format
   */
  validateToken(token: string): boolean;
}
