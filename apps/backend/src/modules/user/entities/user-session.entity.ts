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
import { User } from './user.entity';

/**
 * UserSession Entity
 *
 * Tracks active JWT refresh tokens across multiple devices.
 * Each login creates a new session with its own unique refresh token.
 *
 * Security Model:
 * 1. Each session has a unique JTI (JWT ID) - prevents hash collision issues
 * 2. Refresh token is hashed before storage (bcrypt)
 * 3. Validation uses bcrypt.compare() - handles salt automatically
 * 4. Token rotation: each refresh creates new token + invalidates old one
 * 5. No collision risk: jti ensures uniqueness even if hashes somehow collide
 *
 * Flow:
 * - User logs in from Device A → Session 1 (jti: abc123, refresh_token_hash: $2b$...)
 * - User logs in from Device B → Session 2 (jti: def456, refresh_token_hash: $2b$...)
 * - Device A refreshes → New Session 3 (jti: ghi789), Session 1 marked as rotated
 * - User can revoke Session 2 independently (logout Device B)
 */
@Entity('user_sessions')
@Index(['userId', 'isActive'])
@Index(['jti']) // Fast lookup by JWT ID
@Index(['deviceFingerprint'])
@Index(['expiresAt'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ===== TOKEN MANAGEMENT =====
  /**
   * JWT ID (jti) - UNIQUE identifier for this session's refresh token
   * Format: {timestamp}-{userId}-{random}
   * Example: 1706123456789-user-abc123-xyz789
   *
   * This ensures no two sessions can have the same jti,
   * eliminating hash collision concerns.
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  jti: string;

  /**
   * Hashed refresh token (bcrypt)
   * When validating:
   * 1. Find session by jti from JWT
   * 2. Compare using bcrypt.compare(providedToken, this.refreshTokenHash)
   *
   * This approach avoids collision issues because:
   * - jti is unique (ensured by DB constraint)
   * - We only compare within the same session (same jti)
   * - bcrypt.compare() handles salt internally
   */
  @Column({ type: 'text', name: 'refresh_token_hash' })
  refreshTokenHash: string;

  /**
   * Token family ID - groups tokens from the same original login
   * Used to detect token reuse attacks across rotations
   */
  @Column({ type: 'varchar', length: 100, name: 'token_family', nullable: true })
  tokenFamily: string;

  /**
   * Token version within this family
   * Incremented on each refresh
   */
  @Column({ type: 'int', name: 'token_version', default: 1 })
  tokenVersion: number;

  // ===== DEVICE INFORMATION =====
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'device_name' })
  deviceName: string; // e.g., "iPhone 13 Pro", "Chrome on Windows"

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'device_type' })
  deviceType: string; // 'mobile' | 'tablet' | 'desktop' | 'unknown'

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'os_name' })
  osName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'os_version' })
  osVersion: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'browser_name' })
  browserName: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'browser_version' })
  browserVersion: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string;

  /**
   * Device fingerprint - hash of device characteristics
   * Used to detect same device logging in again
   */
  @Column({ type: 'varchar', length: 64, nullable: true, name: 'device_fingerprint' })
  deviceFingerprint: string;

  // ===== NETWORK INFORMATION =====
  @Column({ type: 'varchar', length: 45, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'country_code' })
  countryCode: string;

  // ===== SESSION STATUS =====
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @Index()
  isActive: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_trusted' })
  isTrusted: boolean; // User marked device as trusted (skip 2FA for 30 days)

  @Column({ type: 'boolean', default: false, name: 'is_current' })
  isCurrent: boolean; // Is this the current request's session?

  // ===== TIMESTAMPS =====
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_activity_at' })
  lastActivityAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'revoked_at' })
  revokedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'revoked_reason' })
  revokedReason: string;
  // 'user_logout' | 'user_logout_all' | 'admin_revoked' | 'token_rotation' | 'expired' | 'suspicious_activity' | 'max_sessions_exceeded'
}
