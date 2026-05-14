import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from './user.entity';

/**
 * TwoFactorAuth Entity
 *
 * Stores 2FA configuration and secrets for multiple authentication methods.
 *
 * Supported 2FA Methods (User can choose ONE primary method):
 * 1. **TOTP** (Authenticator App): Google Authenticator, Authy, 1Password, etc.
 *    - 6-digit codes that rotate every 30 seconds
 *    - Works offline
 *    - Most secure option
 *
 * 2. **Mobile/SMS OTP**: 6-digit codes sent via SMS to phone
 *    - Requires SMS service integration
 *    - Works without app installation
 *    - Less secure than TOTP but more accessible
 *
 * 3. **Email OTP** (Fallback): 6-digit codes sent via email
 *    - Already implemented in OTP service
 *    - Can be used as backup for primary method
 *    - Least secure but most accessible
 *
 * 4. **Backup Codes** (Recovery): One-time use codes
 *    - 8 codes generated during 2FA setup
 *    - Each code can only be used once
 *    - Stored hashed in database
 *
 * Setup Flow:
 * 1. User enables 2FA in settings
 * 2. User chooses primary method: TOTP or Mobile OTP
 * 3a. If TOTP: Generate secret → Show QR code → Verify first code
 * 3b. If Mobile OTP: Verify phone → Send test OTP → Verify code
 * 4. System generates 8 backup codes
 * 5. User saves backup codes securely
 * 6. 2FA is now active
 *
 * Login Flow:
 * 1. User enters credentials
 * 2. Check if device is trusted → Skip 2FA (if enabled)
 * 3. If not trusted → Prompt for 2FA based on primary method:
 *    - If TOTP → Show authenticator code input
 *    - If Mobile OTP → Send SMS and show code input
 * 4. If primary method fails → Offer alternatives:
 *    - Backup codes
 *    - Email OTP (if enabled as fallback)
 *
 * Password Reset Flow (CRITICAL):
 * 1. User requests password reset
 * 2. Send email OTP for initial verification
 * 3. User verifies email OTP → Allowed to set new password
 * 4. **IF 2FA IS ENABLED** → Require 2FA verification AFTER setting password:
 *    - Send second OTP via primary 2FA method (TOTP or Mobile)
 *    - User must verify with 2FA code
 *    - Only then password reset is complete
 * 5. This prevents attackers from bypassing 2FA via password reset
 *
 * Security:
 * - TOTP secret is encrypted before storage (AES-256-GCM)
 * - Backup codes are hashed (bcrypt)
 * - Failed 2FA attempts are rate-limited (5 attempts per 15 min)
 * - Password reset requires 2FA if enabled (prevents bypass)
 * - Backup codes can only be used once
 */
