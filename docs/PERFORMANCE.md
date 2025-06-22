# Руководство по производительности

## Обзор

Этот документ описывает стратегии оптимизации производительности, инструменты мониторинга и лучшие практики для AI Agency Landing Page.

## 🎯 Цели производительности

### Core Web Vitals

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Дополнительные метрики

- **FCP (First Contentful Paint)**: < 1.8s
- **TTI (Time to Interactive)**: < 3.8s
- **TBT (Total Blocking Time)**: < 200ms
- **Speed Index**: < 3.4s

### Lighthouse Score

- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 95+
- **PWA**: 90+

## 🔧 Инструменты мониторинга

### Lighthouse CI

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/services',
        'http://localhost:3000/about',
        'http://localhost:3000/contact',
      ],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'ready on',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:pwa': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Additional metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        interactive: ['warn', { maxNumericValue: 3800 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: './lighthouse-reports',
    },
  },
};
```

### Web Vitals мониторинг

```typescript
// lib/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Отправка метрик в Google Analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }

  // Отправка в собственную аналитику
  fetch('/api/analytics/web-vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now(),
    }),
  }).catch(console.error);
}

export function initWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

### Performance Observer

```typescript
// lib/performance-observer.ts
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initObserver();
    }
  }

  private initObserver() {
    this.observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        this.handlePerformanceEntry(entry);
      }
    });

    // Наблюдение за различными типами метрик
    this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.handleNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.handlePaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.handleLCPEntry(entry);
        break;
    }
  }

  private handleNavigationEntry(entry: PerformanceNavigationTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.connectEnd - entry.secureConnectionStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domParse: entry.domContentLoadedEventStart - entry.responseEnd,
      domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
    };

    this.sendMetrics('navigation', metrics);
  }

  private handlePaintEntry(entry: PerformancePaintTiming) {
    this.sendMetrics('paint', {
      name: entry.name,
      startTime: entry.startTime,
    });
  }

  private handleLCPEntry(entry: any) {
    this.sendMetrics('lcp', {
      startTime: entry.startTime,
      size: entry.size,
      element: entry.element?.tagName,
    });
  }

  private sendMetrics(type: string, data: any) {
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, timestamp: Date.now() }),
    }).catch(console.error);
  }

  public disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
```

## 🚀 Оптимизация загрузки

### Next.js оптимизации

```typescript
// next.config.js
const nextConfig = {
  // Сжатие
  compress: true,

  // Оптимизация изображений
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 дней
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Экспериментальные функции
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    legacyBrowsers: false,
    browsersListForSwc: true,
  },

  // Webpack оптимизации
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Анализ бандла
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }

      // Оптимизация разделения кода
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // Headers для кеширования
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
```

### Динамические импорты

```typescript
// components/LazyComponent.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Ленивая загрузка компонентов
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
  ssr: false, // Отключить SSR для клиентских компонентов
});

const Modal = dynamic(() => import('./Modal'), {
  loading: () => <div>Loading...</div>,
});

// Предзагрузка критических компонентов
const CriticalComponent = dynamic(() => import('./CriticalComponent'), {
  loading: () => <div>Loading...</div>,
});

// Использование с Suspense
export function ComponentWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CriticalComponent />
    </Suspense>
  );
}
```

### Оптимизация изображений

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={85}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        onLoadingComplete={() => setIsLoading(false)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoading ? 0 : 1,
        }}
      />
    </div>
  );
}

// Компонент для hero изображений
export function HeroImage({ src, alt }: { src: string; alt: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      priority={true}
      className="w-full h-screen object-cover"
    />
  );
}
```

### Предзагрузка ресурсов

```typescript
// components/ResourcePreloader.tsx
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function ResourcePreloader() {
  const router = useRouter();

  useEffect(() => {
    // Предзагрузка критических маршрутов
    router.prefetch('/services');
    router.prefetch('/about');
    router.prefetch('/contact');
  }, [router]);

  return (
    <Head>
      {/* Предзагрузка критических ресурсов */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />

      {/* Предзагрузка критических изображений */}
      <link
        rel="preload"
        href="/images/hero-bg.webp"
        as="image"
        type="image/webp"
      />

      {/* DNS предзагрузка */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />

      {/* Предподключение к критическим доменам */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Head>
  );
}
```

## 🎨 Оптимизация рендеринга

### React оптимизации

```typescript
// hooks/useOptimizedState.ts
import { useCallback, useMemo, useState } from 'react';
import { debounce } from 'lodash';

export function useOptimizedSearch(initialValue = '') {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  // Дебаунсинг для поиска
  const debouncedSetSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchTerm(value);
      }, 300),
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      debouncedSetSearch(value);
    },
    [debouncedSetSearch]
  );

  return {
    searchTerm,
    debouncedSearchTerm,
    handleSearchChange,
  };
}

// Мемоизация дорогих вычислений
export function useExpensiveCalculation(data: any[]) {
  return useMemo(() => {
    return data.reduce((acc, item) => {
      // Дорогие вычисления
      return acc + item.value * item.multiplier;
    }, 0);
  }, [data]);
}
```

### Виртуализация списков

```typescript
// components/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';

