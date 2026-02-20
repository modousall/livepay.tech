/**
 * Centralized Logger with Sentry Integration
 * Provides structured logging, error tracking, and payment event monitoring
 */

import winston from "winston";
import * as Sentry from "@sentry/node";

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
  console.log("[LOGGER] Sentry initialized");
} else {
  console.warn("[LOGGER] Sentry not configured (missing SENTRY_DSN)");
}

// Define log levels
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "blue",
  },
};

winston.addColors(logLevels.colors);

// Define log formats
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: logLevels.levels,
  defaultMeta: { service: "livepay" },
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Error log file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: logFormat,
    }),
    // Combined log file
    new winston.transports.File({
      filename: "logs/combined.log",
      format: logFormat,
    }),
    // HTTP log file
    new winston.transports.File({
      filename: "logs/http.log",
      level: "http",
      format: logFormat,
    }),
  ],
});

// Log types
export type LogLevel = "error" | "warn" | "info" | "http" | "debug";

export interface LogContext {
  [key: string]: any;
}

export interface PaymentEventContext extends LogContext {
  orderId: string;
  amount?: number;
  paymentMethod?: string;
  status?: "initiated" | "failed" | "succeeded" | "refunded";
  processingTime?: number;
  errorCode?: string;
}

export interface OrderEventContext extends LogContext {
  orderId: string;
  vendorId: string;
  previousStatus?: string;
  newStatus?: string;
  changedBy?: string;
}

/**
 * Log an error with optional context and Sentry reporting
 */
export function logError(
  error: Error | unknown,
  context: LogContext = {},
  options: { reportToSentry?: boolean; level?: LogLevel } = {}
): void {
  const { reportToSentry = true, level = "error" } = options;

  const errorContext = {
    ...context,
    service: "livepay",
  };

  // Log with Winston
  logger.log(level, error instanceof Error ? error.message : String(error), errorContext);

  // Report to Sentry if enabled and it's a real error
  if (reportToSentry && error instanceof Error) {
    Sentry.captureException(error, {
      extra: errorContext,
    });
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, context: LogContext = {}): void {
  logger.info(message, context);
}

/**
 * Log a warning message
 */
export function logWarn(message: string, context: LogContext = {}): void {
  logger.warn(message, context);
}

/**
 * Log a debug message
 */
export function logDebug(message: string, context: LogContext = {}): void {
  logger.debug(message, context);
}

/**
 * Log an HTTP request
 */
export function logHttp(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context: LogContext = {}
): void {
  logger.log("http", `${method} ${path} ${statusCode}`, {
    durationMs,
    ...context,
  });
}

/**
 * Log a payment event
 */
export function logPaymentEvent(event: PaymentEventContext): void {
  const { orderId, status, amount, paymentMethod, processingTime, errorCode } = event;

  const context = {
    category: "payment",
    orderId,
    amount,
    paymentMethod,
    processingTime,
    errorCode,
  };

  if (status === "succeeded") {
    logger.info(`Payment succeeded: ${orderId}`, context);
  } else if (status === "failed") {
    logger.error(`Payment failed: ${orderId}`, {
      ...context,
      error: errorCode,
    });

    // Report payment failures to Sentry
    if (errorCode) {
      Sentry.captureMessage(`Payment failed: ${orderId}`, {
        level: "warning",
        extra: context,
      });
    }
  } else if (status === "initiated") {
    logger.info(`Payment initiated: ${orderId}`, context);
  } else if (status === "refunded") {
    logger.info(`Payment refunded: ${orderId}`, context);
  }
}

/**
 * Log an order event
 */
export function logOrderEvent(event: OrderEventContext): void {
  const { orderId, vendorId, previousStatus, newStatus, changedBy } = event;

  logger.info(`Order status changed: ${orderId}`, {
    category: "order",
    orderId,
    vendorId,
    previousStatus,
    newStatus,
    changedBy,
  });
}

/**
 * Log a security event
 */
export function logSecurityEvent(
  eventType: string,
  details: LogContext,
  severity: "low" | "medium" | "high" | "critical" = "medium"
): void {
  const level: LogLevel = severity === "critical" || severity === "high" ? "error" : "warn";

  logger.log(level, `Security event: ${eventType}`, {
    category: "security",
    severity,
    ...details,
  });

  // Report high/critical security events to Sentry
  if (severity === "high" || severity === "critical") {
    Sentry.captureMessage(`Security ${severity}: ${eventType}`, {
      level: severity === "critical" ? "fatal" : "warning",
      extra: details,
    });
  }
}

/**
 * Log a rate limit event
 */
export function logRateLimit(ip: string, path: string, limitType: string): void {
  logger.warn(`Rate limit exceeded: ${limitType}`, {
    category: "rate_limit",
    ip,
    path,
    limitType,
  });
}

/**
 * Log a webhook event
 */
export function logWebhookEvent(
  provider: string,
  eventType: string,
  orderId?: string,
  success?: boolean,
  error?: string
): void {
  const context = {
    category: "webhook",
    provider,
    eventType,
    orderId,
    success,
    error,
  };

  if (success) {
    logger.info(`Webhook received: ${provider} - ${eventType}`, context);
  } else {
    logger.error(`Webhook failed: ${provider} - ${eventType}`, context);
  }
}

/**
 * Performance monitoring helper
 */
export function measurePerformance(label: string): {
  end: () => number;
} {
  const start = Date.now();

  return {
    end: () => {
      const duration = Date.now() - start;
      logger.debug(`Performance: ${label} completed in ${duration}ms`, {
        duration,
        label,
      });
      return duration;
    },
  };
}

/**
 * Request logging middleware for Express
 */
export function requestLogger(req: any, res: any, next: () => void): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logHttp(req.method, req.path, res.statusCode, duration, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}

/**
 * Error handling middleware for Express
 */
export function errorLogger(err: any, req: any, res: any, next: any): void {
  logError(err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    headers: req.headers,
  });

  next(err);
}

/**
 * Flush Sentry events before shutdown
 */
export async function flushLogs(timeout: number = 2000): Promise<void> {
  await Sentry.flush(timeout);
  await logger.end();
}
