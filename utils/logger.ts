/**
 * Logger utility for structured logging
 */

export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

export type LogLevelType = keyof typeof LogLevel;

export interface LogEntry {
  level: LogLevelType;
  message: string;
  timestamp: Date;
  data?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevelType = 'INFO';

  setLevel(level: LogLevelType): void {
    this.logLevel = level;
  }

  error(message: string, data?: Record<string, any>): void {
    this.log('ERROR', message, data);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log('WARN', message, data);
  }

  info(message: string, data?: Record<string, any>): void {
    this.log('INFO', message, data);
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log('DEBUG', message, data);
  }

  private log(level: LogLevelType, message: string, data?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
    };

    // In production, you might want to send logs to external service
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.timestamp.toISOString()}] ${level}: ${message}`, data || '');
    }
  }
}

export const logger = new Logger();
