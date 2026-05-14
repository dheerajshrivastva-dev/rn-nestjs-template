import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * User-facing notification inbox record.
 *
 * This is the persistent source of truth for all in-app notifications.
 * Separate from PushQueue (which tracks delivery mechanics).
 *
 * Every business event (order, key transfer, command ACK) creates a row here
 * so missed notifications are always retrievable when the app opens.
 */
@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Recipient user ID */
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  /**
   * Notification type — maps to NotificationType enum.
   * Stored as plain string so it's serialisable without import cycles.
   */
  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'read_at' })
  readAt: Date | null;

  /**
   * Contextual data for deep-linking.
   * e.g. { orderId, transferId, clientId, commandId, status }
   */
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, string> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
