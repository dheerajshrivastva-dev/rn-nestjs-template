import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity';
import { WsGateway } from '../ws/ws.gateway';
import { NotificationService } from './notification.service';
import { EmailTemplateUtil } from './utils/email-template.util';
import { EmailType, NotificationPriority } from '../../common/enums';
import {
  isPushAllowed,
  NOTIFICATION_TYPE_CATEGORY,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notification-preferences';

export interface NotifyEmailOptions {
  /** Subject line for the email */
  subject: string;
  /** Plain-text body (required) */
  body: string;
  /** Optional HTML body — if omitted, plain text is used */
  bodyHtml?: string;
  /** Override email priority (default: NORMAL) */
  priority?: NotificationPriority;
}

/**
 * NotificationHelper
 *
 * Single entry-point for all notification creation in the app.
 *
 * For every business event, call `this.notificationHelper.notify(...)`.
 * It will:
 *   1. Persist a row in the `notifications` table (source of truth / inbox)
 *   2. Push the notification in real-time via WebSocket (if user is connected)
 *   3. Queue an FCM push notification (best-effort, for background delivery)
 *
 * For events that also need an email, pass `email` options or use
 * `notifyWithEmail()` which always sends email.
 *
 * This keeps all other services (Order, KeyTransfer, Device) clean —
 * they just call notify() without worrying about delivery mechanics.
 */
@Injectable()
export class NotificationHelper {
  private readonly logger = new Logger(NotificationHelper.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly wsGateway: WsGateway,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a notification for a user and deliver via inbox + WS + FCM.
   * Optionally also sends an email if `email` options are provided.
   *
   * @param userId  - Recipient user UUID
   * @param type    - NotificationType value (e.g. 'order_approved')
   * @param title   - Short title shown in notification
   * @param body    - Full body text
   * @param data    - Optional key-value map for deep-linking (orderId, clientId, etc.)
   * @param email   - If provided, also queues an email notification
   */
  async notify(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    email?: NotifyEmailOptions,
  ): Promise<void> {
    // 1. Persist to inbox
    let notification: Notification;
    try {
      notification = await this.notificationRepo.save(
        this.notificationRepo.create({ userId, type, title, body, data: data ?? null }),
      );
    } catch (err) {
      this.logger.error(`[Notify] Failed to persist notification for user ${userId}:`, err);
      return; // Don't throw — notification is best-effort for non-critical paths
    }

    // 2. Real-time via WebSocket (no-op if user is offline)
    this.wsGateway.notifyUser(userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      createdAt: notification.createdAt,
    });

    // 3. FCM push (best-effort — user may be backgrounded)
    this.sendFcmPush(userId, title, body, type, data).catch((err) =>
      this.logger.warn(`[Notify] FCM push failed for user ${userId}:`, err),
    );

    // 4. Email (optional — only when caller explicitly requests it)
    if (email) {
      this.sendNotificationEmail(userId, type, email).catch((err) =>
        this.logger.warn(`[Notify] Email notification failed for user ${userId}:`, err),
      );
    }
  }

  /**
   * Convenience wrapper — always sends inbox + WS + FCM + email.
   * Use this for business events where email is mandatory
   * (e.g. order approved, key transfer received).
   */
  async notifyWithEmail(
    userId: string,
    type: string,
    title: string,
    body: string,
    email: NotifyEmailOptions,
    data?: Record<string, string>,
  ): Promise<void> {
    return this.notify(userId, type, title, body, data, email);
  }

  /**
   * Send a silent FCM data-only push directly to the device's registered FCM token.
   *
   * Used when a device hasn't synced in 72h to check if it's still reachable.
   * If the device was factory reset / erased, FCM returns INVALID_REGISTRATION,
   * confirming the device is gone. This is best-effort — no retry.
   *
   * Note: Requires `client.fcmDeviceToken` to be set (registered by the app).
   * If not set yet, the probe is skipped and logged as a warning.
   */
  async sendDeviceProbe(client: Client): Promise<void> {
    const fcmToken = client.fcmDeviceToken;

    if (!fcmToken) {
      this.logger.warn(
        `[DeviceProbe] No FCM device token for client ${client.id} — probe skipped`,
      );
      return;
    }

    try {
      await this.notificationService.queuePush({
        recipientType: 'client',
        recipientId: client.id,
        deviceTokens: [fcmToken],
        title: '',
        body: '',
        data: {
          type: 'device_probe',
          clientId: client.id,
        },
        notificationType: 'system',
        priority: 'high',
        queuePriority: NotificationPriority.HIGH,
        channelId: 'device_probe',
      });
    } catch (err) {
      this.logger.warn(`[DeviceProbe] Failed to queue probe for client ${client.id}:`, err);
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async sendFcmPush(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'fcmTokens', 'notificationPreferences'],
    });

    // ── Preference gate ──────────────────────────────────────────────────────
    const prefs = user?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;
    if (!isPushAllowed(prefs, type)) {
      const category = NOTIFICATION_TYPE_CATEGORY[type] ?? 'uncategorised';
      const ts = new Date().toISOString();

      if (!prefs.master) {
        this.logger.warn(
          `[FCM] Push BLOCKED — master switch OFF | user=${userId} type="${type}" category="${category}" at=${ts}`,
        );
      } else {
        this.logger.warn(
          `[FCM] Push BLOCKED — category disabled | user=${userId} type="${type}" category="${category}" categoryFlag=false at=${ts}`,
        );
      }

      return;
    }

    const tokens: string[] = (user?.fcmTokens ?? []).map((t: { token: string }) => t.token);
    if (!tokens.length) {
      this.logger.debug(`[FCM] No tokens registered for user ${userId} — push skipped`);
      return;
    }

    this.logger.debug(
      `[FCM] Sending push | user=${userId} type="${type}" tokens=${tokens.length}`,
    );

    await this.notificationService.queuePush({
      recipientType: 'user',
      recipientId: userId,
      deviceTokens: tokens,
      title,
      body,
      data: { type, ...(data ?? {}) },
      notificationType: 'update',
      priority: 'normal',
      queuePriority: NotificationPriority.NORMAL,
      channelId: 'default',
    });
  }

  private async sendNotificationEmail(
    userId: string,
    _type: string,
    options: NotifyEmailOptions,
  ): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name'],
    });

    if (!user?.email) {
      this.logger.warn(`[Notify] Cannot send email for user ${userId} — no email on record`);
      return;
    }

    const bodyHtml = options.bodyHtml ?? EmailTemplateUtil.renderNotificationEmail({
      toEmail: user.email,
      userName: user.name,
      title: options.subject,
      body: options.body,
    });

    await this.notificationService.queueEmail({
      recipientType: 'user',
      recipientId: userId,
      toEmail: user.email,
      toName: user.name,
      subject: options.subject,
      body: options.body,
      bodyHtml,
      emailType: EmailType.NOTIFICATION,
      priority: options.priority ?? NotificationPriority.NORMAL,
    });
  }
}
