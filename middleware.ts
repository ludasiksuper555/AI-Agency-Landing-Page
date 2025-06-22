import { NextRequest, NextResponse } from 'next/server';
import {
  combineSkipConditions,
  createRateLimiter,
  rateLimitConfigs,
  skipConditions,
} from './middleware/rateLimiting';
import { SecurityUtils, corsConfig } from './middleware/security';

/**
 * Next.js Middleware for Security and Rate Limiting
 * Handles CSP, security headers, CORS, and rate limiting
 */

// Create rate limiters for different endpoints
const apiRateLimiter = createRateLimiter({
  ...rateLimitConfigs.api,
  skip: combineSkipConditions(
    skipConditions.development,
    skipConditions.healthCheck,
    skipConditions.staticAssets
  ),
});

const authRateLimiter = createRateLimiter({
  ...rateLimitConfigs.auth,
  skip: combineSkipConditions(skipConditions.development, skipConditions.adminUsers),
});

const contactRateLimiter = createRateLimiter({
  ...rateLimitConfigs.contact,
  skip: skipConditions.development,
});

const performanceRateLimiter = createRateLimiter({
  ...rateLimitConfigs.performance,
  skip: combineSkipConditions(skipConditions.development, skipConditions.healthCheck),
});

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)
  ) {
    // Add caching headers for static assets
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return response;
  }

  try {
    // Apply rate limiting based on route
    const rateLimitResponse = applyRateLimiting(request, pathname);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Apply security headers
    applySecurityHeaders(response, request);

    // Apply CORS headers for API routes
    if (pathname.startsWith('/api/')) {
      applyCORSHeaders(response, request);
    }

    // Apply Content Security Policy
    applyCSP(response, request);

    // Log security events
    logSecurityEvent(request, 'middleware_applied');

    return response;
  } catch (error) {
    console.error('[Middleware] Error:', error);
    logSecurityEvent(request, 'middleware_error', { error: error.message });
    return response;
  }
}

/**
 * Apply rate limiting based on the request path
 */
function applyRateLimiting(request: NextRequest, pathname: string): NextResponse | null {
  // Authentication endpoints
  if (pathname.startsWith('/api/auth/')) {
    return authRateLimiter(request);
  }

  // Contact form endpoint
  if (pathname === '/api/contact') {
    return contactRateLimiter(request);
  }

  // Performance monitoring endpoints
  if (pathname.startsWith('/api/analytics/') || pathname.startsWith('/api/performance/')) {
    return performanceRateLimiter(request);
  }

  // General API endpoints
  if (pathname.startsWith('/api/')) {
    return apiRateLimiter(request);
  }

  return null;
}

/**
 * Apply security headers to the response
 */
function applySecurityHeaders(response: NextResponse, request: NextRequest) {
  // Standard security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // HSTS for HTTPS connections
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Additional security headers based on environment
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Robots-Tag', 'index, follow');
  } else {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Compression headers
  if (request.headers.get('accept-encoding')?.includes('gzip')) {
    response.headers.set('Content-Encoding', 'gzip');
  }
}

/**
 * Apply CORS headers for API routes
 */
function applyCORSHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');

  // Check if origin is allowed
  if (origin && corsConfig.origin.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());

  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }
}

/**
 * Apply Content Security Policy
 */
function applyCSP(response: NextResponse, request: NextRequest) {
  const nonce = SecurityUtils.generateNonce();

  // Store nonce for use in pages
  response.headers.set('X-CSP-Nonce', nonce);

  // Build basic CSP header
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // Also set report-only header in development
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Content-Security-Policy-Report-Only', cspDirectives);
  }
}

/**
 * Log security events for monitoring
 */
function logSecurityEvent(request: NextRequest, event: string, metadata: Record<string, any> = {}) {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    url: request.url,
    method: request.method,
    ...metadata,
  };

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'development') {
    console.log('[Security Event]', logData);
  }

  // Send to external logging service in production
  if (process.env.NODE_ENV === 'production' && process.env.SECURITY_LOG_ENDPOINT) {
    fetch(process.env.SECURITY_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    }).catch(error => {
      console.error('[Security Log] Failed to send log:', error);
    });
  }
}

/**
 * Configuration for which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

/**
 * Utility functions for middleware
 */
export const middlewareUtils = {
  /**
   * Check if request is from a bot
   */
  isBot(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    const botPatterns = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /rogerbot/i,
      /linkedinbot/i,
      /embedly/i,
      /quora link preview/i,
      /showyoubot/i,
      /outbrain/i,
      /pinterest/i,
      /developers.google.com\/\+\/web\/snippet\//i,
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  },

  /**
   * Check if request is from mobile device
   */
  isMobile(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || '';
    return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  },

  /**
   * Get client country from headers
   */
  getClientCountry(request: NextRequest): string {
    return (
      request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'unknown'
    );
  },

  /**
   * Check if request is from allowed country
   */
  isCountryAllowed(request: NextRequest, allowedCountries: string[]): boolean {
    if (allowedCountries.length === 0) return true;
    const country = this.getClientCountry(request);
    return allowedCountries.includes(country.toUpperCase());
  },

  /**
   * Get request fingerprint for tracking
   */
  getRequestFingerprint(request: NextRequest): string {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const acceptLanguage = request.headers.get('accept-language') || 'unknown';

    return Buffer.from(`${ip}:${userAgent}:${acceptLanguage}`).toString('base64').slice(0, 16);
  },
};
