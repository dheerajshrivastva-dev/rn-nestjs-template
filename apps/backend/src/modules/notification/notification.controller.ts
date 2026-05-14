import {
  Controller,
  Post,
  Delete,
  Get,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsIn, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { NotificationHelper } from './notification.helper';
import { NotificationProviderFactory } from './factories/notification-provider.factory';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../user/entities/user.entity';
import { Notification } from './entities/notification.entity';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notification-preferences';
import { UserSettings, DEFAULT_USER_SETTINGS } from './user-settings';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class NotificationPageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

class RegisterDeviceDto {
  @IsString()
  token: string;

  @IsIn(['android', 'ios'])
  platform: 'android' | 'ios';
}

class UnregisterDeviceDto {
  @IsString()
  token: string;
}

class TestPushDto {
  /** FCM device token to send to. Leave empty to send to YOUR own registered tokens. */
  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;
}

class TestNotifyDto {
  /** Target user ID. Omit to send to yourself. */
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    private readonly notificationHelper: NotificationHelper,
    private readonly providerFactory: NotificationProviderFactory,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  // ── Device Token Registration ─────────────────────────────────────────────

  /**
   * POST /notifications/register-device
   * Called by the mobile app on every login / token refresh.
   * Saves the FCM token against the authenticated user so the backend
   * can send targeted push notifications.
   */
  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  async registerDevice(
    @Request() req: { user: User },
    @Body() dto: RegisterDeviceDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      return { message: 'User not found' };
    }

    const existing: Array<{ token: string; platform: string; registeredAt: string }> =
      user.fcmTokens ?? [];

    // Avoid duplicates — remove any existing entry with the same token then re-add
    const filtered = existing.filter((t) => t.token !== dto.token);
    filtered.push({
      token: dto.token,
      platform: dto.platform,
      registeredAt: new Date().toISOString(),
    });

    // Keep at most 5 tokens per user (covers multiple devices / reinstalls)
    const trimmed = filtered.slice(-5);

    await this.userRepository.update(user.id, { fcmTokens: trimmed });

    this.logger.log(`[FCM] Registered token for user ${user.id} (${dto.platform})`);
    return { message: 'Device registered' };
  }

  /**
   * DELETE /notifications/register-device
   * Called on logout. Removes the token so the user stops receiving
   * push notifications on this device after logging out.
   */
  @Delete('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister FCM device token on logout' })
  async unregisterDevice(
    @Request() req: { user: User },
    @Body() dto: UnregisterDeviceDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      return { message: 'User not found' };
    }

    const existing: Array<{ token: string; platform: string; registeredAt: string }> =
      user.fcmTokens ?? [];

    const filtered = existing.filter((t) => t.token !== dto.token);
    await this.userRepository.update(user.id, { fcmTokens: filtered });

    this.logger.log(`[FCM] Unregistered token for user ${user.id}`);
    return { message: 'Device unregistered' };
  }

  // ── Dev-only: Test Push ───────────────────────────────────────────────────

  /**
   * POST /notifications/test-push
   * Development only. Sends a real FCM push notification so you can verify
   * the full pipeline (env var → firebase-admin → device) without the app.
   *
   * Body (all optional):
   *   token  — specific FCM token. Omit to use YOUR own registered tokens.
   *   title  — notification title (default: "Test Push")
   *   body   — notification body  (default: "FCM is working ✓")
   */
  @Post('test-push')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEV ONLY] Send a test push notification via FCM' })
  async testPush(
    @Request() req: { user: User },
    @Body() dto: TestPushDto,
  ): Promise<{ success: boolean; result: unknown }> {
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      throw new ForbiddenException('Test push is only available in development');
    }

    // Resolve tokens: use supplied token OR fall back to caller's own registered tokens
    let tokens: string[] = [];
    if (dto.token) {
      tokens = [dto.token];
    } else {
      const user = await this.userRepository.findOne({ where: { id: req.user.id } });
      tokens = (user?.fcmTokens ?? []).map((t) => t.token);
    }

    if (tokens.length === 0) {
      return {
        success: false,
        result: 'No FCM tokens found. Log in on the device first, or pass a token in the body.',
      };
    }

    const provider = this.providerFactory.getPushProvider();
    const result = await provider.sendPush({
      deviceToken: tokens,
      title: dto.title ?? 'Test Push',
      body: dto.body ?? 'FCM is working ✓',
      data: { type: 'system_alert' },
      priority: 'high',
      channelId: 'default',
    });

    this.logger.log(`[FCM] Test push → success:${result.successCount} fail:${result.failureCount}`);
    return { success: result.success, result };
  }

  /**
   * POST /notifications/test-notify
   * Development only. Runs the full pipeline: DB insert + WS emit + FCM push.
   * Use this to verify WS delivery and notification inbox in one shot.
   *
   * Body (all optional):
   *   userId — target user. Omit to notify yourself.
   *   title  — default: "Test Notification"
   *   body   — default: "WS + FCM pipeline is working ✓"
   */
  @Post('test-notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[DEV ONLY] Full pipeline test: DB + WS + FCM' })
  async testNotify(
    @Request() req: { user: User },
    @Body() dto: TestNotifyDto,
  ): Promise<{ message: string }> {
    if (this.configService.get<string>('NODE_ENV') !== 'development') {
      throw new ForbiddenException('test-notify is only available in development');
    }

    const targetUserId = dto.userId ?? req.user.id;

    await this.notificationHelper.notify(
      targetUserId,
      'system_alert',
      dto.title ?? 'Test Notification',
      dto.body ?? 'WS + FCM pipeline is working ✓',
      { source: 'test-notify' },
    );

    return { message: `Notification sent to user ${targetUserId}` };
  }

  // ── Notification Inbox ────────────────────────────────────────────────────

  /**
   * GET /notifications
   * Paginated inbox for the current user.
   */
  @Get()
  @ApiOperation({ summary: 'Get paginated notification inbox' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getNotifications(
    @Request() req: { user: User },
    @Query() query: NotificationPageDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.notificationRepository.findAndCount({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    return { items, total, page, pageSize };
  }

  /**
   * GET /notifications/unread-count
   * Number of unread notifications — used for AppBar badge.
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req: { user: User }): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { userId: req.user.id, isRead: false },
    });
    return { count };
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read.
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(
    @Request() req: { user: User },
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId: req.user.id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      await this.notificationRepository.update(id, {
        isRead: true,
        readAt: new Date(),
      });
    }

    return { message: 'Marked as read' };
  }

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read for the current user.
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Request() req: { user: User }): Promise<{ message: string }> {
    await this.notificationRepository.update(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { message: 'All notifications marked as read' };
  }

  // ── Notification Preferences ──────────────────────────────────────────────

  /**
   * GET /notifications/preferences
   * Returns the current user's notification preference settings.
   * Merges stored prefs with defaults so new categories are always present.
   */
  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences for the current user' })
  async getPreferences(
    @Request() req: { user: User },
  ): Promise<NotificationPreferences> {
    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
      select: ['id', 'notificationPreferences'],
    });

    // Merge with defaults so any new category keys are present for older rows
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(user?.notificationPreferences ?? {}) };
  }

  /**
   * PUT /notifications/preferences
   * Replaces the current user's notification preferences.
   * Merges with defaults so partial payloads are safe.
   */
  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update notification preferences for the current user' })
  async updatePreferences(
    @Request() req: { user: User },
    @Body() body: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const allowed: Array<keyof NotificationPreferences> = [
      'master',
      'orders',
      'pendingOrders',
      'keyTransfers',
      'transferRequests',
      'systemAlerts',
      'clientActivity',
      'deviceAlerts',
      'emiReminders',
      'lowBalanceAlert',
    ];

    // Strip unknown keys and validate booleans
    const sanitised: Partial<NotificationPreferences> = {};
    for (const key of allowed) {
      if (key in body) {
        if (typeof body[key] !== 'boolean') {
          throw new BadRequestException(`Preference "${key}" must be a boolean`);
        }
        (sanitised as Record<string, boolean>)[key] = body[key] as boolean;
      }
    }

    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
      select: ['id', 'notificationPreferences'],
    });

    const merged: NotificationPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user?.notificationPreferences ?? {}),
      ...sanitised,
    };

    await this.userRepository.update(req.user.id, { notificationPreferences: merged });

    this.logger.log(
      `[Preferences] Updated notification prefs for user ${req.user.id}: ${JSON.stringify(sanitised)}`,
    );

    return merged;
  }

  // ── User Settings ─────────────────────────────────────────────────────────

  /**
   * GET /notifications/user-settings
   * Returns the current user's operational settings (low balance threshold,
   * auto-lock config, etc.). Merges with defaults for forward compatibility.
   */
  @Get('user-settings')
  @ApiOperation({ summary: 'Get user operational settings' })
  async getUserSettings(@Request() req: { user: User }): Promise<UserSettings> {
    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
      select: ['id', 'userSettings'] as any,
    });
    return { ...DEFAULT_USER_SETTINGS, ...(user?.userSettings ?? {}) };
  }

  /**
   * PUT /notifications/user-settings
   * Updates the current user's operational settings (partial update, merged with defaults).
   */
  @Put('user-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user operational settings' })
  async updateUserSettings(
    @Request() req: { user: User },
    @Body() body: Partial<UserSettings>,
  ): Promise<UserSettings> {
    const sanitised: Partial<UserSettings> = {};

    if ('lowBalanceThreshold' in body) {
      const v = body.lowBalanceThreshold;
      if (v !== null && (typeof v !== 'number' || !Number.isInteger(v) || v < 0)) {
        throw new BadRequestException('lowBalanceThreshold must be a non-negative integer or null');
      }
      sanitised.lowBalanceThreshold = v ?? null;
    }
    if ('autoLockDeviceWhenEmiDue' in body) {
      if (typeof body.autoLockDeviceWhenEmiDue !== 'boolean') {
        throw new BadRequestException('autoLockDeviceWhenEmiDue must be a boolean');
      }
      sanitised.autoLockDeviceWhenEmiDue = body.autoLockDeviceWhenEmiDue;
    }
    if ('lockGracePeriodDays' in body) {
      const v = body.lockGracePeriodDays;
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 30) {
        throw new BadRequestException('lockGracePeriodDays must be an integer between 0 and 30');
      }
      sanitised.lockGracePeriodDays = v;
    }

    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
      select: ['id', 'userSettings'] as any,
    });

    const merged: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      ...(user?.userSettings ?? {}),
      ...sanitised,
    };

    await this.userRepository.update(req.user.id, { userSettings: merged } as any);

    this.logger.log(
      `[UserSettings] Updated for user ${req.user.id}: ${JSON.stringify(sanitised)}`,
    );

    return merged;
  }
}
