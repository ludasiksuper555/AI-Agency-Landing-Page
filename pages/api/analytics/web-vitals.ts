// API endpoint for Web Vitals analytics
import { NextApiRequest, NextApiResponse } from 'next';
import { logError, logMessage } from '../../../lib/sentry';

// Web Vitals metric interface
interface WebVitalsMetric {
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

// In-memory storage for metrics (in production, use a database)
const metricsStore: WebVitalsMetric[] = [];
const MAX_METRICS = 1000; // Limit stored metrics

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (clientData.count >= RATE_LIMIT) {
    return false;
  }

  clientData.count++;
  return true;
}

// Validate metric data
function validateMetric(data: any): data is WebVitalsMetric {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.value === 'number' &&
    typeof data.delta === 'number' &&
    ['good', 'needs-improvement', 'poor'].includes(data.rating) &&
    typeof data.navigationType === 'string' &&
    typeof data.timestamp === 'number' &&
    typeof data.url === 'string' &&
    typeof data.userAgent === 'string'
  );
}

// Store metric
function storeMetric(metric: WebVitalsMetric): void {
  metricsStore.push(metric);

  // Keep only the latest metrics
  if (metricsStore.length > MAX_METRICS) {
    metricsStore.splice(0, metricsStore.length - MAX_METRICS);
  }

  // Log critical performance issues
  if (metric.rating === 'poor') {
    logMessage(`Poor performance detected: ${metric.name} = ${metric.value}ms`, 'warning', {
      metric: metric.name,
      value: metric.value,
      url: metric.url,
      userAgent: metric.userAgent,
    });
  }
}

// Get performance summary
function getPerformanceSummary() {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  const recentMetrics = metricsStore.filter(m => m.timestamp > oneHourAgo);

  const summary = {
    totalMetrics: recentMetrics.length,
    byName: {} as Record<
      string,
      { count: number; avgValue: number; ratings: Record<string, number> }
    >,
    overallRating: { good: 0, 'needs-improvement': 0, poor: 0 },
    timestamp: now,
  };

  recentMetrics.forEach(metric => {
    // By name statistics
    if (!summary.byName[metric.name]) {
      summary.byName[metric.name] = {
        count: 0,
        avgValue: 0,
        ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
      };
    }

    const nameStats = summary.byName[metric.name];
    nameStats.count++;
    nameStats.avgValue =
      (nameStats.avgValue * (nameStats.count - 1) + metric.value) / nameStats.count;
    nameStats.ratings[metric.rating]++;

    // Overall rating
    summary.overallRating[metric.rating]++;
  });

  return summary;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get client IP for rate limiting
    const clientIP =
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
      });
    }

    if (req.method === 'POST') {
      // Store new metric
      const metric = req.body;

      if (!validateMetric(metric)) {
        return res.status(400).json({
          error: 'Invalid metric data',
          message: 'Metric data does not match expected format',
        });
      }

      storeMetric(metric);

      return res.status(200).json({
        success: true,
        message: 'Metric stored successfully',
      });
    } else if (req.method === 'GET') {
      // Get performance summary
      const summary = getPerformanceSummary();

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } else {
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(405).json({
        error: 'Method not allowed',
        message: 'Only POST and GET methods are supported',
      });
    }
  } catch (error) {
    logError(error as Error, {
      endpoint: '/api/analytics/web-vitals',
      method: req.method,
      body: req.body,
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process request',
    });
  }
}
