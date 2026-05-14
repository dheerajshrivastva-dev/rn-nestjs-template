import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Enable diagnostic logging for debugging (optional, remove in production)
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

/**
 * OpenTelemetry Tracing Configuration
 *
 * This configures distributed tracing for the entire application.
 * Traces are exported to Jaeger for visualization.
 *
 * What gets traced automatically:
 * - HTTP requests/responses
 * - Database queries (PostgreSQL, Redis)
 * - External API calls
 * - NestJS controllers, services, guards
 * - Bull queue jobs
 */

const traceExporter = new OTLPTraceExporter({
  // Jaeger collector endpoint (OTLP format)
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const sdk = new NodeSDK({
  traceExporter,
  serviceName: process.env.APP_NAME || 'forge-backend',
  instrumentations: [
    getNodeAutoInstrumentations({
      // Instrument HTTP
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      // Instrument Express/NestJS
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      // Instrument PostgreSQL
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
      // Instrument DNS lookups — disabled: OTel DNS patching blocks dns.resolve4
      // callbacks when the trace exporter (Jaeger) is unreachable, causing SMTP
      // greeting timeouts in nodemailer.
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
      // Instrument file system operations
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Can be noisy, enable if needed
      },
    }),
  ],
});

// Start the SDK
sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

export default sdk;
