import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailQueue, SmsQueue, PushQueue } from './entities';
import { EmailType, NotificationStatus, NotificationPriority } from '../../common/enums';
import { SendEmailDto } from './dto/send-email.dto';
import { SendSMSDto } from './dto/send-sms.dto';
import { SendPushDto } from './dto/send-push.dto';
import { EmailTemplateUtil } from './utils/email-template.util';
import { ConfigService } from '@nestjs/config';
import { Client } from '../client/entities/client.entity';
import { EmiPayment } from '../client/entities/emi-payment.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(EmailQueue)
    private readonly emailQueueRepository: Repository<EmailQueue>,
    @InjectRepository(SmsQueue)
    private readonly smsQueueRepository: Repository<SmsQueue>,
    @InjectRepository(PushQueue)
    private readonly pushQueueRepository: Repository<PushQueue>,
    @InjectQueue('email')
    private readonly emailQueue: Queue,
    @InjectQueue('sms')
    private readonly smsQueue: Queue,
    @InjectQueue('push')
    private readonly pushQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Queue an email for sending
   */
  async queueEmail(sendEmailDto: SendEmailDto): Promise<EmailQueue> {
    // Create email queue entry
    const emailQueueEntry = this.emailQueueRepository.create({
      ...sendEmailDto,
      fromEmail: this.configService.get('SMTP_FROM_EMAIL') || 'noreply@forge.com',
      fromName: this.configService.get('SMTP_FROM_NAME') || 'Duetech',
      status: NotificationStatus.PENDING,
      priority: sendEmailDto.priority || NotificationPriority.NORMAL,
    });

    const savedEntry = await this.emailQueueRepository.save(emailQueueEntry);

    // Add to Bull queue for processing
    await this.emailQueue.add(
      'send-email',
      {
        emailQueueId: savedEntry.id,
      },
      {
        priority: this.getPriorityValue(savedEntry.priority),
        attempts: savedEntry.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(`Email queued: ${savedEntry.id} - ${savedEntry.subject}`);

    return savedEntry;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    recipientId: string,
    toEmail: string,
    userName: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<EmailQueue> {
    const htmlContent = EmailTemplateUtil.renderForgotPasswordEmail({
      toEmail,
      userName,
      otp,
      expiryMinutes,
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'Reset Your Password - Duetech',
      body: `Your password reset OTP is: ${otp}. Valid for ${expiryMinutes} minutes.`,
      bodyHtml: htmlContent,
      emailType: EmailType.PASSWORD_RESET,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(
    recipientId: string,
    toEmail: string,
    userName: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<EmailQueue> {
    const htmlContent = EmailTemplateUtil.renderEmailVerificationEmail({
      toEmail,
      userName,
      otp,
      expiryMinutes,
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'Verify Your Email - Duetech',
      body: `Your email verification OTP is: ${otp}. Valid for ${expiryMinutes} minutes.`,
      bodyHtml: htmlContent,
      emailType: EmailType.OTP,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send 2FA login email
   */
  async send2FAEmail(
    recipientId: string,
    toEmail: string,
    userName: string,
    otp: string,
    expiryMinutes: number = 10,
    loginTime?: string,
    loginLocation?: string,
    loginDevice?: string,
  ): Promise<EmailQueue> {
    const htmlContent = EmailTemplateUtil.render2FAEmail({
      toEmail,
      userName,
      otp,
      expiryMinutes,
      loginTime,
      loginLocation,
      loginDevice,
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'Two-Factor Authentication - Duetech',
      body: `Your 2FA code is: ${otp}. Valid for ${expiryMinutes} minutes.`,
      bodyHtml: htmlContent,
      emailType: EmailType.OTP,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send 2FA setup email (sent when enabling 2FA — distinct from login 2FA)
   */
  async send2FASetupEmail(
    recipientId: string,
    toEmail: string,
    userName: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<EmailQueue> {
    const htmlContent = EmailTemplateUtil.render2FASetupEmail({
      toEmail,
      userName,
      otp,
      expiryMinutes,
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'Enable Two-Factor Authentication - Duetech',
      body: `Your 2FA setup code is: ${otp}. Valid for ${expiryMinutes} minutes.`,
      bodyHtml: htmlContent,
      emailType: EmailType.OTP,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    recipientId: string,
    toEmail: string,
    userName: string,
    userRole: string,
    dashboardUrl?: string,
  ): Promise<EmailQueue> {
    const htmlContent = EmailTemplateUtil.renderWelcomeEmail({
      toEmail,
      userName,
      userEmail: toEmail,
      userRole,
      dashboardUrl,
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'Welcome to Duetech! 🎉',
      body: `Welcome to Duetech, ${userName}! Your account has been successfully created.`,
      bodyHtml: htmlContent,
      emailType: EmailType.WELCOME,
      priority: NotificationPriority.NORMAL,
    });
  }

  /**
   * Send account locked email (after repeated failed login attempts)
   */
  async sendAccountLockedEmail(
    recipientId: string,
    toEmail: string,
    userName: string,
    lockReason: string,
    unlocksAt: Date,
  ): Promise<EmailQueue> {
    const now = new Date();
    const htmlContent = EmailTemplateUtil.renderAccountLockedEmail({
      toEmail,
      userName,
      lockReason,
      lockedAt: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      unlocksAt: unlocksAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'Your Account Has Been Temporarily Locked - Duetech',
      body: `Your account has been temporarily locked. It will unlock at ${unlocksAt.toLocaleString()}.`,
      bodyHtml: htmlContent,
      emailType: EmailType.SECURITY_ALERT,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send account suspended email (when suspended user attempts login)
   */
  async sendAccountSuspendedEmail(
    recipientId: string,
    toEmail: string,
    userName: string,
  ): Promise<EmailQueue> {
    const htmlContent = EmailTemplateUtil.renderAccountSuspendedEmail({
      toEmail,
      userName,
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'Your Account Has Been Suspended - Duetech',
      body: 'Your Duetech account has been suspended. Please contact your administrator to restore access.',
      bodyHtml: htmlContent,
      emailType: EmailType.SECURITY_ALERT,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send suspicious login alert email (when login is detected from a new location)
   */
  async sendSuspiciousLoginEmail(
    recipientId: string,
    toEmail: string,
    userName: string,
    loginLocation: string,
    loginDevice: string,
    ipAddress: string,
  ): Promise<EmailQueue> {
    const loginTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const htmlContent = EmailTemplateUtil.renderSuspiciousLoginEmail({
      toEmail,
      userName,
      loginTime,
      loginLocation,
      loginDevice,
      ipAddress,
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'New Login Detected from a Different Location - Duetech',
      body: `A login was detected to your Duetech account from ${loginLocation} at ${loginTime}. If this was not you, please change your password immediately.`,
      bodyHtml: htmlContent,
      emailType: EmailType.SECURITY_ALERT,
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Get priority value for Bull queue
   */
  private getPriorityValue(priority: NotificationPriority): number {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 1;
      case NotificationPriority.HIGH:
        return 2;
      case NotificationPriority.NORMAL:
        return 3;
      case NotificationPriority.LOW:
        return 4;
      default:
        return 3;
    }
  }

  /**
   * Get email queue entry by ID
   */
  async getEmailQueueEntry(id: string): Promise<EmailQueue> {
    return this.emailQueueRepository.findOne({ where: { id } });
  }

  /**
   * Update email status
   */
  async updateEmailStatus(
    id: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: any = {
      status,
      lastAttemptAt: new Date(),
    };

    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    } else if (status === NotificationStatus.FAILED) {
      updateData.errorMessage = errorMessage;
    }

    await this.emailQueueRepository.update(id, updateData);
  }

  /**
   * Send device unenroll OTP email to retailer
   */
  async sendDeviceUnenrollOtpEmail(
    recipientId: string,
    toEmail: string,
    userName: string,
    otp: string,
    expiryMinutes: number = 10,
    client?: Client,
    emiRecords?: EmiPayment[],
  ): Promise<EmailQueue> {
    const htmlContent = EmailTemplateUtil.renderDeviceUnenrollOtpEmail({
      toEmail,
      userName,
      otp,
      expiryMinutes,
      client,
      emiRecords,
    });

    return this.queueEmail({
      recipientType: 'user',
      recipientId,
      toEmail,
      toName: userName,
      subject: 'Device Unenroll OTP - Duetech',
      body: `Your device unenroll OTP is: ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code.`,
      bodyHtml: htmlContent,
      emailType: EmailType.SECURITY_ALERT,
      priority: NotificationPriority.HIGH,
    });
  }

  // ==================== SMS METHODS ====================

  /**
   * Queue an SMS for sending
   */
  async queueSMS(sendSMSDto: SendSMSDto): Promise<SmsQueue> {
    // Create SMS queue entry
    const smsQueueEntry = this.smsQueueRepository.create({
      ...sendSMSDto,
      status: NotificationStatus.PENDING,
      priority: sendSMSDto.priority || NotificationPriority.NORMAL,
    });

    const savedEntry = await this.smsQueueRepository.save(smsQueueEntry);

    // Add to Bull queue for processing
    await this.smsQueue.add(
      'send-sms',
      {
        smsQueueId: savedEntry.id,
      },
      {
        priority: this.getPriorityValue(savedEntry.priority),
        attempts: savedEntry.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(`SMS queued: ${savedEntry.id} - ${savedEntry.toPhone}`);

    return savedEntry;
  }

  /**
   * Send OTP via SMS
   */
  async sendOTPSMS(
    recipientId: string,
    recipientType: 'user' | 'client' | 'company',
    toPhone: string,
    toName: string,
    otp: string,
    expiryMinutes: number = 10,
  ): Promise<SmsQueue> {
    return this.queueSMS({
      recipientType,
      recipientId,
      toPhone,
      toName,
      message: `Your OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code. - Duetech`,
      smsType: 'otp',
      priority: NotificationPriority.HIGH,
      dltTemplateId: this.configService.get('MSG91_OTP_TEMPLATE_ID'),
    });
  }

  /**
   * Send alert SMS (device locked, stolen, etc.)
   */
  async sendAlertSMS(
    recipientId: string,
    recipientType: 'user' | 'client' | 'company',
    toPhone: string,
    toName: string,
    message: string,
  ): Promise<SmsQueue> {
    return this.queueSMS({
      recipientType,
      recipientId,
      toPhone,
      toName,
      message,
      smsType: 'alert',
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send payment reminder SMS
   */
  async sendPaymentReminderSMS(
    recipientId: string,
    recipientType: 'user' | 'client' | 'company',
    toPhone: string,
    toName: string,
    amount: number,
    dueDate: string,
  ): Promise<SmsQueue> {
    return this.queueSMS({
      recipientType,
      recipientId,
      toPhone,
      toName,
      message: `Hi ${toName}, your EMI payment of ₹${amount} is due on ${dueDate}. Please pay on time. - Duetech`,
      smsType: 'reminder',
      priority: NotificationPriority.NORMAL,
    });
  }

  // ==================== PUSH NOTIFICATION METHODS ====================

  /**
   * Queue a push notification for sending
   */
  async queuePush(sendPushDto: SendPushDto): Promise<PushQueue> {
    // Create push queue entry
    const pushQueueEntry = this.pushQueueRepository.create({
      ...sendPushDto,
      status: NotificationStatus.PENDING,
      queuePriority: sendPushDto.queuePriority || NotificationPriority.NORMAL,
      priority: sendPushDto.priority || 'normal',
    });

    const savedEntry = await this.pushQueueRepository.save(pushQueueEntry);

    // Add to Bull queue for processing
    await this.pushQueue.add(
      'send-push',
      {
        pushQueueId: savedEntry.id,
      },
      {
        priority: this.getPriorityValue(savedEntry.queuePriority),
        attempts: savedEntry.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(`Push queued: ${savedEntry.id} - ${savedEntry.title}`);

    return savedEntry;
  }

  /**
   * Send device alert push notification
   */
  async sendDeviceAlertPush(
    recipientId: string,
    recipientType: 'user' | 'client' | 'company',
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushQueue> {
    return this.queuePush({
      recipientType,
      recipientId,
      deviceTokens,
      title,
      body,
      data,
      notificationType: 'alert',
      priority: 'high',
      queuePriority: NotificationPriority.HIGH,
      channelId: 'device_alerts',
      sound: 'default',
    });
  }

  /**
   * Send payment reminder push notification
   */
  async sendPaymentReminderPush(
    recipientId: string,
    recipientType: 'user' | 'client' | 'company',
    deviceTokens: string[],
    amount: number,
    dueDate: string,
  ): Promise<PushQueue> {
    return this.queuePush({
      recipientType,
      recipientId,
      deviceTokens,
      title: 'Payment Reminder',
      body: `Your EMI payment of ₹${amount} is due on ${dueDate}. Please pay on time.`,
      data: {
        type: 'payment_reminder',
        amount: amount.toString(),
        dueDate,
      },
      notificationType: 'reminder',
      priority: 'normal',
      queuePriority: NotificationPriority.NORMAL,
      channelId: 'payment_reminders',
      clickAction: 'OPEN_PAYMENTS',
    });
  }

  /**
   * Send key transfer notification
   */
  async sendKeyTransferPush(
    recipientId: string,
    recipientType: 'user' | 'client' | 'company',
    deviceTokens: string[],
    keys: number,
    fromName: string,
  ): Promise<PushQueue> {
    return this.queuePush({
      recipientType,
      recipientId,
      deviceTokens,
      title: 'Keys Received',
      body: `You received ${keys} keys from ${fromName}`,
      data: {
        type: 'key_transfer',
        keys: keys.toString(),
        fromName,
      },
      notificationType: 'update',
      priority: 'normal',
      queuePriority: NotificationPriority.NORMAL,
      channelId: 'key_transfers',
      clickAction: 'OPEN_BALANCE',
    });
  }
}
