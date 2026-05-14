import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsBoolean, IsUUID } from 'class-validator';
import { NotificationPriority } from '../../../common/enums';

export class SendSMSDto {
  @IsEnum(['user', 'client', 'company', 'user'])
  recipientType: 'user' | 'client' | 'company' | 'user';

  @IsUUID()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  toPhone: string; // E.164 format (+91XXXXXXXXXX)

  @IsString()
  @IsOptional()
  toName?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  senderId?: string;

  @IsEnum(['otp', 'transactional', 'promotional', 'alert', 'reminder'])
  smsType: 'otp' | 'transactional' | 'promotional' | 'alert' | 'reminder';

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, any>;

  @IsString()
  @IsOptional()
  dltEntityId?: string;

  @IsString()
  @IsOptional()
  dltTemplateId?: string;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsBoolean()
  @IsOptional()
  unicode?: boolean;

  @IsBoolean()
  @IsOptional()
  flash?: boolean;
}
