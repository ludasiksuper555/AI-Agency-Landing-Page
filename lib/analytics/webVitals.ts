// Web Vitals monitoring and analytics

// Web Vitals metric interface
export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

import { PERFORMANCE_CONFIG, THRESHOLDS_CONFIG } from '../config/performance';

// Use performance thresholds from configuration
const PERFORMANCE_THRESHOLDS = THRESHOLDS_CONFIG;

// Get rating based on metric value
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Send metric to analytics endpoint
async function sendToAnalytics(metric: WebVitalsMetric): Promise<void> {
  try {
    await fetch(PERFORMANCE_CONFIG.endpoints.webVitals, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metric),
    });
  } catch (error) {
    console.error('Failed to send web vitals metric:', error);
  }
}

// Enhanced metric handler
function handleMetric(metric: any): void {
  const enhancedMetric: WebVitalsMetric = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: getRating(metric.name, metric.value),
    navigationType:
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type ||
      'unknown',
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Send to analytics
  sendToAnalytics(enhancedMetric);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: enhancedMetric.rating,
      delta: metric.delta,
    });
  }
}

// Initialize Web Vitals monitoring
export async function initWebVitals(): Promise<void> {
  try {
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');
    onCLS(handleMetric);
    onINP(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

// Performance observer for additional metrics
export class PerformanceAnalyzer {
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initObservers();
  }

  private initObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Resource timing observer
    try {
      const resourceObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.handleResourceEntry(entry as PerformanceResourceTiming);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.warn('Resource observer not supported:', error);
    }

    // Navigation timing observer
    try {
      const navigationObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.handleNavigationEntry(entry as PerformanceNavigationTiming);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (error) {
      console.warn('Navigation observer not supported:', error);
    }

    // Paint timing observer
    try {
      const paintObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          this.handlePaintEntry(entry as PerformancePaintTiming);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.warn('Paint observer not supported:', error);
    }
  }

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    // Track slow resources
    if (entry.duration > 1000) {
      const metric: WebVitalsMetric = {
        id: `resource-${Date.now()}`,
        name: 'SLOW_RESOURCE',
        value: entry.duration,
        delta: 0,
        rating: 'poor',
        navigationType: 'resource',
        timestamp: Date.now(),
        url: entry.name,
        userAgent: navigator.userAgent,
      };
      sendToAnalytics(metric);
    }
  }

  private handleNavigationEntry(entry: PerformanceNavigationTiming): void {
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
    const loadComplete = entry.loadEventEnd - entry.loadEventStart;

    // Track DOM content loaded time
    if (domContentLoaded > 0) {
      const metric: WebVitalsMetric = {
        id: `dcl-${Date.now()}`,
        name: 'DOM_CONTENT_LOADED',
        value: domContentLoaded,
        delta: 0,
        rating: getRating('FCP', domContentLoaded),
        navigationType: entry.type,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      sendToAnalytics(metric);
    }

    // Track load complete time
    if (loadComplete > 0) {
      const metric: WebVitalsMetric = {
        id: `load-${Date.now()}`,
        name: 'LOAD_COMPLETE',
        value: loadComplete,
        delta: 0,
        rating: getRating('LCP', loadComplete),
        navigationType: entry.type,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      sendToAnalytics(metric);
    }
  }

  private handlePaintEntry(entry: PerformancePaintTiming): void {
    const metric: WebVitalsMetric = {
      id: `paint-${Date.now()}`,
      name: entry.name.toUpperCase().replace('-', '_'),
      value: entry.startTime,
      delta: 0,
      rating: getRating('FCP', entry.startTime),
      navigationType: 'paint',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    sendToAnalytics(metric);
  }

  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance analyzer instance
let globalAnalyzer: PerformanceAnalyzer | null = null;

// Initialize performance monitoring
export async function initPerformanceMonitoring(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Initialize Web Vitals
  await initWebVitals();

  // Initialize performance analyzer
  if (!globalAnalyzer) {
    globalAnalyzer = new PerformanceAnalyzer();
  }
}

// Cleanup function
export function cleanupPerformanceMonitoring(): void {
  if (globalAnalyzer) {
    globalAnalyzer.disconnect();
    globalAnalyzer = null;
  }
}

// Export for use in _app.tsx
export { handleMetric };
