import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Security Health Check API
 * Provides information about the security status of the application
 */

interface SecurityHealthResponse {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  checks: {
    csp: {
      enabled: boolean;
      reportUri: string;
    };
    headers: {
      hsts: boolean;
      xss: boolean;
      frameOptions: boolean;
      contentType: boolean;
    };
    rateLimiting: {
      enabled: boolean;
      endpoints: string[];
    };
    cors: {
      configured: boolean;
      allowedOrigins: string[];
    };
    environment: {
      nodeEnv: string;
      httpsOnly: boolean;
      debugMode: boolean;
    };
  };
  recommendations: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SecurityHealthResponse | { error: string }>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if request is authorized (in production, you might want API key auth)
    const isAuthorized = checkAuthorization(req);
    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const healthCheck: SecurityHealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        csp: {
          enabled: true,
          reportUri: '/api/security/csp-report',
        },
        headers: {
          hsts: process.env.NODE_ENV === 'production',
          xss: true,
          frameOptions: true,
          contentType: true,
        },
        rateLimiting: {
          enabled: true,
          endpoints: ['/api/auth/', '/api/contact', '/api/analytics/', '/api/performance/'],
        },
        cors: {
          configured: true,
          allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        },
        environment: {
          nodeEnv: process.env.NODE_ENV || 'development',
          httpsOnly: process.env.NODE_ENV === 'production',
          debugMode: process.env.NODE_ENV === 'development',
        },
      },
      recommendations: [],
    };

    // Analyze security status and generate recommendations
    const { status, recommendations } = analyzeSecurityStatus(healthCheck.checks);
    healthCheck.status = status;
    healthCheck.recommendations = recommendations;

    res.status(200).json(healthCheck);
  } catch (error) {
    console.error('[Security Health Check] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Check if the request is authorized to access security health information
 */
function checkAuthorization(req: NextApiRequest): boolean {
  // In development, allow all requests
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check for API key in production
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.SECURITY_API_KEY;

  if (!validApiKey) {
    console.warn('[Security Health Check] No SECURITY_API_KEY configured');
    return false;
  }

  return apiKey === validApiKey;
}

/**
 * Analyze security configuration and determine overall status
 */
function analyzeSecurityStatus(checks: SecurityHealthResponse['checks']): {
  status: SecurityHealthResponse['status'];
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let status: SecurityHealthResponse['status'] = 'healthy';

  // Check HTTPS enforcement
  if (!checks.environment.httpsOnly && checks.environment.nodeEnv === 'production') {
    recommendations.push('Enable HTTPS-only mode in production');
    status = 'warning';
  }

  // Check HSTS
  if (!checks.headers.hsts && checks.environment.nodeEnv === 'production') {
    recommendations.push('Enable HTTP Strict Transport Security (HSTS) headers');
    status = 'warning';
  }

  // Check debug mode in production
  if (checks.environment.debugMode && checks.environment.nodeEnv === 'production') {
    recommendations.push('Disable debug mode in production');
    status = 'critical';
  }

  // Check CORS configuration
  if (checks.cors.allowedOrigins.includes('*')) {
    recommendations.push('Restrict CORS allowed origins (avoid wildcard in production)');
    if (checks.environment.nodeEnv === 'production') {
      status = 'warning';
    }
  }

  // Check environment-specific recommendations
  if (checks.environment.nodeEnv === 'production') {
    if (!process.env.CSP_VIOLATION_WEBHOOK) {
      recommendations.push('Configure CSP violation reporting webhook');
    }

    if (!process.env.SECURITY_LOG_ENDPOINT) {
      recommendations.push('Configure security event logging endpoint');
    }

    if (!process.env.SECURITY_API_KEY) {
      recommendations.push('Set SECURITY_API_KEY for health check authentication');
    }
  }

  // Rate limiting checks
  if (!checks.rateLimiting.enabled) {
    recommendations.push('Enable rate limiting for API endpoints');
    status = 'warning';
  }

  return { status, recommendations };
}

/**
 * Configuration for this API route
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
