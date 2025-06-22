import * as Sentry from '@sentry/nextjs';
import { addSentryBreadcrumb, setSentryContext } from './sentryConfig';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories for better organization
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  API = 'api',
  NETWORK = 'network',
  UI = 'ui',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UNKNOWN = 'unknown',
}

// Enhanced error interface
export interface EnhancedError {
  message: string;
  stack?: string;
  code?: string | number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: number;
  context?: Record<string, any>;
  fingerprint?: string[];
}

// Error logger class
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: EnhancedError[] = [];
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  // Main error logging method
  public async logError(
    error: Error | EnhancedError,
    context?: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      userId?: string;
      sessionId?: string;
      additionalContext?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const enhancedError = this.enhanceError(error, context);

      // Add to queue for batch processing
      this.errorQueue.push(enhancedError);

      // Process immediately for critical errors
      if (enhancedError.severity === ErrorSeverity.CRITICAL) {
        await this.processErrorQueue();
      } else {
        // Process queue periodically for non-critical errors
        this.scheduleQueueProcessing();
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Enhanced Error Log:', enhancedError);
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Enhanced error processing
  private enhanceError(error: Error | EnhancedError, context?: any): EnhancedError {
    const isEnhancedError = 'severity' in error;

    if (isEnhancedError) {
      return error as EnhancedError;
    }

    const baseError = error as Error;
    const severity = context?.severity || this.determineSeverity(baseError);
    const category = context?.category || this.determineCategory(baseError);

    return {
      message: baseError.message,
      stack: baseError.stack,
      severity,
      category,
      userId: context?.userId,
      sessionId: context?.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: Date.now(),
      context: context?.additionalContext,
      fingerprint: this.generateFingerprint(baseError, category),
    };
  }

  // Determine error severity based on error characteristics
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical errors
    if (
      message.includes('security') ||
      message.includes('unauthorized') ||
      message.includes('csrf') ||
      stack.includes('auth')
    ) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('500')
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (message.includes('validation') || message.includes('400') || message.includes('404')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  // Determine error category based on error characteristics
  private determineCategory(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('auth') || stack.includes('auth')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('database') || message.includes('sql')) {
      return ErrorCategory.DATABASE;
    }
    if (message.includes('api') || message.includes('endpoint')) {
      return ErrorCategory.API;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('render') || message.includes('component')) {
      return ErrorCategory.UI;
    }
    if (message.includes('performance') || message.includes('slow')) {
      return ErrorCategory.PERFORMANCE;
    }
    if (message.includes('security') || message.includes('csrf')) {
      return ErrorCategory.SECURITY;
    }

    return ErrorCategory.UNKNOWN;
  }

  // Generate fingerprint for error grouping
  private generateFingerprint(error: Error, category: ErrorCategory): string[] {
    const baseFingerprint = [category, error.name];

    // Add specific identifiers based on error type
    if (error.stack) {
      const stackLines = error.stack.split('\n').slice(0, 3);
      const relevantLine = stackLines.find(
        line => line.includes('.tsx') || line.includes('.ts') || line.includes('.js')
      );

      if (relevantLine) {
        const match = relevantLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          baseFingerprint.push(`${match[2]}:${match[3]}`);
        }
      }
    }

    return baseFingerprint;
  }

  // Process error queue
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const errorsToProcess = [...this.errorQueue];
      this.errorQueue = [];

      for (const error of errorsToProcess) {
        await this.sendToSentry(error);
        await this.sendToLocalAPI(error);
      }
    } catch (processingError) {
      console.error('Error processing queue:', processingError);
    } finally {
      this.isProcessing = false;
    }
  }

  // Send error to Sentry with enhanced context
  private async sendToSentry(error: EnhancedError): Promise<void> {
    try {
      // Set context for this error
      setSentryContext({
        user: error.userId ? { id: error.userId } : undefined,
        tags: {
          severity: error.severity,
          category: error.category,
          ...(error.sessionId && { sessionId: error.sessionId }),
        },
        extra: {
          ...error.context,
          url: error.url,
          userAgent: error.userAgent,
          timestamp: error.timestamp,
        },
      });

      // Add breadcrumb
      addSentryBreadcrumb({
        message: `Error occurred: ${error.category}`,
        category: 'error',
        level: this.mapSeverityToSentryLevel(error.severity),
        data: {
          errorCode: error.code,
          category: error.category,
        },
      });

      // Capture exception with fingerprint
      Sentry.captureException(new Error(error.message), {
        fingerprint: error.fingerprint,
        level: this.mapSeverityToSentryLevel(error.severity),
        extra: {
          enhancedError: error,
        },
      });
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  // Send error to local API endpoint
  private async sendToLocalAPI(error: EnhancedError): Promise<void> {
    try {
      if (typeof fetch !== 'undefined') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            severity: error.severity,
            category: error.category,
            userId: error.userId,
            sessionId: error.sessionId,
            url: error.url,
            userAgent: error.userAgent,
            timestamp: error.timestamp,
            context: error.context,
          }),
        });
      }
    } catch (apiError) {
      console.error('Failed to send error to local API:', apiError);
    }
  }

  // Map severity to Sentry level
  private mapSeverityToSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  // Schedule periodic queue processing
  private scheduleQueueProcessing(): void {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.processErrorQueue();
      }, 5000); // Process every 5 seconds
    }
  }

  // Public method to flush all pending errors
  public async flush(): Promise<void> {
    await this.processErrorQueue();
  }
}

// Singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Convenience functions
export const logError = (error: Error, context?: any) => {
  return errorLogger.logError(error, context);
};

export const logCriticalError = (error: Error, context?: any) => {
  return errorLogger.logError(error, {
    ...context,
    severity: ErrorSeverity.CRITICAL,
  });
};

export const logSecurityError = (error: Error, context?: any) => {
  return errorLogger.logError(error, {
    ...context,
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.SECURITY,
  });
};
