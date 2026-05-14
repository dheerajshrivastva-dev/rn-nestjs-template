import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { User } from '../user/entities/user.entity';
import { AuditLogQueryDto, AuditLogResponseDto } from './dto/audit-log-query.dto';
import { SystemHealthResponseDto } from './dto/system-health.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly startTime: Date;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectQueue('email')
    private readonly emailQueue: Queue,
    @InjectQueue('sms')
    private readonly smsQueue: Queue,
    @InjectQueue('push')
    private readonly pushQueue: Queue,
  ) {
    this.startTime = new Date();
  }

  /**
   * Create an audit log entry
   */
  async log(params: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: AuditAction;
    description?: string;
    entityType?: string;
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    endpoint?: string;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        ...params,
        success: params.success !== undefined ? params.success : true,
      });

      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      // Don't throw - audit logging should never break the application
      return null;
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    query: AuditLogQueryDto,
    user: User,
  ): Promise<AuditLogResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    // Date range filter
    if (query.startDate && query.endDate) {
      whereClause.createdAt = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    }

    // Action filter
    if (query.action) {
      whereClause.action = query.action;
    }

    // User filter
    if (query.userId) {
      whereClause.userId = query.userId;
    }

    // Entity filter
    if (query.entityType) {
      whereClause.entityType = query.entityType;
    }

    if (query.entityId) {
      whereClause.entityId = query.entityId;
    }

    // Role-based filtering
    // TODO: Add company-based filtering for non-SUPER_ADMIN users

    const [logs, totalItems] = await this.auditLogRepository.findAndCount({
      where: whereClause,
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealthResponseDto> {
    this.logger.log('Checking system health');

    const [
      databaseHealth,
      redisHealth,
      queuesHealth,
      statistics,
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkQueuesHealth(),
      this.getSystemStatistics(),
    ]);

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'down' = 'healthy';

    if (databaseHealth.status === 'down' || redisHealth.status === 'down') {
      overall = 'down';
    } else if (
      databaseHealth.status === 'degraded' ||
      queuesHealth.some(q => q.status === 'degraded')
    ) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date(),
      services: {
        database: databaseHealth,
        redis: redisHealth,
        queues: queuesHealth,
      },
      notificationProviders: {
        email: [],
        sms: [],
        push: [],
      },
      statistics: {
        ...statistics,
        uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
      },
    };
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      await this.userRepository.count();
      const queryTime = Date.now() - startTime;

      return {
        status: queryTime < 1000 ? ('healthy' as const) : ('degraded' as const),
        connectionCount: 1,
        avgQueryTime: queryTime,
        slowQueries: 0,
        message: queryTime < 1000 ? 'Database is healthy' : 'Database is slow',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        connectionCount: 0,
        avgQueryTime: 0,
        slowQueries: 0,
        message: `Database error: ${error.message}`,
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth() {
    try {
      await this.emailQueue.getJobCounts();

      return {
        status: 'healthy' as const,
        connected: true,
        message: 'Redis is healthy',
      };
    } catch (error) {
      return {
        status: 'down' as const,
        connected: false,
        message: `Redis error: ${error.message}`,
      };
    }
  }

  /**
   * Check queues health
   */
  private async checkQueuesHealth() {
    const queues = [
      { name: 'email', queue: this.emailQueue },
      { name: 'sms', queue: this.smsQueue },
      { name: 'push', queue: this.pushQueue },
    ];

    const healthChecks = await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          const counts = await queue.getJobCounts();

          const status =
            counts.failed > 100 ? ('degraded' as const) : ('healthy' as const);

          return {
            queueName: name,
            status,
            waiting: counts.waiting || 0,
            active: counts.active || 0,
            completed: counts.completed || 0,
            failed: counts.failed || 0,
            delayed: counts.delayed || 0,
          };
        } catch (error) {
          return {
            queueName: name,
            status: 'down' as const,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
          };
        }
      }),
    );

    return healthChecks;
  }

  /**
   * Get system statistics
   */
  private async getSystemStatistics() {
    try {
      const totalUsers = await this.userRepository.count();
      return { totalUsers, activeConnections: 0 };
    } catch (error) {
      return { totalUsers: 0, activeConnections: 0 };
    }
  }

  /**
   * Clean up old audit logs (older than X days)
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old audit logs`);

    return result.affected || 0;
  }
}
