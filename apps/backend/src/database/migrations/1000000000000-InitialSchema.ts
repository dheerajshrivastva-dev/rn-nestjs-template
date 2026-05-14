import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Initial schema migration.
 *
 * All status/type/role columns use varchar instead of PostgreSQL enum types.
 * This avoids ALTER TYPE migrations every time a new value is added — just
 * update the TypeScript enum and you're done. Constraints are enforced at
 * the application layer (class-validator + TypeScript enums).
 */
export class InitialSchema1000000000000 implements MigrationInterface {
  name = 'InitialSchema1000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Table: addresses ─────────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'addresses',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'street', type: 'varchar', length: '255', isNullable: true },
          { name: 'city', type: 'varchar', length: '100', isNullable: false },
          { name: 'state', type: 'varchar', length: '100', isNullable: false },
          { name: 'country', type: 'varchar', length: '100', isNullable: false },
          { name: 'postal_code', type: 'varchar', length: '20', isNullable: false },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 8, isNullable: true },
          { name: 'longitude', type: 'decimal', precision: 11, scale: 8, isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // ─── Table: users ─────────────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'first_name', type: 'varchar', length: '100', isNullable: false },
          { name: 'last_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'email', type: 'varchar', length: '255', isNullable: false, isUnique: true },
          { name: 'phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'password', type: 'varchar', length: '255', isNullable: false },
          { name: 'role', type: 'varchar', length: '50', isNullable: false, default: `'user'` },
          { name: 'status', type: 'varchar', length: '50', isNullable: false, default: `'active'` },
          { name: 'avatar_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'email_verified', type: 'boolean', isNullable: false, default: false },
          { name: 'phone_verified', type: 'boolean', isNullable: false, default: false },
          { name: 'is_2fa_enabled', type: 'boolean', isNullable: false, default: false },
          { name: 'notification_settings', type: 'jsonb', isNullable: true },
          { name: 'last_login_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('users', new TableIndex({
      name: 'idx_users_email',
      columnNames: ['email'],
      isUnique: true,
    }));
    await queryRunner.createIndex('users', new TableIndex({
      name: 'idx_users_role',
      columnNames: ['role'],
    }));
    await queryRunner.createIndex('users', new TableIndex({
      name: 'idx_users_status',
      columnNames: ['status'],
    }));

    // ─── Table: user_sessions ─────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'user_sessions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'jti', type: 'varchar', length: '100', isNullable: false, isUnique: true },
          { name: 'refresh_token_hash', type: 'text', isNullable: false },
          { name: 'token_family', type: 'varchar', length: '100', isNullable: true },
          { name: 'token_version', type: 'int', isNullable: false, default: 1 },
          { name: 'device_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'device_type', type: 'varchar', length: '50', isNullable: true },
          { name: 'os_name', type: 'varchar', length: '50', isNullable: true },
          { name: 'os_version', type: 'varchar', length: '50', isNullable: true },
          { name: 'browser_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'browser_version', type: 'varchar', length: '50', isNullable: true },
          { name: 'user_agent', type: 'text', isNullable: true },
          { name: 'device_fingerprint', type: 'varchar', length: '64', isNullable: true },
          { name: 'ip_address', type: 'varchar', length: '45', isNullable: false },
          { name: 'city', type: 'varchar', length: '100', isNullable: true },
          { name: 'region', type: 'varchar', length: '100', isNullable: true },
          { name: 'country', type: 'varchar', length: '100', isNullable: true },
          { name: 'country_code', type: 'varchar', length: '10', isNullable: true },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
          { name: 'is_trusted', type: 'boolean', isNullable: false, default: false },
          { name: 'is_current', type: 'boolean', isNullable: false, default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'last_activity_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
          { name: 'expires_at', type: 'timestamp', isNullable: true },
          { name: 'revoked_at', type: 'timestamp', isNullable: true },
          { name: 'revoked_reason', type: 'varchar', length: '100', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey('user_sessions', new TableForeignKey({
      name: 'fk_user_sessions_user',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createIndex('user_sessions', new TableIndex({
      name: 'idx_user_sessions_jti',
      columnNames: ['jti'],
      isUnique: true,
    }));
    await queryRunner.createIndex('user_sessions', new TableIndex({
      name: 'idx_user_sessions_user_active',
      columnNames: ['user_id', 'is_active'],
    }));
    await queryRunner.createIndex('user_sessions', new TableIndex({
      name: 'idx_user_sessions_fingerprint',
      columnNames: ['device_fingerprint'],
    }));
    await queryRunner.createIndex('user_sessions', new TableIndex({
      name: 'idx_user_sessions_expires',
      columnNames: ['expires_at'],
    }));

    // ─── Table: two_factor_auth ───────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'two_factor_auth',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', isNullable: false, isUnique: true },
          { name: 'primary_method', type: 'varchar', length: '20', isNullable: true },
          { name: 'is_enabled', type: 'boolean', isNullable: false, default: false },
          { name: 'totp_secret_encrypted', type: 'text', isNullable: true },
          { name: 'totp_enabled', type: 'boolean', isNullable: false, default: false },
          { name: 'totp_verified', type: 'boolean', isNullable: false, default: false },
          { name: 'totp_issuer', type: 'varchar', length: '50', isNullable: false, default: `'Demigod'` },
          { name: 'totp_digits', type: 'int', isNullable: false, default: 6 },
          { name: 'totp_period', type: 'int', isNullable: false, default: 30 },
          { name: 'backup_codes', type: 'jsonb', isNullable: true },
          { name: 'backup_codes_used', type: 'int', isNullable: false, default: 0 },
          { name: 'backup_codes_remaining', type: 'int', isNullable: false, default: 8 },
          { name: 'mobile_otp_enabled', type: 'boolean', isNullable: false, default: false },
          { name: 'mobile_otp_phone', type: 'varchar', length: '20', isNullable: true },
          { name: 'mobile_otp_phone_verified', type: 'boolean', isNullable: false, default: false },
          { name: 'mobile_otp_verified_at', type: 'timestamp', isNullable: true },
          { name: 'email_otp_fallback_enabled', type: 'boolean', isNullable: false, default: true },
          { name: 'remember_device_enabled', type: 'boolean', isNullable: false, default: true },
          { name: 'remember_device_duration_days', type: 'int', isNullable: false, default: 30 },
          { name: 'failed_totp_attempts', type: 'int', isNullable: false, default: 0 },
          { name: 'last_failed_totp_at', type: 'timestamp', isNullable: true },
          { name: 'totp_locked_until', type: 'timestamp', isNullable: true },
          { name: 'last_verified_at', type: 'timestamp', isNullable: true },
          { name: 'totp_enabled_at', type: 'timestamp', isNullable: true },
          { name: 'totp_disabled_at', type: 'timestamp', isNullable: true },
          { name: 'last_modified_ip', type: 'varchar', length: '45', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey('two_factor_auth', new TableForeignKey({
      name: 'fk_two_factor_auth_user',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createIndex('two_factor_auth', new TableIndex({
      name: 'idx_2fa_user_id',
      columnNames: ['user_id'],
      isUnique: true,
    }));

    // ─── Table: user_biometrics ───────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'user_biometrics',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'device_fingerprint', type: 'varchar', length: '64', isNullable: false },
          { name: 'device_name', type: 'varchar', length: '100', isNullable: true },
          { name: 'public_key', type: 'text', isNullable: false },
          { name: 'pending_challenge', type: 'varchar', length: '128', isNullable: true },
          { name: 'challenge_expires_at', type: 'timestamp', isNullable: true },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
          { name: 'expires_at', type: 'timestamp', isNullable: false },
          { name: 'last_used_at', type: 'timestamp', isNullable: true },
          { name: 'use_count', type: 'int', isNullable: false, default: 0 },
          { name: 'setup_ip', type: 'varchar', length: '45', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey('user_biometrics', new TableForeignKey({
      name: 'fk_user_biometrics_user',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createIndex('user_biometrics', new TableIndex({
      name: 'idx_biometrics_user_id',
      columnNames: ['user_id'],
    }));
    await queryRunner.createIndex('user_biometrics', new TableIndex({
      name: 'idx_biometrics_fingerprint',
      columnNames: ['device_fingerprint'],
    }));
    await queryRunner.createIndex('user_biometrics', new TableIndex({
      name: 'idx_biometrics_user_fp_active',
      columnNames: ['user_id', 'device_fingerprint', 'is_active'],
    }));

    // ─── Table: login_attempts ────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'login_attempts',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'identifier', type: 'varchar', length: '255', isNullable: false },
          { name: 'identifier_type', type: 'varchar', length: '20', isNullable: false },
          { name: 'ip_address', type: 'varchar', length: '45', isNullable: false },
          { name: 'country', type: 'varchar', length: '100', isNullable: true },
          { name: 'city', type: 'varchar', length: '100', isNullable: true },
          { name: 'user_agent', type: 'text', isNullable: true },
          { name: 'device_type', type: 'varchar', length: '50', isNullable: true },
          { name: 'device_fingerprint', type: 'varchar', length: '64', isNullable: true },
          { name: 'success', type: 'boolean', isNullable: false, default: false },
          { name: 'failure_reason', type: 'varchar', length: '100', isNullable: true },
          { name: 'consecutive_failures', type: 'int', isNullable: false, default: 0 },
          { name: 'was_blocked', type: 'boolean', isNullable: false, default: false },
          { name: 'block_reason', type: 'varchar', length: '50', isNullable: true },
          { name: 'is_suspicious', type: 'boolean', isNullable: false, default: false },
          { name: 'suspicion_flags', type: 'jsonb', isNullable: true },
          { name: 'latitude', type: 'decimal', precision: 10, scale: 6, isNullable: true },
          { name: 'longitude', type: 'decimal', precision: 10, scale: 6, isNullable: true },
          { name: 'was_reset', type: 'boolean', isNullable: false, default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('login_attempts', new TableIndex({
      name: 'idx_login_attempts_identifier_created',
      columnNames: ['identifier', 'created_at'],
    }));
    await queryRunner.createIndex('login_attempts', new TableIndex({
      name: 'idx_login_attempts_ip_created',
      columnNames: ['ip_address', 'created_at'],
    }));
    await queryRunner.createIndex('login_attempts', new TableIndex({
      name: 'idx_login_attempts_identifier_success_created',
      columnNames: ['identifier', 'success', 'created_at'],
    }));

    // ─── Table: system_tokens ─────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'system_tokens',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'issued_by_user_id', type: 'uuid', isNullable: false },
          { name: 'name', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'varchar', length: '500', isNullable: true },
          { name: 'key_hash', type: 'varchar', length: '64', isNullable: false, isUnique: true },
          { name: 'key_prefix', type: 'varchar', length: '16', isNullable: false },
          { name: 'scopes', type: 'jsonb', isNullable: false, default: `'[]'` },
          { name: 'expires_at', type: 'timestamptz', isNullable: true },
          { name: 'is_active', type: 'boolean', isNullable: false, default: true },
          { name: 'revoked_at', type: 'timestamptz', isNullable: true },
          { name: 'revoked_reason', type: 'varchar', length: '200', isNullable: true },
          { name: 'last_used_at', type: 'timestamptz', isNullable: true },
          { name: 'use_count', type: 'int', isNullable: false, default: 0 },
          { name: 'last_used_ip', type: 'varchar', length: '45', isNullable: true },
          { name: 'ip_whitelist', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamptz', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey('system_tokens', new TableForeignKey({
      name: 'fk_system_tokens_user',
      columnNames: ['issued_by_user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE',
    }));

    await queryRunner.createIndex('system_tokens', new TableIndex({
      name: 'idx_system_tokens_key_hash',
      columnNames: ['key_hash'],
      isUnique: true,
    }));
    await queryRunner.createIndex('system_tokens', new TableIndex({
      name: 'idx_system_tokens_user',
      columnNames: ['issued_by_user_id'],
    }));
    await queryRunner.createIndex('system_tokens', new TableIndex({
      name: 'idx_system_tokens_active',
      columnNames: ['is_active'],
    }));

    // ─── Table: audit_logs ────────────────────────────────────────────────────
    // action uses varchar — AuditAction has 40+ values and grows with the app.
    // varchar avoids ALTER TYPE on every new action.

    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', isNullable: true },
          { name: 'user_email', type: 'varchar', length: '100', isNullable: true },
          { name: 'user_role', type: 'varchar', length: '100', isNullable: true },
          { name: 'action', type: 'varchar', length: '100', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'entity_type', type: 'varchar', length: '100', isNullable: true },
          { name: 'entity_id', type: 'uuid', isNullable: true },
          { name: 'old_values', type: 'jsonb', isNullable: true },
          { name: 'new_values', type: 'jsonb', isNullable: true },
          { name: 'ip_address', type: 'varchar', length: '100', isNullable: true },
          { name: 'user_agent', type: 'varchar', length: '500', isNullable: true },
          { name: 'method', type: 'varchar', length: '100', isNullable: true },
          { name: 'endpoint', type: 'varchar', length: '500', isNullable: true },
          { name: 'success', type: 'boolean', isNullable: false, default: true },
          { name: 'error_message', type: 'varchar', length: '500', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey('audit_logs', new TableForeignKey({
      name: 'fk_audit_logs_user',
      columnNames: ['user_id'],
      referencedTableName: 'users',
      referencedColumnNames: ['id'],
      onDelete: 'SET NULL',
    }));

    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'idx_audit_user_created',
      columnNames: ['user_id', 'created_at'],
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'idx_audit_action_created',
      columnNames: ['action', 'created_at'],
    }));
    await queryRunner.createIndex('audit_logs', new TableIndex({
      name: 'idx_audit_entity',
      columnNames: ['entity_type', 'entity_id'],
    }));

    // ─── Table: otps ──────────────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'otps',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'recipient_id', type: 'uuid', isNullable: false },
          { name: 'otp_code', type: 'varchar', length: '255', isNullable: false },
          { name: 'otp_type', type: 'varchar', length: '50', isNullable: false },
          { name: 'attempt_count', type: 'int', isNullable: false, default: 0 },
          { name: 'max_attempts', type: 'int', isNullable: false, default: 5 },
          { name: 'expires_at', type: 'timestamp', isNullable: false },
          { name: 'is_used', type: 'boolean', isNullable: false, default: false },
          { name: 'used_at', type: 'timestamp', isNullable: true },
          { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
          { name: 'user_agent', type: 'text', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('otps', new TableIndex({
      name: 'idx_otps_recipient_type',
      columnNames: ['recipient_id', 'otp_type'],
    }));
    await queryRunner.createIndex('otps', new TableIndex({
      name: 'idx_otps_expires',
      columnNames: ['expires_at'],
    }));

    // ─── Table: otp_rate_limits ───────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'otp_rate_limits',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'recipient_id', type: 'uuid', isNullable: false },
          { name: 'otp_type', type: 'varchar', length: '50', isNullable: false },
          { name: 'request_count', type: 'int', isNullable: false, default: 1 },
          { name: 'window_start', type: 'timestamp', isNullable: false },
          { name: 'cooldown_until', type: 'timestamp', isNullable: true },
          { name: 'is_in_cooldown', type: 'boolean', isNullable: false, default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('otp_rate_limits', new TableIndex({
      name: 'idx_otp_rate_limits_recipient_type',
      columnNames: ['recipient_id', 'otp_type'],
    }));

    // ─── Table: notifications ─────────────────────────────────────────────────
    // No FK on user_id — notifications survive user deletion

    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'user_id', type: 'uuid', isNullable: false },
          { name: 'type', type: 'varchar', length: '64', isNullable: false },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'is_read', type: 'boolean', isNullable: false, default: false },
          { name: 'read_at', type: 'timestamp', isNullable: true, default: null },
          { name: 'data', type: 'jsonb', isNullable: true, default: null },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('notifications', new TableIndex({
      name: 'idx_notifications_user_read_created',
      columnNames: ['user_id', 'is_read', 'created_at'],
    }));

    // ─── Table: email_queue ───────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'email_queue',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'recipient_type', type: 'varchar', length: '20', isNullable: false },
          { name: 'recipient_id', type: 'uuid', isNullable: false },
          { name: 'to_email', type: 'varchar', length: '255', isNullable: false },
          { name: 'to_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'subject', type: 'varchar', length: '500', isNullable: false },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'body_html', type: 'text', isNullable: true },
          { name: 'from_email', type: 'varchar', length: '255', isNullable: false },
          { name: 'from_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'reply_to', type: 'varchar', length: '255', isNullable: true },
          { name: 'email_type', type: 'varchar', length: '50', isNullable: false },
          { name: 'status', type: 'varchar', length: '20', isNullable: false, default: `'pending'` },
          { name: 'attempt_count', type: 'int', isNullable: false, default: 0 },
          { name: 'max_attempts', type: 'int', isNullable: false, default: 3 },
          { name: 'last_attempt_at', type: 'timestamp', isNullable: true },
          { name: 'next_retry_at', type: 'timestamp', isNullable: true },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'delivered_at', type: 'timestamp', isNullable: true },
          { name: 'opened_at', type: 'timestamp', isNullable: true },
          { name: 'clicked_at', type: 'timestamp', isNullable: true },
          { name: 'provider', type: 'varchar', length: '50', isNullable: true },
          { name: 'external_id', type: 'varchar', length: '255', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'error_code', type: 'varchar', length: '50', isNullable: true },
          { name: 'attachments', type: 'jsonb', isNullable: true },
          { name: 'priority', type: 'varchar', length: '20', isNullable: false, default: `'normal'` },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('email_queue', new TableIndex({
      name: 'idx_email_queue_status',
      columnNames: ['status'],
    }));
    await queryRunner.createIndex('email_queue', new TableIndex({
      name: 'idx_email_queue_retry',
      columnNames: ['next_retry_at', 'status'],
    }));

    // ─── Table: sms_queue ─────────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'sms_queue',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'recipient_type', type: 'varchar', length: '20', isNullable: false },
          { name: 'recipient_id', type: 'uuid', isNullable: false },
          { name: 'to_phone', type: 'varchar', length: '20', isNullable: false },
          { name: 'to_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'message', type: 'text', isNullable: false },
          { name: 'sender_id', type: 'varchar', length: '20', isNullable: true },
          { name: 'sms_type', type: 'varchar', length: '20', isNullable: false },
          { name: 'template_id', type: 'varchar', length: '100', isNullable: true },
          { name: 'template_variables', type: 'jsonb', isNullable: true },
          { name: 'dlt_entity_id', type: 'varchar', length: '100', isNullable: true },
          { name: 'dlt_template_id', type: 'varchar', length: '100', isNullable: true },
          { name: 'status', type: 'varchar', length: '20', isNullable: false, default: `'pending'` },
          { name: 'attempt_count', type: 'int', isNullable: false, default: 0 },
          { name: 'max_attempts', type: 'int', isNullable: false, default: 3 },
          { name: 'last_attempt_at', type: 'timestamp', isNullable: true },
          { name: 'next_retry_at', type: 'timestamp', isNullable: true },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'delivered_at', type: 'timestamp', isNullable: true },
          { name: 'provider', type: 'varchar', length: '50', isNullable: true },
          { name: 'external_id', type: 'varchar', length: '255', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'error_code', type: 'varchar', length: '50', isNullable: true },
          { name: 'credits_used', type: 'decimal', precision: 10, scale: 4, isNullable: true },
          { name: 'priority', type: 'varchar', length: '20', isNullable: false, default: `'normal'` },
          { name: 'unicode', type: 'boolean', isNullable: false, default: false },
          { name: 'flash', type: 'boolean', isNullable: false, default: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('sms_queue', new TableIndex({
      name: 'idx_sms_queue_status',
      columnNames: ['status'],
    }));
    await queryRunner.createIndex('sms_queue', new TableIndex({
      name: 'idx_sms_queue_retry',
      columnNames: ['next_retry_at', 'status'],
    }));

    // ─── Table: push_queue ────────────────────────────────────────────────────

    await queryRunner.createTable(
      new Table({
        name: 'push_queue',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'recipient_type', type: 'varchar', length: '20', isNullable: false },
          { name: 'recipient_id', type: 'uuid', isNullable: false },
          { name: 'device_tokens', type: 'jsonb', isNullable: false },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          { name: 'body', type: 'text', isNullable: false },
          { name: 'image_url', type: 'varchar', length: '500', isNullable: true },
          { name: 'data', type: 'jsonb', isNullable: true },
          { name: 'sound', type: 'varchar', length: '50', isNullable: true },
          { name: 'badge', type: 'int', isNullable: true },
          { name: 'click_action', type: 'varchar', length: '255', isNullable: true },
          { name: 'priority', type: 'varchar', length: '10', isNullable: false, default: `'normal'` },
          { name: 'ttl', type: 'int', isNullable: true },
          { name: 'collapse_key', type: 'varchar', length: '100', isNullable: true },
          { name: 'channel_id', type: 'varchar', length: '100', isNullable: true },
          { name: 'notification_type', type: 'varchar', length: '20', isNullable: false },
          { name: 'status', type: 'varchar', length: '20', isNullable: false, default: `'pending'` },
          { name: 'attempt_count', type: 'int', isNullable: false, default: 0 },
          { name: 'max_attempts', type: 'int', isNullable: false, default: 3 },
          { name: 'last_attempt_at', type: 'timestamp', isNullable: true },
          { name: 'next_retry_at', type: 'timestamp', isNullable: true },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'delivered_at', type: 'timestamp', isNullable: true },
          { name: 'opened_at', type: 'timestamp', isNullable: true },
          { name: 'delivery_results', type: 'jsonb', isNullable: true },
          { name: 'provider', type: 'varchar', length: '50', isNullable: true },
          { name: 'external_id', type: 'varchar', length: '255', isNullable: true },
          { name: 'error_message', type: 'text', isNullable: true },
          { name: 'error_code', type: 'varchar', length: '50', isNullable: true },
          { name: 'success_count', type: 'int', isNullable: false, default: 0 },
          { name: 'failure_count', type: 'int', isNullable: false, default: 0 },
          { name: 'queue_priority', type: 'varchar', length: '20', isNullable: false, default: `'normal'` },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('push_queue', new TableIndex({
      name: 'idx_push_queue_status',
      columnNames: ['status'],
    }));
    await queryRunner.createIndex('push_queue', new TableIndex({
      name: 'idx_push_queue_retry',
      columnNames: ['next_retry_at', 'status'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order
    await queryRunner.dropTable('push_queue', true);
    await queryRunner.dropTable('sms_queue', true);
    await queryRunner.dropTable('email_queue', true);
    await queryRunner.dropTable('notifications', true);
    await queryRunner.dropTable('otp_rate_limits', true);
    await queryRunner.dropTable('otps', true);
    await queryRunner.dropTable('audit_logs', true);
    await queryRunner.dropTable('system_tokens', true);
    await queryRunner.dropTable('login_attempts', true);
    await queryRunner.dropTable('user_biometrics', true);
    await queryRunner.dropTable('two_factor_auth', true);
    await queryRunner.dropTable('user_sessions', true);
    await queryRunner.dropTable('users', true);
    await queryRunner.dropTable('addresses', true);
  }
}
