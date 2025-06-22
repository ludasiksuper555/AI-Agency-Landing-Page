import * as Sentry from '@sentry/nextjs';

// Enhanced Sentry configuration for Stage 4
export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  enableUserFeedback: boolean;
  enablePerformanceMonitoring: boolean;
}

// Default configuration
const defaultConfig: Partial<SentryConfig> = {
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enableUserFeedback: true,
  enablePerformanceMonitoring: true,
};

// Initialize enhanced Sentry configuration
export const initEnhancedSentry = (config?: Partial<SentryConfig>) => {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('Sentry DSN not found. Error tracking will be disabled.');
    return;
  }

  const finalConfig = {
    ...defaultConfig,
    ...config,
    dsn: sentryDsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version,
  };

  Sentry.init({
    dsn: finalConfig.dsn,
    environment: finalConfig.environment,
    release: finalConfig.release,
    tracesSampleRate: finalConfig.tracesSampleRate,

    // Enhanced integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Performance monitoring for web vitals
        tracePropagationTargets: ['localhost', /^https:\/\/yourapi\.domain\.com\/api/],
      }),

      // Session replay for better debugging
      new Sentry.Replay({
        maskAllText: process.env.NODE_ENV === 'production',
        blockAllMedia: true,
        sessionSampleRate: finalConfig.replaysSessionSampleRate,
        errorSampleRate: finalConfig.replaysOnErrorSampleRate,
      }),

      // User feedback integration
      ...(finalConfig.enableUserFeedback
        ? [
            new Sentry.Feedback({
              colorScheme: 'system',
              showBranding: false,
            }),
          ]
        : []),
    ],

    // Enhanced error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;

      if (error instanceof Error) {
        // Skip network errors that are not actionable
        if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
          return null;
        }

        // Skip ResizeObserver errors (common browser quirk)
        if (error.message.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
      }

      return event;
    },

    // Enhanced performance monitoring
    ...(finalConfig.enablePerformanceMonitoring && {
      profilesSampleRate: 0.1,
    }),
  });

  console.log(`Sentry initialized for ${finalConfig.environment} environment`);
};

// Enhanced error context setting
export const setSentryContext = (context: {
  user?: {
    id: string;
    email?: string;
    username?: string;
    role?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}) => {
  if (context.user) {
    Sentry.setUser(context.user);
  }

  if (context.tags) {
    Sentry.setTags(context.tags);
  }

  if (context.extra) {
    Sentry.setExtras(context.extra);
  }
};

// Clear Sentry context
export const clearSentryContext = () => {
  Sentry.setUser(null);
  Sentry.setTags({});
  Sentry.setExtras({});
};

// Enhanced breadcrumb logging
export const addSentryBreadcrumb = ({
  message,
  category = 'custom',
  level = 'info',
  data,
}: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

export default Sentry;
