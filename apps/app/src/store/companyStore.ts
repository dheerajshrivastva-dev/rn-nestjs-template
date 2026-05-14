/**
 * Company Store - Zustand
 * Manages current company state based on logged-in user's companyId
 */

import {create} from 'zustand';
import type {Company} from '../api/types';

// ============================================================================
// Store Types
// ============================================================================

interface CompanyState {
  // State
  company: Company | null;

  // Actions
  setCompany: (company: Company | null) => void;
  clearCompany: () => void;
}

// ============================================================================
// Company Store
// ============================================================================

export const useCompanyStore = create<CompanyState>((set) => ({
  // Initial state
  company: null,

  // Set company
  setCompany: (company: Company | null) => {
    set({company});
  },

  // Clear company
  clearCompany: () => {
    set({company: null});
  },
}));

// ============================================================================
// Selectors (for better performance)
// ============================================================================

export const selectCompany = (state: CompanyState) => state.company;
export const selectCompanyId = (state: CompanyState) => state.company?.id;
export const selectBaseKeyRate = (state: CompanyState) => state.company?.baseKeyRate || 0;
export const selectTaxPercentage = (state: CompanyState) => state.company?.taxPercentage || 0;

/**
 * Calculate effective rate for a user with commission
 * Rate = baseKeyRate - (baseKeyRate × commission%)
 */
export const selectEffectiveRateForUser = (commissionPercentage: number) => (state: CompanyState) => {
  const baseRate = Number(state.company?.baseKeyRate) || 0;
  return baseRate - (baseRate * commissionPercentage) / 100;
};
