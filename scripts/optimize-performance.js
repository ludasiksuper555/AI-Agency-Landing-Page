#!/usr/bin/env node

/**
 * Performance Optimization Script
 * Автоматизує оптимізацію продуктивності для Next.js додатку
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceOptimizer {
  constructor() {
    this.projectRoot = process.cwd();
    this.optimizations = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Оптимізація Next.js конфігурації
  optimizeNextConfig() {
    this.log('Оптимізація Next.js конфігурації...');

    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');

    if (!fs.existsSync(nextConfigPath)) {
      this.log('next.config.js не знайдено, створюємо оптимізований файл', 'error');
      return;
    }

    const optimizedConfig = `
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимізація продуктивності
  swcMinify: true,
  compress: true,
  poweredByHeader: false,

  // Оптимізація зображень
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Webpack оптимізації
  webpack: (config, { dev, isServer }) => {
    // Оптимізація для продакшену
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\\/]node_modules[\\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },

  // Заголовки для кешування
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
`;

    try {
      // Backup original config
      const backupPath = nextConfigPath + '.backup';
      fs.copyFileSync(nextConfigPath, backupPath);

      // Write optimized config
      fs.writeFileSync(nextConfigPath, optimizedConfig);

      this.optimizations.push('Next.js конфігурація оптимізована');
      this.log('Next.js конфігурація успішно оптимізована', 'success');
    } catch (error) {
      this.log(`Помилка при оптимізації Next.js конфігурації: ${error.message}`, 'error');
    }
  }

  // Створення middleware для кешування
  createCacheMiddleware() {
    this.log('Створення middleware для кешування...');

    const middlewarePath = path.join(this.projectRoot, 'middleware.ts');

    const middlewareContent = `
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Додавання заголовків для кешування статичних ресурсів
  if (request.nextUrl.pathname.startsWith('/static/') ||
      request.nextUrl.pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Додавання заголовків безпеки
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Compression headers
  if (request.headers.get('accept-encoding')?.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
`;

    try {
      fs.writeFileSync(middlewarePath, middlewareContent);
      this.optimizations.push('Middleware для кешування створено');
      this.log('Middleware для кешування успішно створено', 'success');
    } catch (error) {
      this.log(`Помилка при створенні middleware: ${error.message}`, 'error');
    }
  }

  // Оптимізація package.json скриптів
  optimizePackageScripts() {
    this.log('Оптимізація package.json скриптів...');

    const packagePath = path.join(this.projectRoot, 'package.json');

    if (!fs.existsSync(packagePath)) {
      this.log('package.json не знайдено', 'error');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Додавання оптимізованих скриптів
      packageJson.scripts = {
        ...packageJson.scripts,
        'build:analyze': 'cross-env ANALYZE=true npm run build',
        'build:prod': 'NODE_ENV=production npm run build',
        'start:prod': 'NODE_ENV=production npm start',
        'perf:lighthouse':
          'lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html',
        'perf:bundle': 'npm run build:analyze',
        optimize: 'node scripts/optimize-performance.js',
      };

      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

      this.optimizations.push('Package.json скрипти оптимізовано');
      this.log('Package.json скрипти успішно оптимізовано', 'success');
    } catch (error) {
      this.log(`Помилка при оптимізації package.json: ${error.message}`, 'error');
    }
  }

  // Створення файлу для моніторингу продуктивності
  createPerformanceMonitor() {
    this.log('Створення системи моніторингу продуктивності...');

    const monitorPath = path.join(this.projectRoot, 'utils', 'performance-monitor.ts');
    const utilsDir = path.dirname(monitorPath);

    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }

    const monitorContent = `
// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Array<{ name: string; value: number; timestamp: number }> = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Вимірювання часу виконання
  measureTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();

    this.addMetric(name, end - start);
    return result;
  }

  // Асинхронне вимірювання
  async measureAsyncTime<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();

    this.addMetric(name, end - start);
    return result;
  }

  // Додавання метрики
  private addMetric(name: string, value: number): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
    });

    // Зберігаємо тільки останні 1000 метрик
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Отримання статистики
  getStats(name?: string) {
    const filteredMetrics = name
      ? this.metrics.filter(m => m.name === name)
      : this.metrics;

    if (filteredMetrics.length === 0) return null;

    const values = filteredMetrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      average: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      total: sum,
    };
  }

  // Очищення метрик
  clearMetrics(): void {
    this.metrics = [];
  }

  // Експорт метрик
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Hook для React компонентів
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  return {
    measureTime: monitor.measureTime.bind(monitor),
    measureAsyncTime: monitor.measureAsyncTime.bind(monitor),
    getStats: monitor.getStats.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor),
  };
}

// Middleware для API routes
export function performanceMiddleware(handler: any) {
  return async (req: any, res: any) => {
    const monitor = PerformanceMonitor.getInstance();

    return monitor.measureAsyncTime(
      \`API_\${req.method}_\${req.url}\`,
      () => handler(req, res)
    );
  };
}
`;

    try {
      fs.writeFileSync(monitorPath, monitorContent);
      this.optimizations.push('Система моніторингу продуктивності створена');
      this.log('Система моніторингу продуктивності успішно створена', 'success');
    } catch (error) {
      this.log(`Помилка при створенні системи моніторингу: ${error.message}`, 'error');
    }
  }

  // Створення конфігурації для bundle analyzer
  createBundleAnalyzerConfig() {
    this.log('Створення конфігурації для аналізу bundle...');

    const analyzerConfigPath = path.join(this.projectRoot, 'analyze-bundle.js');

    const analyzerConfig = `
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }
    return config;
  },
};
`;

    try {
      fs.writeFileSync(analyzerConfigPath, analyzerConfig);
      this.optimizations.push('Конфігурація bundle analyzer створена');
      this.log('Конфігурація bundle analyzer успішно створена', 'success');
    } catch (error) {
      this.log(`Помилка при створенні конфігурації analyzer: ${error.message}`, 'error');
    }
  }

  // Запуск всіх оптимізацій
  async runAllOptimizations() {
    this.log('🚀 Початок оптимізації продуктивності...');

    this.optimizeNextConfig();
    this.createCacheMiddleware();
    this.optimizePackageScripts();
    this.createPerformanceMonitor();
    this.createBundleAnalyzerConfig();

    this.log('\n📊 Звіт про оптимізацію:');
    this.optimizations.forEach((opt, index) => {
      this.log(`${index + 1}. ${opt}`, 'success');
    });

    this.log('\n🎉 Оптимізація продуктивності завершена!', 'success');
    this.log('\n📝 Рекомендації:');
    this.log('1. Запустіть npm run build:analyze для аналізу bundle');
    this.log('2. Використовуйте npm run perf:lighthouse для аудиту Lighthouse');
    this.log('3. Моніторьте продуктивність за допомогою utils/performance-monitor.ts');
  }
}

// Запуск скрипта
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  optimizer.runAllOptimizations().catch(console.error);
}

module.exports = PerformanceOptimizer;
