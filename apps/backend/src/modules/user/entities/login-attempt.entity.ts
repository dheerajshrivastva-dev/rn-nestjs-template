import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * LoginAttempt Entity
 *
 * Tracks failed login attempts for rate limiting and security monitoring.
 *
 * Security Rules:
 * 1. After 3 failed attempts within 15 minutes → Account temporarily locked for 15 minutes
 * 2. After 5 failed attempts within 1 hour → Account locked for 1 hour
 * 3. After 10 failed attempts within 24 hours → Account suspended (requires admin unlock)
 * 4. Successful login resets the attempt counter
 *
 * Rate Limiting Strategy:
 * - Track by identifier (email/phone/userId) AND IP address
 * - Identifier-based: Prevents credential stuffing
 * - IP-based: Prevents brute force from single IP
 * - Combination: Prevents distributed attacks
 *
 * Cleanup:
 * - Old records (>30 days) auto-deleted by cron job
 * - Successful login marks previous attempts as "reset"
 */
@Entity('login_attempts')
@Index(['identifier', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
@Index(['identifier', 'success', 'createdAt'])
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ===== IDENTIFIER =====
  /**
   * User identifier used in login attempt
   * Can be: email, phone, or userId
   */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  identifier: string;

  /**
   * Type of identifier used
   */
  @Column({ type: 'varchar', length: 20, name: 'identifier_type' })
  identifierType: string; // 'email' | 'phone' | 'userId'

  // ===== NETWORK INFO =====
  @Column({ type: 'varchar', length: 45, name: 'ip_address' })
  @Index()
  ipAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  // ===== DEVICE INFO =====
  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'device_type' })
  deviceType: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'device_fingerprint' })
  deviceFingerprint: string;

  // ===== ATTEMPT DETAILS =====
  /**
   * Was this login attempt successful?
   */
  @Column({ type: 'boolean', default: false })
  @Index()
  success: boolean;

  /**
   * Failure reason if unsuccessful
   */
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'failure_reason' })
  failureReason: string;
  // 'invalid_credentials' | 'account_locked' | 'account_suspended' | '2fa_failed' | 'account_not_found'

  /**
   * How many consecutive failed attempts before this one?
   * Updated when checking if user should be locked
   */
  @Column({ type: 'int', default: 0, name: 'consecutive_failures' })
  consecutiveFailures: number;

  /**
   * Was this attempt blocked due to rate limiting?
   */
  @Column({ type: 'boolean', default: false, name: 'was_blocked' })
  wasBlocked: boolean;

  /**
   * Which rate limit rule triggered the block?
   */
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'block_reason' })
  blockReason: string;
  // '3_in_15min' | '5_in_1hour' | '10_in_24hours' | 'ip_rate_limit'

  // ===== METADATA =====
  /**
   * Was this a suspicious attempt?
   * Triggers:
   * - Login from new country
   * - Login from unusual IP
   * - Login at unusual time
   * - Rapid attempts from different IPs
   */
  @Column({ type: 'boolean', default: false, name: 'is_suspicious' })
  isSuspicious: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'suspicion_flags' })
  suspicionFlags: string[]; // ['new_country', 'unusual_ip', 'rapid_attempts', 'credential_stuffing']

  /**
   * Geolocation data (for suspicious activity detection)
   */
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  // ===== TIMESTAMP =====
  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  /**
   * If this was a failed attempt that was later followed by success,
   * mark it as "reset" for cleanup purposes
   */
  @Column({ type: 'boolean', default: false, name: 'was_reset' })
  wasReset: boolean;
}
