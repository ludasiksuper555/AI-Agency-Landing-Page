import { NextRequest } from 'next/server';

/**
 * Geo-blocking utilities
 */

interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
}

interface GeoBlockingConfig {
  blockedCountries: string[];
  allowedCountries?: string[];
  blockedRegions?: string[];
  allowedRegions?: string[];
  blockUnknownLocations?: boolean;
  whitelist?: string[]; // IP addresses to always allow
  blacklist?: string[]; // IP addresses to always block
}

/**
 * Default geo-blocking configuration
 */
const DEFAULT_CONFIG: GeoBlockingConfig = {
  blockedCountries: [],
  allowedCountries: [],
  blockedRegions: [],
  allowedRegions: [],
  blockUnknownLocations: false,
  whitelist: [],
  blacklist: [],
};

/**
 * High-risk countries (commonly used for malicious activities)
 */
const HIGH_RISK_COUNTRIES = [
  'CN', // China
  'RU', // Russia
  'KP', // North Korea
  'IR', // Iran
  'SY', // Syria
  'AF', // Afghanistan
  'IQ', // Iraq
  'LY', // Libya
  'SO', // Somalia
  'SD', // Sudan
  'YE', // Yemen
];

/**
 * Countries with high spam/bot activity
 */
const SPAM_COUNTRIES = [
  'BD', // Bangladesh
  'IN', // India (high volume, mixed quality)
  'PK', // Pakistan
  'NG', // Nigeria
  'ID', // Indonesia
  'VN', // Vietnam
  'PH', // Philippines
];

/**
 * Extract IP address from request
 */
function getClientIP(req: NextRequest): string {
  // Check Cloudflare header first
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Check other common headers
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = req.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  // Fallback headers
  const xClientIP = req.headers.get('x-client-ip');
  if (xClientIP) {
    return xClientIP;
  }

  const xClusterClientIP = req.headers.get('x-cluster-client-ip');
  if (xClusterClientIP) {
    return xClusterClientIP;
  }

  return 'unknown';
}

/**
 * Get geolocation from Cloudflare headers
 */
function getCloudflareGeoLocation(req: NextRequest): GeoLocation {
  return {
    country: req.headers.get('cf-ipcountry') || undefined,
    region: req.headers.get('cf-region') || undefined,
    city: req.headers.get('cf-ipcity') || undefined,
    latitude: parseFloat(req.headers.get('cf-iplatitude') || '') || undefined,
    longitude: parseFloat(req.headers.get('cf-iplongitude') || '') || undefined,
    timezone: req.headers.get('cf-timezone') || undefined,
  };
}

/**
 * Get geolocation from other headers (AWS CloudFront, etc.)
 */
function getOtherGeoLocation(req: NextRequest): GeoLocation {
  return {
    country:
      req.headers.get('cloudfront-viewer-country') ||
      req.headers.get('x-country-code') ||
      req.headers.get('x-geo-country') ||
      undefined,
    region:
      req.headers.get('cloudfront-viewer-country-region') ||
      req.headers.get('x-geo-region') ||
      undefined,
    city: req.headers.get('x-geo-city') || undefined,
  };
}

/**
 * Fallback IP geolocation using a simple IP-to-country mapping
 * In production, you might want to use a proper GeoIP service
 */
function getFallbackGeoLocation(ip: string): GeoLocation {
  // This is a very basic implementation
  // In production, integrate with services like:
  // - MaxMind GeoIP2
  // - IP2Location
  // - ipapi.co
  // - ipgeolocation.io

  // For now, return empty location
  return {};
}

/**
 * Get geolocation information from request
 */
export function getGeoLocation(req: NextRequest): GeoLocation {
  // Try Cloudflare headers first (most reliable)
  let geo = getCloudflareGeoLocation(req);

  // If no country found, try other headers
  if (!geo.country) {
    geo = { ...geo, ...getOtherGeoLocation(req) };
  }

  // If still no country, try fallback IP geolocation
  if (!geo.country) {
    const ip = getClientIP(req);
    if (ip !== 'unknown' && !isPrivateIP(ip)) {
      geo = { ...geo, ...getFallbackGeoLocation(ip) };
    }
  }

  return geo;
}

/**
 * Check if IP is private/local
 */
function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ];

  return privateRanges.some(range => range.test(ip));
}

/**
 * Check if request should be geo-blocked
 */
export function shouldGeoBlock(req: NextRequest, config: Partial<GeoBlockingConfig> = {}): boolean {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const ip = getClientIP(req);

  // Check whitelist first
  if (fullConfig.whitelist?.includes(ip)) {
    return false;
  }

  // Check blacklist
  if (fullConfig.blacklist?.includes(ip)) {
    return true;
  }

  // Skip private IPs
  if (ip === 'unknown' || isPrivateIP(ip)) {
    return false;
  }

  const geo = getGeoLocation(req);

  // If location is unknown and we should block unknown locations
  if (!geo.country && fullConfig.blockUnknownLocations) {
    return true;
  }

  // If no country detected, don't block
  if (!geo.country) {
    return false;
  }

  // Check allowed countries (if specified, only these are allowed)
  if (fullConfig.allowedCountries && fullConfig.allowedCountries.length > 0) {
    return !fullConfig.allowedCountries.includes(geo.country);
  }

  // Check blocked countries
  if (fullConfig.blockedCountries.includes(geo.country)) {
    return true;
  }

  // Check blocked regions
  if (geo.region && fullConfig.blockedRegions?.includes(geo.region)) {
    return true;
  }

  // Check allowed regions (if specified, only these are allowed)
  if (fullConfig.allowedRegions && fullConfig.allowedRegions.length > 0) {
    if (!geo.region || !fullConfig.allowedRegions.includes(geo.region)) {
      return true;
    }
  }

  return false;
}

