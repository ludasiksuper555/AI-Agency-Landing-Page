import { WebVitalsMetric } from './webVitals';

// Performance thresholds based on Core Web Vitals standards
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  DOM_CONTENT_LOADED: { good: 2000, poor: 4000 },
  LOAD_COMPLETE: { good: 3000, poor: 6000 },
  SLOW_RESOURCE: { good: 1000, poor: 3000 },
} as const;

// Performance rating type
export type PerformanceRating = 'good' | 'needs-improvement' | 'poor';

// Metric analysis interface
export interface MetricAnalysis {
  name: string;
  count: number;
  avgValue: number;
  minValue: number;
  maxValue: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  ratings: {
    good: number;
    'needs-improvement': number;
    poor: number;
  };
  trend: {
    direction: 'improving' | 'degrading' | 'stable';
    percentage: number;
  };
}

// Dashboard summary interface
export interface PerformanceDashboardData {
  totalMetrics: number;
  timeRange: {
    start: number;
    end: number;
  };
  byName: Record<string, MetricAnalysis>;
  overallRating: {
    good: number;
    'needs-improvement': number;
    poor: number;
  };
  alerts: PerformanceAlert[];
  timestamp: number;
}

// Performance alert interface
export interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// Performance analyzer class
export class PerformanceDashboard {
  private metrics: WebVitalsMetric[] = [];
  private alerts: PerformanceAlert[] = [];

  /**
   * Add metrics to the dashboard
   */
  addMetrics(metrics: WebVitalsMetric[]): void {
    this.metrics.push(...metrics);
    this.analyzeForAlerts(metrics);
  }

  /**
   * Get performance rating for a metric value
   */
  getRating(metricName: string, value: number): PerformanceRating {
    const thresholds = PERFORMANCE_THRESHOLDS[metricName as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return 'good';

    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Calculate percentiles for an array of values
   */
  private calculatePercentiles(values: number[]): {
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  } {
    if (values.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[Math.max(0, index)];
    };

    return {
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
    };
  }

  /**
   * Calculate trend for a metric
   */
  private calculateTrend(
    values: number[],
    timestamps: number[]
  ): {
    direction: 'improving' | 'degrading' | 'stable';
    percentage: number;
  } {
    if (values.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    // Split data into two halves and compare averages
    const midpoint = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, midpoint);
    const secondHalf = values.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    const threshold = 5; // 5% threshold for considering a trend

    if (Math.abs(change) < threshold) {
      return { direction: 'stable', percentage: Math.abs(change) };
    }

    // For performance metrics, lower values are better (improving)
    return {
      direction: change < 0 ? 'improving' : 'degrading',
      percentage: Math.abs(change),
    };
  }

  /**
   * Analyze metrics for performance alerts
   */
  private analyzeForAlerts(metrics: WebVitalsMetric[]): void {
    const now = Date.now();
    const recentMetrics = metrics.filter(m => now - m.timestamp < 5 * 60 * 1000); // Last 5 minutes

    // Group by metric name
    const byName = recentMetrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) acc[metric.name] = [];
        acc[metric.name].push(metric);
        return acc;
      },
      {} as Record<string, WebVitalsMetric[]>
    );

    // Check for critical performance issues
    Object.entries(byName).forEach(([name, metricList]) => {
      const thresholds = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
      if (!thresholds) return;

      const poorMetrics = metricList.filter(m => this.getRating(name, m.value) === 'poor');
      const poorPercentage = (poorMetrics.length / metricList.length) * 100;

      // Critical alert: >50% of recent metrics are poor
      if (poorPercentage > 50) {
        this.alerts.push({
          id: `critical-${name}-${now}`,
          type: 'critical',
          metric: name,
          message: `Critical performance issue: ${poorPercentage.toFixed(1)}% of ${name} metrics are poor`,
          value: poorPercentage,
          threshold: 50,
          timestamp: now,
        });
      }
      // Warning alert: >25% of recent metrics are poor
      else if (poorPercentage > 25) {
        this.alerts.push({
          id: `warning-${name}-${now}`,
          type: 'warning',
          metric: name,
          message: `Performance warning: ${poorPercentage.toFixed(1)}% of ${name} metrics are poor`,
          value: poorPercentage,
          threshold: 25,
          timestamp: now,
        });
      }

      // Check for extremely high individual values
      const extremeValues = metricList.filter(m => m.value > thresholds.poor * 2);
      if (extremeValues.length > 0) {
        this.alerts.push({
          id: `extreme-${name}-${now}`,
          type: 'critical',
          metric: name,
          message: `Extreme ${name} values detected: ${extremeValues.length} metrics exceed ${thresholds.poor * 2}ms`,
          value: Math.max(...extremeValues.map(m => m.value)),
          threshold: thresholds.poor * 2,
          timestamp: now,
        });
      }
    });

