import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Patch,
  Query,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Complete2FADto } from './dto/complete-2fa.dto';
import {
  BiometricSetupDto,
  BiometricChallengeDto,
  BiometricLoginDto,
  BiometricRevokeDto,
} from './dto/biometric.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import { TempTokenGuard } from '../../common/guards/temp-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CurrentTempUser,
  TempUser,
} from '../../common/decorators/current-temp-user.decorator';
import { User } from '../user/entities/user.entity';
import { Request, Response } from 'express';
import { DeviceInfoInterceptor } from '../../common/interceptors/device-info.interceptor';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly configService: ConfigService) {}

  // 5 attempts per 15 minutes
  @Throttle({ default: { limit: 15, ttl: 15 * 60 * 1000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Public()
  @UseInterceptors(DeviceInfoInterceptor)
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Check if 2FA is required (result has tempToken instead of accessToken)
    if ('tempToken' in result) {
      // 2FA required - set temp token cookie for web clients
      this.setTempTokenCookie(res, result.tempToken);
      return result;
    }

    // Set HTTP-only cookies for web clients
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Also return tokens in response body for mobile/API clients
    return result;
  }

  @ApiOperation({
    summary: 'Complete 2FA login — verifies OTP and issues tokens atomically',
    description: `Accepts the OTP code alongside the temp token. OTP verification is internal — there is no separate /otp/verify step for 2FA login.

    Mobile apps can send the tempToken via:
    1. Authorization header: "Bearer <tempToken>" (recommended)
    2. Request body: { "tempToken": "<tempToken>" }

    Web clients can use cookies automatically.`,
  })
  @ApiResponse({ status: 200, description: '2FA login completed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid temp token or OTP' })
  @ApiBearerAuth('JWT-auth')
  @Public()
  @UseGuards(TempTokenGuard)
  @Post('complete-2fa')
  async complete2FA(
    @Body() body: Complete2FADto,
    @CurrentTempUser() tempUser: TempUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract deviceInfo from temp token
    const deviceInfo = (tempUser as any).deviceInfo || {
      ipAddress: '0.0.0.0',
      deviceName: 'Unknown',
      deviceType: 'unknown',
    };

    // Verify OTP internally and issue tokens atomically
    const result = await this.authService.complete2FALogin(tempUser.sub, body.otp, deviceInfo);

    // Clear temp token cookie (for web clients)
    res.clearCookie('temp_token');

    // Set HTTP-only cookies after successful 2FA (for web clients)
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return result;
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

    const result = await this.authService.refreshTokens(refreshToken);

    // Update cookies with new tokens
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return result;
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired token' })
  @HttpCode(200)
  @Post('logout')
  async logout(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract JTI from access token
    const accessToken = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
    const decoded = this.authService['jwtService'].decode(accessToken) as any;
    const jti = decoded?.jti;

    await this.authService.logout(user.id, jti);

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Logged out successfully' };
  }

  // ============================================================================
  // Registration & Approval
  // ============================================================================

  // 10 registrations per hour per IP
  @Throttle({ default: { limit: 10, ttl: 60 * 60 * 1000 } })
  @ApiOperation({
    summary: 'Register a new account',
    description:
      'Creates a USER-role account with `status: pending_approval`.\n\n' +
      'The user **cannot log in** until a MANAGER (authority 50) or ADMIN (authority 100) approves the account via `PATCH /auth/approve/:userId`.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registration submitted — awaiting approval',
    schema: {
      example: {
        message: 'Registration successful. Your account is pending approval.',
        userId: 'a1b2c3d4-...',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Public()
  @HttpCode(201)
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List users pending approval',
    description:
      'Returns pending registrations the current user has authority to approve.\n\n' +
      '**Authority map:** `ADMIN=100`, `MANAGER=50`, `USER=0`\n\n' +
      'Only users whose role authority is strictly less than the actor\'s authority are returned.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending users',
    schema: {
      example: [
        {
          id: 'a1b2c3d4-...',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '+919876543210',
          role: 'user',
          createdAt: '2026-05-15T10:00:00.000Z',
        },
      ],
    },
  })
  @Get('pending-users')
  async listPendingUsers(@CurrentUser() user: User) {
    return this.authService.listPendingUsers(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Approve a pending user',
    description:
      'Sets the user\'s status to `active`, allowing them to log in.\n\n' +
      '**Authority map:** `ADMIN=100`, `MANAGER=50`, `USER=0`\n\n' +
      'Actor\'s authority must be strictly greater than the target\'s role authority.',
  })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'ID of the user to approve' })
  @ApiResponse({
    status: 200,
    description: 'User approved and activated',
    schema: { example: { message: 'User approved successfully', userId: 'a1b2c3d4-...' } },
  })
  @ApiResponse({ status: 403, description: 'Insufficient authority' })
  @ApiResponse({ status: 400, description: 'User is not in pending_approval status' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(200)
  @Patch('approve/:userId')
  async approveUser(@CurrentUser() user: User, @Param('userId') userId: string) {
    return this.authService.approvePendingUser(user.id, userId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Reject a pending user',
    description:
      'Sets the user\'s status to `inactive`. The user cannot log in.\n\n' +
      'Actor\'s authority must be strictly greater than the target\'s role authority.',
  })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'ID of the user to reject' })
  @ApiResponse({
    status: 200,
    description: 'User rejected',
    schema: { example: { message: 'User rejected', userId: 'a1b2c3d4-...' } },
  })
  @ApiResponse({ status: 403, description: 'Insufficient authority' })
  @ApiResponse({ status: 400, description: 'User is not in pending_approval status' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(200)
  @Patch('reject/:userId')
  async rejectUser(
    @CurrentUser() user: User,
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.authService.rejectPendingUser(user.id, userId, body.reason);
  }

  // NOTE: For user profile, use GET /api/v1/users/me instead
  // This endpoint follows REST principles and SOLID design

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Old password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(200)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  /**
   * Helper method to convert time strings (e.g., '15m', '7d') to milliseconds
   */
  private parseTimeToMs(timeStr: string): number {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers = {
      s: 1000,           // seconds
      m: 60 * 1000,      // minutes
      h: 60 * 60 * 1000, // hours
      d: 24 * 60 * 60 * 1000, // days
    };

    return value * multipliers[unit];
  }

  /**
   * Helper method to set authentication cookies
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const accessExpiration = this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
    const refreshExpiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    // Access token cookie (default: 15 minutes)
    res.cookie('access_token', accessToken, {
      httpOnly: true, // Cannot be accessed via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: this.parseTimeToMs(accessExpiration),
    });

    // Refresh token cookie (default: 7 days)
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.parseTimeToMs(refreshExpiration),
    });
  }

  /**
   * Helper method to set temp token cookie (for 2FA flow)
   */
  private setTempTokenCookie(res: Response, tempToken: string) {
    res.cookie('temp_token', tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10 * 60 * 1000, // 10 minutes (same as temp token expiry)
    });
  }

  // 5 attempts per 15 minutes
  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Sends password reset OTP to email and returns a temporary token. Mobile apps should store the tempToken from response body and send it in the Authorization header (Bearer token) or request body for subsequent requests.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Password reset email sent (if account exists). Returns tempToken in response body for mobile apps.',
    schema: {
      example: {
        tempToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message:
          'If an account with that email exists, you will receive a password reset email',
        otp: '123456', // Only in development mode
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Account suspended' })
  @Public()
  @HttpCode(200)
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.forgotPassword(
      forgotPasswordDto.email,
    );

    // Set temp token cookie for web clients (optional)
    // Mobile apps should use the tempToken from response body
    if ('tempToken' in result && result.tempToken) {
      this.setTempTokenCookie(res, result.tempToken);
    }

    return result;
  }

  @ApiOperation({
    summary: 'Reset password with OTP',
    description: `Verify OTP and set new password. Requires temp token from forgot-password endpoint.

Mobile apps can send the tempToken via:
1. Authorization header: "Bearer <tempToken>" (recommended)
2. Request body: { "tempToken": "<tempToken>", "otp": "123456", "newPassword": "..." }

Web clients can use cookies automatically.`,
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 401, description: 'Invalid OTP or temp token' })
  @ApiBearerAuth('JWT-auth')
  @Public()
  @UseGuards(TempTokenGuard)
  @Post('reset-password')
  async resetPassword(
    @CurrentTempUser() tempUser: TempUser,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(
      tempUser.sub,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );

    // Clear temp token cookie (for web clients)
    res.clearCookie('temp_token');

    return result;
  }

  // ============================================================================
  // Biometric Authentication Endpoints
  // ============================================================================

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Register current device for biometric login' })
  @ApiResponse({ status: 201, description: 'Biometric set up — returns biometricToken to store in Keychain' })
  @HttpCode(201)
  @Post('biometric-setup')
  async biometricSetup(
    @CurrentUser() user: User,
    @Body() dto: BiometricSetupDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req as any).socket?.remoteAddress || '0.0.0.0';
    return this.authService.setupBiometric(user.id, dto, ipAddress);
  }

  @Public()
  @ApiOperation({ summary: 'Request a one-time challenge to sign with the device private key' })
  @ApiResponse({ status: 200, description: 'Returns a random challenge nonce (valid for 2 minutes)' })
  @HttpCode(200)
  @Post('biometric-challenge')
  async biometricChallenge(@Body() dto: BiometricChallengeDto) {
    return this.authService.getBiometricChallenge(dto);
  }

  // 10 attempts per 5 minutes
  @Throttle({ default: { limit: 10, ttl: 5 * 60 * 1000 } })
  @Public()
  @ApiOperation({ summary: 'Login by submitting a signed biometric challenge' })
  @ApiResponse({ status: 200, description: 'Login successful — same shape as /auth/login' })
  @HttpCode(200)
  @Post('biometric-login')
  async biometricLogin(
    @Body() dto: BiometricLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = (req as any).ip || (req as any).socket?.remoteAddress || '0.0.0.0';
    if (dto.deviceInfo) {
      dto.deviceInfo.ipAddress = ipAddress;
    } else {
      dto.deviceInfo = { deviceFingerprint: dto.deviceFingerprint, deviceType: 'mobile', ipAddress };
    }
    const result = await this.authService.biometricLogin(dto);

    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all active biometric registrations for the current user' })
  @ApiResponse({ status: 200, description: 'List of registered biometric devices' })
  @Get('biometrics')
  async listBiometrics(@CurrentUser() user: User) {
    return this.authService.listBiometrics(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke biometric registration for a device' })
  @ApiResponse({ status: 200, description: 'Biometric revoked' })
  @HttpCode(200)
  @Post('biometric-revoke')
  async biometricRevoke(
    @CurrentUser() user: User,
    @Body() dto: BiometricRevokeDto,
  ) {
    await this.authService.revokeBiometric(user.id, dto.deviceFingerprint);
    return { message: 'Biometric login disabled for this device' };
  }

  // ============================================================================
  // Session Management Endpoints
  // ============================================================================

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  @ApiResponse({ status: 200, description: 'Active sessions returned' })
  @Get('sessions')
  async getSessions(@CurrentUser() user: User, @Req() req: Request) {
    const accessToken = req.headers.authorization?.split(' ')[1] || (req as any).cookies?.access_token;
    const decoded = this.authService['jwtService'].decode(accessToken) as any;
    const currentJti = decoded?.jti;
    return this.authService.getSessions(user.id, currentJti);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke a specific session by ID' })
  @ApiParam({ name: 'sessionId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @HttpCode(200)
  @Delete('sessions/:sessionId')
  async revokeSession(
    @CurrentUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(user.id, sessionId);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout all other sessions except the current one' })
  @ApiResponse({ status: 200, description: 'Other sessions revoked' })
  @HttpCode(200)
  @Delete('sessions')
  async revokeOtherSessions(@CurrentUser() user: User, @Req() req: Request) {
    const accessToken = req.headers.authorization?.split(' ')[1] || (req as any).cookies?.access_token;
    const decoded = this.authService['jwtService'].decode(accessToken) as any;
    const currentJti = decoded?.jti;
    return this.authService.revokeOtherSessions(user.id, currentJti);
  }

  // ============================================================================
  // Google OAuth
  // ============================================================================

  @ApiOperation({
    summary: 'Initiate Google OAuth login / registration',
    description:
      'Redirects to Google. Pass `role` to request a specific role on first sign-up.\n\n' +
      '**Allowed self-request roles:** `user` (default), `manager`\n\n' +
      'Any other value is silently downgraded to `user`. Existing users keep their current role.\n\n' +
      'New accounts are created with `status: pending_approval` regardless of role — an admin must approve them.',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['user', 'manager'],
    description: 'Requested role for new registrations (ignored for existing accounts)',
  })
  @ApiResponse({ status: 302, description: 'Redirect to Google login' })
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Query('role') role?: string, @Req() req?: any) {
    // GoogleAuthGuard triggers the redirect — the role is encoded into OAuth
    // state by overriding authorizationParams() on the guard (see GoogleAuthGuard)
  }

  @ApiOperation({ summary: 'Google OAuth callback (handled by Google)' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend after auth' })
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // New registration — account needs approval before they can use the app
    if (user.isNewRegistration) {
      return (res as any).redirect(`${frontendUrl}/auth/pending-approval`);
    }

    const deviceInfo = {
      ipAddress: (req as any).ip || (req as any).socket?.remoteAddress || '0.0.0.0',
      userAgent: (req as any).headers?.['user-agent'],
      deviceName: 'Google OAuth Browser',
      deviceType: 'desktop',
    };

    const tokens = await this.authService.generateTokens(user, deviceInfo);
    this.setAuthCookies(res as any, tokens.accessToken, tokens.refreshToken);

    return (res as any).redirect(`${frontendUrl}/dashboard`);
  }
}
