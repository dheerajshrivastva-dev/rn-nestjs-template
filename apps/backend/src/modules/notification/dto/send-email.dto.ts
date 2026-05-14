import { IsEmail, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EmailType, NotificationPriority } from '../../../common/enums';

export class SendEmailDto {
  @IsEnum(['user', 'client', 'company'])
  recipientType: 'user' | 'client' | 'company';

  @IsUUID()
  recipientId: string;

  @IsEmail()
  toEmail: string;

  @IsString()
  @IsOptional()
  toName?: string;

  @IsString()
  subject: string;

  @IsString()
  body: string;

  @IsString()
  @IsOptional()
  bodyHtml?: string;

  @IsEnum(EmailType)
  emailType: EmailType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsOptional()
  attachments?: any;
}
