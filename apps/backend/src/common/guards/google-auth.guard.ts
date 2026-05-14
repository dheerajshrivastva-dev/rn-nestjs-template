import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  // Encode the requested role into the OAuth state so the strategy
  // can read it back after Google redirects to the callback.
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const role = req.query?.role ?? 'user';
    const state = Buffer.from(JSON.stringify({ role })).toString('base64url');
    return { state };
  }
}
