import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Client } from '../client/entities/client.entity';
import { EmiPayment } from '../client/entities/emi-payment.entity';
import { DeviceCommand } from '../device/entities/device-command.entity';
import { NotificationHelper } from './notification.helper';
import {
  NotificationType,
  UserRole,
  EmiStatus,
  ClientStatus,
  CommandType,
  CommandStatus,
} from '../../common/enums';
import { DEFAULT_USER_SETTINGS } from './user-settings';

/**
 * AlertSchedulerService
 *
 * All jobs run daily at 09:00 UTC.
 *
 * 1. checkLowBalances
 *    Sends a low_balance_alert in-app notification + FCM push to SUPER /
 *    DISTRIBUTOR / RETAILER whose balance ≤ userSettings.lowBalanceThreshold.
 *    Guard: one alert per user per calendar day (lastLowBalanceAlertAt).
 *
 * 2. checkEmiReminders  (retailer in-app / FCM)
 *    Notifies the RETAILER when any of their clients have:
 *      - EMI due within the next 3 days  → emi_reminder notification
 *      - EMI that just became overdue yesterday → emi_overdue notification
 *    These are in-app + FCM alerts to the retailer, gated by the retailer's
 *    emiReminders notification preference.
 *
 * 3. sendClientEmiMessages  (SHOW_MESSAGE command to client device)
 *    Queues a SHOW_MESSAGE DeviceCommand for each PROTECTED client device when:
 *      - emiReminderEnabled=true AND EMI due within 3 days  → reminder message
 *      - emiOverdueReminderEnabled=true AND EMI is MISSED   → overdue message
 *    The device shows this as a closable overlay at next sync (09:00 is the
 *    standard daily sync window). De-duplicated: only one PENDING SHOW_MESSAGE
 *    per client per calendar day is queued.
 */
@Injectable()
export class AlertSchedulerService {
  private readonly logger = new Logger(AlertSchedulerService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(EmiPayment)
    private readonly emiRepo: Repository<EmiPayment>,
    @InjectRepository(DeviceCommand)
    private readonly commandRepo: Repository<DeviceCommand>,
    private readonly notificationHelper: NotificationHelper,
  ) {}

  // ─── 1. Low Balance Alert ─────────────────────────────────────────────────

  @Cron('0 9 * * *', { name: 'low_balance_alert', timeZone: 'UTC' })
  async checkLowBalances(): Promise<void> {
    this.logger.log('[AlertScheduler] Running low-balance alert check...');

    const users = await this.userRepo
      .createQueryBuilder('u')
      .where('u.role IN (:...roles)', {
        roles: [UserRole.SUPER, UserRole.DISTRIBUTOR, UserRole.RETAILER],
      })
      .select([
        'u.id',
        'u.balance',
        'u.role',
        'u.userSettings',
        'u.notificationPreferences',
        'u.lastLowBalanceAlertAt',
      ])
      .getMany();

    const today = new Date().toISOString().slice(0, 10);
    let sent = 0;

    for (const user of users) {
      try {
        const settings = { ...DEFAULT_USER_SETTINGS, ...(user.userSettings ?? {}) };
        const threshold = settings.lowBalanceThreshold;

        if (threshold === null || threshold === undefined) continue;
        if (user.balance > threshold) continue;

        // Guard: one alert per calendar day
        const lastSent = user.lastLowBalanceAlertAt;
        if (lastSent && lastSent.toISOString().slice(0, 10) === today) continue;

        await this.notificationHelper.notify(
          user.id,
          NotificationType.LOW_BALANCE_ALERT,
          'Low key balance',
          `Your key balance (${user.balance}) has dropped to or below your alert threshold (${threshold}). Top up to avoid disruption.`,
          { balance: String(user.balance), threshold: String(threshold) },
        );

        await this.userRepo.update(user.id, { lastLowBalanceAlertAt: new Date() });
        sent++;
      } catch (err) {
        this.logger.error(
          `[AlertScheduler] Low-balance check failed for user ${user.id}:`,
          err,
        );
      }
    }

    this.logger.log(`[AlertScheduler] Low-balance alerts sent: ${sent}`);
  }

  // ─── 2. EMI Reminder — retailer in-app/FCM notification ──────────────────

  @Cron('0 9 * * *', { name: 'emi_reminder_retailer', timeZone: 'UTC' })
  async checkEmiReminders(): Promise<void> {
    this.logger.log('[AlertScheduler] Running EMI reminder (retailer) check...');

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().slice(0, 10);
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);

