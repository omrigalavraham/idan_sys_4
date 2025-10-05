export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private isDebug = process.env.DEBUG === 'true';

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.WARN:
        return true;
      case LogLevel.INFO:
        return this.isDebug;
      case LogLevel.DEBUG:
        return this.isDebug;
      default:
        return false;
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  // Security-specific logging
  security(event: string, details: any): void {
    this.warn(`SECURITY: ${event}`, details);
  }

  // Performance logging
  performance(operation: string, duration: number, meta?: any): void {
    this.info(`PERFORMANCE: ${operation} took ${duration}ms`, meta);
  }

  // Database logging
  database(operation: string, query: string, duration?: number, meta?: any): void {
    const message = `DATABASE: ${operation}`;
    const dbMeta = {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      ...meta
    };
    this.debug(message, dbMeta);
  }
}

export const logger = new Logger();
