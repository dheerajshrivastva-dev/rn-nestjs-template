/**
 * Global Bottom Sheets
 * Renders all global bottom sheets once at root level
 * Prevents duplicate bottom sheet instances
 */

import React from 'react';
import { FilterBottomSheet } from './filters';
import { SessionExpiredSheet } from './SessionExpiredSheet';
import { NetworkListener } from './NetworkBanner';

/**
 * Global Bottom Sheets Component
 *
 * IMPORTANT: Render this ONCE at the root level (App.tsx or RootNavigator)
 * Do NOT render bottom sheets in individual screens
 *
 * Bottom sheets are controlled via Zustand stores:
 * - FilterBottomSheet: useFilterStore().openFilter()
 *
 * NOTE: ChangePasswordBottomSheet is NOT global - it's rendered in SettingsTab
 * because it requires user-specific props (userId, userName, userRole)
 */
export const GlobalBottomSheets: React.FC = () => {
  return (
    <>
      <FilterBottomSheet />
<SessionExpiredSheet />
      {/* Network listener — no UI, wires up NetInfo + server probe */}
      <NetworkListener />
      {/* ChangePasswordBottomSheet is rendered in SettingsTab (not global) */}
    </>
  );
};
