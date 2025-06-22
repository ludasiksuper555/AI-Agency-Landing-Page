/**
 * Advanced logging system with multiple transports and structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  method?: string;
  stack?: string;
  tags?: string[];
  source?: string;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  maxFileSize: number;
  maxFiles: number;
  logDirectory: string;
  remoteEndpoint?: string;
  remoteApiKey?: string;
  enableStructuredLogging: boolean;
  enableColorOutput: boolean;
}

interface LogTransport {
  name: string;
  log(entry: LogEntry): Promise<void> | void;
  close?(): Promise<void> | void;
}

/**
 * Console transport with color support
 */
class ConsoleTransport implements LogTransport {
  name = 'console';
  private enableColors: boolean;

  constructor(enableColors = true) {
    this.enableColors = enableColors;
  }

  log(entry: LogEntry): void {
    const { timestamp, level, message, data, requestId, userId, path, method } = entry;

    let colorCode = '';
    let resetCode = '';

    if (this.enableColors) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        fatal: '\x1b[35m', // Magenta
      };
      colorCode = colors[level] || '';
      resetCode = '\x1b[0m';
    }

    const prefix = `${colorCode}[${timestamp}] ${level.toUpperCase()}${resetCode}`;
    const context = [];

    if (requestId) context.push(`req:${requestId}`);
    if (userId) context.push(`user:${userId}`);
    if (method && path) context.push(`${method} ${path}`);

    const contextStr = context.length > 0 ? ` [${context.join(' | ')}]` : '';
    const logMessage = `${prefix}${contextStr}: ${message}`;

    if (data && Object.keys(data).length > 0) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    if (entry.stack && level === 'error') {
      console.log(entry.stack);
    }
  }
}

/**
 * File transport with rotation
 */
class FileTransport implements LogTransport {
  name = 'file';
  private logDirectory: string;
  private maxFileSize: number;
  private maxFiles: number;
  private currentFile: string;
  private currentSize = 0;

  constructor(logDirectory: string, maxFileSize = 10 * 1024 * 1024, maxFiles = 5) {
    this.logDirectory = logDirectory;
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.currentFile = this.getCurrentLogFile();
    this.ensureLogDirectory();
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      const logLine = JSON.stringify(entry) + '\n';

      // Check if we need to rotate the log file
      if (this.currentSize + logLine.length > this.maxFileSize) {
        await this.rotateLogFile();
      }

      // Write to current log file
      const fs = await import('fs/promises');
      await fs.appendFile(this.currentFile, logLine);
      this.currentSize += logLine.length;
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private getCurrentLogFile(): string {
    const date = new Date().toISOString().split('T')[0];
    return `${this.logDirectory}/app-${date}.log`;
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.mkdir(this.logDirectory, { recursive: true });

      // Get current file size if it exists
      try {
        const stats = await fs.stat(this.currentFile);
        this.currentSize = stats.size;
      } catch {
        this.currentSize = 0;
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private async rotateLogFile(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      // Get all log files
      const files = await fs.readdir(this.logDirectory);
      const logFiles = files
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .sort()
        .reverse();

      // Remove old files if we have too many
      if (logFiles.length >= this.maxFiles) {
        const filesToDelete = logFiles.slice(this.maxFiles - 1);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(this.logDirectory, file));
        }
      }

      // Create new log file
      this.currentFile = this.getCurrentLogFile();
      this.currentSize = 0;
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  async close(): Promise<void> {
    // File transport doesn't need explicit closing
  }
}

/**
 * Remote transport for sending logs to external services
 */
class RemoteTransport implements LogTransport {
  name = 'remote';
  private endpoint: string;
  private apiKey?: string;
  private buffer: LogEntry[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private timer?: NodeJS.Timeout;

  constructor(endpoint: string, apiKey?: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.startBatchTimer();
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private startBatchTimer(): void {
    this.timer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      // Put logs back in buffer for retry
      this.buffer.unshift(...logs);
    }
  }

  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.flush();
  }
}

/**
 * Main Logger class
 */
class Logger {
  private config: LoggerConfig;
  private transports: LogTransport[] = [];
  private context: Partial<LogEntry> = {};

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      logDirectory: './logs',
      enableStructuredLogging: true,
      enableColorOutput: true,
      ...config,
    };

    this.initializeTransports();
  }

