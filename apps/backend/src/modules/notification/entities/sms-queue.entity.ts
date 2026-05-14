import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationStatus, NotificationPriority } from '../../../common/enums';

@Entity('sms_queue')
export class SmsQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Recipient information
  @Column({ type: 'enum', enum: ['user', 'client', 'company', 'user'], name: 'recipient_type' })
  recipientType: 'user' | 'client' | 'company' | 'user';

  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'varchar', length: 20, name: 'to_phone' })
  toPhone: string; // E.164 format (+91XXXXXXXXXX)

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'to_name' })
  toName?: string;

  // SMS content
  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'sender_id' })
  senderId?: string; // Sender ID (e.g., 'DEMIGD')

  // SMS type
  @Column({
    type: 'enum',
    enum: ['otp', 'transactional', 'promotional', 'alert', 'reminder'],
    name: 'sms_type',
  })
  smsType: 'otp' | 'transactional' | 'promotional' | 'alert' | 'reminder';

  // Template (if using template-based SMS)
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'template_id' })
  templateId?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'template_variables' })
  templateVariables?: Record<string, any>;

  // DLT (India Distributed Ledger Technology) parameters
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'dlt_entity_id' })
  dltEntityId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'dlt_template_id' })
  dltTemplateId?: string;

  // Status and retry
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'int', default: 0, name: 'attempt_count' })
  attemptCount: number;

  @Column({ type: 'int', default: 3, name: 'max_attempts' })
  maxAttempts: number;

  @Column({ type: 'timestamp', nullable: true, name: 'last_attempt_at' })
  lastAttemptAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'next_retry_at' })
  nextRetryAt?: Date;

  // Delivery tracking
  @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'delivered_at' })
  deliveredAt?: Date;

  // Provider details
  @Column({ type: 'varchar', length: 50, nullable: true })
  provider?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'external_id' })
  externalId?: string;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'error_code' })
  errorCode?: string;

  // Credits consumed
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, name: 'credits_used' })
  creditsUsed?: number;

  // Priority
  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  // Flags
  @Column({ type: 'boolean', default: false })
  unicode: boolean; // Unicode SMS (for non-ASCII characters)

  @Column({ type: 'boolean', default: false })
  flash: boolean; // Flash SMS

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
