import {
  Controller,
  Post,
  Delete,
  Get,
  Patch,
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

class TestPushDto {
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
   * Extend to store FCM tokens in a device_tokens table (or custom User field)
   * when you add push notification support.
   */
  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  async registerDevice(
    @Request() req: { user: User },
    @Body() dto: RegisterDeviceDto,
  ): Promise<{ message: string }> {
    // TODO: store dto.token + dto.platform against req.user.id in a device_tokens table
    this.logger.log(`[FCM] Register device token for user ${req.user.id} (${dto.platform}) — implement token storage`);
    return { message: 'Device registration endpoint — wire up token storage to enable push' };
  }

  /**
   * DELETE /notifications/register-device
   * Called on logout to remove the FCM token.
   */
  @Delete('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister FCM device token on logout' })
  async unregisterDevice(
    @Request() req: { user: User },
    @Body() dto: UnregisterDeviceDto,
  ): Promise<{ message: string }> {
    // TODO: remove dto.token from device_tokens table
    this.logger.log(`[FCM] Unregister device token for user ${req.user.id} — implement token storage`);
    return { message: 'Device unregistration endpoint — wire up token storage to enable push' };
  }

  // ── Dev-only: Test Push ───────────────────────────────────────────────────

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

    if (!dto.token) {
      return {
        success: false,
        result: 'No FCM token provided. Pass a token in the body to test push delivery.',
      };
    }

    const provider = this.providerFactory.getPushProvider();
    const result = await provider.sendPush({
      deviceToken: [dto.token],
      title: dto.title ?? 'Test Push',
      body: dto.body ?? 'FCM is working ✓',
      data: { type: 'system_alert' },
      priority: 'high',
      channelId: 'default',
    });

    this.logger.log(`[FCM] Test push → success:${result.successCount} fail:${result.failureCount}`);
    return { success: result.success, result };
  }

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

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req: { user: User }): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { userId: req.user.id, isRead: false },
    });
    return { count };
  }

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
}