/**
 * Get geo-blocking configuration from environment variables
 */
export function getGeoBlockingConfig(): GeoBlockingConfig {
  const config: GeoBlockingConfig = {
    blockedCountries: [],
    allowedCountries: [],
    blockedRegions: [],
    allowedRegions: [],
    blockUnknownLocations: false,
    whitelist: [],
    blacklist: [],
  };

  // Parse environment variables
  if (process.env.GEO_BLOCKED_COUNTRIES) {
    config.blockedCountries = process.env.GEO_BLOCKED_COUNTRIES.split(',').map(c => c.trim());
  }

  if (process.env.GEO_ALLOWED_COUNTRIES) {
    config.allowedCountries = process.env.GEO_ALLOWED_COUNTRIES.split(',').map(c => c.trim());
  }

  if (process.env.GEO_BLOCKED_REGIONS) {
    config.blockedRegions = process.env.GEO_BLOCKED_REGIONS.split(',').map(r => r.trim());
  }

  if (process.env.GEO_ALLOWED_REGIONS) {
    config.allowedRegions = process.env.GEO_ALLOWED_REGIONS.split(',').map(r => r.trim());
  }

  if (process.env.GEO_BLOCK_UNKNOWN === 'true') {
    config.blockUnknownLocations = true;
  }

  if (process.env.GEO_IP_WHITELIST) {
    config.whitelist = process.env.GEO_IP_WHITELIST.split(',').map(ip => ip.trim());
  }

  if (process.env.GEO_IP_BLACKLIST) {
    config.blacklist = process.env.GEO_IP_BLACKLIST.split(',').map(ip => ip.trim());
  }

  // Add high-risk countries if security mode is enabled
  if (process.env.GEO_BLOCK_HIGH_RISK === 'true') {
    config.blockedCountries = [...config.blockedCountries, ...HIGH_RISK_COUNTRIES];
  }

  // Add spam countries if anti-spam mode is enabled
  if (process.env.GEO_BLOCK_SPAM === 'true') {
    config.blockedCountries = [...config.blockedCountries, ...SPAM_COUNTRIES];
  }

  // Remove duplicates
  config.blockedCountries = [...new Set(config.blockedCountries)];

  return config;
}

/**
 * Create a response for geo-blocked requests
 */
export function createGeoBlockResponse(geo: GeoLocation): Response {
  const message = geo.country
    ? `Access denied from ${geo.country}`
    : 'Access denied from your location';

  return new Response(message, {
    status: 403,
    headers: {
      'Content-Type': 'text/plain',
      'X-Geo-Block-Reason': 'country-blocked',
      'X-Geo-Country': geo.country || 'unknown',
    },
  });
}

/**
 * Middleware helper for geo-blocking
 */
export function handleGeoBlocking(req: NextRequest): Response | null {
  // Skip geo-blocking for certain paths
  const skipPaths = ['/api/health', '/robots.txt', '/sitemap.xml', '/favicon.ico', '/.well-known/'];

  const pathname = req.nextUrl.pathname;
  if (skipPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  const config = getGeoBlockingConfig();

  if (shouldGeoBlock(req, config)) {
    const geo = getGeoLocation(req);
    return createGeoBlockResponse(geo);
  }

  return null;
}

/**
 * Get geo information for analytics
 */
export function getGeoInfo(req: NextRequest): {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  isBlocked: boolean;
  blockReason?: string;
} {
  const ip = getClientIP(req);
  const geo = getGeoLocation(req);
  const config = getGeoBlockingConfig();
  const isBlocked = shouldGeoBlock(req, config);

  let blockReason: string | undefined;
  if (isBlocked) {
    if (config.blacklist?.includes(ip)) {
      blockReason = 'ip-blacklisted';
    } else if (geo.country && config.blockedCountries.includes(geo.country)) {
      blockReason = 'country-blocked';
    } else if (geo.region && config.blockedRegions?.includes(geo.region)) {
      blockReason = 'region-blocked';
    } else if (!geo.country && config.blockUnknownLocations) {
      blockReason = 'unknown-location';
    } else {
      blockReason = 'geo-policy';
    }
  }

  return {
    ip,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    isBlocked,
    blockReason,
  };
}

/**
 * Log geo-blocking activity
 */
export function logGeoActivity(req: NextRequest): void {
  const geoInfo = getGeoInfo(req);

  if (geoInfo.isBlocked) {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: geoInfo.ip,
      country: geoInfo.country,
      region: geoInfo.region,
      city: geoInfo.city,
      path: req.nextUrl.pathname,
      userAgent: req.headers.get('user-agent') || '',
      blockReason: geoInfo.blockReason,
    };

    // In production, send to logging service
    if (process.env.NODE_ENV === 'development') {
      console.log('Geo-blocked request:', logData);
    }
  }
}

/**
 * Utility functions for common geo-blocking scenarios
 */

// Block high-risk countries
export const blockHighRiskCountries = (req: NextRequest): Response | null => {
  return handleGeoBlocking(req);
};

// Allow only specific countries
export const allowOnlyCountries = (countries: string[]) => {
  return (req: NextRequest): Response | null => {
    const config = { allowedCountries: countries };
    if (shouldGeoBlock(req, config)) {
      const geo = getGeoLocation(req);
      return createGeoBlockResponse(geo);
    }
    return null;
  };
};

// Block specific countries
export const blockCountries = (countries: string[]) => {
  return (req: NextRequest): Response | null => {
    const config = { blockedCountries: countries };
    if (shouldGeoBlock(req, config)) {
      const geo = getGeoLocation(req);
      return createGeoBlockResponse(geo);
    }
    return null;
  };
};
