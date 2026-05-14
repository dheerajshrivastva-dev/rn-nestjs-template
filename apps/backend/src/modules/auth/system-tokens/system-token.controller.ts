import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { SystemTokenService } from './system-token.service';
import { CreateSystemTokenDto } from './dto/create-system-token.dto';
import { UpdateSystemTokenDto } from './dto/update-system-token.dto';
import {
  CreateSystemTokenResponseDto,
  SystemTokenResponseDto,
} from './dto/system-token-response.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums';
import { User } from '../../user/entities/user.entity';

@ApiTags('System Tokens')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('auth/system-tokens')
export class SystemTokenController {
  constructor(private readonly systemTokenService: SystemTokenService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a system token',
    description:
      'Creates a new API key for external system integration. The plaintext key is returned ONLY once — store it securely.',
  })
  @ApiResponse({ status: 201, type: CreateSystemTokenResponseDto })
  create(
    @Body() dto: CreateSystemTokenDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<CreateSystemTokenResponseDto> {
    return this.systemTokenService.create(dto, user, req.ip);
  }

  @Get()
  @ApiOperation({ summary: 'List all system tokens issued by the current admin' })
  @ApiResponse({ status: 200, type: [SystemTokenResponseDto] })
  findAll(@CurrentUser() user: User): Promise<SystemTokenResponseDto[]> {
    return this.systemTokenService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single system token' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: SystemTokenResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SystemTokenResponseDto> {
    return this.systemTokenService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update name, description, scopes, expiry, or IP whitelist' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: SystemTokenResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSystemTokenDto,
    @CurrentUser() user: User,
  ): Promise<SystemTokenResponseDto> {
    return this.systemTokenService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a system token (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: SystemTokenResponseDto })
  revoke(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<SystemTokenResponseDto> {
    return this.systemTokenService.revoke(id, user, 'Revoked by issuer', req.ip);
  }

  @Post(':id/rotate')
  @ApiOperation({
    summary: 'Rotate a system token',
    description:
      'Invalidates the current key and issues a new one with the same settings. New plaintext key is returned once.',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, type: CreateSystemTokenResponseDto })
  rotate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Req() req: Request,
  ): Promise<CreateSystemTokenResponseDto> {
    return this.systemTokenService.rotate(id, user, req.ip);
  }
}
