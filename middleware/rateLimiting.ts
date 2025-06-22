import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory store for rate limiting
 * In production, use Redis or similar external store
 */
class MemoryStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const current = this.store.get(key);

    if (!current || now > current.resetTime) {
      // Reset or create new entry
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    // Increment existing entry
    current.count++;
    this.store.set(key, current);
    return current;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const store = new MemoryStore();

// Cleanup expired entries every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message: string; // Error message when limit exceeded
  standardHeaders: boolean; // Send rate limit info in headers
  legacyHeaders: boolean; // Send legacy rate limit headers
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skip?: (request: NextRequest) => boolean; // Skip rate limiting for certain requests
}

/**
 * Default rate limit configurations
 */
export const rateLimitConfigs = {
  // General API rate limiting
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many API requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,

  // Contact form
  contact: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many contact form submissions, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,

  // Performance monitoring endpoints
  performance: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000,
    message: 'Too many performance monitoring requests.',
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many file uploads, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  } as RateLimitConfig,
};

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimiter(request: NextRequest): NextResponse | null {
    // Skip if skip function returns true
    if (config.skip && config.skip(request)) {
      return null;
    }

    // Generate key for this request
    const key = config.keyGenerator ? config.keyGenerator(request) : getDefaultKey(request);

    // Get current count and reset time
    const { count, resetTime } = store.increment(key, config.windowMs);

    // Check if limit exceeded
    if (count > config.max) {
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: config.message,
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );

      // Add rate limit headers
      if (config.standardHeaders) {
        response.headers.set('RateLimit-Limit', config.max.toString());
        response.headers.set('RateLimit-Remaining', '0');
        response.headers.set('RateLimit-Reset', new Date(resetTime).toISOString());
      }

      if (config.legacyHeaders) {
        response.headers.set('X-RateLimit-Limit', config.max.toString());
        response.headers.set('X-RateLimit-Remaining', '0');
        response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      }

      response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());

      return response;
    }

    // Request is within limits, continue
    return null;
  };
}

/**
 * Default key generator (IP-based)
 */
function getDefaultKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
  return `rate_limit:${ip}`;
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return request.ip || 'unknown';
}

/**
 * Create key generator based on IP and user agent
 */
export function createIPUserAgentKey(request: NextRequest): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const hash = Buffer.from(userAgent).toString('base64').slice(0, 10);
  return `rate_limit:${ip}:${hash}`;
}

/**
 * Create key generator based on user ID (for authenticated requests)
 */
export function createUserKey(request: NextRequest): string {
  // Extract user ID from JWT token or session
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      // In a real app, you'd decode the JWT and extract user ID
      const token = authHeader.slice(7);
      // For now, use a hash of the token
      const hash = Buffer.from(token).toString('base64').slice(0, 10);
      return `rate_limit:user:${hash}`;
    } catch {
      // Fall back to IP-based key
      return getDefaultKey(request);
    }
  }

  return getDefaultKey(request);
}

/**
 * Skip rate limiting for certain conditions
 */
export const skipConditions = {
  // Skip for localhost in development
  development: (request: NextRequest): boolean => {
    if (process.env.NODE_ENV !== 'development') return false;
    const ip = getClientIP(request);
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
  },

  // Skip for health check endpoints
  healthCheck: (request: NextRequest): boolean => {
    return request.nextUrl.pathname === '/api/health' || request.nextUrl.pathname === '/health';
  },

  // Skip for static assets
  staticAssets: (request: NextRequest): boolean => {
    const pathname = request.nextUrl.pathname;
    return (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
    );
  },

  // Skip for admin users (implement based on your auth system)
  adminUsers: (request: NextRequest): boolean => {
    // Implement admin user detection logic
    const adminToken = request.headers.get('x-admin-token');
    return adminToken === process.env.ADMIN_SECRET_TOKEN;
  },
};

/**
 * Combine multiple skip conditions
 */
export function combineSkipConditions(...conditions: Array<(request: NextRequest) => boolean>) {
  return (request: NextRequest): boolean => {
    return conditions.some(condition => condition(request));
  };
}

/**
 * Rate limiting statistics
 */
export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  uniqueIPs: number;
  topIPs: Array<{ ip: string; requests: number }>;
}

/**
 * Get rate limiting statistics (for monitoring)
 */
export function getRateLimitStats(): RateLimitStats {
  const ipCounts = new Map<string, number>();
  let totalRequests = 0;
  let blockedRequests = 0;

  // This is a simplified version - in production you'd want more sophisticated tracking
  for (const [key, value] of (store as any).store.entries()) {
    if (key.startsWith('rate_limit:')) {
      const ip = key.split(':')[1];
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + value.count);
      totalRequests += value.count;
    }
  }

  const topIPs = Array.from(ipCounts.entries())
    .map(([ip, requests]) => ({ ip, requests }))
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 10);

  return {
    totalRequests,
    blockedRequests, // This would need to be tracked separately
    uniqueIPs: ipCounts.size,
    topIPs,
  };
}