    // Clean up old alerts (keep only last hour)
    this.alerts = this.alerts.filter(alert => now - alert.timestamp < 60 * 60 * 1000);
  }

  /**
   * Generate dashboard data for a specific time range
   */
  generateDashboard(timeRangeMs: number = 60 * 60 * 1000): PerformanceDashboardData {
    const now = Date.now();
    const startTime = now - timeRangeMs;

    // Filter metrics within time range
    const filteredMetrics = this.metrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= now
    );

    // Group metrics by name
    const byName = filteredMetrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) acc[metric.name] = [];
        acc[metric.name].push(metric);
        return acc;
      },
      {} as Record<string, WebVitalsMetric[]>
    );

    // Analyze each metric
    const analysis: Record<string, MetricAnalysis> = {};
    let totalGood = 0;
    let totalNeedsImprovement = 0;
    let totalPoor = 0;

    Object.entries(byName).forEach(([name, metricList]) => {
      const values = metricList.map(m => m.value);
      const timestamps = metricList.map(m => m.timestamp);

      // Calculate ratings
      const ratings = { good: 0, 'needs-improvement': 0, poor: 0 };
      metricList.forEach(metric => {
        const rating = this.getRating(name, metric.value);
        ratings[rating]++;
      });

      // Add to overall totals
      totalGood += ratings.good;
      totalNeedsImprovement += ratings['needs-improvement'];
      totalPoor += ratings.poor;

      // Calculate statistics
      const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const percentiles = this.calculatePercentiles(values);
      const trend = this.calculateTrend(values, timestamps);

      analysis[name] = {
        name,
        count: metricList.length,
        avgValue,
        minValue,
        maxValue,
        ...percentiles,
        ratings,
        trend,
      };
    });

    return {
      totalMetrics: filteredMetrics.length,
      timeRange: {
        start: startTime,
        end: now,
      },
      byName: analysis,
      overallRating: {
        good: totalGood,
        'needs-improvement': totalNeedsImprovement,
        poor: totalPoor,
      },
      alerts: this.alerts.slice(-10), // Last 10 alerts
      timestamp: now,
    };
  }

  /**
   * Get current alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Get metric summary for a specific metric name
   */
  getMetricSummary(
    metricName: string,
    timeRangeMs: number = 60 * 60 * 1000
  ): MetricAnalysis | null {
    const dashboard = this.generateDashboard(timeRangeMs);
    return dashboard.byName[metricName] || null;
  }

  /**
   * Export metrics data for external analysis
   */
  exportMetrics(timeRangeMs?: number): WebVitalsMetric[] {
    if (!timeRangeMs) return [...this.metrics];

    const cutoff = Date.now() - timeRangeMs;
    return this.metrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Import metrics data from external source
   */
  importMetrics(metrics: WebVitalsMetric[]): void {
    this.addMetrics(metrics);
  }
}

// Global dashboard instance
export const performanceDashboard = new PerformanceDashboard();

// Helper functions for dashboard integration
export const getDashboardData = (timeRangeMs?: number): PerformanceDashboardData => {
  return performanceDashboard.generateDashboard(timeRangeMs);
};

export const addMetricsToDashboard = (metrics: WebVitalsMetric[]): void => {
  performanceDashboard.addMetrics(metrics);
};

export const getPerformanceAlerts = (): PerformanceAlert[] => {
  return performanceDashboard.getAlerts();
};

export const cleanupDashboard = (maxAge?: number): void => {
  performanceDashboard.cleanup(maxAge);
};
