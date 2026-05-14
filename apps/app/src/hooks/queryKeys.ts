/**
 * Centralized Query Keys
 * Used across all TanStack Query hooks for consistent cache management
 *
 * Benefits:
 * - Easy invalidation across the app
 * - Type-safe query keys
 * - Centralized cache key management
 * - Prevents typos and inconsistencies
 */

export const queryKeys = {
  // Authentication
  auth: {
    me: ['auth', 'me'] as const,
    login: ['auth', 'login'] as const,
    logout: ['auth', 'logout'] as const,
    refresh: ['auth', 'refresh'] as const,
    biometricToken: ['auth', 'biometric-token'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    me: ['users', 'me'] as const,
    byId: (id: string) => ['users', id] as const,
    detail: (id?: string) => ['users', 'detail', id] as const,
    byCompany: (companyId: string) => ['users', 'company', companyId] as const,
    list: (filters?: any) => ['users', 'list', filters] as const,
    upstream: ['users', 'upstream'] as const,
    downstream: ['users', 'downstream'] as const,
  },

  // Companies
  companies: {
    all: ['companies'] as const,
    me: ['companies', 'me'] as const,
    byId: (id: string) => ['companies', id] as const,
    stats: (id: string) => ['companies', id, 'stats'] as const,
    list: (filters?: any) => ['companies', 'list', filters] as const,
  },

  // Dashboard & Stats
  dashboard: {
    systemStats: ['dashboard', 'system-stats'] as const,
    systemHealth: ['dashboard', 'system-health'] as const,
  },

  // Reports & Activity
  reports: {
    recentActivity: (filters?: any) => ['reports', 'recent-activity', filters] as const,
    actionableCount: ['reports', 'actionable-count'] as const,
  },

  // Clients
  clients: {
    all: ['clients'] as const,
    list: (filters?: any) => ['clients', 'list', filters] as const,
    detail: (id: string) => ['clients', id] as const,
    byId: (id: string) => ['clients', id] as const,
    byAgent: (userId: string) => ['clients', 'user', userId] as const,
    byCompany: (companyId: string) => ['clients', 'company', companyId] as const,
    qrCode: (id: string) => ['clients', id, 'qr-code'] as const,
    emis: (clientId: string) => ['clients', clientId, 'emis'] as const,
    agreement: (clientId: string) => ['clients', clientId, 'agreement'] as const,
    agreementTemplate: ['agreements', 'template'] as const,
    locations: (clientId: string) => ['clients', clientId, 'locations'] as const,
    latestLocation: (clientId: string) => ['clients', clientId, 'location', 'latest'] as const,
    activity: (clientId: string) => ['clients', clientId, 'activity'] as const,
    blockedApps: (clientId: string) => ['clients', clientId, 'blocked-apps'] as const,
  },

  // Transactions (for future use)
  transactions: {
    all: ['transactions'] as const,
    byId: (id: string) => ['transactions', id] as const,
    byAgent: (userId: string) => ['transactions', 'user', userId] as const,
  },

  // Orders (for future use)
  orders: {
    all: ['orders'] as const,
    list: (filters?: any, limit?: number, status?: string) => ['orders', 'list', filters, limit, status] as const,
    byId: (id: string) => ['orders', id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
    preferences: ['notifications', 'preferences'] as const,
    userSettings: ['notifications', 'user-settings'] as const,
  },

  // Balance Sheet
  balanceSheet: {
    all: ['balance-sheet'] as const,
    list: (filters?: any) => ['balance-sheet', 'list', filters] as const,
    summary: (userId: string) => ['balance-sheet', 'summary', userId] as const,
    byId: (id: string) => ['balance-sheet', id] as const,
  },

  // Key Transfers
  keyTransfers: {
    all: ['key-transfers'] as const,
    list: (filters?: any) => ['key-transfers', 'list', filters] as const,
    pending: (userId?: string) => ['key-transfers', 'pending', userId] as const,
    sent: (userId: string) => ['key-transfers', 'sent', userId] as const,
    received: (userId: string) => ['key-transfers', 'received', userId] as const,
    byId: (id: string) => ['key-transfers', id] as const,
  },

  // Audit Logs (SUPER_ADMIN only)
  audit: {
    logs: (filters?: any) => ['audit', 'logs', filters] as const,
    health: ['audit', 'health'] as const,
  },
} as const;
