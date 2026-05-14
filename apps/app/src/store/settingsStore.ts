/**
 * Settings Store
 * Persists app preferences (appearance, etc.).
 *
 * Theme: Each role maps to a color palette. Users toggle dark/light.
 *   ADMIN → Red | MANAGER → Green | USER → Blue
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
    case UserRole.ADMIN:    return `admin-${mode}`;
    case UserRole.MANAGER:  return `manager-${mode}`;
    case UserRole.USER:
    default:                return `user-${mode}`;
  }
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type FontSize = 'small' | 'medium' | 'large';

export interface SettingsState {
  isDark: boolean;
  fontSize: FontSize;

  // TODO: Add app-specific settings here

  setIsDark: (dark: boolean) => void;
  setFontSize: (size: FontSize) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isDark: false,
      fontSize: 'medium',

      setIsDark: (dark) => set({ isDark: dark }),
      setFontSize: (size) => set({ fontSize: size }),
    }),
    {
      name: 'forge-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
