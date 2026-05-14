import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import {
  ISMSProvider,
  SendSMSRequest,
  SendSMSResponse,
} from '../interfaces';

/**
 * Twilio SMS Provider
 * Implements SMS sending via Twilio API
 * Docs: https://www.twilio.com/docs/sms/api
 */
@Injectable()
export class TwilioSMSProvider implements ISMSProvider {
  private readonly logger = new Logger(TwilioSMSProvider.name);
  private readonly client: Twilio;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    this.accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER');

    if (this.accountSid && this.authToken) {
      this.client = new Twilio(this.accountSid, this.authToken);
      this.logger.log('Twilio SMS Provider initialized');
    } else {
      this.logger.warn('Twilio credentials not configured');
    }
  }

  getName(): string {
    return 'twilio';
  }

  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    try {
      this.logger.log(`Sending SMS via Twilio to: ${request.to}`);

      const message = await this.client.messages.create({
        body: request.message,
        from: request.senderId || this.fromNumber,
        to: request.to, // Twilio expects E.164 format (+1234567890)
      });

      this.logger.log(`Twilio SMS sent successfully: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
        provider: this.getName(),
        externalId: message.sid,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS via Twilio: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: '',
        provider: this.getName(),
        error: error.message,
      };
    }
  }

  async sendOTP(
    phoneNumber: string,
    otp: string,
    templateId?: string,
  ): Promise<SendSMSResponse> {
    // Twilio doesn't have dedicated OTP API, use regular SMS
    return this.sendSMS({
      to: phoneNumber,
      message: `Your OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    });
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.accountSid || !this.authToken || !this.fromNumber) {
        this.logger.error('Twilio credentials not configured');
        return false;
      }

      // Verify by fetching account info
      await this.client.api.accounts(this.accountSid).fetch();
      this.logger.log('Twilio configuration verified');
      return true;
    } catch (error) {
      this.logger.error(`Twilio configuration verification failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<{
    healthy: boolean;
    credits?: number;
    message?: string;
  }> {
    try {
      const account = await this.client.api.accounts(this.accountSid).fetch();

      return {
        healthy: account.status === 'active',
        message: `Twilio - Status: ${account.status}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Twilio - Error: ${error.message}`,
      };
    }
  }
}
