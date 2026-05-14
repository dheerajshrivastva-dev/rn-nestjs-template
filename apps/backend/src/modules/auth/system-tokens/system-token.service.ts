import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { SystemToken } from './system-token.entity';
import { CreateSystemTokenDto } from './dto/create-system-token.dto';
import { UpdateSystemTokenDto } from './dto/update-system-token.dto';
import { CreateSystemTokenResponseDto, SystemTokenResponseDto } from './dto/system-token-response.dto';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '../../audit/entities/audit-log.entity';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class SystemTokenService {
  private readonly logger = new Logger(SystemTokenService.name);

  constructor(
    @InjectRepository(SystemToken)
    private readonly repo: Repository<SystemToken>,
    private readonly auditService: AuditService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(
    dto: CreateSystemTokenDto,
    issuedBy: User,
    ip?: string,
  ): Promise<CreateSystemTokenResponseDto> {
    const { raw, hash, prefix } = this.generateKey();

    const token = this.repo.create({
      name: dto.name,
      description: dto.description,
      scopes: dto.scopes ?? [],
      expiresAt: dto.expiresAt ?? undefined,
      ipWhitelist: dto.ipWhitelist ?? undefined,
      keyHash: hash,
      keyPrefix: prefix,
      issuedByUserId: issuedBy.id,
      isActive: true,
    });

    const saved = await this.repo.save(token);

    void this.auditService.log({
      userId: issuedBy.id,
      userEmail: issuedBy.email,
      userRole: issuedBy.role,
      action: AuditAction.SYSTEM_TOKEN_CREATED,
      entityType: 'SystemToken',
      entityId: saved.id,
      description: `System token "${saved.name}" created`,
      newValues: { name: saved.name, scopes: saved.scopes, expiresAt: saved.expiresAt },
      ipAddress: ip,
      success: true,
    });

    const response = SystemTokenResponseDto.from(saved) as CreateSystemTokenResponseDto;
    response.key = raw;
    return response;
  }

  // ─── List ─────────────────────────────────────────────────────────────────

  async findAll(issuedByUserId?: string): Promise<SystemTokenResponseDto[]> {
    const tokens = await this.repo.find({
      where: issuedByUserId ? { issuedByUserId } : {},
      order: { createdAt: 'DESC' },
    });
    return tokens.map(SystemTokenResponseDto.from);
  }

  // ─── Get one ──────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<SystemTokenResponseDto> {
    const token = await this.findOrFail(id);
    return SystemTokenResponseDto.from(token);
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateSystemTokenDto,
    requestingUser: User,
  ): Promise<SystemTokenResponseDto> {
    const token = await this.findOrFail(id);
    this.assertOwnership(token, requestingUser);

    if (dto.name !== undefined) token.name = dto.name;
    if (dto.description !== undefined) token.description = dto.description;
    if (dto.scopes !== undefined) token.scopes = dto.scopes;
    if (dto.expiresAt !== undefined) token.expiresAt = dto.expiresAt ?? undefined;
    if (dto.ipWhitelist !== undefined) token.ipWhitelist = dto.ipWhitelist;

    const saved = await this.repo.save(token);
    return SystemTokenResponseDto.from(saved);
  }

  // ─── Revoke ───────────────────────────────────────────────────────────────

  async revoke(
    id: string,
    requestingUser: User,
    reason = 'Revoked by issuer',
    ip?: string,
  ): Promise<SystemTokenResponseDto> {
    const token = await this.findOrFail(id);
    this.assertOwnership(token, requestingUser);

    token.isActive = false;
    token.revokedAt = new Date();
    token.revokedReason = reason;

    const saved = await this.repo.save(token);

    void this.auditService.log({
      userId: requestingUser.id,
      userEmail: requestingUser.email,
      userRole: requestingUser.role,
      action: AuditAction.SYSTEM_TOKEN_REVOKED,
      entityType: 'SystemToken',
      entityId: saved.id,
      description: `System token "${saved.name}" revoked: ${reason}`,
      ipAddress: ip,
      success: true,
    });

    return SystemTokenResponseDto.from(saved);
  }

  // ─── Rotate ───────────────────────────────────────────────────────────────

  async rotate(
    id: string,
    requestingUser: User,
    ip?: string,
  ): Promise<CreateSystemTokenResponseDto> {
    const token = await this.findOrFail(id);
    this.assertOwnership(token, requestingUser);

    // Invalidate old key
    token.revokedAt = new Date();
    token.revokedReason = 'key_rotation';
    await this.repo.save(token);

    // Issue new token with same settings
    const { raw, hash, prefix } = this.generateKey();
    const newToken = this.repo.create({
      name: token.name,
      description: token.description,
      scopes: token.scopes,
      expiresAt: token.expiresAt,
      ipWhitelist: token.ipWhitelist,
      keyHash: hash,
      keyPrefix: prefix,
      issuedByUserId: token.issuedByUserId,
      isActive: true,
    });

    const saved = await this.repo.save(newToken);

    void this.auditService.log({
      userId: requestingUser.id,
      userEmail: requestingUser.email,
      userRole: requestingUser.role,
      action: AuditAction.SYSTEM_TOKEN_ROTATED,
      entityType: 'SystemToken',
      entityId: saved.id,
      description: `System token "${saved.name}" rotated (old id: ${id})`,
      metadata: { oldTokenId: id, newTokenId: saved.id },
      ipAddress: ip,
      success: true,
    });

    const response = SystemTokenResponseDto.from(saved) as CreateSystemTokenResponseDto;
    response.key = raw;
    return response;
  }

  // ─── Validate (called by ApiKeyGuard on every request) ────────────────────

  async validateKey(rawKey: string, ip?: string): Promise<SystemToken | null> {
    if (!rawKey?.startsWith('stk_live_')) return null;

    const hash = sha256(rawKey);
    const token = await this.repo.findOne({
      where: { keyHash: hash, isActive: true },
      relations: ['issuedByUser'],
    });

    if (!token) return null;
    if (token.isRevoked) return null;
    if (token.isExpired) return null;
    if (token.ipWhitelist?.length && ip && !token.ipWhitelist.includes(ip)) return null;

    // Fire-and-forget usage tracking — never block the request
    void this.repo.update(token.id, {
      lastUsedAt: new Date(),
      useCount: () => 'use_count + 1',
      lastUsedIp: ip,
    });

    return token;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private generateKey(): { raw: string; hash: string; prefix: string } {
    const raw = `stk_live_${randomBytes(32).toString('hex')}`;
    const hash = sha256(raw);
    const prefix = raw.substring(0, 16); // "stk_live_" + 7 chars
    return { raw, hash, prefix };
  }

  private async findOrFail(id: string): Promise<SystemToken> {
    const token = await this.repo.findOne({ where: { id } });
    if (!token) throw new NotFoundException(`System token ${id} not found`);
    return token;
  }

  private assertOwnership(token: SystemToken, user: User): void {
    if (token.issuedByUserId !== user.id) {
      throw new ForbiddenException('You can only manage tokens you issued');
    }
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
