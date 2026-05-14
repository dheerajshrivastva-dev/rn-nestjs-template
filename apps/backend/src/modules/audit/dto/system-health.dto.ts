export class DatabaseHealthDto {
  status: 'healthy' | 'degraded' | 'down';
  connectionCount: number;
  avgQueryTime: number;
  slowQueries: number;
  message?: string;
}

export class RedisHealthDto {
  status: 'healthy' | 'degraded' | 'down';
  connected: boolean;
  memoryUsage?: number;
  message?: string;
}

export class QueueHealthDto {
  queueName: string;
  status: 'healthy' | 'degraded' | 'down';
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export class NotificationProviderHealthDto {
  type: string;
  name: string;
  healthy: boolean;
  credits?: number;
  message?: string;
}

export class SystemHealthResponseDto {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: Date;

  services: {
    database: DatabaseHealthDto;
    redis: RedisHealthDto;
    queues: QueueHealthDto[];
  };

  notificationProviders: {
    email: NotificationProviderHealthDto[];
    sms: NotificationProviderHealthDto[];
    push: NotificationProviderHealthDto[];
  };

  statistics: {
    uptime: number; // seconds
    totalUsers: number;
    totalClients: number;
    totalOrders: number;
    activeConnections: number;
  };
}
