/**
 * Settings Store
 * Persists app preferences and role-specific business config.
 *
 * Theme: Each role has a fixed color palette. Users only toggle dark/light.
 *   SUPER_ADMIN → Red  | SUPER → Green | DISTRIBUTOR → Purple | RETAILER → Blue
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeKey } from '@forge/ui';
import { UserRole } from '../api/types';

// ─── Role → ThemeKey helper ───────────────────────────────────────────────────

export const getThemeKeyForRole = (role: UserRole, isDark: boolean): ThemeKey => {
  const mode = isDark ? 'dark' : 'light';
  switch (role) {
    case UserRole.SUPER_ADMIN:  return `superAdmin-${mode}`;
    case UserRole.SUPER:        return `super-${mode}`;
    case UserRole.DISTRIBUTOR:  return `distributor-${mode}`;
    case UserRole.RETAILER:
    default:                    return `retailer-${mode}`;
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontSize = 'small' | 'medium' | 'large';

export interface SettingsState {
  // ── Appearance ──────────────────────────────────────────────────────────────
  isDark: boolean;
  fontSize: FontSize;

  // ── SUPER business config ───────────────────────────────────────────────────
  defaultDistributorCommission: number;
  autoApproveTransfers: boolean;
  showRetailerBalancesToDistributors: boolean;

  // ── DISTRIBUTOR business config ─────────────────────────────────────────────
  defaultRetailerCommission: number;
  autoConfirmIncomingTransfers: boolean;

  // ── RETAILER business config ─────────────────────────────────────────────────
  defaultEmiPeriodMonths: number;
  autoLockDeviceWhenEmiDue: boolean;
  lockGracePeriodDays: number;

  // ── Shared (SUPER, DISTRIBUTOR, RETAILER) ────────────────────────────────────
  lowBalanceThresholdKeys: number | null;

  // ── Actions ─────────────────────────────────────────────────────────────────
  setIsDark: (dark: boolean) => void;
  setFontSize: (size: FontSize) => void;
  setDefaultDistributorCommission: (value: number) => void;
  setAutoApproveTransfers: (value: boolean) => void;
  setShowRetailerBalancesToDistributors: (value: boolean) => void;
  setDefaultRetailerCommission: (value: number) => void;
  setAutoConfirmIncomingTransfers: (value: boolean) => void;
  setDefaultEmiPeriodMonths: (value: number) => void;
  setAutoLockDeviceWhenEmiDue: (value: boolean) => void;
  setLockGracePeriodDays: (value: number) => void;
  setLowBalanceThresholdKeys: (value: number | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
  // Appearance
  isDark: true,
  fontSize: 'medium',

  // SUPER
  defaultDistributorCommission: 10,
  autoApproveTransfers: false,
  showRetailerBalancesToDistributors: false,

  // DISTRIBUTOR
  defaultRetailerCommission: 5,
  autoConfirmIncomingTransfers: true,

  // RETAILER
  defaultEmiPeriodMonths: 12,
  autoLockDeviceWhenEmiDue: true,
  lockGracePeriodDays: 7,

  // Shared
  lowBalanceThresholdKeys: 10,

  // ── Actions ──
  setIsDark: (dark) => set({ isDark: dark }),
  setFontSize: (size) => set({ fontSize: size }),
  setDefaultDistributorCommission: (value) =>
    set({ defaultDistributorCommission: value }),
  setAutoApproveTransfers: (value) => set({ autoApproveTransfers: value }),
  setShowRetailerBalancesToDistributors: (value) =>
    set({ showRetailerBalancesToDistributors: value }),
  setDefaultRetailerCommission: (value) =>
    set({ defaultRetailerCommission: value }),
  setAutoConfirmIncomingTransfers: (value) =>
    set({ autoConfirmIncomingTransfers: value }),
  setDefaultEmiPeriodMonths: (value) => set({ defaultEmiPeriodMonths: value }),
  setAutoLockDeviceWhenEmiDue: (value) => set({ autoLockDeviceWhenEmiDue: value }),
  setLockGracePeriodDays: (value) => set({ lockGracePeriodDays: value }),
  setLowBalanceThresholdKeys: (value) => set({ lowBalanceThresholdKeys: value }),
    }),
    {
      name: 'forge-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
