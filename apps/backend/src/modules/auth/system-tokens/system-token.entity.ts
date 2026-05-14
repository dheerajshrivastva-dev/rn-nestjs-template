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
import { User } from '../../user/entities/user.entity';

@Entity('system_tokens')
@Index(['keyHash'], { unique: true })
@Index(['issuedByUserId'])
@Index(['isActive'])
export class SystemToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'issued_by_user_id' })
  issuedByUser: User;

  @Column({ type: 'uuid', name: 'issued_by_user_id' })
  issuedByUserId: string;

  // Human-readable label, e.g. "Zapier Integration", "CI Pipeline"
  @Column({ length: 100 })
  name: string;

  @Column({ length: 500, nullable: true })
  description?: string;

  // sha256(plaintextKey) stored as 64-char hex — never store plaintext
  @Column({ name: 'key_hash', length: 64 })
  keyHash: string;

  // First 12 chars of the plaintext key for display in admin UI, e.g. "stk_live_xK3"
  @Column({ name: 'key_prefix', length: 16 })
  keyPrefix: string;

  // Free-form permission strings, e.g. ["orders:read", "users:write"]
  @Column({ type: 'jsonb', default: [] })
  scopes: string[];

  // null = never expires
  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt?: Date;

  @Column({ length: 200, nullable: true, name: 'revoked_reason' })
  revokedReason?: string;

  // Usage telemetry — updated async, never blocks the request
  @Column({ type: 'timestamptz', nullable: true, name: 'last_used_at' })
  lastUsedAt?: Date;

  @Column({ default: 0, name: 'use_count' })
  useCount: number;

  @Column({ length: 45, nullable: true, name: 'last_used_ip' })
  lastUsedIp?: string;

  // Optional CIDR/IP whitelist, e.g. ["203.0.113.0/24", "198.51.100.5"]
  @Column({ type: 'jsonb', nullable: true, name: 'ip_whitelist' })
  ipWhitelist?: string[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  get isExpired(): boolean {
    return this.expiresAt != null && this.expiresAt < new Date();
  }

  get isRevoked(): boolean {
    return this.revokedAt != null;
  }

  get isValid(): boolean {
    return this.isActive && !this.isRevoked && !this.isExpired;
  }
}
