import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Otp, OtpRateLimit } from './entities/otp.entity';
import { User } from '../user/entities/user.entity';
import { OtpType } from '../../common/enums';
import { CryptoUtil } from '../../common/utils/crypto.util';
import * as bcrypt from 'bcrypt';

/**
 * OTP Service - Handles OTP generation, verification, and rate limiting
 */
@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    @InjectRepository(OtpRateLimit)
    private readonly rateLimitRepository: Repository<OtpRateLimit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Generate and save OTP for a recipient
   * @param recipientId - User/Client ID
   * @param otpType - Purpose of OTP
   * @param expiryMinutes - OTP validity in minutes (default: 10)
   * @param ipAddress - Optional IP address
   * @param userAgent - Optional user user
   */
  async generateOtp(
    recipientId: string,
    otpType: OtpType,
    expiryMinutes: number = 10,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ otp: Otp; code: string }> {
    // Check rate limiting
    await this.checkRateLimit(recipientId, otpType);

    // Invalidate any existing pending OTPs for this recipient and type
    await this.invalidateExistingOtps(recipientId, otpType);

    // Generate 6-digit OTP
    const code = CryptoUtil.generateOTP();

    // Hash the OTP before storing
    const hashedCode = await bcrypt.hash(code, 10);

    // Calculate expiry
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Create OTP record
    const otp = this.otpRepository.create({
      recipientId,
      otpCode: hashedCode,
      otpType,
      expiresAt,
      ipAddress,
      userAgent,
      attemptCount: 0,
      maxAttempts: 5,
      isUsed: false,
    });

    const savedOtp = await this.otpRepository.save(otp);

    // Update rate limiting
    await this.updateRateLimit(recipientId, otpType);

    return { otp: savedOtp, code }; // Return plaintext code for sending via email/SMS
  }

  /**
   * Verify OTP code
   * @param recipientId - User/Client ID
   * @param otpType - Purpose of OTP
   * @param code - OTP code to verify
   */
  async verifyOtp(
    recipientId: string,
    otpType: OtpType,
    code: string,
  ): Promise<Otp> {
    // Find the latest pending OTP for this recipient and type
    const otp = await this.otpRepository.findOne({
      where: {
        recipientId,
        otpType,
        isUsed: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!otp) {
      throw new BadRequestException('No valid OTP found');
    }

    // Check if expired
    if (new Date() > otp.expiresAt) {
      throw new UnauthorizedException('OTP has expired');
    }

    // Check if max attempts reached
    if (otp.attemptCount >= otp.maxAttempts) {
      throw new UnauthorizedException('Maximum OTP attempts exceeded');
    }

    // Increment attempt count
    otp.attemptCount += 1;
    await this.otpRepository.save(otp);

    // Verify OTP code
    const isValid = await bcrypt.compare(code, otp.otpCode);

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Mark OTP as used
    otp.isUsed = true;
    otp.usedAt = new Date();
    await this.otpRepository.save(otp);

    return otp;
  }

  /**
   * Invalidate existing pending OTPs for a recipient
   */
  private async invalidateExistingOtps(
    recipientId: string,
    otpType: OtpType,
  ): Promise<void> {
    await this.otpRepository.update(
      {
        recipientId,
        otpType,
        isUsed: false,
      },
      {
        isUsed: true,
        usedAt: new Date(),
      },
    );
  }

  /**
   * Check rate limiting for OTP generation
   */
  private async checkRateLimit(
    recipientId: string,
    otpType: OtpType,
  ): Promise<void> {
    const rateLimit = await this.rateLimitRepository.findOne({
      where: {
        recipientId,
        otpType,
      },
    });

    if (!rateLimit) {
      return; // No rate limit record yet
    }

    // Check if in cooldown
    if (rateLimit.isInCooldown && rateLimit.cooldownUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (rateLimit.cooldownUntil.getTime() - Date.now()) / 60000,
      );
      throw new BadRequestException(
        `Too many OTP requests. Please try again in ${remainingMinutes} minute(s)`,
      );
    }

    // Check if window has expired (reset counter)
    const windowDuration = 15 * 60 * 1000; // 15 minutes
    if (Date.now() - rateLimit.windowStart.getTime() > windowDuration) {
      rateLimit.requestCount = 0;
      rateLimit.windowStart = new Date();
      rateLimit.isInCooldown = false;
      rateLimit.cooldownUntil = null;
      await this.rateLimitRepository.save(rateLimit);
      return;
    }

    // Check if max requests reached (5 requests per 15 minutes)
    const maxRequests = 5;
    if (rateLimit.requestCount >= maxRequests) {
      // Set cooldown for 30 minutes
      rateLimit.isInCooldown = true;
      rateLimit.cooldownUntil = new Date(Date.now() + 30 * 60 * 1000);
      await this.rateLimitRepository.save(rateLimit);

      throw new BadRequestException(
        'Too many OTP requests. Please try again in 30 minutes',
      );
    }
  }

  /**
   * Update rate limiting counter
   */
  private async updateRateLimit(
    recipientId: string,
    otpType: OtpType,
  ): Promise<void> {
    let rateLimit = await this.rateLimitRepository.findOne({
      where: {
        recipientId,
        otpType,
      },
    });

    if (!rateLimit) {
      // Create new rate limit record
      rateLimit = this.rateLimitRepository.create({
        recipientId,
        otpType,
        requestCount: 1,
        windowStart: new Date(),
        isInCooldown: false,
      });
    } else {
      rateLimit.requestCount += 1;
    }

    await this.rateLimitRepository.save(rateLimit);
  }

  /**
   * Clean up expired OTPs (run via cron job)
   */
  async cleanupExpiredOtps(): Promise<number> {
    const result = await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    return result.affected || 0;
  }

  /**
   * Return the existing valid (unexpired, unused) OTP for a recipient+type, or null.
   * Used to avoid generating a new OTP when one is still active.
   */
  async findActiveOtp(recipientId: string, otpType: OtpType): Promise<Otp | null> {
    const otp = await this.otpRepository.findOne({
      where: { recipientId, otpType, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp || new Date() > otp.expiresAt) {
      return null;
    }

    return otp;
  }

  /**
   * Find a user by their ID (used by OtpController to get email/name for notifications)
   */
  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  /**
   * Get OTP statistics for a recipient
   */
  async getOtpStats(
    recipientId: string,
  ): Promise<{
    totalGenerated: number;
    totalUsed: number;
    totalExpired: number;
    recentAttempts: number;
  }> {
    const total = await this.otpRepository.count({
      where: { recipientId },
    });

    const used = await this.otpRepository.count({
      where: { recipientId, isUsed: true },
    });

    const expired = await this.otpRepository.count({
      where: {
        recipientId,
        isUsed: false,
        expiresAt: LessThan(new Date()),
      },
    });

    const recent = await this.otpRepository.count({
      where: {
        recipientId,
        createdAt: LessThan(new Date(Date.now() - 24 * 60 * 60 * 1000)), // Last 24 hours
      },
    });

    return {
      totalGenerated: total,
      totalUsed: used,
      totalExpired: expired,
      recentAttempts: recent,
    };
  }
}
