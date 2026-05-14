import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NotificationHelper } from '../notification/notification.helper';
import { User } from '../user/entities/user.entity';
import { UserRole, NotificationType } from '../../common/enums';

// ─── Thresholds ───────────────────────────────────────────────────────────────

/** DB query time above this (ms) → DB_DEGRADED alert */
const DB_SLOW_THRESHOLD_MS = 1000;

/** Failed jobs in a single queue above this count → QUEUE_DEGRADED alert */
const QUEUE_FAILED_THRESHOLD = 100;

// ─── State snapshot ───────────────────────────────────────────────────────────

interface HealthState {
  db: 'healthy' | 'degraded' | 'down';
  redis: 'healthy' | 'down';
  /** Map of queue name → 'healthy' | 'degraded' */
  queues: Record<string, 'healthy' | 'degraded'>;
  maintenance: boolean;
}

@Injectable()
export class SystemHealthMonitorService {
  private readonly logger = new Logger(SystemHealthMonitorService.name);

  /** Tracks the last known state to avoid duplicate alerts */
  private lastState: HealthState = {
    db: 'healthy',
    redis: 'healthy',
    queues: {},
    maintenance: false,
  };

  /** In-memory maintenance mode flag. Toggled via the API. */
  private maintenanceMode = false;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectQueue('email')
    private readonly emailQueue: Queue,
    @InjectQueue('sms')
    private readonly smsQueue: Queue,
    @InjectQueue('push')
    private readonly pushQueue: Queue,
    private readonly notificationHelper: NotificationHelper,
  ) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  isMaintenanceMode(): boolean {
    return this.maintenanceMode;
  }

  /**
   * Toggle maintenance mode and immediately push a system alert to all
   * SUPER_ADMIN users so they know the mode changed.
   */
  async setMaintenanceMode(enabled: boolean): Promise<void> {
    if (this.maintenanceMode === enabled) return;

    this.maintenanceMode = enabled;
    this.lastState.maintenance = enabled;

    this.logger.warn(`[HealthMonitor] Maintenance mode ${enabled ? 'ENABLED' : 'DISABLED'}`);

    const type = enabled ? NotificationType.MAINTENANCE_ON : NotificationType.MAINTENANCE_OFF;
    const title = enabled ? '🔧 Maintenance Mode Enabled' : '✅ Maintenance Mode Disabled';
    const body = enabled
      ? 'The system has been placed in maintenance mode. Some features may be unavailable.'
      : 'Maintenance mode has been lifted. The system is fully operational.';

    await this.broadcastToSuperAdmins(type, title, body, { maintenance: String(enabled) });
  }

  // ─── Scheduled health check ──────────────────────────────────────────────────

  /**
   * Runs every 2 minutes.
   * Checks DB, Redis, and Bull queues — fires push notifications only when
   * the state *changes* (healthy→degraded/down or back to healthy) to avoid spam.
   */
  @Cron('*/2 * * * *')
  async runHealthCheck(): Promise<void> {
    this.logger.debug('[HealthMonitor] Running scheduled health check');

    const [dbState, redisState, queueStates] = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
      this.checkQueues(),
    ]);

    await Promise.all([
      this.handleDbStateChange(dbState),
      this.handleRedisStateChange(redisState),
      this.handleQueueStateChanges(queueStates),
    ]);
  }

  // ─── Individual checks ───────────────────────────────────────────────────────

  private async checkDb(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const start = Date.now();
      await this.userRepo.count();
      const elapsed = Date.now() - start;

      if (elapsed >= DB_SLOW_THRESHOLD_MS) {
        this.logger.warn(`[HealthMonitor] DB slow — query took ${elapsed}ms`);
        return 'degraded';
      }
      return 'healthy';
    } catch (err) {
      this.logger.error('[HealthMonitor] DB check failed:', err);
      return 'down';
    }
  }

  private async checkRedis(): Promise<'healthy' | 'down'> {
    try {
      await this.emailQueue.getJobCounts();
      return 'healthy';
    } catch (err) {
      this.logger.error('[HealthMonitor] Redis check failed:', err);
      return 'down';
    }
  }

  private async checkQueues(): Promise<Record<string, 'healthy' | 'degraded'>> {
    const queues: Array<{ name: string; queue: Queue }> = [
      { name: 'email', queue: this.emailQueue },
      { name: 'sms',   queue: this.smsQueue },
      { name: 'push',  queue: this.pushQueue },
    ];

    const results: Record<string, 'healthy' | 'degraded'> = {};

    await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          const counts = await queue.getJobCounts();
          results[name] = counts.failed > QUEUE_FAILED_THRESHOLD ? 'degraded' : 'healthy';
          if (results[name] === 'degraded') {
            this.logger.warn(
              `[HealthMonitor] Queue "${name}" degraded — failed jobs: ${counts.failed}`,
            );
          }
        } catch {
          // If we can't reach the queue it's a Redis issue; mark healthy here
          // (Redis alert handles the outage)
          results[name] = 'healthy';
        }
      }),
    );

    return results;
  }

  // ─── State-change handlers ───────────────────────────────────────────────────

  private async handleDbStateChange(current: 'healthy' | 'degraded' | 'down'): Promise<void> {
    const previous = this.lastState.db;
    if (current === previous) return;

    this.lastState.db = current;
    this.logger.warn(`[HealthMonitor] DB state: ${previous} → ${current}`);

    let type: NotificationType;
    let title: string;
    let body: string;

    if (current === 'down') {
      type = NotificationType.DB_DOWN;
      title = '🔴 Database Down';
      body = 'The database is unreachable. User-facing operations are affected.';
    } else if (current === 'degraded') {
      type = NotificationType.DB_DEGRADED;
      title = '🟡 Database Slow';
      body = `Database query time exceeded ${DB_SLOW_THRESHOLD_MS}ms. Performance may be degraded.`;
    } else {
      type = NotificationType.DB_RECOVERED;
      title = '🟢 Database Recovered';
      body = 'Database is back to healthy response times.';
    }

    await this.broadcastToSuperAdmins(type, title, body, { previousState: previous, currentState: current });
  }

  private async handleRedisStateChange(current: 'healthy' | 'down'): Promise<void> {
    const previous = this.lastState.redis;
    if (current === previous) return;

    this.lastState.redis = current;
    this.logger.warn(`[HealthMonitor] Redis state: ${previous} → ${current}`);

    const type = current === 'down' ? NotificationType.REDIS_DOWN : NotificationType.REDIS_RECOVERED;
    const title = current === 'down' ? '🔴 Redis Down' : '🟢 Redis Recovered';
    const body = current === 'down'
      ? 'Redis is unreachable. Queues and real-time features are offline.'
      : 'Redis connection restored. All queue-based features are operational again.';

    await this.broadcastToSuperAdmins(type, title, body, { previousState: previous, currentState: current });
  }

  private async handleQueueStateChanges(
    current: Record<string, 'healthy' | 'degraded'>,
  ): Promise<void> {
    for (const [queueName, state] of Object.entries(current)) {
      const previous = this.lastState.queues[queueName] ?? 'healthy';
      if (state === previous) continue;

      this.lastState.queues[queueName] = state;
      this.logger.warn(`[HealthMonitor] Queue "${queueName}" state: ${previous} → ${state}`);

      const type = state === 'degraded' ? NotificationType.QUEUE_DEGRADED : NotificationType.QUEUE_RECOVERED;
      const title = state === 'degraded'
        ? `🟡 Queue Degraded: ${queueName}`
        : `🟢 Queue Recovered: ${queueName}`;
      const body = state === 'degraded'
        ? `The "${queueName}" queue has more than ${QUEUE_FAILED_THRESHOLD} failed jobs. Notifications may be delayed.`
        : `The "${queueName}" queue failure rate has normalised.`;

      await this.broadcastToSuperAdmins(type, title, body, { queue: queueName, previousState: previous, currentState: state });
    }
  }

  // ─── Broadcast helper ────────────────────────────────────────────────────────

  /**
   * Finds all SUPER_ADMIN users and sends them a push + inbox notification.
   * Best-effort — errors are logged but not thrown.
   */
  private async broadcastToSuperAdmins(
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    let admins: User[];
    try {
      admins = await this.userRepo.find({
        where: { role: UserRole.SUPER_ADMIN },
        select: ['id'],
      });
    } catch (err) {
      this.logger.error('[HealthMonitor] Failed to fetch SUPER_ADMIN users for alert broadcast:', err);
      return;
    }

    if (!admins.length) {
      this.logger.warn('[HealthMonitor] No SUPER_ADMIN users found — alert not delivered');
      return;
    }

    this.logger.log(
      `[HealthMonitor] Broadcasting "${type}" to ${admins.length} SUPER_ADMIN user(s)`,
    );

    await Promise.allSettled(
      admins.map((admin) =>
        this.notificationHelper.notify(admin.id, type, title, body, {
          source: 'system_health_monitor',
          ...data,
        }),
      ),
    );
  }
}
