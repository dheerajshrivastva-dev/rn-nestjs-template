// Polyfill for crypto (required for @nestjs/typeorm on older Node versions)
import * as crypto from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

// Initialize OpenTelemetry BEFORE importing anything else
// This must be the very first import to properly instrument the app
import './tracing';

import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust reverse proxy (Coolify/nginx) so req.protocol and X-Forwarded-* headers work
  app.set('trust proxy', 1);

  // Use strong ETags (SHA1 hash) instead of Express's default weak ETags (CRC32)
  app.set('etag', 'strong');

  // Security headers — removes X-Powered-By, adds X-Frame-Options, HSTS, etc.
  // contentSecurityPolicy disabled to keep Swagger UI functional
  app.use(helmet({ contentSecurityPolicy: false }));

  // Serve APK release files as static assets at /releases/<filename>
  // Default to /tmp/releases so it works without a mounted volume (always writable).
  // In production, set APP_RELEASES_PATH to a persistent volume path via env var.
  const releasesPath = process.env.APP_RELEASES_PATH || path.join(os.tmpdir(), 'releases');
  fs.mkdirSync(releasesPath, { recursive: true });
  app.useStaticAssets(releasesPath, { prefix: '/releases' });

  // Serve download.html at GET /download.html
  // Search order: public/ sibling of dist/, then dist/ itself (nest-cli flat copy)
  const downloadHtmlCandidates = [
    path.join(__dirname, '..', 'public', 'download.html'), // prod with /app/public
    path.join(__dirname, 'download.html'),                  // prod/dev via nest-cli flat copy
    path.join(process.cwd(), 'public', 'download.html'),   // dev fallback
  ];
  const downloadHtml = downloadHtmlCandidates.find(f => fs.existsSync(f));
  if (downloadHtml) {
    app.getHttpAdapter().getInstance().get('/download.html', (_req: any, res: any) => {
      res.sendFile(downloadHtml);
    });
  }

  // Cookie parser middleware - must be before Bull Board so req.cookies is available
  app.use(cookieParser());

  // Bull Board - Queue monitoring UI at /queues
  const bullBoardPath = '/queues';
  const boardAdapter = new ExpressAdapter();
  boardAdapter.setBasePath(bullBoardPath);
  createBullBoard({
    queues: [
      new BullAdapter(app.get(getQueueToken('email'))),
      new BullAdapter(app.get(getQueueToken('sms'))),
      new BullAdapter(app.get(getQueueToken('push'))),
    ],
    serverAdapter: boardAdapter,
  });
  // Protect Bull Board: SUPER_ADMIN JWT required (Bearer header or access_token cookie)
  const jwtService = app.get(JwtService);
  app.use(bullBoardPath, (req: any, res: any, next: any) => {
    if (process.env.NODE_ENV !== 'production') {
      return next();
    }
    try {
      // Accept token from Authorization header OR access_token cookie
      const authHeader = req.headers['authorization'];
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : req.cookies?.access_token;

      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const payload = jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      if (payload?.role !== 'super_admin') {
        return res.status(403).json({ message: 'SUPER_ADMIN role required' });
      }
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  });
  app.use(bullBoardPath, boardAdapter.getRouter());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS Whitelist
  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:3000',
    /https?:\/\/([a-z0-9-]+\.)*duetech\.in$/,
  ];
  if (process.env.CORS_ORIGINS) {
    const envOrigins = process.env.CORS_ORIGINS.split(',').map((o) => o.trim());
    allowedOrigins.push(...envOrigins);
  }

  // CORS
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    },
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptors - ClassSerializerInterceptor to respect @Exclude() decorators
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EMI Management System API')
    .setDescription(
      'Backend API for EMI Management System with Zero-Touch Provisioning\n\n' +
      '**Authentication:** Click the "Authorize" button (🔓 icon) and paste your access token.\n' +
      'Token is automatically included in the Authorization header as "Bearer <token>".'
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Click "Authorize" button above and paste your JWT access token (without "Bearer" prefix)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Device-Unique-Code',
        in: 'header',
        description: 'Device unique code for signature-based authentication',
      },
      'device-auth',
    )
    .build();

  // Swagger — Basic auth guard (browser prompt)
  // Set SWAGGER_USER and SWAGGER_PASSWORD env vars to enable in production.
  // In development with no env vars: open access.
  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (swaggerUser && swaggerPassword) {
    app.getHttpAdapter().getInstance().use('/api/docs', (req: any, res: any, next: any) => {
      const authHeader = req.headers['authorization'];
      if (authHeader?.startsWith('Basic ')) {
        const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
        const [user, pass] = credentials.split(':');
        if (user === swaggerUser && pass === swaggerPassword) {
          return next();
        }
      }
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs"');
      return res.status(401).send('Unauthorized');
    });
  }

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0'; // Bind to all network interfaces

  await app.listen(port, host);

  // Get local IP addresses
  const networkInterfaces = os.networkInterfaces();
  const localIPs: string[] = [];

  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    if (interfaces) {
      interfaces.forEach((iface) => {
        // Skip internal (loopback) and non-IPv4 addresses
        if (!iface.internal && iface.family === 'IPv4') {
          localIPs.push(iface.address);
        }
      });
    }
  });

  // Log startup information
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Demigod Backend Service Started Successfully');
  console.log('='.repeat(60));
  console.log(`\n📡 Server listening on port: ${port}`);
  console.log(`🌐 Binding to: ${host} (all network interfaces)\n`);

  console.log('📍 Available at:');
  console.log(`   - Local:    http://localhost:${port}`);
  console.log(`   - Local:    http://127.0.0.1:${port}`);

  if (localIPs.length > 0) {
    localIPs.forEach((ip) => {
      console.log(`   - Network:  http://${ip}:${port}`);
    });
  }

  console.log('\n📚 API Documentation:');
  console.log(`   - Local:    http://localhost:${port}/api/docs`);
  if (localIPs.length > 0) {
    console.log(`   - Network:  http://${localIPs[0]}:${port}/api/docs`);
  }

  console.log('\n📊 Bull Board (Queue Monitor):');
  console.log(`   - Local:    http://localhost:${port}/queues`);
  console.log(`   - Auth:     SUPER_ADMIN Bearer token required`);

  console.log('\n🔍 Jaeger Tracing UI:');
  console.log(`   - http://localhost:16686`);

  console.log('\n' + '='.repeat(60) + '\n');
}

bootstrap();
