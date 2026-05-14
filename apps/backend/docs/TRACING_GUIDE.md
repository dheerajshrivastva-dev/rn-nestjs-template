# OpenTelemetry + Jaeger Tracing Guide 🔍

## Overview

Your NestJS backend now has **distributed tracing** powered by **OpenTelemetry** and **Jaeger**!

This means you can:
- ✅ See **real-time request flows** through your entire application
- ✅ Track **database queries** and their performance
- ✅ Monitor **API response times** at every layer
- ✅ Debug **errors** with full context
- ✅ Identify **performance bottlenecks**
- ✅ Visualize **dependencies** between services

---

## Architecture

```
┌─────────────┐
│  HTTP Request│
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│   NestJS App     │ ─────▶ Generates Trace
│ (Auto-instrumented)│      (every request)
└──────┬───────────┘
       │
       ├──▶ PostgreSQL Query ─────▶ Traced
       ├──▶ Redis Operation ────────▶ Traced
       ├──▶ External API Call ──────▶ Traced
       └──▶ Guard/Service/Controller ▶ Traced
       │
       ▼
┌──────────────────┐
│  OpenTelemetry   │ ─────▶ Collects Traces
│     SDK          │
└──────┬───────────┘
       │
       ▼ (HTTP/OTLP)
┌──────────────────┐
│     Jaeger       │ ─────▶ Stores & Visualizes
│   (Docker)       │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│   Jaeger UI      │ ─────▶ http://localhost:16686
│  (Browser)       │
└──────────────────┘
```

---

## Quick Start

### 1. Start Jaeger (in Docker)

```bash
# Start all services including Jaeger
docker-compose -f docker-compose.dev.yml up -d

# Or start only Jaeger
docker-compose -f docker-compose.dev.yml up -d jaeger

# Verify Jaeger is running
docker ps | grep jaeger

# Check Jaeger health
curl http://localhost:14269/
```

### 2. Start Your NestJS App

```bash
# Install dependencies (if not already)
pnpm install

# Copy environment file
cp .env.example .env

# Start the app
pnpm run start:dev
```

### 3. Open Jaeger UI

```bash
# Open in browser
open http://localhost:16686

# Or manually navigate to:
http://localhost:16686
```

### 4. Make Some API Requests

```bash
# Example: Test login endpoint
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Example: Test health check
curl http://localhost:3000/api/v1/health
```

### 5. View Traces in Jaeger

1. Open http://localhost:16686
2. Select **Service**: `demi-backend`
3. Click **Find Traces**
4. See your request flows! 🎉

---

## What Gets Traced Automatically?

Thanks to OpenTelemetry auto-instrumentation, these are traced **without any code changes**:

### ✅ HTTP Requests/Responses
```
Trace shows:
├─ Request method (GET, POST, etc.)
├─ URL path (/api/v1/auth/login)
├─ Status code (200, 401, etc.)
├─ Response time (ms)
└─ Headers, query params
```

### ✅ Database Queries (PostgreSQL)
```
Trace shows:
├─ SQL query text
├─ Query duration
├─ Database name
├─ Connection pool stats
└─ Rows affected
```

### ✅ Redis Operations
```
Trace shows:
├─ Redis command (GET, SET, etc.)
├─ Key name
├─ Operation duration
└─ Connection details
```

### ✅ NestJS Components
```
Trace shows:
├─ Controller method execution
├─ Service method calls
├─ Guard execution
├─ Interceptor timing
├─ Pipe validation
└─ Exception filters
```

### ✅ External API Calls
```
Trace shows:
├─ HTTP method & URL
├─ Request/response time
├─ Status codes
└─ Any errors
```

---

## Jaeger UI Guide

### **Search Page**

```
┌────────────────────────────────────────┐
│  Service: [demi-backend     ▼]         │
│  Operation: [All          ▼]           │
│  Tags: [ ]                              │
│  Lookback: [Last Hour   ▼]             │
│  Min/Max Duration: [ ]                  │
│                                         │
│  [Find Traces]                          │
└────────────────────────────────────────┘
```

**How to use:**
1. Select **Service**: `demi-backend`
2. Select **Operation**: e.g., `POST /api/v1/auth/login`
3. Click **Find Traces**

### **Trace View**

```
Timeline View (Waterfall):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  0ms     50ms    100ms   150ms   200ms
  │        │        │        │        │
  ├─ HTTP POST /api/v1/auth/login [200ms]
  │  ├─ JwtAuthGuard [5ms] ✅
  │  │  └─ Database: SELECT * FROM agents [15ms]
  │  ├─ ValidationPipe [2ms] ✅
  │  ├─ AuthController.login [180ms]
  │  │  └─ AuthService.login [175ms]
  │  │     ├─ Database: SELECT * FROM agents WHERE email [20ms]
  │  │     ├─ bcrypt.compare [80ms]
  │  │     ├─ JwtService.sign [30ms]
  │  │     └─ Database: UPDATE agents SET refreshToken [25ms]
  │  └─ Response Interceptor [3ms]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Color Coding:**
- 🟢 Green: Fast (< 100ms)
- 🟡 Yellow: Medium (100-500ms)
- 🔴 Red: Slow (> 500ms)
- ❌ Red with error icon: Failed

### **Span Details**

Click any span to see:
```
Tags:
├─ http.method: POST
├─ http.url: /api/v1/auth/login
├─ http.status_code: 200
├─ db.statement: SELECT * FROM agents WHERE email = ?
├─ db.system: postgresql
└─ error: false

