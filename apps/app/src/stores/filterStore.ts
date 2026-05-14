/**
 * Global Filter Store - Zustand
 * Manages filter state across all screens and roles
 */

import { create } from 'zustand';
import { UserRole, UserStatus } from '../api/types';

export type FilterType = 'companies' | 'agents' | 'clients' | 'orders' | 'devices' | null;

export interface CompanyFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  sortBy?: 'name' | 'createdAt' | 'totalAgents' | 'monthlyRevenue';
  sortOrder?: 'asc' | 'desc';
  minAgents?: number;
  maxAgents?: number;
  minRevenue?: number;
  maxRevenue?: number;
  minClients?: number;
  maxClients?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface userFilters {
  search?: string;
  status?: UserStatus | undefined;
  role?: UserRole | undefined;
  sortBy?: 'name' | 'createdAt' | 'balance' | 'activeClients';
  sortOrder?: 'asc' | 'desc';
  minClients?: number;
  maxClients?: number;
  minBalance?: number;
  maxBalance?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface ClientFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  emiStatus?: 'all' | 'pending' | 'paid' | 'overdue';
  deviceType?: 'all' | string;
  sortBy?: 'name' | 'createdAt' | 'emiAmount' | 'lastPayment';
  sortOrder?: 'asc' | 'desc';
  minEmiAmount?: number;
  maxEmiAmount?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface OrderFilters {
  search?: string;
  status?: 'all' | 'pending' | 'approved' | 'rejected' | 'completed';
  sortBy?: 'createdAt' | 'amount' | 'quantity';
  sortOrder?: 'asc' | 'desc';
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface DeviceFilters {
  search?: string;
  status?: 'all' | 'locked' | 'unlocked';
  sortBy?: 'createdAt' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

export type FilterValues =
  | CompanyFilters
  | userFilters
  | ClientFilters
  | OrderFilters
  | DeviceFilters;

interface FilterState {
  // UI State
  isOpen: boolean;
  filterType: FilterType;

  // Filter Values per type
  companyFilters: CompanyFilters;
  userFilters: userFilters;
  clientFilters: ClientFilters;
  orderFilters: OrderFilters;
  deviceFilters: DeviceFilters;

  // Actions
  openFilter: (type: FilterType) => void;
  closeFilter: () => void;
  setCompanyFilter: (key: keyof CompanyFilters, value: any) => void;
  setUserFilter: (key: keyof userFilters, value: any) => void;
  setClientFilter: (key: keyof ClientFilters, value: any) => void;
  setOrderFilter: (key: keyof OrderFilters, value: any) => void;
  setDeviceFilter: (key: keyof DeviceFilters, value: any) => void;
  applyFilters: () => void;
  clearFilters: (type: FilterType) => void;
  resetAllFilters: () => void;
}

const defaultCompanyFilters: CompanyFilters = {
  status: 'active',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultuserFilters: userFilters = {
  status: undefined,
  role: undefined,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultClientFilters: ClientFilters = {
  status: 'all',
  emiStatus: 'all',
  deviceType: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultOrderFilters: OrderFilters = {
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

const defaultDeviceFilters: DeviceFilters = {
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useFilterStore = create<FilterState>((set) => ({
  isOpen: false,
  filterType: null,

  companyFilters: defaultCompanyFilters,
  userFilters: defaultuserFilters,
  clientFilters: defaultClientFilters,
  orderFilters: defaultOrderFilters,
  deviceFilters: defaultDeviceFilters,

  openFilter: (type) => set({ isOpen: true, filterType: type }),

  closeFilter: () => set({ isOpen: false }),

  setCompanyFilter: (key, value) =>
    set((state) => ({
      companyFilters: { ...state.companyFilters, [key]: value },
    })),

  setUserFilter: (key, value) =>
    set((state) => ({
      userFilters: { ...state.userFilters, [key]: value },
    })),

  setClientFilter: (key, value) =>
    set((state) => ({
      clientFilters: { ...state.clientFilters, [key]: value },
    })),

  setOrderFilter: (key, value) =>
    set((state) => ({
      orderFilters: { ...state.orderFilters, [key]: value },
    })),

  setDeviceFilter: (key, value) =>
    set((state) => ({
      deviceFilters: { ...state.deviceFilters, [key]: value },
    })),

  applyFilters: () => {
    // Close the bottom sheet
    set({ isOpen: false });
  },

  clearFilters: (type) => {
    switch (type) {
      case 'companies':
        set({ companyFilters: defaultCompanyFilters });
        break;
      case 'agents':
        set({ userFilters: defaultuserFilters });
        break;
      case 'clients':
        set({ clientFilters: defaultClientFilters });
        break;
      case 'orders':
        set({ orderFilters: defaultOrderFilters });
        break;
      case 'devices':
        set({ deviceFilters: defaultDeviceFilters });
        break;
    }
  },

  resetAllFilters: () =>
    set({
      companyFilters: defaultCompanyFilters,
      userFilters: defaultuserFilters,
      clientFilters: defaultClientFilters,
      orderFilters: defaultOrderFilters,
      deviceFilters: defaultDeviceFilters,
    }),
}));