interface VirtualizedListProps {
  items: any[];
  height: number;
  itemHeight: number;
  renderItem: (props: any) => JSX.Element;
}

const VirtualizedList = memo(function VirtualizedList({
  items,
  height,
  itemHeight,
  renderItem,
}: VirtualizedListProps) {
  const Row = ({ index, style }: { index: number; style: any }) => (
    <div style={style}>
      {renderItem({ item: items[index], index })}
    </div>
  );

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={5}
    >
      {Row}
    </List>
  );
});

export default VirtualizedList;
```

### Intersection Observer для ленивой загрузки

```typescript
// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;

        if (isElementIntersecting && triggerOnce && !hasTriggered) {
          setIsIntersecting(true);
          setHasTriggered(true);
        } else if (!triggerOnce) {
          setIsIntersecting(isElementIntersecting);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref, isIntersecting };
}

// Компонент ленивой загрузки
export function LazySection({ children }: { children: React.ReactNode }) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  return (
    <div ref={ref}>
      {isIntersecting ? children : <div className="h-64 bg-gray-100" />}
    </div>
  );
}
```

## 📦 Оптимизация бандла

### Анализ размера бандла

```bash
# Анализ бандла
npm run analyze

# Проверка дублирующихся зависимостей
npx duplicate-package-checker-webpack-plugin

# Анализ с webpack-bundle-analyzer
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

### Tree shaking

```typescript
// utils/optimized-imports.ts

// ❌ Плохо - импортирует всю библиотеку
import _ from 'lodash';
import * as dateFns from 'date-fns';

// ✅ Хорошо - импортирует только нужные функции
import { debounce, throttle } from 'lodash';
import { format, parseISO } from 'date-fns';

// ✅ Еще лучше - используем babel-plugin-import
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

### Оптимизация зависимостей

```json
// package.json - оптимизированные зависимости
{
  "dependencies": {
    // Используем более легкие альтернативы
    "date-fns": "^2.29.0", // вместо moment.js
    "clsx": "^1.2.0", // вместо classnames
    "zustand": "^4.0.0", // вместо redux для простых случаев
    "swr": "^2.0.0" // легкая альтернатива react-query
  },
  "devDependencies": {
    "@next/bundle-analyzer": "^13.0.0",
    "webpack-bundle-analyzer": "^4.7.0"
  }
}
```

## 🗄️ Кеширование

### Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'ai-agency-v1';
const urlsToCache = ['/', '/static/css/main.css', '/static/js/main.js', '/images/logo.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Возвращаем кешированную версию или загружаем из сети
      return response || fetch(event.request);
    })
  );
});
```

### HTTP кеширование

```typescript
// pages/api/data.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Кеширование на 1 час
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  // ETag для условных запросов
  const etag = generateETag(data);
  res.setHeader('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.json(data);
}

function generateETag(data: any): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}
```

### Мемоизация API запросов

```typescript
// lib/api-cache.ts
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  ttl = 5 * 60 * 1000 // 5 минут
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  const response = await fetch(url, options);
  const data = await response.json();

  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl,
  });

  return data;
}

// Очистка устаревшего кеша
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // каждую минуту
```

## 🎭 Оптимизация CSS

### Critical CSS

```typescript
// lib/critical-css.ts
import { getCriticalCSS } from 'critical';

export async function generateCriticalCSS(html: string, css: string) {
  return getCriticalCSS({
    base: 'public/',
    html,
    css,
    width: 1300,
    height: 900,
    penthouse: {
      blockJSRequests: false,
    },
  });
}
```

### Tailwind CSS оптимизация

```javascript
// tailwind.config.js
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Только необходимые кастомные стили
    },
  },
  plugins: [],
  // Удаление неиспользуемых стилей
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    options: {
      safelist: ['dark'], // Классы, которые нужно сохранить
    },
  },
};
```

## 📱 Мобильная оптимизация

### Responsive Images

```typescript
// components/ResponsiveImage.tsx
import Image from 'next/image';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
}

export function ResponsiveImage({ src, alt, sizes }: ResponsiveImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
      style={{
        width: '100%',
        height: 'auto',
      }}
    />
  );
}
```

### Touch оптимизация

```css
/* styles/touch-optimization.css */

/* Увеличение области касания */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

/* Отключение выделения текста */
.no-select {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* Оптимизация скролла */
.smooth-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Отключение zoom при фокусе на input */
@media screen and (max-width: 768px) {
  input[type='text'],
  input[type='email'],
  input[type='tel'],
  textarea {
    font-size: 16px; /* Предотвращает zoom на iOS */
  }
}
```

## 🔍 Мониторинг в production

### Real User Monitoring (RUM)

