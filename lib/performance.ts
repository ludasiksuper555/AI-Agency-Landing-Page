// Performance optimization utilities

// Performance monitoring interfaces
export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: number;
  endpoint?: string;
  userId?: string;
}

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of items
  strategy: 'lru' | 'fifo' | 'lfu';
}

export interface OptimizationConfig {
  enableCaching: boolean;
  enableCompression: boolean;
  enableMinification: boolean;
  enableLazyLoading: boolean;
  cacheConfig: CacheConfig;
}

// In-memory cache implementation
class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; timestamp: number; accessCount: number }>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  set(key: string, value: T): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > this.config.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    // Update access count for LFU strategy
    item.accessCount++;

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToRemove: string;

    switch (this.config.strategy) {
      case 'lru': // Least Recently Used
        keyToRemove = this.findLRUKey();
        break;
      case 'lfu': // Least Frequently Used
        keyToRemove = this.findLFUKey();
        break;
      case 'fifo': // First In, First Out
      default:
        keyToRemove = this.cache.keys().next().value;
        break;
    }

    this.cache.delete(keyToRemove);
  }

  private findLRUKey(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFUKey(): string {
    let leastUsedKey = '';
    let leastUsedCount = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastUsedCount) {
        leastUsedCount = item.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }
}

// Performance monitor class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000;

  startTiming(): () => PerformanceMetrics {
    const startTime = process.hrtime.bigint();
    const startCpuUsage = process.cpuUsage();

    return (endpoint?: string, userId?: string): PerformanceMetrics => {
      const endTime = process.hrtime.bigint();
      const endCpuUsage = process.cpuUsage(startCpuUsage);

      const metrics: PerformanceMetrics = {
        responseTime: Number(endTime - startTime) / 1000000, // Convert to milliseconds
        memoryUsage: process.memoryUsage(),
        cpuUsage: endCpuUsage,
        timestamp: Date.now(),
        endpoint,
        userId,
      };

      this.addMetric(metrics);
      return metrics;
    };
  }

  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(limit?: number): PerformanceMetrics[] {
    return limit ? this.metrics.slice(-limit) : this.metrics;
  }

  getAverageResponseTime(endpoint?: string): number {
    const filteredMetrics = endpoint
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;

    if (filteredMetrics.length === 0) return 0;

    const total = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return total / filteredMetrics.length;
  }

  getSlowQueries(threshold = 1000): PerformanceMetrics[] {
    return this.metrics.filter(m => m.responseTime > threshold);
  }

  getMemoryUsageStats(): { min: number; max: number; avg: number } {
    if (this.metrics.length === 0) {
      return { min: 0, max: 0, avg: 0 };
    }

    const heapUsed = this.metrics.map(m => m.memoryUsage.heapUsed);

    return {
      min: Math.min(...heapUsed),
      max: Math.max(...heapUsed),
      avg: heapUsed.reduce((sum, val) => sum + val, 0) / heapUsed.length,
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// Optimization utilities
export class PerformanceOptimizer {
  private cache: MemoryCache;
  private monitor: PerformanceMonitor;
  private config: OptimizationConfig;

  constructor(config: OptimizationConfig) {
    this.config = config;
    this.cache = new MemoryCache(config.cacheConfig);
    this.monitor = new PerformanceMonitor();
  }

  // Memoization decorator
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    if (!this.config.enableCaching) {
      return fn;
    }

    const memoized = (...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      if (this.cache.has(key)) {
        return this.cache.get(key) as ReturnType<T>;
      }

      const result = fn(...args);
      this.cache.set(key, result);

      return result;
    };

    return memoized as T;
  }

  // Debounce function
  debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;

    const debounced = (...args: Parameters<T>): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };

    return debounced as T;
  }

  // Throttle function
  throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T {
    let inThrottle: boolean;

    const throttled = (...args: Parameters<T>): ReturnType<T> | void => {
      if (!inThrottle) {
        const result = fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
        return result;
      }
    };

    return throttled as T;
  }

  // Batch processing
  async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize = 10,
    delay = 0
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);

      // Add delay between batches to prevent overwhelming the system
      if (delay > 0 && i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }

  // Lazy loading utility
  createLazyLoader<T>(loader: () => Promise<T>): () => Promise<T> {
    let cached: T | null = null;
    let loading = false;
    let loadPromise: Promise<T> | null = null;

    return async (): Promise<T> => {
      if (cached !== null) {
        return cached;
      }

      if (loading && loadPromise) {
        return loadPromise;
      }

      loading = true;
      loadPromise = loader()
        .then(result => {
          cached = result;
          loading = false;
          return result;
        })
        .catch(error => {
          loading = false;
          loadPromise = null;
          throw error;
        });

      return loadPromise;
    };
  }

  // Performance monitoring middleware
  createMonitoringMiddleware() {
    return (req: any, res: any, next: any) => {
      const endTiming: (endpoint?: string, userId?: string) => PerformanceMetrics =
        this.monitor.startTiming();

      res.on('finish', () => {
        endTiming(req.path, req.user?.id);
      });

      next();
    };
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size(),
      maxSize: this.config.cacheConfig.maxSize,
      strategy: this.config.cacheConfig.strategy,
      ttl: this.config.cacheConfig.ttl,
    };
  }

  // Get performance statistics
  getPerformanceStats() {
    return {
      averageResponseTime: this.monitor.getAverageResponseTime(),
      slowQueries: this.monitor.getSlowQueries().length,
      memoryUsage: this.monitor.getMemoryUsageStats(),
      totalRequests: this.monitor.getMetrics().length,
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Clear performance metrics
  clearMetrics(): void {
    this.monitor.clearMetrics();
  }
}

// Default configuration
export const defaultOptimizationConfig: OptimizationConfig = {
  enableCaching: true,
  enableCompression: true,
  enableMinification: true,
  enableLazyLoading: true,
  cacheConfig: {
    ttl: 300, // 5 minutes
    maxSize: 1000,
    strategy: 'lru',
  },
};

// Global performance optimizer instance
let globalOptimizer: PerformanceOptimizer | null = null;

export function getPerformanceOptimizer(config?: OptimizationConfig): PerformanceOptimizer {
  if (!globalOptimizer) {
    globalOptimizer = new PerformanceOptimizer(config || defaultOptimizationConfig);
  }
  return globalOptimizer;
}

// Utility functions
export function measureExecutionTime<T>(fn: () => T): { result: T; executionTime: number } {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();

  return {
    result,
    executionTime: Number(end - start) / 1000000, // Convert to milliseconds
  };
}

export async function measureAsyncExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();

  return {
    result,
    executionTime: Number(end - start) / 1000000, // Convert to milliseconds
  };
}

// Memory usage monitoring
export function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

export function formatMemoryUsage(usage: NodeJS.MemoryUsage): string {
  const formatBytes = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return [
    `RSS: ${formatBytes(usage.rss)}`,
    `Heap Total: ${formatBytes(usage.heapTotal)}`,
    `Heap Used: ${formatBytes(usage.heapUsed)}`,
    `External: ${formatBytes(usage.external)}`,
  ].join(', ');
}

// CPU usage monitoring
export function getCpuUsage(): NodeJS.CpuUsage {
  return process.cpuUsage();
}

export function formatCpuUsage(usage: NodeJS.CpuUsage): string {
  return `User: ${(usage.user / 1000).toFixed(2)}ms, System: ${(usage.system / 1000).toFixed(2)}ms`;
}
