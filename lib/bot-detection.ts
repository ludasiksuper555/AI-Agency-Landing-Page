import { NextRequest } from 'next/server';

/**
 * Bot detection utilities
 */

interface BotDetectionResult {
  isBot: boolean;
  confidence: number; // 0-1, where 1 is definitely a bot
  reason: string;
  userAgent?: string;
}

interface BotPattern {
  pattern: RegExp;
  name: string;
  confidence: number;
}

/**
 * Known bot patterns
 */
const BOT_PATTERNS: BotPattern[] = [
  // Search engine bots
  { pattern: /googlebot/i, name: 'Googlebot', confidence: 0.9 },
  { pattern: /bingbot/i, name: 'Bingbot', confidence: 0.9 },
  { pattern: /slurp/i, name: 'Yahoo Slurp', confidence: 0.9 },
  { pattern: /duckduckbot/i, name: 'DuckDuckBot', confidence: 0.9 },
  { pattern: /baiduspider/i, name: 'Baidu Spider', confidence: 0.9 },
  { pattern: /yandexbot/i, name: 'YandexBot', confidence: 0.9 },

  // Social media bots
  { pattern: /facebookexternalhit/i, name: 'Facebook Bot', confidence: 0.8 },
  { pattern: /twitterbot/i, name: 'Twitter Bot', confidence: 0.8 },
  { pattern: /linkedinbot/i, name: 'LinkedIn Bot', confidence: 0.8 },
  { pattern: /whatsapp/i, name: 'WhatsApp Bot', confidence: 0.8 },
  { pattern: /telegrambot/i, name: 'Telegram Bot', confidence: 0.8 },

  // SEO and monitoring bots
  { pattern: /ahrefsbot/i, name: 'Ahrefs Bot', confidence: 0.7 },
  { pattern: /semrushbot/i, name: 'SEMrush Bot', confidence: 0.7 },
  { pattern: /mj12bot/i, name: 'Majestic Bot', confidence: 0.7 },
  { pattern: /dotbot/i, name: 'Moz DotBot', confidence: 0.7 },
  { pattern: /uptimerobot/i, name: 'UptimeRobot', confidence: 0.6 },
  { pattern: /pingdom/i, name: 'Pingdom', confidence: 0.6 },

  // Generic bot patterns
  { pattern: /bot\b/i, name: 'Generic Bot', confidence: 0.5 },
  { pattern: /crawler/i, name: 'Generic Crawler', confidence: 0.5 },
  { pattern: /spider/i, name: 'Generic Spider', confidence: 0.5 },
  { pattern: /scraper/i, name: 'Generic Scraper', confidence: 0.8 },

  // Malicious bots
  { pattern: /python-requests/i, name: 'Python Requests', confidence: 0.7 },
  { pattern: /curl/i, name: 'cURL', confidence: 0.6 },
  { pattern: /wget/i, name: 'Wget', confidence: 0.7 },
  { pattern: /libwww/i, name: 'libwww', confidence: 0.6 },
  { pattern: /mechanize/i, name: 'Mechanize', confidence: 0.8 },
  { pattern: /scrapy/i, name: 'Scrapy', confidence: 0.9 },
  { pattern: /selenium/i, name: 'Selenium', confidence: 0.8 },
  { pattern: /phantomjs/i, name: 'PhantomJS', confidence: 0.8 },
  { pattern: /headlesschrome/i, name: 'Headless Chrome', confidence: 0.7 },

  // Security scanners
  { pattern: /nmap/i, name: 'Nmap', confidence: 0.9 },
  { pattern: /masscan/i, name: 'Masscan', confidence: 0.9 },
  { pattern: /zmap/i, name: 'ZMap', confidence: 0.9 },
  { pattern: /nikto/i, name: 'Nikto', confidence: 0.9 },
  { pattern: /sqlmap/i, name: 'SQLMap', confidence: 0.9 },
  { pattern: /burpsuite/i, name: 'Burp Suite', confidence: 0.9 },
  { pattern: /owasp/i, name: 'OWASP Scanner', confidence: 0.8 },
];

/**
 * Suspicious patterns that might indicate automated behavior
 */
const SUSPICIOUS_PATTERNS = [
  /^$/, // Empty user agent
  /^mozilla\/4\.0$/i, // Very generic old Mozilla
  /^mozilla\/5\.0$/i, // Very generic Mozilla
  /test/i, // Contains 'test'
  /^java/i, // Java-based clients
  /^go-http-client/i, // Go HTTP client
  /^node/i, // Node.js clients
];

/**
 * Good bot patterns (allowed bots)
 */
const GOOD_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /uptimerobot/i,
  /pingdom/i,
];

/**
 * Detect if a request is from a bot
 */
