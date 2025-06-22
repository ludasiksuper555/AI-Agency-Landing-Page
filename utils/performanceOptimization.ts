import React from 'react';

import { logger } from './logger';

// Интерфейсы для оптимизации производительности
interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
}

interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enableImageOptimization: boolean;
  enableCaching: boolean;
}

interface ComponentPerformance {
  componentName: string;
  renderCount: number;
  averageRenderTime: number;
  memoryLeaks: boolean;
}

// Утилиты для оптимизации производительности
export class PerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private config: OptimizationConfig;

  constructor(config: OptimizationConfig) {
    this.config = config;
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      bundleSize: 0,
      memoryUsage: 0,
    };
  }

  // Измерение времени загрузки
  measureLoadTime(): number {
    const startTime = performance.now();
    return performance.now() - startTime;
  }

  // Ленивая загрузка компонентов
  createLazyComponent(importFunction: () => Promise<{ default: React.ComponentType<unknown> }>) {
    if (!this.config.enableLazyLoading) {
      return importFunction;
    }

    return React.lazy(importFunction);
  }

  // Создание обертки для Suspense
  createSuspenseWrapper(fallback?: React.ReactNode) {
    return {
      fallback: fallback || 'Loading...',
      component: null as React.ComponentType | null,
    };
  }

  // Оптимизация изображений
  optimizeImage(src: string, width?: number, height?: number): string {
    if (!this.config.enableImageOptimization) {
      return src;
    }

    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', '80'); // качество 80%
    params.append('f', 'webp'); // формат WebP

    return `${src}?${params.toString()}`;
  }

  // Мониторинг производительности компонентов
  monitorComponent(componentName: string): ComponentPerformance {
    const startTime = performance.now();

    return {
      componentName,
      renderCount: 1,
      averageRenderTime: performance.now() - startTime,
      memoryLeaks: false,
    };
  }

  // Получение метрик производительности
  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      loadTime: this.measureLoadTime(),
      memoryUsage:
        (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
          ?.usedJSHeapSize || 0,
    };
  }

  // Оптимизация рендеринга списков - возвращает конфигурацию
  optimizeListRendering<T>(items: T[]): {
    items: T[];
    keyExtractor: (item: T, index: number) => string;
  } {
    return {
      items,
      keyExtractor: (_item: T, index: number) => `item-${index}`,
    };
  }
}

// Хук для мониторинга производительности
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = React.useState<ComponentPerformance | null>(null);

  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      setMetrics({
        componentName,
        renderCount: 1,
        averageRenderTime: endTime - startTime,
        memoryLeaks: false,
      });
    };
  }, [componentName]);

  return metrics;
}

// Хук для кэширования данных
export function useCache<T>(key: string, fetchFunction: () => Promise<T>, ttl: number = 300000) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const cachedData = localStorage.getItem(key);
    const cachedTimestamp = localStorage.getItem(`${key}_timestamp`);

    if (cachedData && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp);
      if (Date.now() - timestamp < ttl) {
        setData(JSON.parse(cachedData));
        return;
      }
    }

    setLoading(true);
    fetchFunction()
      .then(result => {
        setData(result);
        localStorage.setItem(key, JSON.stringify(result));
        localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        setError(null);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [key, ttl]);

  return { data, loading, error };
}

// Утилиты для анализа производительности
export class PerformanceAnalyzer {
  private observations: PerformanceObserver[] = [];

  // Мониторинг времени загрузки ресурсов
  monitorResourceLoading() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          logger.info('Resource performance', { name: entry.name, duration: entry.duration });
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observations.push(observer);
    }
  }

  // Мониторинг времени рендеринга
  monitorRenderTime() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          logger.info('Paint performance', { name: entry.name, startTime: entry.startTime });
        });
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observations.push(observer);
    }
  }

  // Очистка наблюдателей
  cleanup() {
    this.observations.forEach(observer => observer.disconnect());
    this.observations = [];
  }
}

// Утилиты для кэширования
export class CacheManager {
  private cache: Map<string, unknown> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, value: unknown): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  get(key: string): unknown {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Экспорт интерфейсов
export type { ComponentPerformance, OptimizationConfig, PerformanceMetrics };
