import { NextRequest } from 'next/server';

/**
 * Rate limiting configuration and implementation
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimit {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests default
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator,
      ...config,
    };

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  /**
   * Default key generator based on IP address
   */
  private defaultKeyGenerator(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cfConnectingIP = req.headers.get('cf-connecting-ip');

    let ip = 'unknown';
    if (cfConnectingIP) {
      ip = cfConnectingIP;
    } else if (realIP) {
      ip = realIP;
    } else if (forwarded) {
      ip = forwarded.split(',')[0].trim();
    }

    return `ratelimit:${ip}`;
  }

  /**
   * Check if request should be rate limited
   */
  async check(req: NextRequest): Promise<RateLimitResult> {
    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get or create entry
    let entry = this.store[key];

    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired entry
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.store[key] = entry;
    }

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        reset: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    // Increment counter
    entry.count++;

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - entry.count,
      reset: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of Object.entries(this.store)) {
      if (entry.resetTime <= now) {
        delete this.store[key];
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(req: NextRequest): void {
    const key = this.config.keyGenerator!(req);
    delete this.store[key];
  }

  /**
   * Get current status for a key
   */
  getStatus(req: NextRequest): RateLimitResult | null {
    const key = this.config.keyGenerator!(req);
    const entry = this.store[key];

    if (!entry) {
      return null;
    }

    const now = Date.now();

    if (entry.resetTime <= now) {
      return null;
    }

    return {
      success: entry.count < this.config.maxRequests,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      reset: entry.resetTime,
      retryAfter:
        entry.count >= this.config.maxRequests
          ? Math.ceil((entry.resetTime - now) / 1000)
          : undefined,
    };
  }

  /**
   * Destroy the rate limiter and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store = {};
  }
}

/**
 * Create different rate limiters for different use cases
 */

// General API rate limiter
export const ratelimit = new RateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = new RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Only 5 login attempts per 15 minutes
  keyGenerator: (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `auth:${ip}`;
  },
});

// API rate limiter for authenticated users
export const apiRateLimit = new RateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  keyGenerator: (req: NextRequest) => {
    const userId = req.headers.get('x-user-id');
    if (userId) {
      return `api:user:${userId}`;
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `api:ip:${ip}`;
  },
});

// Contact form rate limiter
export const contactRateLimit = new RateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // Only 3 contact form submissions per hour
  keyGenerator: (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `contact:${ip}`;
  },
});

// Newsletter signup rate limiter
export const newsletterRateLimit = new RateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 1, // Only 1 newsletter signup per day per IP
  keyGenerator: (req: NextRequest) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    return `newsletter:${ip}`;
  },
});

/**
 * Utility function to create custom rate limiters
 */
export function createRateLimit(config: RateLimitConfig): RateLimit {
  return new RateLimit(config);
}

/**
 * Middleware helper for applying rate limits
 */
export async function applyRateLimit(
  req: NextRequest,
  limiter: RateLimit
): Promise<Response | null> {
  const result = await limiter.check(req);

  if (!result.success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter?.toString() || '60',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Content-Type': 'application/json',
      },
    });
  }

  return null;
}

/**
 * Rate limit headers helper
 */
export function addRateLimitHeaders(response: Response, result: RateLimitResult): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());

  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }
}
