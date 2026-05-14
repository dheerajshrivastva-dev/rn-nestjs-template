import {
  Controller,
  Post,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { NotificationService } from '../notification/notification.service';
import { Public } from '../../common/decorators/public.decorator';
import { TempTokenGuard } from '../../common/guards/temp-token.guard';
import { CurrentTempUser, TempUser } from '../../common/decorators/current-temp-user.decorator';
import { OtpType } from '../../common/enums';

/**
 * OTP Controller - Handles OTP verification and resending
 * Generic controller that works for all OTP types (2FA, password reset, etc.)
 */
@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  private readonly logger = new Logger(OtpController.name);

  constructor(
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Resend OTP code
   * Works for all OTP types - type is embedded in tempToken
   * TempTokenGuard decodes the token and attaches payload to req.tempUser
   */
  // 5 resends per 15 minutes
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: 'Resend OTP code' })
  @ApiResponse({ status: 200, description: 'New OTP sent successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 400, description: 'Rate limit exceeded' })
  @Public()
  @UseGuards(TempTokenGuard)
  @Post('resend')
  async resendOtp(@CurrentTempUser() tempUser: TempUser) {
    // Extract OTP type from purpose (e.g., "otp:login_2fa" -> "login_2fa")
    const otpType = tempUser.purpose.split(':')[1] as OtpType;

    // Generate new OTP using OTP service
    const { otp, code } = await this.otpService.generateOtp(
      tempUser.sub, // recipientId
      otpType,
      10, // 10 minutes expiry
    );

    // Send OTP via email based on otpType (fire-and-forget)
    this.sendOtpEmail(tempUser.sub, otpType, code).catch((err) =>
      this.logger.error(`Failed to send OTP email on resend: ${err.message}`),
    );

    return {
      success: true,
      message: 'New OTP sent successfully',
      otpId: otp.id,
      expiresAt: otp.expiresAt,
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp: code }),
    };
  }

  private async sendOtpEmail(userId: string, otpType: OtpType, code: string): Promise<void> {
    const user = await this.otpService.findUserById(userId);
    if (!user) {
      this.logger.warn(`Cannot send OTP email: user ${userId} not found`);
      return;
    }

    switch (otpType) {
      case OtpType.EMAIL_VERIFICATION:
        await this.notificationService.sendEmailVerification(
          user.id, user.email, user.name, code,
        );
        break;
      case OtpType.PASSWORD_RESET:
        await this.notificationService.sendPasswordResetEmail(
          user.id, user.email, user.name, code,
        );
        break;
      case OtpType.LOGIN_2FA:
        await this.notificationService.send2FAEmail(
          user.id, user.email, user.name, code,
        );
        break;
      case OtpType.DEVICE_UNENROLL:
        await this.notificationService.sendDeviceUnenrollOtpEmail(
          user.id, user.email, user.name, code,
        );
        break;
      default:
        this.logger.warn(`No email handler for OTP type: ${otpType}`);
    }
  }
}
