
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
      `API_${req.method}_${req.url}`,
      () => handler(req, res)
    );
  };
}
