import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createVerify } from 'crypto';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';


import { User } from '../user/entities/user.entity';
import { UserSession } from '../user/entities/user-session.entity';
import { LoginAttempt } from '../user/entities/login-attempt.entity';
import { TwoFactorAuth } from '../user/entities/two-factor-auth.entity';
import { UserBiometric } from '../user/entities/user-biometric.entity';
import { UserStatus, OtpType } from '../../common/enums';
import { OtpService } from '../otp/otp.service';
import { NotificationService } from '../notification/notification.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';
import { LoginDto } from './dto/login.dto';
import { DeviceInfoDto } from './dto/device-info.dto';
import {
  BiometricSetupDto,
  BiometricSetupResponseDto,
  BiometricChallengeDto,
  BiometricChallengeResponseDto,
  BiometricLoginDto,
} from './dto/biometric.dto';
import { GeoIpService } from './geo-ip.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(LoginAttempt)
    private readonly loginAttemptRepository: Repository<LoginAttempt>,
    @InjectRepository(TwoFactorAuth)
    private readonly twoFactorAuthRepository: Repository<TwoFactorAuth>,
    @InjectRepository(UserBiometric)
    private readonly biometricRepository: Repository<UserBiometric>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly geoIpService: GeoIpService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Generate JWT tokens with session tracking
   */
  async generateTokens(user: User, deviceInfo: DeviceInfoDto) {
    // Generate unique JTI for this session
    const jti = `${Date.now()}-${user.id}-${randomBytes(16).toString('hex')}`;
    const tokenFamily = `family-${Date.now()}-${randomBytes(8).toString('hex')}`;

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') ||
        '15m') as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti, tokenVersion: 1 },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
          '7d') as any,
      },
    );

    // Hash refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    const refreshExpiryMs = this.parseJwtExpiry(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    ) * 1000;
    const newExpiresAt = new Date(Date.now() + refreshExpiryMs);

    // If the same device fingerprint already has an active session, reuse it
    // instead of creating a duplicate entry
    const existingSession = deviceInfo.deviceFingerprint
      ? await this.sessionRepository.findOne({
          where: {
            userId: user.id,
            deviceFingerprint: deviceInfo.deviceFingerprint,
            isActive: true,
          },
        })
      : null;

    if (existingSession) {
      await this.sessionRepository.update(existingSession.id, {
        jti,
        refreshTokenHash: hashedRefreshToken,
        tokenFamily,
        tokenVersion: 1,
        ipAddress: deviceInfo.ipAddress || existingSession.ipAddress,
        expiresAt: newExpiresAt,
        revokedAt: null,
        revokedReason: null,
      });
    } else {
      // Enforce max 10 active sessions — evict oldest if over limit
      await this.enforceSessionLimit(user.id, this.configService.get<number>('AUTH_MAX_SESSIONS') || 10);

      await this.sessionRepository.save({
        userId: user.id,
        jti,
        refreshTokenHash: hashedRefreshToken,
        tokenFamily,
        tokenVersion: 1,
        ...deviceInfo,
        ipAddress: deviceInfo.ipAddress || '0.0.0.0',
        isActive: true,
        expiresAt: newExpiresAt,
      });
    }

    // Update user metadata
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: deviceInfo.ipAddress,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  /**
   * Login with rate limiting
   */
  async login(loginDto: LoginDto) {
    const { email, phone, userId, password, deviceInfo } = loginDto;

    // 1. Validate input
    if (!(email || phone || userId) || !password) {
      throw new BadRequestException('Invalid credentials');
    }

    const identifier = email || phone || userId;

    // 2. Check rate limiting
    await this.checkRateLimit(identifier, deviceInfo?.ipAddress || "0.0.0.0");

    // 3. Find user
    const whereCondition: any = {};
    if (email) whereCondition.email = email;
    else if (phone) whereCondition.phone = phone;
    else if (userId) whereCondition.userId = userId;

    const user = await this.userRepository.findOne({
      where: whereCondition,
      relations: ['company'],
    });

    if (!user) {
      await this.logFailedAttempt(identifier, deviceInfo, 'account_not_found');
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.logFailedAttempt(identifier, deviceInfo, 'invalid_credentials', user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // 5. Check user status
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Account pending approval');
    }

    if (user.status === UserStatus.SUSPENDED) {
      // Notify user their account is suspended (fire-and-forget)
      this.notificationService
        .sendAccountSuspendedEmail(user.id, user.email, user.name)
        .catch(() => {});
      throw new UnauthorizedException('Account suspended');
    }

    // 6. Log successful attempt and check for suspicious location
    await this.logSuccessfulAttempt(identifier, deviceInfo, user);

    // 7. Check if 2FA enabled
    if (user.twoFactorEnabled) {
      return this.initiate2FA(user, deviceInfo);
    }

    // 8. Audit: successful login (fire-and-forget)
    this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.LOGIN,
      description: `User logged in from ${deviceInfo?.deviceName || 'Unknown device'} (${deviceInfo?.ipAddress || 'unknown IP'})`,
      entityType: 'User',
      entityId: user.id,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      metadata: {
        deviceName: deviceInfo?.deviceName,
        deviceType: deviceInfo?.deviceType,
        osName: deviceInfo?.osName,
        city: deviceInfo?.city,
        country: deviceInfo?.country,
        method: '2fa_skipped',
      },
    }).catch(() => {});

    // 9. Generate tokens (no 2FA)
    return this.generateTokens(user, deviceInfo);
  }

  /**
   * Initiate 2FA verification based on user's primary method
   * @private
   */
  private async initiate2FA(user: User, deviceInfo: DeviceInfoDto) {
    // Load 2FA configuration
    const twoFactorAuth = await this.twoFactorAuthRepository.findOne({
      where: { userId: user.id },
    });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      // 2FA not properly configured, fallback to no 2FA
      return this.generateTokens(user, deviceInfo);
    }

    const primaryMethod = twoFactorAuth.primaryMethod;

    // Check if device is trusted (skip 2FA)
    if (twoFactorAuth.rememberDeviceEnabled && deviceInfo.deviceFingerprint) {
      const trustedSession = await this.sessionRepository.findOne({
        where: {
          userId: user.id,
          deviceFingerprint: deviceInfo.deviceFingerprint,
          isTrusted: true,
          isActive: true,
        },
      });

      if (trustedSession && trustedSession.expiresAt > new Date()) {
        // Device is trusted and not expired, skip 2FA
        return this.generateTokens(user, deviceInfo);
      }
    }

    // Handle different 2FA methods
    if (primaryMethod === 'totp') {
      // TOTP (Authenticator App) - No OTP generation needed
      // User will manually enter code from their app
      const tempToken = this.jwtService.sign(
        {
          sub: user.id,
          purpose: `otp:totp_2fa`, // Must start with "otp:" for TempTokenGuard
          method: 'totp',
          deviceInfo,
        },
        { expiresIn: '10m' },
      );

      return {
        tempToken,
        twoFactorRequired: true,
        primaryMethod: 'totp',
        message: 'Enter code from your authenticator app',
        allowBackupCodes: true,
        allowEmailFallback: twoFactorAuth.emailOtpFallbackEnabled,
      };
    } else if (primaryMethod === 'mobile_otp') {
      // Mobile/SMS OTP - Generate and send SMS
      const { otp, code } = await this.otpService.generateOtp(
        user.id,
        OtpType.LOGIN_2FA,
        10, // 10 minutes expiry
      );

      // TODO: Implement SMS sending service
      // await this.smsService.send2FASMS(twoFactorAuth.mobileOtpPhone, code);

      const tempToken = this.jwtService.sign(
        {
          sub: user.id,
          purpose: `otp:${OtpType.LOGIN_2FA}`,
          otpId: otp.id,
          deviceInfo,
        },
        { expiresIn: '10m' },
      );

      return {
        tempToken,
        twoFactorRequired: true,
        primaryMethod: 'mobile_otp',
        message: `2FA code sent to ${this.maskPhone(twoFactorAuth.mobileOtpPhone)}`,
        otpSent: true,
        allowBackupCodes: true,
        allowEmailFallback: twoFactorAuth.emailOtpFallbackEnabled,
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp: code }),
      };
    } else {
      // Email OTP (default/fallback)
      const { otp, code } = await this.otpService.generateOtp(
        user.id,
        OtpType.LOGIN_2FA,
        10, // 10 minutes expiry
      );

      await this.notificationService.send2FAEmail(
        user.id,
        user.email,
        user.name,
        code,
        10,
      );

      const tempToken = this.jwtService.sign(
        {
          sub: user.id,
          purpose: `otp:${OtpType.LOGIN_2FA}`,
          otpId: otp.id,
          deviceInfo,
        },
        { expiresIn: '10m' },
      );

      return {
        tempToken,
        twoFactorRequired: true,
        primaryMethod: 'email_otp',
        message: '2FA code sent to your email',
        otpSent: true,
        allowBackupCodes: false, // Email OTP has no backup codes — recovery is admin-assisted
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp: code }),
      };
    }
  }

  /**
   * Mask phone number for privacy
   * Example: +919876543210 -> +91****3210
   * @private
   */
  private maskPhone(phone: string): string {
    if (!phone) return '';
    const length = phone.length;
    if (length <= 6) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(length - 4);
  }

  /**
   * Complete 2FA login — verifies OTP internally then issues tokens
   */
  async complete2FALogin(userId: string, otp: string, deviceInfo: DeviceInfoDto) {
    // Verify OTP first (throws if invalid/expired)
    await this.otpService.verifyOtp(userId, OtpType.LOGIN_2FA, otp);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Audit: successful login via 2FA (fire-and-forget)
    this.auditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.LOGIN,
      description: `User logged in via 2FA from ${deviceInfo?.deviceName || 'Unknown device'} (${deviceInfo?.ipAddress || 'unknown IP'})`,
      entityType: 'User',
      entityId: user.id,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      metadata: {
        deviceName: deviceInfo?.deviceName,
        deviceType: deviceInfo?.deviceType,
        osName: deviceInfo?.osName,
        city: deviceInfo?.city,
        country: deviceInfo?.country,
        method: '2fa',
      },
    }).catch(() => {});

    // Generate real tokens
    return this.generateTokens(user, deviceInfo);
  }

  /**
   * Check rate limiting via Redis counters (fast, no DB queries)
   */
  private async checkRateLimit(identifier: string, ipAddress: string) {
    const [f15m, f1h, f24h, fIp] = await Promise.all([
      this.redis.get(`login:${identifier}:15m`),
      this.redis.get(`login:${identifier}:1h`),
      this.redis.get(`login:${identifier}:24h`),
      this.redis.get(`login:ip:${ipAddress}:5m`),
    ]);

    if (Number(f24h) >= (this.configService.get<number>('AUTH_RL_LONG_THRESHOLD') || 10)) {
      throw new UnauthorizedException(
        'Account suspended due to multiple failed attempts. Contact support.',
      );
    }
    if (Number(f1h) >= (this.configService.get<number>('AUTH_RL_MID_THRESHOLD') || 5)) {
      throw new UnauthorizedException(
        'Account locked for 1 hour due to multiple failed attempts.',
      );
    }
    if (Number(f15m) >= (this.configService.get<number>('AUTH_RL_SHORT_THRESHOLD') || 3)) {
      throw new UnauthorizedException(
        'Account temporarily locked. Try again in 15 minutes.',
      );
    }
    if (Number(fIp) >= (this.configService.get<number>('AUTH_RL_IP_THRESHOLD') || 10)) {
      throw new UnauthorizedException(
        'Too many attempts from this device. Try again in 15 minutes.',
      );
    }
  }

  /** Parse JWT expiry strings like '15m', '7d', '3600s' to seconds */
  private parseJwtExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // fallback 15 minutes
    const value = parseInt(match[1], 10);
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * multipliers[match[2]];
  }

  /**
   * Blocklist all active JTIs for a user in Redis, then return the session IDs
   * so the caller can bulk-update the DB in one shot.
   */
  private async blocklistAllActiveSessions(userId: string): Promise<string[]> {
    const sessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
    });
    if (sessions.length === 0) return [];

    const pipe = this.redis.pipeline();
    for (const s of sessions) {
      const ttl = Math.max(1, Math.ceil((s.expiresAt.getTime() - Date.now()) / 1000));
      pipe.setex(`blocklist:${s.jti}`, ttl, '1');
    }
    await pipe.exec();

    return sessions.map((s) => s.id);
  }

  /**
   * Increment Redis rate-limit counters after a failed login attempt
   */
  private async incrementRateLimitCounters(identifier: string, ipAddress: string) {
    const shortW = this.configService.get<number>('AUTH_RL_SHORT_WINDOW_SECS') || 15 * 60;
    const midW   = this.configService.get<number>('AUTH_RL_MID_WINDOW_SECS')   || 60 * 60;
    const longW  = this.configService.get<number>('AUTH_RL_LONG_WINDOW_SECS')  || 24 * 60 * 60;
    const ipW    = this.configService.get<number>('AUTH_RL_IP_WINDOW_SECS')    || 5 * 60;

    const pipe = this.redis.pipeline();
    pipe.incr(`login:${identifier}:15m`);  pipe.expire(`login:${identifier}:15m`, shortW);
    pipe.incr(`login:${identifier}:1h`);   pipe.expire(`login:${identifier}:1h`,  midW);
    pipe.incr(`login:${identifier}:24h`);  pipe.expire(`login:${identifier}:24h`, longW);
    pipe.incr(`login:ip:${ipAddress}:5m`); pipe.expire(`login:ip:${ipAddress}:5m`, ipW);
    await pipe.exec();
  }

  /**
   * Log failed login attempt and send lockout email when threshold is crossed
   */
  private async logFailedAttempt(
    identifier: string,
    deviceInfo: DeviceInfoDto,
    failureReason: string,
    user?: User,
  ) {
    const shortWindowMs = (this.configService.get<number>('AUTH_RL_SHORT_WINDOW_SECS') || 15 * 60) * 1000;
    const recentFailures = await this.loginAttemptRepository.count({
      where: {
        identifier,
        success: false,
        createdAt: MoreThan(new Date(Date.now() - shortWindowMs)),
      },
    });

    await this.loginAttemptRepository.save({
      identifier,
      identifierType: this.getIdentifierType(identifier),
      ...deviceInfo,
      success: false,
      failureReason,
      consecutiveFailures: recentFailures + 1,
    });

    // Increment Redis rate-limit counters (fire-and-forget, non-blocking)
    this.incrementRateLimitCounters(identifier, deviceInfo?.ipAddress || '0.0.0.0').catch(() => {});

    // Send lockout email exactly when threshold is crossed (not on every attempt)
    if (user && user.email) {
      const newCount = recentFailures + 1;
      const shortT = this.configService.get<number>('AUTH_RL_SHORT_THRESHOLD') || 3;
      const midT   = this.configService.get<number>('AUTH_RL_MID_THRESHOLD')   || 5;
      const longT  = this.configService.get<number>('AUTH_RL_LONG_THRESHOLD')  || 10;
      const shortW = this.configService.get<number>('AUTH_RL_SHORT_WINDOW_SECS') || 15 * 60;
      const midW   = this.configService.get<number>('AUTH_RL_MID_WINDOW_SECS')   || 60 * 60;
      const longW  = this.configService.get<number>('AUTH_RL_LONG_WINDOW_SECS')  || 24 * 60 * 60;
      let lockReason: string | null = null;
      let unlocksAt: Date | null = null;

      if (newCount === shortT) {
        lockReason = 'Too many failed login attempts';
        unlocksAt = new Date(Date.now() + shortW * 1000);
      } else if (newCount === midT) {
        lockReason = 'Repeated failed login attempts';
        unlocksAt = new Date(Date.now() + midW * 1000);
      } else if (newCount === longT) {
        lockReason = 'Excessive failed login attempts — account suspended';
        unlocksAt = new Date(Date.now() + longW * 1000);
      }

      if (lockReason && unlocksAt) {
        this.notificationService
          .sendAccountLockedEmail(user.id, user.email, user.name, lockReason, unlocksAt)
          .catch(() => {});
      }
    }

  }

  /**
   * Log successful login attempt and detect suspicious location changes
   */
  private async logSuccessfulAttempt(
    identifier: string,
    deviceInfo: DeviceInfoDto,
    user?: User,
  ) {
    // Resolve location: prefer GPS from app, fall back to IP geolocation
    const ip = deviceInfo?.ipAddress;
    const geoFromIp = ip ? this.geoIpService.lookup(ip) : null;

    const latitude = deviceInfo?.latitude ?? geoFromIp?.latitude ?? null;
    const longitude = deviceInfo?.longitude ?? geoFromIp?.longitude ?? null;
    const city = deviceInfo?.city || geoFromIp?.city || null;
    const country = deviceInfo?.country || geoFromIp?.country || null;

    // Save the login attempt with resolved location
    const savedAttempt = await this.loginAttemptRepository.save({
      identifier,
      identifierType: this.getIdentifierType(identifier),
      ...deviceInfo,
      latitude,
      longitude,
      city,
      country,
      success: true,
      consecutiveFailures: 0,
    });

    // Mark previous failures as reset
    await this.loginAttemptRepository.update(
      { identifier, success: false, wasReset: false },
      { wasReset: true },
    );

    // Clear short-window Redis counters on successful login
    this.redis.del(`login:${identifier}:15m`, `login:${identifier}:1h`).catch(() => {});

    // Check for suspicious location change (fire-and-forget)
    if (user?.email) {
      this.detectSuspiciousLocation(user, savedAttempt.id, {
        latitude,
        longitude,
        city,
        country,
        deviceInfo,
      }).catch(() => {});
    }
  }

  /**
   * Compare current login location against the last successful login.
   * Sends a security alert email if the location has changed significantly.
   */
  private async detectSuspiciousLocation(
    user: User,
    currentAttemptId: string,
    current: {
      latitude: number | null;
      longitude: number | null;
      city: string | null;
      country: string | null;
      deviceInfo: DeviceInfoDto;
    },
  ) {
    // Fetch the last successful login before this one
    const lastAttempt = await this.loginAttemptRepository.findOne({
      where: { identifier: user.email || user.phone, success: true },
      order: { createdAt: 'DESC' },
      // Skip the current attempt we just saved
    });

    if (!lastAttempt || lastAttempt.id === currentAttemptId) {
      return; // First login or only attempt — nothing to compare
    }

    let isSuspicious = false;

    // Prefer GPS distance check (precise, 20km radius)
    if (
      current.latitude !== null &&
      current.longitude !== null &&
      lastAttempt.latitude &&
      lastAttempt.longitude
    ) {
      const distKm = this.geoIpService.distanceKm(
        lastAttempt.latitude,
        lastAttempt.longitude,
        current.latitude,
        current.longitude,
      );
      if (distKm > 20) {
        isSuspicious = true;
      }
    } else if (current.country && lastAttempt.country) {
      // Fallback: flag if country changed
      if (current.country !== lastAttempt.country) {
        isSuspicious = true;
      }
    }

    if (!isSuspicious) return;

    // Mark this attempt as suspicious
    await this.loginAttemptRepository.update(currentAttemptId, {
      isSuspicious: true,
      suspicionFlags: ['new_location'],
    });

    // Build readable location string
    const locationParts = [current.city, current.country].filter(Boolean);
    const loginLocation =
      locationParts.length > 0 ? locationParts.join(', ') : current.deviceInfo?.ipAddress || 'Unknown';

    const deviceLabel = [
      current.deviceInfo?.deviceName,
      current.deviceInfo?.osName,
    ]
      .filter(Boolean)
      .join(' · ') || 'Unknown device';

    // Send alert email (fire-and-forget)
    this.notificationService
      .sendSuspiciousLoginEmail(
        user.id,
        user.email,
        user.name,
        loginLocation,
        deviceLabel,
        current.deviceInfo?.ipAddress || 'Unknown',
      )
      .catch(() => {});
  }

  /**
   * Determine identifier type
   */
  private getIdentifierType(identifier: string): string {
    if (identifier.includes('@')) return 'email';
    if (identifier.startsWith('+')) return 'phone';
    return 'userId';
  }

  /**
   * Refresh access token with token rotation
   */
  async refreshTokens(oldRefreshToken: string) {
    // Decode token
    const decoded = this.jwtService.decode(oldRefreshToken) as any;
    const jti = decoded?.jti;

    if (!jti) {
      throw new UnauthorizedException('Invalid token format');
    }

    // Find session
    const session = await this.sessionRepository.findOne({
      where: { jti, isActive: true },
      relations: ['user'],
    });

    if (!session) {
      throw new UnauthorizedException('Session not found or expired');
    }

    // Check expiry
    if (session.expiresAt && session.expiresAt < new Date()) {
      await this.sessionRepository.update(session.id, {
        isActive: false,
        revokedReason: 'expired',
      });
      throw new UnauthorizedException('Session expired');
    }

    // Verify token
    const isValid = await bcrypt.compare(
      oldRefreshToken,
      session.refreshTokenHash,
    );

    if (!isValid) {
      // Token reuse detected — blocklist all JTIs in the family, then revoke them
      const familySessions = await this.sessionRepository.find({
        where: { tokenFamily: session.tokenFamily, isActive: true },
      });
      if (familySessions.length > 0) {
        const pipe = this.redis.pipeline();
        for (const s of familySessions) {
          const ttl = Math.max(1, Math.ceil((s.expiresAt.getTime() - Date.now()) / 1000));
          pipe.setex(`blocklist:${s.jti}`, ttl, '1');
        }
        await pipe.exec();
      }
      await this.sessionRepository.update(
        { tokenFamily: session.tokenFamily },
        { isActive: false, revokedReason: 'token_reuse' },
      );
      throw new UnauthorizedException(
        'Token reuse detected - all sessions terminated',
      );
    }

    // Generate new tokens with rotation
    const newJti = `${Date.now()}-${session.userId}-${randomBytes(16).toString('hex')}`;
    const payload = {
      sub: session.userId,
      email: session.user.email,
      role: session.user.role,
      jti: newJti,
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') ||
        '15m') as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: session.userId, jti: newJti, tokenVersion: session.tokenVersion + 1 },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
          '7d') as any,
      },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // Blocklist old JTI for its remaining access-token lifetime, then rotate
    const accessExpirySecs = this.parseJwtExpiry(
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m',
    );
    await this.redis.setex(`blocklist:${session.jti}`, accessExpirySecs, '1');

    // Mark old session as rotated
    await this.sessionRepository.update(session.id, {
      isActive: false,
      revokedReason: 'token_rotation',
    });

    // Create new session
    await this.sessionRepository.save({
      userId: session.userId,
      jti: newJti,
      refreshTokenHash: hashedRefreshToken,
      tokenFamily: session.tokenFamily, // Keep same family
      tokenVersion: session.tokenVersion + 1,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      osName: session.osName,
      osVersion: session.osVersion,
      browserName: session.browserName,
      browserVersion: session.browserVersion,
      userAgent: session.userAgent,
      deviceFingerprint: session.deviceFingerprint,
      ipAddress: session.ipAddress,
      city: session.city,
      region: session.region,
      country: session.country,
      countryCode: session.countryCode,
      isActive: true,
      isTrusted: session.isTrusted,
      expiresAt: new Date(Date.now() + this.parseJwtExpiry(
        this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
      ) * 1000),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        status: session.user.status,
      },
    };
  }

  /**
   * Logout (revoke current session)
   */
  async logout(userId: string, jti: string) {
    const session = await this.sessionRepository.findOne({
      where: { userId, jti, isActive: true },
    });

    if (session) {
      // Blocklist JTI in Redis so the token is rejected immediately
      const ttl = Math.max(1, Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000));
      await this.redis.setex(`blocklist:${jti}`, ttl, '1');

      await this.sessionRepository.update(session.id, {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'user_logout',
      });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    await this.blocklistAllActiveSessions(userId);

    await this.sessionRepository.update(
      { userId, isActive: true },
      {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'user_logout_all',
      },
    );

    // Audit: logout all (fire-and-forget)
    this.auditService.log({
      userId,
      userEmail: user?.email,
      userRole: user?.role,
      action: AuditAction.LOGOUT,
      description: `User logged out from all devices`,
      entityType: 'User',
      entityId: userId,
      metadata: { logoutAll: true },
    }).catch(() => {});

    return { message: 'Logged out from all devices' };
  }

  /**
   * Enforce a max of 10 active sessions per user.
   * Revokes the oldest session(s) when the limit is reached.
   */
  private async enforceSessionLimit(userId: string, limit = 10): Promise<void> {
    const activeSessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'ASC' },
    });

    if (activeSessions.length >= limit) {
      const toRevoke = activeSessions.slice(0, activeSessions.length - limit + 1);
      const pipe = this.redis.pipeline();
      for (const s of toRevoke) {
        const ttl = Math.max(1, Math.ceil((s.expiresAt.getTime() - Date.now()) / 1000));
        pipe.setex(`blocklist:${s.jti}`, ttl, '1');
      }
      await pipe.exec();
      await this.sessionRepository
        .createQueryBuilder()
        .update()
        .set({
          isActive: false,
          revokedAt: new Date(),
          revokedReason: 'max_sessions_exceeded',
        })
        .whereInIds(toRevoke.map((s) => s.id))
        .execute();
    }
  }

  /**
   * List all active sessions for a user
   * Marks the current session with isCurrent flag
   */
  async getSessions(userId: string, currentJti: string) {
    const now = new Date();

    // Lazily clean up expired sessions
    await this.sessionRepository
      .createQueryBuilder()
      .update()
      .set({ isActive: false, revokedAt: now, revokedReason: 'expired' })
      .where('user_id = :userId AND is_active = true AND expires_at < :now', { userId, now })
      .execute();

    const sessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActivityAt: 'DESC' },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      deviceType: s.deviceType,
      osName: s.osName,
      osVersion: s.osVersion,
      browserName: s.browserName,
      ipAddress: s.ipAddress,
      city: s.city,
      country: s.country,
      isTrusted: s.isTrusted,
      isCurrent: s.jti === currentJti,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
      expiresAt: s.expiresAt,
    }));
  }

  /**
   * Revoke a specific session by ID (user can only revoke their own sessions)
   */
  async revokeSession(userId: string, sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId, isActive: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const ttl = Math.max(1, Math.ceil((session.expiresAt.getTime() - Date.now()) / 1000));
    await this.redis.setex(`blocklist:${session.jti}`, ttl, '1');

    await this.sessionRepository.update(sessionId, {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: 'user_logout',
    });

    return { message: 'Session revoked' };
  }

  /**
   * Logout all other sessions except the current one
   */
  async revokeOtherSessions(userId: string, currentJti: string) {
    const sessions = await this.sessionRepository.find({
      where: { userId, isActive: true },
    });

    const otherSessions = sessions.filter((s) => s.jti !== currentJti);

    if (otherSessions.length === 0) {
      return { message: 'No other active sessions', revokedCount: 0 };
    }

    // Blocklist all other JTIs in Redis
    const pipe = this.redis.pipeline();
    for (const s of otherSessions) {
      const ttl = Math.max(1, Math.ceil((s.expiresAt.getTime() - Date.now()) / 1000));
      pipe.setex(`blocklist:${s.jti}`, ttl, '1');
    }
    await pipe.exec();

    await this.sessionRepository
      .createQueryBuilder()
      .update()
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'user_logout_all',
      })
      .whereInIds(otherSessions.map((s) => s.id))
      .execute();

    return { message: `Logged out from ${otherSessions.length} other device(s)`, revokedCount: otherSessions.length };
  }

  /**
   * Initiate forgot password flow
   * Generates OTP and sends password reset email
   */
  async forgotPassword(email: string) {
    this.logger.log(`[forgotPassword] Request received for email: ${email}`);

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`[forgotPassword] No user found for email: ${email} — returning generic response`);
      return {
        message:
          'If an account with that email exists, you will receive a password reset email',
      };
    }

    this.logger.log(`[forgotPassword] User found: id=${user.id} status=${user.status}`);

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      this.logger.warn(`[forgotPassword] User ${user.id} is suspended`);
      throw new UnauthorizedException('Your account has been suspended.');
    }

    // Generate OTP
    const { otp, code } = await this.otpService.generateOtp(
      user.id,
      OtpType.PASSWORD_RESET,
      10, // 10 minutes expiry
    );
    this.logger.log(`[forgotPassword] OTP generated: otpId=${otp.id} for userId=${user.id}`);

    // Send password reset email
    this.logger.log(`[forgotPassword] Queuing password reset email to: ${user.email}`);
    const emailResult = await this.notificationService.sendPasswordResetEmail(
      user.id,
      user.email,
      user.name,
      code,
      10,
    );
    this.logger.log(`[forgotPassword] Email queued: emailQueueId=${emailResult.id} status=${emailResult.status}`);

    // Generate temp token for reset password flow
    const tempToken = this.jwtService.sign(
      {
        sub: user.id,
        purpose: `otp:${OtpType.PASSWORD_RESET}`,
        otpId: otp.id,
      },
      { expiresIn: '10m' },
    );

    this.logger.log(`[forgotPassword] Flow complete for userId=${user.id} — tempToken issued`);

    return {
      tempToken,
      message:
        'If an account with that email exists, you will receive a password reset email',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp: code }),
    };
  }

  /**
   * Reset password using OTP
   * Verifies OTP and updates password
   * Invalidates all sessions
   */
  async resetPassword(userId: string, otp: string, newPassword: string) {
    // Verify OTP
    await this.otpService.verifyOtp(userId, OtpType.PASSWORD_RESET, otp);

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.update(user.id, {
      password: hashedPassword,
    });

    // Blocklist all active JTIs then invalidate sessions
    await this.blocklistAllActiveSessions(user.id);
    await this.sessionRepository.update(
      { userId: user.id, isActive: true },
      { isActive: false, revokedReason: 'password_reset' },
    );

    return {
      message: 'Password reset successfully. Please login with your new password.',
    };
  }

  /**
   * Change user password
   * Invalidates all sessions except current one
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    // Find user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.userRepository.update(userId, {
      password: hashedPassword,
    });

    // Blocklist all active JTIs then invalidate sessions
    await this.blocklistAllActiveSessions(userId);
    await this.sessionRepository.update(
      { userId, isActive: true },
      { isActive: false, revokedReason: 'password_change' },
    );

    return {
      message: 'Password changed successfully. Please login again.',
    };
  }

  // ============================================================================
  // Biometric Authentication
  // ============================================================================

  /**
   * Register a device's hardware-bound public key for biometric login.
   * The client generates an RSA key pair via react-native-biometrics;
   * the private key stays in Secure Enclave / Keystore — only the public key is sent here.
   */
  async setupBiometric(
    userId: string,
    dto: BiometricSetupDto,
    ipAddress: string,
  ): Promise<BiometricSetupResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Deactivate any existing biometric record for this device
    await this.biometricRepository.update(
      { userId, deviceFingerprint: dto.deviceFingerprint, isActive: true },
      { isActive: false },
    );

    const biometricExpiryDays = this.configService.get<number>('BIOMETRIC_EXPIRY_DAYS') || 90;
    const expiresAt = new Date(Date.now() + biometricExpiryDays * 24 * 60 * 60 * 1000);

    await this.biometricRepository.save(
      this.biometricRepository.create({
        userId,
        deviceFingerprint: dto.deviceFingerprint,
        deviceName: dto.deviceName,
        publicKey: dto.publicKey,
        isActive: true,
        expiresAt,
        setupIp: ipAddress,
        useCount: 0,
      }),
    );

    return {
      deviceFingerprint: dto.deviceFingerprint,
      expiresAt: expiresAt.toISOString(),
      message: 'Biometric login set up successfully',
    };
  }

  /**
   * Issue a short-lived random challenge for the given device.
   * The client must sign it with its hardware-bound private key within 2 minutes.
   */
  async getBiometricChallenge(dto: BiometricChallengeDto): Promise<BiometricChallengeResponseDto> {
    if (!(dto.userId || dto.email || dto.phone) || !dto.deviceFingerprint) {
      throw new BadRequestException('Invalid challenge request');
    }

    const whereCondition: any = {};
    if (dto.email) whereCondition.email = dto.email;
    else if (dto.phone) whereCondition.phone = dto.phone;
    else if (dto.userId) whereCondition.userId = dto.userId;

    const user = await this.userRepository.findOne({ where: whereCondition });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const biometric = await this.biometricRepository.findOne({
      where: { userId: user.id, deviceFingerprint: dto.deviceFingerprint, isActive: true },
    });
    if (!biometric) throw new UnauthorizedException('Biometric not registered for this device');

    const challenge = randomBytes(32).toString('hex');

    // Store challenge in Redis with configurable TTL instead of Postgres columns
    const challengeTtl = this.configService.get<number>('BIOMETRIC_CHALLENGE_TTL_SECS') || 120;
    await this.redis.setex(`biometric:challenge:${biometric.id}`, challengeTtl, challenge);

    return { challenge };
  }

  /**
   * Verify a biometric login by checking the RSA signature against the stored
   * public key and the previously issued challenge.
   * Returns the same shape as login() — either accessToken or tempToken for 2FA.
   */
  async biometricLogin(dto: BiometricLoginDto) {
    if (!(dto.userId || dto.email || dto.phone) || !dto.deviceFingerprint || !dto.challenge || !dto.signature) {
      throw new BadRequestException('Invalid biometric login request');
    }

    const whereCondition: any = {};
    if (dto.email) whereCondition.email = dto.email;
    else if (dto.phone) whereCondition.phone = dto.phone;
    else if (dto.userId) whereCondition.userId = dto.userId;

    const user = await this.userRepository.findOne({ where: whereCondition, relations: ['company'] });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status === UserStatus.INACTIVE) throw new UnauthorizedException('Account pending approval');
    if (user.status === UserStatus.SUSPENDED) throw new UnauthorizedException('Account suspended');

    const biometric = await this.biometricRepository.findOne({
      where: { userId: user.id, deviceFingerprint: dto.deviceFingerprint, isActive: true },
    });
    if (!biometric) throw new UnauthorizedException('Biometric not registered for this device');

    // Check registration expiry
    if (biometric.expiresAt < new Date()) {
      await this.biometricRepository.update(biometric.id, { isActive: false });
      throw new UnauthorizedException('Biometric registration expired. Please sign in with your password and set up biometric login again.');
    }

    // Validate challenge from Redis (2-minute TTL handles expiry automatically)
    const storedChallenge = await this.redis.get(`biometric:challenge:${biometric.id}`);
    if (!storedChallenge || storedChallenge !== dto.challenge) {
      throw new UnauthorizedException('Invalid or expired challenge. Please try again.');
    }

    // Verify RSA signature: client signed the challenge with its private key.
    // react-native-biometrics returns a raw base64-DER (PKCS#8) key with no headers.
    // Node's crypto requires PEM, so strip any accidental whitespace/headers and
    // re-wrap into a valid -----BEGIN PUBLIC KEY----- block.
    const rawKey = biometric.publicKey.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, '');
    const pemKey = `-----BEGIN PUBLIC KEY-----\n${rawKey.match(/.{1,64}/g)!.join('\n')}\n-----END PUBLIC KEY-----`;
    const verifier = createVerify('SHA256');
    verifier.update(dto.challenge);
    const signatureValid = verifier.verify(pemKey, dto.signature, 'base64');
    if (!signatureValid) throw new UnauthorizedException('Invalid biometric signature');

    // Consume the challenge from Redis (prevents replay)
    await this.redis.del(`biometric:challenge:${biometric.id}`);

    await this.biometricRepository.update(biometric.id, {
      lastUsedAt: new Date(),
      useCount: biometric.useCount + 1,
    });

    const deviceInfo: DeviceInfoDto = dto.deviceInfo || { deviceFingerprint: dto.deviceFingerprint, deviceType: 'mobile' };

    // Biometric is a strong second factor (enrolled post-2FA), so bypass 2FA entirely.
    return this.generateTokens(user, deviceInfo);
  }

  /**
   * List all active biometric registrations for a user (one per enrolled device).
   */
  async listBiometrics(userId: string) {
    const records = await this.biometricRepository.find({
      where: { userId, isActive: true },
      order: { lastUsedAt: 'DESC' },
      select: ['id', 'deviceFingerprint', 'deviceName', 'lastUsedAt', 'useCount', 'expiresAt', 'setupIp', 'createdAt'],
    });
    return records;
  }

  /**
   * Revoke biometric registration for a specific device.
   * Called from settings when user disables quick login.
   */
  async revokeBiometric(userId: string, deviceFingerprint: string): Promise<void> {
    await this.biometricRepository.update(
      { userId, deviceFingerprint, isActive: true },
      { isActive: false },
    );
  }
}
