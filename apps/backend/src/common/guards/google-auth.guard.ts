import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * Triggers the Google OAuth flow when applied to a route
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