    const [upcomingEmis, overdueEmis] = await Promise.all([
      this.emiRepo
        .createQueryBuilder('ep')
        .innerJoinAndSelect('ep.client', 'c')
        .where('ep.status = :status', { status: EmiStatus.UPCOMING })
        .andWhere('ep.due_date >= :today', { today: todayStr })
        .andWhere('ep.due_date <= :in3Days', { in3Days: in3DaysStr })
        .select([
          'ep.id', 'ep.clientId', 'ep.emiNumber', 'ep.amount', 'ep.dueDate',
          'c.id', 'c.clientName', 'c.userId',
        ])
        .getMany(),

      // EMIs that just became overdue (due_date = yesterday, MISSED)
      this.emiRepo
        .createQueryBuilder('ep')
        .innerJoinAndSelect('ep.client', 'c')
        .where('ep.status = :status', { status: EmiStatus.MISSED })
        .andWhere('ep.due_date = :yesterday', { yesterday: yesterdayStr })
        .select([
          'ep.id', 'ep.clientId', 'ep.emiNumber', 'ep.amount', 'ep.dueDate',
          'c.id', 'c.clientName', 'c.userId',
        ])
        .getMany(),
    ]);

    // Group by retailer
    const upcomingByRetailer = this.groupByRetailer(upcomingEmis);
    const overdueByRetailer = this.groupByRetailer(overdueEmis);

    const allRetailerIds = new Set([
      ...upcomingByRetailer.keys(),
      ...overdueByRetailer.keys(),
    ]);

    let remindersSent = 0;
    let overdueSent = 0;

    for (const retailerId of allRetailerIds) {
      try {
        const upcoming = upcomingByRetailer.get(retailerId);
        if (upcoming?.length) {
          const count = upcoming.length;
          await this.notificationHelper.notify(
            retailerId,
            NotificationType.EMI_REMINDER,
            count === 1 ? 'EMI due soon' : `${count} EMIs due soon`,
            count === 1
              ? `${upcoming[0].client.clientName}'s EMI #${upcoming[0].emiNumber} (₹${upcoming[0].amount}) is due on ${upcoming[0].dueDate}.`
              : `${count} EMIs are due in the next 3 days: ${upcoming.map((e) => e.client.clientName).join(', ')}.`,
            { count: String(count) },
          );
          remindersSent++;
        }

        const overdue = overdueByRetailer.get(retailerId);
        if (overdue?.length) {
          const count = overdue.length;
          await this.notificationHelper.notify(
            retailerId,
            NotificationType.EMI_OVERDUE,
            count === 1 ? 'EMI overdue' : `${count} EMIs overdue`,
            count === 1
              ? `${overdue[0].client.clientName}'s EMI #${overdue[0].emiNumber} (₹${overdue[0].amount}) was due on ${overdue[0].dueDate} and is now overdue.`
              : `${count} EMI payments are now overdue: ${overdue.map((e) => e.client.clientName).join(', ')}.`,
            { count: String(count) },
          );
          overdueSent++;
        }
      } catch (err) {
        this.logger.error(
          `[AlertScheduler] EMI reminder failed for retailer ${retailerId}:`,
          err,
        );
      }
    }

