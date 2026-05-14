/**
 * SMS Provider Interface
 * Defines contract for SMS sending providers (MSG91, Twilio, SNS, etc.)
 */

export interface SendSMSRequest {
  to: string; // Phone number in E.164 format
  message: string;
  senderId?: string; // Sender ID / From number
  templateId?: string; // For template-based SMS (OTP, etc.)
  templateVariables?: Record<string, any>;
  unicode?: boolean; // Support for non-ASCII characters
  flash?: boolean; // Flash SMS (appears directly on screen)
  dlt?: {
    // India DLT (Distributed Ledger Technology) parameters
    entityId?: string;
    templateId?: string;
  };
}

export interface SendSMSResponse {
  success: boolean;
  messageId: string;
  provider: string;
  externalId?: string;
  credits?: number; // Credits consumed
  error?: string;
}

export interface ISMSProvider {
  /**
   * Provider name (e.g., 'msg91', 'twilio', 'sns')
   */
  getName(): string;

  /**
   * Send an SMS
   */
  sendSMS(request: SendSMSRequest): Promise<SendSMSResponse>;

  /**
   * Send OTP (if provider has dedicated OTP API)
   */
  sendOTP?(phoneNumber: string, otp: string, templateId?: string): Promise<SendSMSResponse>;

  /**
   * Verify provider configuration
   */
  verifyConfiguration(): Promise<boolean>;

  /**
   * Get provider health status and remaining credits
   */
  getHealthStatus(): Promise<{
    healthy: boolean;
    credits?: number;
    message?: string
  }>;
}
