/**
 * Email Provider Interface
 * Defines contract for email sending providers (MSG91, SendGrid, SES, etc.)
 */

export interface SendEmailRequest {
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  replyTo?: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
  templateVariables?: Record<string, any>;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
  encoding?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId: string;
  provider: string;
  externalId?: string;
  error?: string;
}

export interface IEmailProvider {
  /**
   * Provider name (e.g., 'msg91', 'sendgrid', 'ses')
   */
  getName(): string;

  /**
   * Send an email
   */
  sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;

  /**
   * Verify provider configuration (API key, credentials, etc.)
   */
  verifyConfiguration(): Promise<boolean>;

  /**
   * Get provider health status
   */
  getHealthStatus(): Promise<{ healthy: boolean; message?: string }>;
}
