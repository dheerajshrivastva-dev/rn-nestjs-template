import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  ISMSProvider,
  SendSMSRequest,
  SendSMSResponse,
} from '../interfaces';

/**
 * MSG91 SMS Provider
 * Implements SMS sending via MSG91 SMS API
 * Docs: https://docs.msg91.com/p/tf9GTextN/e/sms-api
 */
@Injectable()
export class MSG91SMSProvider implements ISMSProvider {
  private readonly logger = new Logger(MSG91SMSProvider.name);
  private readonly client: AxiosInstance;
  private readonly authKey: string;
  private readonly senderId: string;
  private readonly dltEntityId: string;

  constructor(private readonly configService: ConfigService) {
    this.authKey = this.configService.get<string>('MSG91_AUTH_KEY');
    this.senderId = this.configService.get<string>('MSG91_SENDER_ID') || 'DEMIGD';
    this.dltEntityId = this.configService.get<string>('MSG91_DLT_ENTITY_ID');

    this.client = axios.create({
      baseURL: 'https://control.msg91.com/api/v5',
      headers: {
        'Content-Type': 'application/json',
        'authkey': this.authKey,
      },
      timeout: 30000,
    });

    this.logger.log('MSG91 SMS Provider initialized');
  }

  getName(): string {
    return 'msg91-sms';
  }

  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    try {
      this.logger.log(`Sending SMS via MSG91 to: ${request.to}`);

      // MSG91 expects phone number without '+'
      const phoneNumber = request.to.replace(/^\+/, '');

      const payload = {
        sender: request.senderId || this.senderId,
        route: '4', // Route 4 = Transactional
        country: '91', // India country code
        sms: [
          {
            message: request.message,
            to: [phoneNumber],
          },
        ],
        ...(request.unicode && { unicode: 1 }),
        ...(request.flash && { flash: 1 }),
        ...(request.dlt && {
          DLT_TE_ID: request.dlt.templateId,
        }),
        ...(this.dltEntityId && { DLT_Entity_ID: this.dltEntityId }),
      };

      const response = await this.client.post('/flow', payload);

      this.logger.log(`MSG91 SMS sent successfully: ${response.data.message}`);

      return {
        success: true,
        messageId: response.data.request_id || `msg91-${Date.now()}`,
        provider: this.getName(),
        externalId: response.data.request_id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS via MSG91: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: '',
        provider: this.getName(),
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async sendOTP(
    phoneNumber: string,
    otp: string,
    templateId?: string,
  ): Promise<SendSMSResponse> {
    try {
      this.logger.log(`Sending OTP via MSG91 to: ${phoneNumber}`);

      // MSG91 has dedicated OTP API
      const phone = phoneNumber.replace(/^\+/, '');

      const payload = {
        template_id: templateId || this.configService.get<string>('MSG91_OTP_TEMPLATE_ID'),
        mobile: phone,
        authkey: this.authKey,
        otp,
        ...(this.dltEntityId && { DLT_Entity_ID: this.dltEntityId }),
      };

      const response = await this.client.post('/otp', payload);

      this.logger.log(`MSG91 OTP sent successfully: ${response.data.message}`);

      return {
        success: true,
        messageId: response.data.request_id || `msg91-otp-${Date.now()}`,
        provider: this.getName(),
        externalId: response.data.request_id,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send OTP via MSG91: ${error.message}`,
        error.stack,
      );

      return {
        success: false,
        messageId: '',
        provider: this.getName(),
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async verifyConfiguration(): Promise<boolean> {
    try {
      if (!this.authKey) {
        this.logger.error('MSG91_AUTH_KEY is not configured');
        return false;
      }

      // Verify by checking balance
      const response = await this.client.get('/balance');
      this.logger.log(`MSG91 SMS balance: ${response.data.balance}`);
      return true;
    } catch (error) {
      this.logger.error(`MSG91 SMS configuration verification failed: ${error.message}`);
      return false;
    }
  }

  async getHealthStatus(): Promise<{
    healthy: boolean;
    credits?: number;
    message?: string;
  }> {
    try {
      const response = await this.client.get('/balance');
      const balance = parseFloat(response.data.balance);

      return {
        healthy: true,
        credits: balance,
        message: `MSG91 SMS - Balance: ₹${balance}`,
      };
    } catch (error) {
      return {
        healthy: false,
        message: `MSG91 SMS - Error: ${error.message}`,
      };
    }
  }
}
