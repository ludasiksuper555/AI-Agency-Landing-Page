import { NextApiRequest, NextApiResponse } from 'next';
import {
  PerformanceAlert,
  getPerformanceAlerts,
} from '../../../lib/analytics/performanceDashboard';
import { logError } from '../../../lib/errorReporting/errorLogger';

// API response interface
interface AlertsResponse {
  success: boolean;
  data?: PerformanceAlert[];
  message?: string;
  timestamp: number;
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // requests per minute
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

// Clean up old rate limit entries
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now > data.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  },
  5 * 60 * 1000
); // Clean up every 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse<AlertsResponse>) {
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting
    const clientIP =
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        timestamp: Date.now(),
      });
      return;
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
      res.status(405).json({
        success: false,
        message: 'Method not allowed. Only GET requests are supported.',
        timestamp: Date.now(),
      });
      return;
    }

    // Get query parameters
    const { limit, severity, metric } = req.query;

    // Validate limit parameter
    let alertLimit = 50; // default limit
    if (limit) {
      const parsedLimit = parseInt(limit as string, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        res.status(400).json({
          success: false,
          message: 'Invalid limit parameter. Must be a number between 1 and 100.',
          timestamp: Date.now(),
        });
        return;
      }
      alertLimit = parsedLimit;
    }

    // Get all alerts
    let alerts = getPerformanceAlerts();

    // Filter by severity if specified
    if (severity && typeof severity === 'string') {
      const validSeverities = ['critical', 'warning', 'info'];
      if (!validSeverities.includes(severity)) {
        res.status(400).json({
          success: false,
          message: 'Invalid severity parameter. Must be one of: critical, warning, info.',
          timestamp: Date.now(),
        });
        return;
      }
      alerts = alerts.filter(alert => alert.type === severity);
    }

    // Filter by metric if specified
    if (metric && typeof metric === 'string') {
      alerts = alerts.filter(alert => alert.metric.toLowerCase().includes(metric.toLowerCase()));
    }

    // Sort by timestamp (newest first) and apply limit
    alerts = alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, alertLimit);

    // Add performance timing
    const processingTime = Date.now() - startTime;

    // Set cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Add custom headers
    res.setHeader('X-Processing-Time', processingTime.toString());
    res.setHeader('X-Alert-Count', alerts.length.toString());

    // Return successful response
    res.status(200).json({
      success: true,
      data: alerts,
      timestamp: Date.now(),
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Log the error
    await logError(error as Error, {
      context: 'alerts-api',
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      processingTime,
      query: req.query,
    });

    // Return error response
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred while fetching alerts.',
      timestamp: Date.now(),
    });
  }
}

// Export configuration for Next.js
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
};