    this.logger.log(
      `[AlertScheduler] Retailer EMI reminders: ${remindersSent} sent, overdue alerts: ${overdueSent} sent`,
    );
  }

  // ─── 3. Client device SHOW_MESSAGE for EMI reminder / overdue ────────────

  @Cron('30 3 * * *', { name: 'emi_device_messages', timeZone: 'UTC' }) // 09:00 IST
  async sendClientEmiMessages(): Promise<void> {
    this.logger.log('[AlertScheduler] Running client EMI SHOW_MESSAGE job...');

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().slice(0, 10);

    // Fetch PROTECTED clients where either reminder flag is enabled
    const clients = await this.clientRepo
      .createQueryBuilder('c')
      .where('c.status = :status', { status: ClientStatus.PROTECTED })
      .andWhere('(c.emi_reminder_enabled = true OR c.emi_overdue_reminder_enabled = true)')
      .select([
        'c.id', 'c.userId', 'c.clientName',
        'c.emiReminderEnabled', 'c.emiOverdueReminderEnabled',
      ])
      .getMany();

    if (!clients.length) {
      this.logger.log('[AlertScheduler] No eligible clients for EMI device messages.');
      return;
    }

    const clientIds = clients.map((c) => c.id);

    // Fetch upcoming EMIs (due within 3 days) and overdue EMIs for these clients
    const [upcomingEmis, overdueEmis] = await Promise.all([
      this.emiRepo
        .createQueryBuilder('ep')
        .where('ep.client_id IN (:...clientIds)', { clientIds })
        .andWhere('ep.status = :status', { status: EmiStatus.UPCOMING })
        .andWhere('ep.due_date >= :today', { today: todayStr })
        .andWhere('ep.due_date <= :in3Days', { in3Days: in3DaysStr })
        .select(['ep.id', 'ep.clientId', 'ep.emiNumber', 'ep.amount', 'ep.dueDate'])
        .getMany(),

      this.emiRepo
        .createQueryBuilder('ep')
        .where('ep.client_id IN (:...clientIds)', { clientIds })
        .andWhere('ep.status = :status', { status: EmiStatus.MISSED })
        .select(['ep.id', 'ep.clientId', 'ep.emiNumber', 'ep.amount', 'ep.dueDate'])
        .getMany(),
    ]);

    // Index by clientId for quick lookup
    const upcomingByClient = new Map<string, EmiPayment>();
    for (const emi of upcomingEmis) {
      if (!upcomingByClient.has(emi.clientId)) upcomingByClient.set(emi.clientId, emi);
    }
    const overdueByClient = new Map<string, EmiPayment>();
    for (const emi of overdueEmis) {
      if (!overdueByClient.has(emi.clientId)) overdueByClient.set(emi.clientId, emi);
    }

    // Check which clients already have a PENDING SHOW_MESSAGE queued today
    // to avoid duplicates if the cron re-runs or the job is triggered manually.
    const todayStart = new Date(today);
    todayStart.setUTCHours(0, 0, 0, 0);

    const existingToday = await this.commandRepo
      .createQueryBuilder('cmd')
      .where('cmd.client_id IN (:...clientIds)', { clientIds })
      .andWhere('cmd.type = :type', { type: CommandType.SHOW_MESSAGE })
      .andWhere('cmd.status = :status', { status: CommandStatus.PENDING })
      .andWhere('cmd.created_at >= :todayStart', { todayStart })
      .select(['cmd.clientId'])
      .getMany();

    const alreadyQueued = new Set(existingToday.map((c) => c.clientId));

    // Command expires end of day (23:59 UTC) — device picks it up on next sync
    const expiresAt = new Date(today);
    expiresAt.setUTCHours(23, 59, 59, 999);

    let queued = 0;

    for (const client of clients) {
      if (alreadyQueued.has(client.id)) continue;

      const upcoming = upcomingByClient.get(client.id);
      const overdue = overdueByClient.get(client.id);

      let message: string | null = null;

      if (overdue && client.emiOverdueReminderEnabled) {
        message =
          `Your EMI payment of ₹${overdue.amount} was due on ${overdue.dueDate} ` +
          `and is now overdue. Please contact your retailer to avoid device lock.`;
      } else if (upcoming && client.emiReminderEnabled) {
        message =
          `Reminder: Your EMI payment of ₹${upcoming.amount} is due on ` +
          `${upcoming.dueDate}. Please ensure timely payment.`;
      }

      if (!message) continue;

      try {
        const command = this.commandRepo.create({
          clientId: client.id,
          type: CommandType.SHOW_MESSAGE,
          status: CommandStatus.PENDING,
          payload: {
            message,
            title: overdue ? 'EMI Payment Overdue' : 'EMI Payment Reminder',
            dismissible: true,    // closable overlay on device
            source: 'automated',  // device can distinguish auto vs retailer-issued
          },
          // Automated system command — no human issuer; use client's retailer as owner
          createdById: client.userId,
          expiresAt,
        });

        await this.commandRepo.save(command);
        queued++;
      } catch (err) {
        this.logger.error(
          `[AlertScheduler] Failed to queue SHOW_MESSAGE for client ${client.id}:`,
          err,
        );
      }
    }

    this.logger.log(`[AlertScheduler] Client EMI SHOW_MESSAGE commands queued: ${queued}`);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private groupByRetailer<T extends { client: { userId: string } }>(
    items: T[],
  ): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of items) {
      const uid = item.client.userId;
      if (!map.has(uid)) map.set(uid, []);
      map.get(uid)!.push(item);
    }
    return map;
  }
}
