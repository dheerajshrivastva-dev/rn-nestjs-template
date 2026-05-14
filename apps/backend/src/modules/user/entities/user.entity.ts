import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../../common/enums';
import { DEFAULT_USER_SETTINGS, UserSettings } from '../../notification/user-settings';
import { UserSession } from './user-session.entity';
import { TwoFactorAuth } from './two-factor-auth.entity';
import { UserBiometric } from './user-biometric.entity';

@Entity('users')
@Index(['role'])
@Index(['status'])
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', example: UserRole.USER })
  @Column({
    type: 'varchar',
    length: 50,
    default: UserRole.USER,
    transformer: {
      to: (value: UserRole) => value,
      from: (value: string) => value as UserRole,
    },
  })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus', example: UserStatus.ACTIVE })
  @Column({
    type: 'varchar',
    length: 50,
    default: UserStatus.ACTIVE,
    transformer: {
      to: (value: UserStatus) => value,
      from: (value: string) => value as UserStatus,
    },
  })
  status: UserStatus;

  @Column({ type: 'varchar', length: 500, name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'boolean', name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ type: 'boolean', name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ type: 'boolean', name: 'is_2fa_enabled', default: false })
  is2FAEnabled: boolean;

  @Column({ type: 'jsonb', name: 'notification_settings', nullable: true })
  notificationSettings?: UserSettings;

  @Column({ type: 'timestamp', name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ─── Relations (auth infrastructure) ─────────────────────────────────────

  @OneToMany(() => UserSession, (session) => session.user, { cascade: true })
  sessions?: UserSession[];

  @OneToOne(() => TwoFactorAuth, (tfa) => tfa.user, { cascade: true })
  twoFactorAuth?: TwoFactorAuth;

  @OneToMany(() => UserBiometric, (biometric) => biometric.user, { cascade: true })
  biometrics?: UserBiometric[];

  // ─── Computed helpers ────────────────────────────────────────────────────

  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ');
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get effectiveNotificationSettings(): UserSettings {
    return this.notificationSettings ?? DEFAULT_USER_SETTINGS;
  }
}
