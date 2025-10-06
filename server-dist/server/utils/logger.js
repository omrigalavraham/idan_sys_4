export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
class Logger {
    isDevelopment = process.env.NODE_ENV !== 'production';
    isDebug = process.env.DEBUG === 'true';
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
    }
    shouldLog(level) {
        if (this.isDevelopment)
            return true;
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
    error(message, meta) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage(LogLevel.ERROR, message, meta));
        }
    }
    warn(message, meta) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, message, meta));
        }
    }
    info(message, meta) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatMessage(LogLevel.INFO, message, meta));
        }
    }
    debug(message, meta) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatMessage(LogLevel.DEBUG, message, meta));
        }
    }
    // Security-specific logging
    security(event, details) {
        this.warn(`SECURITY: ${event}`, details);
    }
    // Performance logging
    performance(operation, duration, meta) {
        this.info(`PERFORMANCE: ${operation} took ${duration}ms`, meta);
    }
    // Database logging
    database(operation, query, duration, meta) {
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
