import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { AuditService } from './audit.service';
import { SystemHealthMonitorService } from './system-health-monitor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../../common/enums';
import { AuditLogQueryDto, AuditLogResponseDto } from './dto/audit-log-query.dto';
import { SystemHealthResponseDto } from './dto/system-health.dto';

class SetMaintenanceDto {
  @IsBoolean()
  enabled: boolean;
}

@ApiTags('Audit & Monitoring')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly healthMonitor: SystemHealthMonitorService,
  ) {}

  @Get('logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get audit logs (Super Admin only)',
    description:
      'Retrieve system audit logs with filtering and pagination. ' +
      'Tracks all user actions, system events, and data modifications.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: AuditLogResponseDto,
  })
  async getAuditLogs(
    @CurrentUser() user: User,
    @Query() query: AuditLogQueryDto,
  ): Promise<AuditLogResponseDto> {
    return this.auditService.getAuditLogs(query, user);
  }

  @Get('health')
  @Roles(UserRole.SUPER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get system health status',
    description:
      'Comprehensive system health check including database, Redis, queues, ' +
      'notification providers, and system statistics.',
  })
  @ApiResponse({
    status: 200,
    description: 'System health retrieved successfully',
    type: SystemHealthResponseDto,
  })
  async getSystemHealth(): Promise<SystemHealthResponseDto> {
    return this.auditService.getSystemHealth();
  }

  @Patch('maintenance')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Toggle maintenance mode (Super Admin only)',
    description: 'Enable or disable maintenance mode. A push notification is immediately sent to all Super Admins on change.',
  })
  @ApiBody({ type: SetMaintenanceDto })
  @ApiResponse({ status: 200, description: 'Maintenance mode updated' })
  async setMaintenance(
    @CurrentUser() _user: User,
    @Body() dto: SetMaintenanceDto,
  ): Promise<{ maintenance: boolean }> {
    await this.healthMonitor.setMaintenanceMode(dto.enabled);
    return { maintenance: dto.enabled };
  }

  @Get('maintenance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPER)
  @ApiOperation({ summary: 'Get current maintenance mode status' })
  @ApiResponse({ status: 200, description: 'Maintenance mode status' })
  getMaintenanceStatus(): { maintenance: boolean } {
    return { maintenance: this.healthMonitor.isMaintenanceMode() };
  }
}
