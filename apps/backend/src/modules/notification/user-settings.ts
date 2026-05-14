/**
 * User Settings — superset across all roles, stored as JSONB on the User entity.
 *
 * Shared:
 *   lowBalanceThreshold  — alert when key balance drops to/below this. null = disabled.
 *
 * RETAILER-specific (ignored for other roles):
 *   autoLockDeviceWhenEmiDue  — master switch: false means no device auto-locks for EMI.
 *   lockGracePeriodDays       — days after due date before device locks (when auto-lock on).
 */

export interface UserSettings {
  /** null = low-balance alert disabled. Relevant: SUPER, DISTRIBUTOR, RETAILER. */
  lowBalanceThreshold: number | null;
  /** RETAILER only. Default: true. */
  autoLockDeviceWhenEmiDue: boolean;
  /** RETAILER only. 0–30 days. Default: 7. */
  lockGracePeriodDays: number;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  lowBalanceThreshold: 10,
  autoLockDeviceWhenEmiDue: true,
  lockGracePeriodDays: 7,
};
