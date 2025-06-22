import { NextRequest, NextResponse } from 'next/server';
import { getCSPConfig, getPageCSP } from '../lib/security/cspConfig';

/**
 * Security middleware для додавання security headers та CSP
 */
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Отримуємо CSP конфігурацію
  const { header: cspHeader, nonce, reportUri } = getCSPConfig(request);

  // Застосовуємо page-specific CSP якщо потрібно
  const finalCSP = getPageCSP(pathname, cspHeader);

  // Security Headers
  response.headers.set('Content-Security-Policy', finalCSP);
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // HSTS (HTTP Strict Transport Security)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Додаємо nonce до response для використання в компонентах
  if (nonce) {
    response.headers.set('X-CSP-Nonce', nonce);
  }

  return response;
}

/**
 * Rate limiting configuration
 */
export const rateLimitConfig = {
  // API routes rate limiting
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Authentication routes rate limiting
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Contact form rate limiting
  contact: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 requests per hour
    message: 'Too many contact form submissions, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
};

/**
 * CORS configuration
 */
export const corsConfig = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com', 'https://www.yourdomain.com']
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Security utilities
 */
export const SecurityUtils = {
  /**
   * Validate and sanitize input
   */
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[<>"']/g, '') // Remove potentially dangerous characters
      .trim()
      .slice(0, 1000); // Limit length
  },

  /**
   * Check if request is from allowed origin
   */
  isAllowedOrigin: (origin: string | null): boolean => {
    if (!origin) return false;

    const allowedOrigins = corsConfig.origin;
    if (Array.isArray(allowedOrigins)) {
      return allowedOrigins.includes(origin);
    }
    return origin === allowedOrigins;
  },

  /**
   * Generate nonce for CSP
   */
  generateNonce: (): string => {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  },

  /**
   * Validate API key
   */
  validateApiKey: (apiKey: string | null): boolean => {
    if (!apiKey) return false;
    return apiKey === process.env.API_SECRET_KEY;
  },
};

/**
 * CSP violation reporting
 */
export interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number': number;
    'column-number': number;
    'source-file': string;
    'status-code': number;
    'script-sample': string;
  };
}

/**
 * Handle CSP violation reports
 */
export const handleCSPViolation = (report: CSPViolationReport) => {
  console.warn('CSP Violation:', {
    documentUri: report['csp-report']['document-uri'],
    violatedDirective: report['csp-report']['violated-directive'],
    blockedUri: report['csp-report']['blocked-uri'],
    sourceFile: report['csp-report']['source-file'],
    lineNumber: report['csp-report']['line-number'],
  });

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service (Sentry, LogRocket, etc.)
  }
};
