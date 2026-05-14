import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // Client Management
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  CLIENT_DELETED = 'CLIENT_DELETED',
  CLIENT_DEVICE_REGISTERED = 'CLIENT_DEVICE_REGISTERED',

  // Device Operations
  DEVICE_LOCKED = 'DEVICE_LOCKED',
  DEVICE_UNLOCKED = 'DEVICE_UNLOCKED',
  DEVICE_MARKED_STOLEN = 'DEVICE_MARKED_STOLEN',
  DEVICE_UNMARKED_STOLEN = 'DEVICE_UNMARKED_STOLEN',
  DEVICE_FACTORY_RESET = 'DEVICE_FACTORY_RESET',
  LOCATION_REQUESTED = 'LOCATION_REQUESTED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  SOUND_PLAYED = 'SOUND_PLAYED',

  // Orders & Keys
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_APPROVED = 'ORDER_APPROVED',
  ORDER_REJECTED = 'ORDER_REJECTED',
  KEY_TRANSFER = 'KEY_TRANSFER',
  KEY_REQUEST_CREATED = 'KEY_REQUEST_CREATED',
  KEY_REQUEST_APPROVED = 'KEY_REQUEST_APPROVED',
  KEY_REQUEST_REJECTED = 'KEY_REQUEST_REJECTED',

  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',

  // Company Management
  COMPANY_CREATED = 'COMPANY_CREATED',
  COMPANY_UPDATED = 'COMPANY_UPDATED',
  COMPANY_STATUS_CHANGED = 'COMPANY_STATUS_CHANGED',

  // Settings
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',

  // Reports
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_EXPORTED = 'REPORT_EXPORTED',

  // Balance Reconciliation
  BALANCE_RECONCILIATION_CORRECTED = 'BALANCE_RECONCILIATION_CORRECTED',
  BALANCE_RECONCILIATION_VERIFIED = 'BALANCE_RECONCILIATION_VERIFIED',
  BALANCE_RECONCILIATION_BULK = 'BALANCE_RECONCILIATION_BULK',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Who performed the action
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'user_email' })
  userEmail: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'user_role' })
  userRole: string;

  // What action was performed
  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Which entity was affected
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'entity_type' })
  entityType: string; // 'Client', 'Order', 'User', etc.

  @Column({ type: 'uuid', nullable: true, name: 'entity_id' })
  entityId: string;

  // Before/After state (for updates)
  @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
  newValues: Record<string, any>;

  // Request metadata
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'ip_address' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  method: string; // GET, POST, PUT, DELETE

  @Column({ type: 'varchar', length: 500, nullable: true })
  endpoint: string;

  // Result
  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'error_message' })
  errorMessage: string;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
