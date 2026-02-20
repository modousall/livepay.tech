/**
 * Centralized Logging System
 * Handles all application logging across frontend and backend
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: unknown;
  userId?: string;
  sessionId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    if (typeof window !== 'undefined') {
      // Browser environment
      return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    // Server environment
    return `server-${Date.now()}`;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private buildContext(
    level: LogLevel,
    source: string,
    message: string,
    data?: unknown
  ): LogContext {
    return {
      timestamp: this.formatTimestamp(),
      level,
      source,
      message,
      data,
      sessionId: this.sessionId,
    };
  }

  private formatLog(context: LogContext): string {
    const { timestamp, level, source, message } = context;
    return `[${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`;
  }

  private outputLog(context: LogContext): void {
    const formatted = this.formatLog(context);

    if (typeof window !== 'undefined') {
      // Browser console
      const style = this.getConsoleStyle(context.level);
      console.log(`%c${formatted}`, style);
      if (context.data) console.log(context.data);
      if (context.error) console.error(context.error);
    } else {
      // Node.js console
      console.log(formatted);
      if (context.data) console.log(JSON.stringify(context.data, null, 2));
      if (context.error) console.error(JSON.stringify(context.error, null, 2));
    }
  }

  private sendToServer(context: LogContext): void {
    if (this.isDevelopment) return;

    // Send to logging service for production monitoring
    if (typeof navigator !== 'undefined') {
      navigator.sendBeacon('/api/logs', JSON.stringify(context));
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #888; font-weight: normal;',
      info: 'color: #0066cc; font-weight: bold;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;',
    };
    return styles[level];
  }

  debug(source: string, message: string, data?: unknown): void {
    const context = this.buildContext('debug', source, message, data);
    this.outputLog(context);
  }

  info(source: string, message: string, data?: unknown): void {
    const context = this.buildContext('info', source, message, data);
    this.outputLog(context);
    this.sendToServer(context);
  }

  warn(source: string, message: string, data?: unknown): void {
    const context = this.buildContext('warn', source, message, data);
    this.outputLog(context);
    this.sendToServer(context);
  }

  error(source: string, message: string, error?: Error, data?: unknown): void {
    const errorData = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined;

    const context: LogContext = {
      timestamp: this.formatTimestamp(),
      level: 'error',
      source,
      message,
      data,
      error: errorData,
      sessionId: this.sessionId,
    };

    this.outputLog(context);
    this.sendToServer(context);
  }

  setUserId(userId: string): void {
    // Context will be added to next logs
  }

  group(label: string): void {
    if (typeof console.group !== 'undefined') {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (typeof console.groupEnd !== 'undefined') {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();

/**
 * Usage Examples:
 *
 * logger.debug('Auth.tsx', 'User login attempt', { email: 'user@example.com' });
 * logger.info('Dashboard.tsx', 'Dashboard loaded', { vendorId: '123' });
 * logger.warn('Orders.tsx', 'High order count', { count: 1000 });
 * logger.error('Payment.ts', 'Payment failed', paymentError, { orderId: '456' });
 */
