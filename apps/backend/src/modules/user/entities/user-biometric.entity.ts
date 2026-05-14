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
 * UserBiometric Entity
 *
 * Stores hardware-bound key-pair registrations for passwordless login.
 * One user can have multiple biometric registrations (one per device).
 *
 * Security Model:
 * - Client generates an RSA key pair via react-native-biometrics.
 *   The private key NEVER leaves the device (Android Keystore / iOS Secure Enclave).
 * - Only the PEM-encoded public key is stored here.
 * - On every login the server issues a one-time challenge; the device signs it
 *   with the private key and the server verifies the signature with the public key.
 * - Registration expires after 90 days and must be renewed.
 */
@Entity('user_biometrics')
@Index(['userId'])
@Index(['deviceFingerprint'])
@Index(['userId', 'deviceFingerprint', 'isActive'])
export class UserBiometric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ===== USER RELATIONSHIP =====
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  // ===== DEVICE BINDING =====
  // Matches DeviceInfo.getUniqueId() from react-native-device-info
  @Column({ type: 'varchar', length: 64, name: 'device_fingerprint' })
  deviceFingerprint: string;

  @Column({ type: 'varchar', length: 100, name: 'device_name', nullable: true })
  deviceName?: string;

  // ===== PUBLIC KEY =====
  // PEM-encoded RSA public key received at setup time.
  // Used to verify challenge signatures — never used to authenticate directly.
  @Column({ type: 'text', name: 'public_key' })
  publicKey: string;

  // ===== CHALLENGE =====
  // Pending one-time nonce issued by POST /auth/biometric-challenge.
  // Cleared after a successful login or on expiry.
  @Column({ type: 'varchar', length: 128, name: 'pending_challenge', nullable: true })
  pendingChallenge?: string;

  @Column({ type: 'timestamp', name: 'challenge_expires_at', nullable: true })
  challengeExpiresAt?: Date;

  // ===== LIFECYCLE =====
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date;

  @Column({ type: 'int', default: 0, name: 'use_count' })
  useCount: number;

  // ===== AUDIT =====
  @Column({ type: 'varchar', length: 45, nullable: true, name: 'setup_ip' })
  setupIp?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
