/**
 * React Query hooks for Audit API
 * GET /audit/logs  — paginated audit logs (SUPER_ADMIN only)
 * GET /audit/health — system health (SUPER_ADMIN / SUPER)
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { AUDIT_ENDPOINTS } from '../api/endpoints';
import { queryKeys } from './queryKeys';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  userId?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  ipAddress: string | null;
  method: string | null;
  endpoint: string | null;
  success: boolean;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface AuditLogResponse {
  logs: AuditLogEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'down';
}

export interface DatabaseHealth extends ServiceHealth {
  connectionCount: number;
  avgQueryTime: number;
  slowQueries: number;
  message?: string;
}

export interface RedisHealth extends ServiceHealth {
  connected: boolean;
  memoryUsage?: number;
  message?: string;
}

export interface QueueHealth {
  queueName: string;
  status: 'healthy' | 'degraded' | 'down';
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface NotificationProviderHealth {
  type: string;
  name: string;
  healthy: boolean;
  credits?: number;
  message?: string;
}

export interface SystemHealthResponse {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: {
    database: DatabaseHealth;
    redis: RedisHealth;
    queues: QueueHealth[];
  };
  notificationProviders: {
    email: NotificationProviderHealth[];
    sms: NotificationProviderHealth[];
    push: NotificationProviderHealth[];
  };
  statistics: {
    uptime: number;
    totalUsers: number;
    totalClients: number;
    totalOrders: number;
    activeConnections: number;
  };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/**
 * Infinite paginated audit logs — SUPER_ADMIN only
 * GET /audit/logs
 */
export const useAuditLogs = (filters?: Omit<AuditLogFilters, 'page'>) => {
  return useInfiniteQuery({
    queryKey: queryKeys.audit.logs(filters),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.get<AuditLogResponse>(AUDIT_ENDPOINTS.GET_ALL, {
        params: { ...filters, page: pageParam, limit: filters?.limit ?? 20 },
      });
      return data;
    },
    getNextPageParam: (lastPage) => {
      const { currentPage, totalPages } = lastPage.pagination;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 15000,
  });
};

/**
 * System health — SUPER_ADMIN / SUPER
 * GET /audit/health
 */
export const useSystemHealth = () => {
  return useQuery({
    queryKey: queryKeys.audit.health,
    queryFn: async () => {
      const { data } = await apiClient.get<SystemHealthResponse>(AUDIT_ENDPOINTS.HEALTH);
      return data;
    },
    staleTime: 30000, // 30s
  });
};
