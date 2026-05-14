import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Enriches request body.deviceInfo with server-side metadata:
 * IP address (from X-Forwarded-For or socket), user-agent header.
 * Client-supplied values take precedence over server-derived ones.
 */
@Injectable()
export class DeviceInfoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const ip =
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      '0.0.0.0';

    const userAgent = request.headers['user-agent'] || '';

    if (request.body) {
      if (!request.body.deviceInfo) {
        request.body.deviceInfo = {};
      }
      // Only fill in values the client did not supply
      request.body.deviceInfo.ipAddress = request.body.deviceInfo.ipAddress || ip;
      request.body.deviceInfo.userAgent = request.body.deviceInfo.userAgent || userAgent;
    }

    return next.handle();
  }
}