```typescript
// lib/rum.ts
class RealUserMonitoring {
  private metrics: Map<string, number[]> = new Map();

  constructor() {
    this.initPerformanceObserver();
    this.initErrorTracking();
  }

  private initPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration || entry.startTime);
        }
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    }
  }

  private initErrorTracking() {
    window.addEventListener('error', event => {
      this.recordError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', event => {
      this.recordError({
        message: 'Unhandled Promise Rejection',
        reason: event.reason,
      });
    });
  }

  private recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  private recordError(error: any) {
    fetch('/api/analytics/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      }),
    }).catch(console.error);
  }

  public getMetrics() {
    const summary = new Map();

    for (const [name, values] of this.metrics.entries()) {
      summary.set(name, {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: this.percentile(values, 95),
      });
    }

    return summary;
  }

  private percentile(values: number[], p: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

export const rum = new RealUserMonitoring();
```

## 📊 Performance Budget

### Бюджет производительности

```json
// performance-budget.json
{
  "budget": {
    "javascript": "250kb",
    "css": "50kb",
    "images": "500kb",
    "fonts": "100kb",
    "total": "1mb"
  },
  "thresholds": {
    "fcp": 1800,
    "lcp": 2500,
    "fid": 100,
    "cls": 0.1,
    "tti": 3800
  }
}
```

### Автоматическая проверка бюджета

```javascript
// scripts/check-performance-budget.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const budget = require('../performance-budget.json');

function checkBundleSize() {
  const buildDir = '.next/static';
  const jsFiles = execSync(`find ${buildDir} -name "*.js" -type f`)
    .toString()
    .split('\n')
    .filter(Boolean);

  let totalJsSize = 0;

  jsFiles.forEach(file => {
    const stats = fs.statSync(file);
    totalJsSize += stats.size;
  });

  const totalJsSizeKb = Math.round(totalJsSize / 1024);
  const budgetKb = parseInt(budget.budget.javascript.replace('kb', ''));

  console.log(`JavaScript bundle size: ${totalJsSizeKb}kb`);
  console.log(`Budget: ${budgetKb}kb`);

  if (totalJsSizeKb > budgetKb) {
    console.error(`❌ JavaScript bundle exceeds budget by ${totalJsSizeKb - budgetKb}kb`);
    process.exit(1);
  } else {
    console.log(`✅ JavaScript bundle is within budget`);
  }
}

checkBundleSize();
```

## 🛠️ Инструменты разработки

### Performance профилирование

```typescript
// utils/performance-profiler.ts
export class PerformanceProfiler {
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start && end) {
      const duration = end - start;
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }

    return 0;
  }

  profile<T>(name: string, fn: () => T): T {
    this.mark(`${name}-start`);
    const result = fn();
    this.mark(`${name}-end`);
    this.measure(name, `${name}-start`, `${name}-end`);
    return result;
  }

  async profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.mark(`${name}-start`);
    const result = await fn();
    this.mark(`${name}-end`);
    this.measure(name, `${name}-start`, `${name}-end`);
    return result;
  }
}

export const profiler = new PerformanceProfiler();
```

## 📚 Лучшие практики

### Чек-лист оптимизации

- [ ] **Изображения**

  - [ ] Использование Next.js Image компонента
  - [ ] WebP/AVIF форматы
  - [ ] Правильные размеры и srcset
  - [ ] Ленивая загрузка
  - [ ] Оптимизация для Retina дисплеев

- [ ] **JavaScript**

  - [ ] Разделение кода (code splitting)
  - [ ] Tree shaking
  - [ ] Минификация
  - [ ] Удаление неиспользуемого кода
  - [ ] Оптимизация зависимостей

- [ ] **CSS**

  - [ ] Удаление неиспользуемых стилей
  - [ ] Critical CSS
  - [ ] CSS-in-JS оптимизация
  - [ ] Минификация

- [ ] **Загрузка**

  - [ ] Предзагрузка критических ресурсов
  - [ ] Ленивая загрузка некритических ресурсов
  - [ ] Service Worker кеширование
  - [ ] HTTP/2 Server Push

- [ ] **Рендеринг**
  - [ ] SSR/SSG оптимизация
  - [ ] Мемоизация компонентов
  - [ ] Виртуализация длинных списков
  - [ ] Оптимизация re-renders

### Мониторинг метрик

```typescript
// lib/performance-monitoring.ts
export const performanceConfig = {
  // Критические метрики
  critical: {
    lcp: 2500, // Largest Contentful Paint
    fid: 100, // First Input Delay
    cls: 0.1, // Cumulative Layout Shift
  },

  // Дополнительные метрики
  additional: {
    fcp: 1800, // First Contentful Paint
    tti: 3800, // Time to Interactive
    tbt: 200, // Total Blocking Time
    si: 3400, // Speed Index
  },

  // Бюджеты ресурсов
  budgets: {
    javascript: 250 * 1024, // 250KB
    css: 50 * 1024, // 50KB
    images: 500 * 1024, // 500KB
    fonts: 100 * 1024, // 100KB
    total: 1024 * 1024, // 1MB
  },
};
```

## 📞 Поддержка

По вопросам производительности:

- Email: performance@ai-agency.com
- Slack: #performance
- Документация: https://docs.ai-agency.com/performance
- Мониторинг: https://monitoring.ai-agency.com
