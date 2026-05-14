import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationStatus, NotificationPriority } from '../../../common/enums';

@Entity('push_queue')
export class PushQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Recipient information
  @Column({ type: 'enum', enum: ['user', 'client', 'company', 'user'], name: 'recipient_type' })
  recipientType: 'user' | 'client' | 'company' | 'user';

  @Column({ type: 'uuid', name: 'recipient_id' })
  recipientId: string;

  // Device tokens (can be multiple)
  @Column({ type: 'jsonb', name: 'device_tokens' })
  deviceTokens: string[]; // Array of FCM/APNS tokens

  // Push notification content
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
  imageUrl?: string;

  // Custom data payload
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  // Notification settings
  @Column({ type: 'varchar', length: 50, nullable: true })
  sound?: string;

  @Column({ type: 'int', nullable: true })
  badge?: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'click_action' })
  clickAction?: string; // Deep link or screen to open

  @Column({ type: 'varchar', length: 20, default: 'normal' })
  priority: 'high' | 'normal';

  @Column({ type: 'int', nullable: true })
  ttl?: number; // Time to live in seconds

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'collapse_key' })
  collapseKey?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'channel_id' })
  channelId?: string; // Android notification channel

  // Notification type
  @Column({
    type: 'enum',
    enum: ['alert', 'reminder', 'update', 'message', 'system'],
    name: 'notification_type',
  })
  notificationType: 'alert' | 'reminder' | 'update' | 'message' | 'system';

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

  // Delivery results (per device token)
  @Column({ type: 'jsonb', nullable: true, name: 'delivery_results' })
  deliveryResults?: Array<{
    deviceToken: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;

  // Provider details
  @Column({ type: 'varchar', length: 50, nullable: true })
  provider?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'external_id' })
  externalId?: string;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'error_code' })
  errorCode?: string;

  // Success/failure counts
  @Column({ type: 'int', default: 0, name: 'success_count' })
  successCount: number;

  @Column({ type: 'int', default: 0, name: 'failure_count' })
  failureCount: number;

  // Queue priority
  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
    name: 'queue_priority',
  })
  queuePriority: NotificationPriority;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