Logs:
├─ [INFO] Request received
├─ [DEBUG] Validating credentials
└─ [INFO] JWT tokens generated

Process:
├─ service.name: demi-backend
├─ service.version: 1.0.0
└─ deployment.environment: development
```

---

## Example Traces

### **1. Successful Login Flow**

```
Trace: POST /api/v1/auth/login [Success]
Duration: 185ms

└─ HTTP POST /api/v1/auth/login [185ms]
   ├─ @Public decorator check [0.5ms]
   ├─ ValidationPipe [2ms]
   │  └─ Validate LoginDto [2ms]
   ├─ AuthController.login [180ms]
   │  └─ AuthService.login [178ms]
   │     ├─ PostgreSQL: Find user by email [18ms]
   │     ├─ bcrypt.compare password [82ms] ⚠️ Slow
   │     ├─ JwtService.sign (access token) [28ms]
   │     ├─ JwtService.sign (refresh token) [25ms]
   │     └─ PostgreSQL: Update refresh token [20ms]
   └─ Response sent [2ms]

Status: 200 OK
Response Size: 512 bytes
```

### **2. Failed Authentication (RBAC)**

```
Trace: GET /api/v1/agents [Forbidden]
Duration: 15ms

└─ HTTP GET /api/v1/agents [15ms]
   ├─ JwtAuthGuard [8ms]
   │  └─ JwtStrategy.validate [7ms]
   │     └─ PostgreSQL: Find user by id [6ms]
   ├─ RolesGuard [5ms]
   │  └─ Check @Roles(OWNER) [5ms] ❌ FAILED
   └─ ForbiddenException thrown [2ms]

Status: 403 Forbidden
Error: "Access denied. Required roles: owner"
```

### **3. Device Sync with Database Queries**

```
Trace: POST /api/v1/clients/sync [Success]
Duration: 95ms

└─ HTTP POST /api/v1/clients/sync [95ms]
   ├─ DeviceSignatureGuard [22ms]
   │  ├─ Extract headers [1ms]
   │  ├─ PostgreSQL: Find client by deviceUniqueCode [12ms]
   │  ├─ Validate timestamp [2ms]
   │  └─ Verify RSA signature [7ms]
   ├─ ClientController.sync [70ms]
   │  └─ ClientService.sync [68ms]
   │     ├─ PostgreSQL: Get device config [15ms]
   │     ├─ Redis: Get cached company settings [3ms] ✅ Fast!
   │     ├─ PostgreSQL: Update lastSyncAt [18ms]
   │     └─ Build response payload [32ms]
   └─ Response sent [3ms]

Status: 200 OK
```

---

## Performance Insights

### **Identify Slow Queries**

In Jaeger UI:
1. Go to **Search**
2. Set **Min Duration**: `500ms`
3. Click **Find Traces**
4. See all slow requests!

### **Compare Request Durations**

```
Compare these operations:

GET /api/v1/agents/me
├─ Without cache: 85ms
│  └─ PostgreSQL query: 78ms
│
└─ With Redis cache: 12ms
   └─ Redis GET: 8ms

Result: 7x faster with caching! 🚀
```

### **Database Query Optimization**

```
Before optimization:
└─ GET /api/v1/clients
   └─ PostgreSQL: SELECT * FROM clients
      WHERE agent_id = ? [450ms] ⚠️

After adding index:
└─ GET /api/v1/clients
   └─ PostgreSQL: SELECT * FROM clients
      WHERE agent_id = ? [25ms] ✅

Result: 18x faster!
```

---

## Custom Tracing (Advanced)

While most things are auto-traced, you can add custom spans:

### **Method 1: Manual Spans**

```typescript
import { trace } from '@opentelemetry/api';

