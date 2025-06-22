/**
 * Enhanced Team Portfolio - Performance Configuration
 * Comprehensive performance monitoring and optimization settings
 */

const performanceConfig = {
  // =============================================================================
  // CORE PERFORMANCE SETTINGS
  // =============================================================================

  // Bundle Analysis
  bundleAnalysis: {
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: false,
    analyzerMode: 'static',
    reportFilename: 'bundle-analysis.html',
    defaultSizes: 'gzip',
    generateStatsFile: true,
    statsFilename: 'bundle-stats.json',
  },

  // Code Splitting
  codeSplitting: {
    chunks: 'all',
    minSize: 20000,
    maxSize: 244000,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      },
      common: {
        name: 'common',
        minChunks: 2,
        chunks: 'all',
        priority: 5,
        reuseExistingChunk: true,
      },
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
        name: 'react',
        chunks: 'all',
        priority: 20,
      },
      ui: {
        test: /[\\/]node_modules[\\/](@chakra-ui|framer-motion)[\\/]/,
        name: 'ui',
        chunks: 'all',
        priority: 15,
      },
    },
  },

  // Image Optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    quality: 80,
    sizes: [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'images.unsplash.com',
      'cdn.yourdomain.com',
      'res.cloudinary.com',
      'assets.contentful.com',
    ],
    loader: 'default',
    path: '/_next/image',
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60,
    disableStaticImages: false,
  },

  // Caching Strategy
  caching: {
    // Static assets cache duration (1 year)
    staticAssets: 31536000,
    // API responses cache duration (5 minutes)
    apiResponses: 300,
    // Page cache duration (1 hour)
    pages: 3600,
    // Image cache duration (1 week)
    images: 604800,
    // Font cache duration (1 year)
    fonts: 31536000,
  },

  // =============================================================================
  // MONITORING AND METRICS
  // =============================================================================

  // Web Vitals Thresholds
  webVitals: {
    // Largest Contentful Paint (LCP) - should be <= 2.5s
    lcp: {
      good: 2500,
      needsImprovement: 4000,
    },
    // First Input Delay (FID) - should be <= 100ms
    fid: {
      good: 100,
      needsImprovement: 300,
    },
    // Cumulative Layout Shift (CLS) - should be <= 0.1
    cls: {
      good: 0.1,
      needsImprovement: 0.25,
    },
    // First Contentful Paint (FCP) - should be <= 1.8s
    fcp: {
      good: 1800,
      needsImprovement: 3000,
    },
    // Time to First Byte (TTFB) - should be <= 600ms
    ttfb: {
      good: 600,
      needsImprovement: 1500,
    },
  },

  // Performance Budget
  budget: {
    // Maximum bundle size (in KB)
    maxBundleSize: 500,
    // Maximum initial load size (in KB)
    maxInitialSize: 200,
    // Maximum individual chunk size (in KB)
    maxChunkSize: 100,
    // Maximum number of requests
    maxRequests: 50,
    // Maximum image size (in KB)
    maxImageSize: 500,
    // Maximum font size (in KB)
    maxFontSize: 100,
  },

  // Lighthouse Configuration
  lighthouse: {
    ci: {
      collect: {
        url: ['http://localhost:3000', 'http://localhost:3000/team', 'http://localhost:3000/about'],
        numberOfRuns: 3,
        settings: {
          chromeFlags: '--no-sandbox --disable-dev-shm-usage',
          preset: 'desktop',
        },
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.95 }],
          'categories:best-practices': ['error', { minScore: 0.9 }],
          'categories:seo': ['error', { minScore: 0.9 }],
          'categories:pwa': ['warn', { minScore: 0.8 }],
        },
      },
      upload: {
        target: 'temporary-public-storage',
      },
    },
  },

  // =============================================================================
  // OPTIMIZATION STRATEGIES
  // =============================================================================

  // Preloading Strategy
  preloading: {
    // Critical resources to preload
    critical: ['/fonts/inter-var.woff2', '/api/team'],
    // Resources to prefetch
    prefetch: ['/api/stats', '/api/departments'],
    // DNS prefetch domains
    dnsPrefetch: ['fonts.googleapis.com', 'fonts.gstatic.com', 'api.yourdomain.com'],
  },

  // Compression Settings
  compression: {
    gzip: {
      enabled: true,
      level: 6,
      threshold: 1024,
      types: [
        'text/plain',
        'text/css',
        'text/xml',
        'text/javascript',
        'application/javascript',
        'application/xml+rss',
        'application/json',
        'image/svg+xml',
      ],
    },
    brotli: {
      enabled: true,
      quality: 6,
      threshold: 1024,
    },
  },

  // Service Worker Configuration
  serviceWorker: {
    enabled: process.env.NODE_ENV === 'production',
    scope: '/',
    cacheFirst: ['/static/', '/_next/static/', '/fonts/', '/images/'],
    networkFirst: ['/api/'],
    staleWhileRevalidate: ['/', '/team', '/about'],
    cacheOnly: ['/offline'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-stylesheets',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-webfonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
    ],
  },

  // =============================================================================
  // DEVELOPMENT PERFORMANCE
  // =============================================================================

  // Development Optimization
  development: {
    // Fast refresh settings
    fastRefresh: {
      enabled: true,
      logLevel: 'error',
    },
    // Hot module replacement
    hmr: {
      enabled: true,
      overlay: true,
    },
    // Source maps
    sourceMaps: {
      enabled: true,
      type: 'eval-source-map',
    },
    // Bundle analysis in development
    bundleAnalysis: {
      enabled: false,
      openAnalyzer: false,
    },
  },

  // =============================================================================
  // PRODUCTION OPTIMIZATION
  // =============================================================================

  // Production Settings
  production: {
    // Minification
    minification: {
      enabled: true,
      removeConsole: true,
      removeDebugger: true,
      dropDeadCode: true,
    },
    // Tree shaking
    treeShaking: {
      enabled: true,
      sideEffects: false,
    },
    // Source maps
    sourceMaps: {
      enabled: true,
      type: 'source-map',
      exclude: /node_modules/,
    },
    // Asset optimization
    assets: {
      inlineLimit: 8192,
      assetPrefix: process.env.CDN_URL || '',
    },
  },

  // =============================================================================
  // MONITORING TOOLS
  // =============================================================================

  // Performance Monitoring Tools
  monitoring: {
    // Sentry Performance
    sentry: {
      enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      beforeSend: event => {
        // Filter out development errors
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      },
    },
    // Web Vitals Reporting
    webVitals: {
      enabled: true,
      reportingEndpoint: '/api/analytics/web-vitals',
      sampleRate: 1.0,
    },
    // Custom Performance Metrics
    customMetrics: {
      enabled: true,
      trackUserInteractions: true,
      trackApiCalls: true,
      trackPageTransitions: true,
    },
  },

  // =============================================================================
  // EXPERIMENTAL FEATURES
  // =============================================================================

  // Experimental Optimizations
  experimental: {
    // React 18 features
    reactRoot: true,
    // Concurrent features
    concurrentFeatures: true,
    // Server components
    serverComponents: false,
    // Edge runtime
    runtime: 'nodejs',
    // App directory
    appDir: false,
    // Turbopack (development)
    turbo: {
      enabled: false,
      loaders: {},
      resolveAlias: {},
    },
  },

  // =============================================================================
  // UTILITIES
  // =============================================================================

  // Performance Utilities
  utils: {
    // Measure performance
    measurePerformance: (name, fn) => {
      if (typeof window !== 'undefined' && window.performance) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
      }
      return fn();
    },

    // Report web vitals
    reportWebVitals: metric => {
      if (performanceConfig.monitoring.webVitals.enabled) {
        // Send to analytics endpoint
        fetch(performanceConfig.monitoring.webVitals.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metric),
        }).catch(console.error);
      }
    },

    // Get performance budget status
    getBudgetStatus: () => {
      const budget = performanceConfig.budget;
      return {
        maxBundleSize: budget.maxBundleSize,
        maxInitialSize: budget.maxInitialSize,
        maxChunkSize: budget.maxChunkSize,
        maxRequests: budget.maxRequests,
        maxImageSize: budget.maxImageSize,
        maxFontSize: budget.maxFontSize,
      };
    },

    // Check if performance budget is exceeded
    isBudgetExceeded: (actualSize, budgetKey) => {
      const budget = performanceConfig.budget[budgetKey];
      return actualSize > budget;
    },
  },
};

// Export configuration
module.exports = performanceConfig;

// Export for ES modules
module.exports.default = performanceConfig;
