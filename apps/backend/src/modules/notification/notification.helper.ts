import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../user/entities/user.entity';
import { WsGateway } from '../ws/ws.gateway';
import { NotificationService } from './notification.service';
import { EmailTemplateUtil } from './utils/email-template.util';
import { EmailType, NotificationPriority } from '../../common/enums';

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

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async sendFcmPush(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, string>,
  ): Promise<void> {
    // FCM tokens are stored externally (e.g. device registration endpoint).
    // Extend this method to look up tokens from your device/token store.
    this.logger.debug(
      `[FCM] Push queued | user=${userId} type="${type}" — wire up token lookup to enable delivery`,
    );
  }

  private async sendNotificationEmail(
    userId: string,
    _type: string,
    options: NotifyEmailOptions,
  ): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName', 'lastName'],
    });

    if (!user?.email) {
      this.logger.warn(`[Notify] Cannot send email for user ${userId} — no email on record`);
      return;
    }

    const userName = user.fullName;

    const bodyHtml = options.bodyHtml ?? EmailTemplateUtil.renderNotificationEmail({
      toEmail: user.email,
      userName,
      title: options.subject,
      body: options.body,
    });

    await this.notificationService.queueEmail({
      recipientType: 'user',
      recipientId: userId,
      toEmail: user.email,
      toName: userName,
      subject: options.subject,
      body: options.body,
      bodyHtml,
      emailType: EmailType.NOTIFICATION,
      priority: options.priority ?? NotificationPriority.NORMAL,
    });
  }
}
