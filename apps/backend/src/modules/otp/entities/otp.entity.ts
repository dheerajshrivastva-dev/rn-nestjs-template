import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OtpType } from '../../../common/enums';

@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'varchar', length: 255, name: 'otp_code' })
  otpCode: string; // Hashed with bcrypt

  @Column({
    type: 'enum',
    enum: OtpType,
    name: 'otp_type',
  })
  otpType: OtpType;

  @Column({ type: 'int', default: 0, name: 'attempt_count' })
  attemptCount: number;

  @Column({ type: 'int', default: 5, name: 'max_attempts' })
  maxAttempts: number;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false, name: 'is_used' })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'used_at' })
  usedAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('otp_rate_limits')
export class OtpRateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @Column({
    type: 'enum',
    enum: OtpType,
    name: 'otp_type',
  })
  otpType: OtpType;

  @Column({ type: 'int', default: 1, name: 'request_count' })
  requestCount: number;

  @Column({ type: 'timestamp', name: 'window_start' })
  windowStart: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'cooldown_until' })
  cooldownUntil: Date;

  @Column({ type: 'boolean', default: false, name: 'is_in_cooldown' })
  isInCooldown: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;                                                                                                                            
}