@Entity('two_factor_auth')
@Index(['userId'])
export class TwoFactorAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ===== PRIMARY 2FA METHOD =====
  /**
   * User's chosen primary 2FA method
   * 'totp' | 'mobile_otp' | 'email_otp'
   */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'primary_method' })
  primaryMethod: string;

  /**
   * Is 2FA enabled (any method)?
   */
  @Column({ type: 'boolean', default: false, name: 'is_enabled' })
  isEnabled: boolean;

  // ===== TOTP CONFIGURATION =====
  /**
   * Encrypted TOTP secret (base32 encoded)
   * Generated during setup, never shown to user again
   * Used to generate/verify TOTP codes
   *
   * Format: base32 string (e.g., "JBSWY3DPEHPK3PXP")
   * Encryption: AES-256-GCM using app secret key
   */
  @Exclude()
  @Column({ type: 'text', name: 'totp_secret_encrypted', nullable: true })
  totpSecretEncrypted: string;

  /**
   * Is TOTP method enabled?
   */
  @Column({ type: 'boolean', default: false, name: 'totp_enabled' })
  totpEnabled: boolean;

  /**
   * Has user verified TOTP during setup?
   * Prevents enabling 2FA without successful verification
   */
  @Column({ type: 'boolean', default: false, name: 'totp_verified' })
  totpVerified: boolean;

  /**
   * TOTP configuration
   */
  @Column({ type: 'varchar', length: 50, default: 'Demigod', name: 'totp_issuer' })
  totpIssuer: string; // Shown in authenticator app

  @Column({ type: 'int', default: 6, name: 'totp_digits' })
  totpDigits: number; // 6 or 8

  @Column({ type: 'int', default: 30, name: 'totp_period' })
  totpPeriod: number; // Time step in seconds (30 is standard)

  // ===== BACKUP CODES =====
  /**
   * Backup recovery codes (hashed with bcrypt)
   * Generated as array of 8 codes during TOTP setup
   * Each code can only be used once
   *
   * Format: Array of objects
   * [
   *   { code: "$2b$10$hashed...", used: false, usedAt: null },
   *   { code: "$2b$10$hashed...", used: true, usedAt: "2024-01-15T10:30:00Z" },
   *   ...
   * ]
   */
  @Exclude()
  @Column({ type: 'jsonb', name: 'backup_codes', nullable: true })
  backupCodes: Array<{
    code: string; // Hashed with bcrypt
    used: boolean;
    usedAt: Date | null;
  }>;

  /**
   * How many backup codes have been used?
   */
  @Column({ type: 'int', default: 0, name: 'backup_codes_used' })
  backupCodesUsed: number;

  /**
   * How many backup codes remain?
   */
  @Column({ type: 'int', default: 8, name: 'backup_codes_remaining' })
  backupCodesRemaining: number;

  // ===== MOBILE/SMS OTP CONFIGURATION =====
  /**
   * Is Mobile/SMS OTP method enabled?
   */
  @Column({ type: 'boolean', default: false, name: 'mobile_otp_enabled' })
  mobileOtpEnabled: boolean;

  /**
   * Verified phone number for SMS OTP
   * Must be verified before enabling mobile OTP as primary method
   */
  @Column({ type: 'varchar', length: 20, nullable: true, name: 'mobile_otp_phone' })
  mobileOtpPhone: string;

  /**
   * Is this phone number verified?
   */
  @Column({ type: 'boolean', default: false, name: 'mobile_otp_phone_verified' })
  mobileOtpPhoneVerified: boolean;

  /**
   * When was phone verified?
   */
  @Column({ type: 'timestamp', nullable: true, name: 'mobile_otp_verified_at' })
  mobileOtpVerifiedAt: Date;

  // ===== EMAIL OTP (FALLBACK METHOD) =====
  /**
   * Can user fallback to email OTP if primary method fails?
   * Default: true (more user-friendly)
   * Can be disabled for higher security
   */
  @Column({ type: 'boolean', default: true, name: 'email_otp_fallback_enabled' })
  emailOtpFallbackEnabled: boolean;

  // ===== TRUSTED DEVICES =====
  /**
   * Should we remember trusted devices?
   * If true, user can mark devices as trusted (skip 2FA for 30 days)
   */
  @Column({ type: 'boolean', default: true, name: 'remember_device_enabled' })
  rememberDeviceEnabled: boolean;

  /**
   * How long should devices be trusted? (in days)
   */
  @Column({ type: 'int', default: 30, name: 'remember_device_duration_days' })
  rememberDeviceDurationDays: number;

  // ===== RATE LIMITING =====
  /**
   * Failed TOTP verification attempts
   * Resets on successful verification
   * After 5 failures → temporary lockout (15 minutes)
   */
  @Column({ type: 'int', default: 0, name: 'failed_totp_attempts' })
  failedTotpAttempts: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_failed_totp_at' })
  lastFailedTotpAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'totp_locked_until' })
  totpLockedUntil: Date;

  // ===== METADATA =====
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * When was TOTP last successfully verified?
   */
  @Column({ type: 'timestamp', nullable: true, name: 'last_verified_at' })
  lastVerifiedAt: Date;

  /**
   * When was TOTP first enabled?
   */
  @Column({ type: 'timestamp', nullable: true, name: 'totp_enabled_at' })
  totpEnabledAt: Date;

  /**
   * When was TOTP disabled?
   * Useful for security audit
   */
  @Column({ type: 'timestamp', nullable: true, name: 'totp_disabled_at' })
  totpDisabledAt: Date;

  /**
   * IP address when TOTP was last changed
   */
  @Column({ type: 'varchar', length: 45, nullable: true, name: 'last_modified_ip' })
  lastModifiedIp: string;
}
