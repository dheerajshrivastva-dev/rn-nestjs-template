/**
 * Create User Draft Store - Zustand + AsyncStorage persist
 *
 * Persists the CreateUserScreen form state so that data survives:
 * navigating back, app crash, app reload, or leaving the screen mid-fill.
 *
 * Strategy:
 *   - RHF is the live source of truth while the screen is mounted.
 *   - This store is the persistence layer (backup) that survives unmounts.
 *   - Sync direction: RHF → Store (on every field change via watch), Store → RHF (on mount only).
 *   - Cleared on successful submission or explicit user cancel-clear action.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {UserRole} from '../api/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Mirrors CreateUserFormData from CreateUserScreen.tsx exactly.
 * Keep in sync if the Zod schema changes.
 */
export interface CreateUserDraft {
  companyId: string;
  parentUserId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  commissionPercentage: number;
  street: string;
  city: string;
  stateIso: string;
  districtIso: string;
  country: string;
  postalCode: string;
  profilePictureUrl?: string;
  /** Selected role chip — persisted separately since it's not a RHF field. */
  selectedRole: UserRole | null;
}

/** Default empty draft — matches useForm defaultValues exactly. */
const EMPTY_DRAFT: CreateUserDraft = {
  companyId: '',
  parentUserId: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  commissionPercentage: 10,
  street: '',
  city: '',
  stateIso: '',
  districtIso: '',
  country: 'India',
  postalCode: '',
  profilePictureUrl: undefined,
  selectedRole: null,
};

// ============================================================================
// Store State & Actions
// ============================================================================

interface CreateUserDraftState {
  draft: CreateUserDraft;
  _hasHydrated: boolean;
}

interface CreateUserDraftActions {
  /** Merge partial form values into the draft. */
  setDraft: (data: Partial<CreateUserDraft>) => void;
  /** Erase draft. Call after successful submission or explicit discard. */
  clearDraft: () => void;
  /** Internal — called by onRehydrateStorage once AsyncStorage read completes. */
  _setHasHydrated: (value: boolean) => void;
}

// ============================================================================
// Store
// ============================================================================

export const useCreateUserDraftStore = create<
  CreateUserDraftState & CreateUserDraftActions
>()(
  persist(
    set => ({
      draft: {...EMPTY_DRAFT},
      _hasHydrated: false,

      setDraft: data =>
        set(state => ({
          draft: {...state.draft, ...data},
        })),

      clearDraft: () =>
        set({
          draft: {...EMPTY_DRAFT},
        }),

      _setHasHydrated: value => set({_hasHydrated: value}),
    }),
    {
      name: '@forge:createUserDraft',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      onRehydrateStorage: () => state => {
        state?._setHasHydrated(true);
      },
    },
  ),
);

// ============================================================================
// Selectors
// ============================================================================

type DraftStore = CreateUserDraftState & CreateUserDraftActions;

export const selectUserDraft = (s: DraftStore) => s.draft;
export const selectUserDraftHasHydrated = (s: DraftStore) => s._hasHydrated;

/**
 * True only when the draft has meaningful data worth restoring.
 * Guards the mount reset() call to avoid overwriting a fresh form with empty values.
 */
export const selectHasUserDraft = (s: DraftStore) =>
  s.draft.name.trim().length > 0 || s.draft.email.trim().length > 0;
