import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EmailType, NotificationStatus, NotificationPriority } from '../../../common/enums';

@Entity('email_queue')
export class EmailQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Recipient information
  @Column({ type: 'enum', enum: ['user', 'client', 'company'], name: 'recipient_type' })
  recipientType: 'user' | 'client' | 'company';

  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  @Column({ type: 'varchar', length: 255, name: 'to_email' })
  toEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'to_name' })
  toName?: string;

  // Email content
  @Column({ type: 'varchar', length: 500 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true, name: 'body_html' })
  bodyHtml?: string;

  @Column({ type: 'varchar', length: 255, name: 'from_email' })
  fromEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'from_name' })
  fromName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'reply_to' })
  replyTo?: string;

  // Email type
  @Column({ type: 'enum', enum: EmailType, name: 'email_type' })
  emailType: EmailType;

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

  @Column({ type: 'timestamp', nullable: true, name: 'opened_at' })
  openedAt?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'clicked_at' })
  clickedAt?: Date;

  // Provider details
  @Column({ type: 'varchar', length: 50, nullable: true })
  provider?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'external_id' })
  externalId?: string;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'error_code' })
  errorCode?: string;

  // Attachments (JSON array)
  @Column({ type: 'jsonb', nullable: true })
  attachments?: any;

  // Priority
  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