export function detectBot(req: NextRequest): BotDetectionResult {
  const userAgent = req.headers.get('user-agent') || '';

  // Check for empty or missing user agent
  if (!userAgent.trim()) {
    return {
      isBot: true,
      confidence: 0.8,
      reason: 'Missing or empty user agent',
      userAgent,
    };
  }

  // Check against known bot patterns
  for (const botPattern of BOT_PATTERNS) {
    if (botPattern.pattern.test(userAgent)) {
      return {
        isBot: true,
        confidence: botPattern.confidence,
        reason: `Detected as ${botPattern.name}`,
        userAgent,
      };
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(userAgent)) {
      return {
        isBot: true,
        confidence: 0.6,
        reason: 'Suspicious user agent pattern',
        userAgent,
      };
    }
  }

  // Additional behavioral checks
  const behaviorScore = checkBehavioralPatterns(req);
  if (behaviorScore > 0.7) {
    return {
      isBot: true,
      confidence: behaviorScore,
      reason: 'Suspicious behavioral patterns',
      userAgent,
    };
  }

  return {
    isBot: false,
    confidence: 0,
    reason: 'Appears to be human',
    userAgent,
  };
}

/**
 * Check for behavioral patterns that might indicate a bot
 */
function checkBehavioralPatterns(req: NextRequest): number {
  let suspicionScore = 0;

  // Check for missing common headers
  const commonHeaders = ['accept', 'accept-language', 'accept-encoding'];
  const missingHeaders = commonHeaders.filter(header => !req.headers.get(header));
  suspicionScore += missingHeaders.length * 0.2;

  // Check for unusual header combinations
  const accept = req.headers.get('accept') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';

  if (accept === '*/*' && !acceptLanguage) {
    suspicionScore += 0.3;
  }

  // Check for automation-specific headers
  const automationHeaders = [
    'x-requested-with',
    'x-automation',
    'x-test',
    'selenium-remote-control',
  ];

  for (const header of automationHeaders) {
    if (req.headers.get(header)) {
      suspicionScore += 0.4;
    }
  }

  return Math.min(suspicionScore, 1);
}

/**
 * Check if a bot is a "good" bot (search engines, social media, etc.)
 */
export function isGoodBot(userAgent: string): boolean {
  return GOOD_BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Check if a bot should be blocked
 */
export function shouldBlockBot(req: NextRequest): boolean {
  const detection = detectBot(req);

  if (!detection.isBot) {
    return false;
  }

  // Don't block good bots
  if (isGoodBot(detection.userAgent || '')) {
    return false;
  }

  // Block bots with high confidence
  if (detection.confidence > 0.8) {
    return true;
  }

  // Block known malicious patterns
  const maliciousPatterns = [
    /scraper/i,
    /mechanize/i,
    /scrapy/i,
    /selenium/i,
    /phantomjs/i,
    /nmap/i,
    /masscan/i,
    /nikto/i,
    /sqlmap/i,
    /burpsuite/i,
  ];

  const userAgent = detection.userAgent || '';
  return maliciousPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Get bot information for logging/analytics
 */
export function getBotInfo(req: NextRequest): {
  isBot: boolean;
  botName?: string;
  isGoodBot?: boolean;
  shouldBlock?: boolean;
  confidence?: number;
} {
  const detection = detectBot(req);

  if (!detection.isBot) {
    return { isBot: false };
  }

  const userAgent = detection.userAgent || '';
  const goodBot = isGoodBot(userAgent);
  const shouldBlock = shouldBlockBot(req);

  // Extract bot name from reason
  const botNameMatch = detection.reason.match(/Detected as (.+)/);
  const botName = botNameMatch ? botNameMatch[1] : 'Unknown Bot';

  return {
    isBot: true,
    botName,
    isGoodBot: goodBot,
    shouldBlock,
    confidence: detection.confidence,
  };
}

/**
 * Create a response for blocked bots
 */
export function createBotBlockResponse(): Response {
  return new Response('Access denied for automated requests', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

/**
 * Middleware helper for bot detection
 */
export function handleBotDetection(req: NextRequest): Response | null {
  // Skip bot detection for certain paths
  const skipPaths = ['/robots.txt', '/sitemap.xml', '/favicon.ico', '/.well-known/', '/api/health'];

  const pathname = req.nextUrl.pathname;
  if (skipPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  if (shouldBlockBot(req)) {
    return createBotBlockResponse();
  }

  return null;
}

/**
 * Log bot activity for monitoring
 */
export function logBotActivity(req: NextRequest): void {
  const botInfo = getBotInfo(req);

  if (botInfo.isBot) {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || '',
      path: req.nextUrl.pathname,
      botName: botInfo.botName,
      isGoodBot: botInfo.isGoodBot,
      shouldBlock: botInfo.shouldBlock,
      confidence: botInfo.confidence,
    };

    // In production, you might want to send this to a logging service
    if (process.env.NODE_ENV === 'development') {
      console.log('Bot detected:', logData);
    }

    // You can integrate with external logging services here
    // Example: send to Sentry, DataDog, CloudWatch, etc.
  }
}
