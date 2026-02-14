// Centralized logging utility
// Replaces console.log with environment-aware logging

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    this.isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }
    // In development, log everything
    return true;
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    // Remove sensitive data from logs
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken', 'refreshToken'];
    
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      const sanitized = this.sanitizeContext(context);
      console.debug(this.formatMessage('debug', message, sanitized));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const sanitized = this.sanitizeContext(context);
      console.info(this.formatMessage('info', message, sanitized));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      const sanitized = this.sanitizeContext(context);
      console.warn(this.formatMessage('warn', message, sanitized));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const sanitized = this.sanitizeContext(context);
      const errorDetails = error instanceof Error 
        ? { message: error.message, stack: error.stack }
        : { error };
      
      console.error(this.formatMessage('error', message, { ...sanitized, ...errorDetails }));
      
      // In production, you might want to send errors to a service like Sentry
      if (this.isProduction) {
        this.sendToErrorTracking(message, error, sanitized);
      }
    }
  }

  private sendToErrorTracking(message: string, error: Error | unknown, context?: LogContext): void {
    // Placeholder for error tracking service integration
    // Example: Sentry.captureException(error, { extra: context });
    // For now, just ensure it's logged
  }

  // Specialized logging methods
  auth(action: string, context?: LogContext): void {
    this.info(`Auth: ${action}`, { ...context, component: 'auth' });
  }

  api(method: string, endpoint: string, status?: number, context?: LogContext): void {
    const level = status && status >= 400 ? 'error' : 'info';
    this[level](`API ${method} ${endpoint}`, { ...context, status, component: 'api' });
  }

  security(event: string, context?: LogContext): void {
    this.warn(`Security: ${event}`, { ...context, component: 'security' });
  }

  payment(action: string, context?: LogContext): void {
    this.info(`Payment: ${action}`, { ...context, component: 'payment' });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
