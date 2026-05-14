import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { NotificationPriority } from '../../../common/enums';

export class SendPushDto {
  @IsEnum(['user', 'client', 'company', 'user'])
  recipientType: 'user' | 'client' | 'company' | 'user';

  @IsUUID()
  recipientId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  deviceTokens: string[];

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsString()
  @IsOptional()
  sound?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  badge?: number;

  @IsString()
  @IsOptional()
  clickAction?: string;

  @IsEnum(['high', 'normal'])
  @IsOptional()
  priority?: 'high' | 'normal';

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2419200) // Max 28 days
  ttl?: number;

  @IsString()
  @IsOptional()
  collapseKey?: string;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsEnum(['alert', 'reminder', 'update', 'message', 'system'])
  notificationType: 'alert' | 'reminder' | 'update' | 'message' | 'system';

  @IsEnum(NotificationPriority)
  @IsOptional()
  queuePriority?: NotificationPriority;
}
