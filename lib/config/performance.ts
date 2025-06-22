// Performance monitoring configuration
export let PERFORMANCE_CONFIG = {
  // Web Vitals monitoring
  webVitals: {
    enabled: true,
    sampleRate: 1.0, // Monitor 100% of page loads
    reportAllChanges: false, // Only report final values
    debug: process.env.NODE_ENV === 'development',
  },

  // Analytics endpoints
  endpoints: {
    webVitals: '/api/analytics/web-vitals',
    alerts: '/api/analytics/alerts',
    dashboard: '/api/analytics/dashboard',
  },

  // Performance thresholds (in milliseconds, except CLS)
  thresholds: {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
    DOM_CONTENT_LOADED: { good: 2000, poor: 4000 },
    LOAD_COMPLETE: { good: 3000, poor: 6000 },
    SLOW_RESOURCE: { good: 1000, poor: 3000 },
  },

  // Alert configuration
  alerts: {
    enabled: true,
    criticalThreshold: 50, // % of poor metrics to trigger critical alert
    warningThreshold: 25, // % of poor metrics to trigger warning alert
    checkInterval: 5 * 60 * 1000, // 5 minutes
    maxAlerts: 100, // Maximum number of alerts to keep
    alertRetention: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Data retention
  retention: {
    metrics: 7 * 24 * 60 * 60 * 1000, // 7 days
    alerts: 24 * 60 * 60 * 1000, // 24 hours
    dashboard: 60 * 60 * 1000, // 1 hour
  },

  // Rate limiting
  rateLimit: {
    webVitals: {
      maxRequests: 1000,
      windowMs: 60 * 1000, // 1 minute
    },
    alerts: {
      maxRequests: 60,
      windowMs: 60 * 1000, // 1 minute
    },
    dashboard: {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
    },
  },

  // Performance optimization
  optimization: {
    // Bundle analysis
    bundleAnalysis: {
      enabled: process.env.NODE_ENV === 'development',
      threshold: 250 * 1024, // 250KB warning threshold
      excludePatterns: ['/api/', '/_next/static/'],
    },

    // Resource monitoring
    resourceMonitoring: {
      enabled: true,
      slowResourceThreshold: 3000, // 3 seconds
      trackImages: true,
      trackScripts: true,
      trackStylesheets: true,
    },

    // Memory monitoring
    memoryMonitoring: {
      enabled: true,
      warningThreshold: 50 * 1024 * 1024, // 50MB
      criticalThreshold: 100 * 1024 * 1024, // 100MB
    },
  },

  // Feature flags
  features: {
    realTimeMonitoring: true,
    performanceDashboard: true,
    automaticOptimization: false,
    predictiveAnalytics: false,
    customMetrics: true,
  },

  // Development settings
  development: {
    verbose: process.env.NODE_ENV === 'development',
    mockData: false,
    debugMode: process.env.NODE_ENV === 'development',
  },
} as const;

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  // Production optimizations
  (PERFORMANCE_CONFIG.webVitals as any).debug = false;
  (PERFORMANCE_CONFIG.development as any).verbose = false;
  (PERFORMANCE_CONFIG.development as any).debugMode = false;
}

if (process.env.NODE_ENV === 'test') {
  // Test environment settings
  (PERFORMANCE_CONFIG.webVitals as any).enabled = false;
  (PERFORMANCE_CONFIG.alerts as any).enabled = false;
  (PERFORMANCE_CONFIG.development as any).mockData = true;
}

// Export individual configurations for easier imports
export const WEB_VITALS_CONFIG = PERFORMANCE_CONFIG.webVitals;
export const THRESHOLDS_CONFIG = PERFORMANCE_CONFIG.thresholds;
export const ALERTS_CONFIG = PERFORMANCE_CONFIG.alerts;
export const RETENTION_CONFIG = PERFORMANCE_CONFIG.retention;
export const RATE_LIMIT_CONFIG = PERFORMANCE_CONFIG.rateLimit;
export const OPTIMIZATION_CONFIG = PERFORMANCE_CONFIG.optimization;
export const FEATURES_CONFIG = PERFORMANCE_CONFIG.features;

// Helper functions
export const isFeatureEnabled = (feature: keyof typeof PERFORMANCE_CONFIG.features): boolean => {
  return PERFORMANCE_CONFIG.features[feature];
};

export const getThreshold = (metric: string, type: 'good' | 'poor') => {
  const thresholds =
    PERFORMANCE_CONFIG.thresholds[metric as keyof typeof PERFORMANCE_CONFIG.thresholds];
  return thresholds ? thresholds[type] : null;
};

export const getRateLimit = (endpoint: keyof typeof PERFORMANCE_CONFIG.rateLimit) => {
  return PERFORMANCE_CONFIG.rateLimit[endpoint];
};

export default PERFORMANCE_CONFIG;
