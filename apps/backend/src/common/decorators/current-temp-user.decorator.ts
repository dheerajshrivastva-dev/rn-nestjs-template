import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentTempUser decorator - Extracts temp user from request
 * Use with @UseGuards(TempTokenGuard) to get decoded temp token payload
 */
export const CurrentTempUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tempUser;
  },
);

/**
 * Type definition for temp user (decoded JWT payload)
 */
export interface TempUser {
  sub: string; // recipientId
  recipientType: string;
  purpose: string; // e.g., "otp:login_2fa"
  otpId: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
}