  private initializeTransports(): void {
    // Console transport
    if (this.config.enableConsole) {
      this.transports.push(new ConsoleTransport(this.config.enableColorOutput));
    }

    // File transport
    if (this.config.enableFile) {
      this.transports.push(
        new FileTransport(this.config.logDirectory, this.config.maxFileSize, this.config.maxFiles)
      );
    }

    // Remote transport
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.transports.push(
        new RemoteTransport(this.config.remoteEndpoint, this.config.remoteApiKey)
      );
    }
  }

  /**
   * Set context that will be included in all log entries
   */
  setContext(context: Partial<LogEntry>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Partial<LogEntry>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4,
    };

    return levels[level] >= levels[this.config.level];
  }

  /**
   * Log a message
   */
  private async log(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: error?.stack,
      ...this.context,
    };

    // Send to all transports
    const promises = this.transports.map(transport => {
      try {
        return transport.log(entry);
      } catch (error) {
        console.error(`Transport ${transport.name} failed:`, error);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Debug level logging
   */
  debug(message: string, data?: Record<string, any>): Promise<void> {
    return this.log('debug', message, data);
  }

  /**
   * Info level logging
   */
  info(message: string, data?: Record<string, any>): Promise<void> {
    return this.log('info', message, data);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: Record<string, any>): Promise<void> {
    return this.log('warn', message, data);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, data?: Record<string, any>): Promise<void> {
    return this.log('error', message, data, error);
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, error?: Error, data?: Record<string, any>): Promise<void> {
    return this.log('fatal', message, data, error);
  }

  /**
   * Close all transports
   */
  async close(): Promise<void> {
    const promises = this.transports.map(transport => {
      if (transport.close) {
        return transport.close();
      }
      return Promise.resolve();
    });

    await Promise.allSettled(promises);
  }
}

/**
 * Create logger configuration from environment variables
 */
function createLoggerConfig(): LoggerConfig {
  return {
    level: (process.env.LOG_LEVEL as LogLevel) || 'info',
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE === 'true',
    enableRemote: process.env.LOG_REMOTE === 'true',
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760'), // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
    logDirectory: process.env.LOG_DIRECTORY || './logs',
    remoteEndpoint: process.env.LOG_REMOTE_ENDPOINT,
    remoteApiKey: process.env.LOG_REMOTE_API_KEY,
    enableStructuredLogging: process.env.LOG_STRUCTURED !== 'false',
    enableColorOutput: process.env.LOG_COLORS !== 'false' && process.env.NODE_ENV !== 'production',
  };
}

// Global logger instance
export const logger = new Logger(createLoggerConfig());

// Export types and classes for custom implementations
export { ConsoleTransport, FileTransport, Logger, RemoteTransport };
export type { LogEntry, LogLevel, LogTransport, LoggerConfig };

// Convenience functions
export const log = {
  debug: (message: string, data?: Record<string, any>) => logger.debug(message, data),
  info: (message: string, data?: Record<string, any>) => logger.info(message, data),
  warn: (message: string, data?: Record<string, any>) => logger.warn(message, data),
  error: (message: string, error?: Error, data?: Record<string, any>) =>
    logger.error(message, error, data),
  fatal: (message: string, error?: Error, data?: Record<string, any>) =>
    logger.fatal(message, error, data),
};

// Request logging middleware helper
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    userId,
    source: 'middleware',
  });
}

// Error logging helper
export function logError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, error, {
    name: error.name,
    ...context,
  });
}

// Performance logging helper
export function logPerformance(operation: string, duration: number, context?: Record<string, any>) {
  logger.info(`Performance: ${operation}`, {
    duration,
    operation,
    ...context,
  });
}

// Security logging helper
export function logSecurity(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context?: Record<string, any>
) {
  const level = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
  const data = {
    event,
    severity,
    category: 'security',
    ...context,
  };

  if (level === 'error' || level === 'fatal') {
    logger[level](`Security: ${event}`, undefined, data);
  } else {
    logger[level](`Security: ${event}`, data);
  }
}