export class ClientService {
  async processDeviceRegistration(data: any) {
    const tracer = trace.getTracer('demi-backend');

    // Create a custom span
    return tracer.startActiveSpan('process-device-registration', async (span) => {
      try {
        // Add custom attributes
        span.setAttribute('client.imei', data.imei1);
        span.setAttribute('device.manufacturer', data.manufacturer);

        // Your business logic
        const result = await this.registerDevice(data);

        span.setStatus({ code: 1 }); // Success
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: error.message }); // Error
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

### **Method 2: Decorator (Cleaner)**

```typescript
// Create a decorator
import { trace } from '@opentelemetry/api';

export function Traced(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const spanName = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      const tracer = trace.getTracer('demi-backend');

      return tracer.startActiveSpan(spanName, async (span) => {
        try {
          const result = await originalMethod.apply(this, args);
          span.setStatus({ code: 1 });
          return result;
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: 2, message: error.message });
          throw error;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}

// Usage
export class ClientService {
  @Traced('register-device')
  async registerDevice(data: RegisterDeviceDto) {
    // Your code here
  }
}
```

---

## Troubleshooting

### **Problem: No traces appear in Jaeger**

**Solutions:**

1. **Check Jaeger is running:**
```bash
docker ps | grep jaeger
curl http://localhost:16686/
```

2. **Check app is sending traces:**
```bash
# Look for OpenTelemetry logs in app startup
pnpm run start:dev

# Should see:
# "OpenTelemetry SDK started"
# "Tracing exporter initialized"
```

3. **Verify OTLP endpoint:**
```bash
# In .env file
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Test endpoint
curl http://localhost:4318/
```

4. **Check network:**
```bash
# If app is in Docker, use service name
OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318/v1/traces
```

---

### **Problem: Traces are delayed/missing**

**Causes:**
- Batch exporting (traces sent every 5 seconds)
- Network issues
- Jaeger storage issues

**Solutions:**
```typescript
// In tracing.ts, add immediate export for development
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

const spanProcessor = process.env.NODE_ENV === 'production'
  ? new BatchSpanProcessor(traceExporter)
  : new SimpleSpanProcessor(traceExporter); // Immediate export for dev
```

---

### **Problem: Too many traces (noisy)**

**Solution: Filter out health checks and metrics**

Already configured in `tracing.ts`:
```typescript
'@opentelemetry/instrumentation-http': {
  enabled: true,
  ignoreIncomingPaths: ['/health', '/metrics'], // Don't trace these
}
```

Add more paths as needed:
```typescript
ignoreIncomingPaths: [
  '/health',
  '/metrics',
  '/api/docs',  // Swagger
  '/favicon.ico',
]
```

---

## Production Considerations

### **1. Use Persistent Storage**

Jaeger all-in-one uses in-memory storage (lost on restart).

For production, use Elasticsearch or Cassandra:

```yaml
# docker-compose.prod.yml
jaeger:
  image: jaegertracing/all-in-one:latest
  environment:
    SPAN_STORAGE_TYPE: elasticsearch
    ES_SERVER_URLS: http://elasticsearch:9200
```

### **2. Sampling**

In production, sample traces to reduce overhead:

```typescript
// tracing.ts
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const sdk = new NodeSDK({
  // Sample 10% of traces in production
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(
      process.env.NODE_ENV === 'production' ? 0.1 : 1.0
    ),
  }),
  // ... other config
});
```

### **3. Disable in Production (Optional)**

If you don't need tracing in prod:

```typescript
// main.ts
if (process.env.NODE_ENV !== 'production') {
  import('./tracing'); // Only trace in development
}
```

---

## Integration with Existing Tools

### **Combine with Monitoring**

Jaeger complements other tools:

```
┌─────────────────┐
│  CloudWatch     │ ◄─── Logs & Metrics
└─────────────────┘

┌─────────────────┐
│  Jaeger         │ ◄─── Distributed Traces
└─────────────────┘

┌─────────────────┐
│  Sentry         │ ◄─── Error Tracking
└─────────────────┘

Together = Complete Observability!
```

### **Link Traces to Logs**

Add trace ID to logs:

```typescript
import { trace } from '@opentelemetry/api';
import { Logger } from '@nestjs/common';

export class MyService {
  private logger = new Logger(MyService.name);

  async myMethod() {
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;

    this.logger.log(`Processing request [traceId: ${traceId}]`);
  }
}
```

---

## Ports Reference

| Port | Service | Description |
|------|---------|-------------|
| **16686** | Jaeger UI | Main web interface |
| **4318** | OTLP HTTP | OpenTelemetry traces (HTTP) |
| **4317** | OTLP gRPC | OpenTelemetry traces (gRPC) |
| **14268** | Jaeger Collector | Legacy Jaeger format |
| **14269** | Health Check | Jaeger health endpoint |
| **9411** | Zipkin | Zipkin-compatible endpoint |

---

## Resources

- **Jaeger Documentation**: https://www.jaegertracing.io/docs/
- **OpenTelemetry Docs**: https://opentelemetry.io/docs/
- **NestJS Instrumentation**: https://github.com/open-telemetry/opentelemetry-js-contrib

---

## Quick Commands

```bash
# Start Jaeger
docker-compose -f docker-compose.dev.yml up -d jaeger

# View Jaeger logs
docker logs demi-jaeger -f

# Restart Jaeger
docker-compose -f docker-compose.dev.yml restart jaeger

# Stop Jaeger
docker-compose -f docker-compose.dev.yml stop jaeger

# Access Jaeger UI
open http://localhost:16686

# Check Jaeger health
curl http://localhost:14269/
```

---

## Summary

✅ **OpenTelemetry + Jaeger** is now fully integrated!

**What you get:**
- Real-time request flow visualization
- Performance monitoring
- Database query tracking
- Error debugging with full context
- No code changes needed (auto-instrumentation)

**Access:**
- Jaeger UI: http://localhost:16686
- App API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

**Start tracing now!** 🚀

```bash
docker-compose -f docker-compose.dev.yml up -d
pnpm run start:dev
# Make some requests
# Open http://localhost:16686
# See your traces!
```
