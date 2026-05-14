import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemToken } from '../system-token.entity';

export class SystemTokenResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ description: 'First 12 chars of the token — for identification only' })
  keyPrefix: string;
  @ApiProperty({ type: [String] }) scopes: string[];
  @ApiProperty() isActive: boolean;
  @ApiProperty() useCount: number;
  @ApiPropertyOptional() expiresAt?: Date;
  @ApiPropertyOptional() revokedAt?: Date;
  @ApiPropertyOptional() revokedReason?: string;
  @ApiPropertyOptional() lastUsedAt?: Date;
  @ApiPropertyOptional() lastUsedIp?: string;
  @ApiPropertyOptional({ type: [String] }) ipWhitelist?: string[];
  @ApiProperty() issuedByUserId: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static from(token: SystemToken): SystemTokenResponseDto {
    const dto = new SystemTokenResponseDto();
    dto.id = token.id;
    dto.name = token.name;
    dto.description = token.description;
    dto.keyPrefix = token.keyPrefix;
    dto.scopes = token.scopes;
    dto.isActive = token.isActive;
    dto.useCount = token.useCount;
    dto.expiresAt = token.expiresAt;
    dto.revokedAt = token.revokedAt;
    dto.revokedReason = token.revokedReason;
    dto.lastUsedAt = token.lastUsedAt;
    dto.lastUsedIp = token.lastUsedIp;
    dto.ipWhitelist = token.ipWhitelist;
    dto.issuedByUserId = token.issuedByUserId;
    dto.createdAt = token.createdAt;
    dto.updatedAt = token.updatedAt;
    return dto;
  }
}

export class CreateSystemTokenResponseDto extends SystemTokenResponseDto {
  @ApiProperty({
    description:
      'The plaintext API key. Shown ONLY once at creation — store it securely. Cannot be recovered.',
    example: 'stk_live_a3f8c2d...',
  })
  key: string;
}
