/**
 * Enhanced Team Portfolio - Security Configuration
 * Comprehensive security settings and policies
 */

const crypto = require('crypto');

const securityConfig = {
  // =============================================================================
  // CONTENT SECURITY POLICY (CSP)
  // =============================================================================

  csp: {
    enabled: true,
    reportOnly: process.env.NODE_ENV === 'development',
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-eval'", // Required for Next.js development
        "'unsafe-inline'", // Required for styled-components
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://connect.facebook.net',
        'https://www.clarity.ms',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://images.unsplash.com',
        'https://res.cloudinary.com',
        'https://assets.contentful.com',
        'https://www.google-analytics.com',
        'https://www.facebook.com',
      ],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net', 'data:'],
      'connect-src': [
        "'self'",
        'https://api.yourdomain.com',
        'https://analytics.google.com',
        'https://www.google-analytics.com',
        'https://vitals.vercel-insights.com',
        'https://api.contentful.com',
        'https://preview.contentful.com',
        'wss://localhost:*', // WebSocket for development
      ],
      'frame-src': [
        "'self'",
        'https://www.youtube.com',
        'https://player.vimeo.com',
        'https://www.google.com',
      ],
      'worker-src': ["'self'", 'blob:'],
      'child-src': ["'self'", 'blob:'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    },
    reportUri: '/api/security/csp-report',
  },

  // =============================================================================
  // SECURITY HEADERS
  // =============================================================================

  headers: {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // XSS Protection
    'X-XSS-Protection': '1; mode=block',

    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions Policy
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()',
      'payment=()',
      'usb=()',
    ].join(', '),

    // Strict Transport Security (HTTPS only)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Cross-Origin Policies
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin',

    // Remove server information
    'X-Powered-By': false,
    Server: false,
  },

  // =============================================================================
  // CORS CONFIGURATION
  // =============================================================================

  cors: {
    enabled: true,
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://yourdomain.com', 'https://www.yourdomain.com', 'https://staging.yourdomain.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },

  // =============================================================================
  // RATE LIMITING
  // =============================================================================

  rateLimit: {
    // Global rate limit
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    },

    // API rate limit
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 API requests per windowMs
      message: 'Too many API requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    },

    // Authentication rate limit
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 auth attempts per windowMs
      message: 'Too many authentication attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
    },

    // Contact form rate limit
    contact: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // Limit each IP to 3 contact form submissions per hour
      message: 'Too many contact form submissions, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    },
  },

  // =============================================================================
  // INPUT VALIDATION & SANITIZATION
  // =============================================================================

  validation: {
    // Maximum request body size
    maxBodySize: '10mb',

    // Maximum URL length
    maxUrlLength: 2048,

    // Maximum header size
    maxHeaderSize: 8192,

    // File upload limits
    fileUpload: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'application/pdf',
        'text/plain',
        'text/csv',
      ],
      maxFiles: 5,
    },

    // Input sanitization rules
    sanitization: {
      // Remove HTML tags
      stripHtml: true,
      // Escape special characters
      escapeHtml: true,
      // Trim whitespace
      trim: true,
      // Convert to lowercase for emails
      normalizeEmail: true,
    },
  },

  // =============================================================================
  // AUTHENTICATION & AUTHORIZATION
  // =============================================================================

  auth: {
    // JWT Configuration
    jwt: {
      secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
      expiresIn: '24h',
      issuer: 'team-portfolio',
      audience: 'team-portfolio-users',
      algorithm: 'HS256',
    },

    // Session Configuration
    session: {
      secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
      name: 'team-portfolio-session',
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
      },
    },

    // Password Requirements
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventCommonPasswords: true,
      preventUserInfo: true,
    },

    // Two-Factor Authentication
    twoFactor: {
      enabled: true,
      issuer: 'Team Portfolio',
      window: 2, // Allow 2 time steps before/after current
      step: 30, // 30 seconds per time step
    },

    // Account Lockout
    lockout: {
      enabled: true,
      maxAttempts: 5,
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      progressiveDelay: true,
    },
  },

  // =============================================================================
  // DATA PROTECTION
  // =============================================================================

  dataProtection: {
    // Encryption settings
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      saltLength: 32,
    },

    // PII (Personally Identifiable Information) handling
    pii: {
      // Fields that contain PII
      fields: ['email', 'name', 'phone', 'address', 'socialSecurityNumber', 'dateOfBirth'],
      // Encryption required for PII
      encryptAtRest: true,
      // Mask PII in logs
      maskInLogs: true,
      // Retention period for PII
      retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
    },

    // Data anonymization
    anonymization: {
      enabled: true,
      // Fields to anonymize
      fields: ['ip', 'userAgent', 'sessionId'],
      // Hash algorithm for anonymization
      algorithm: 'sha256',
      // Salt for hashing
      salt: process.env.ANONYMIZATION_SALT || crypto.randomBytes(32).toString('hex'),
    },
  },

  // =============================================================================
  // SECURITY MONITORING
  // =============================================================================

  monitoring: {
    // Security event logging
    logging: {
      enabled: true,
      level: 'info',
      // Events to log
      events: [
        'authentication_success',
        'authentication_failure',
        'authorization_failure',
        'suspicious_activity',
        'rate_limit_exceeded',
        'csp_violation',
        'security_header_missing',
        'file_upload',
        'data_access',
        'admin_action',
      ],
      // Log retention period
      retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    },

    // Intrusion detection
    intrusionDetection: {
      enabled: true,
      // Suspicious patterns
      patterns: [
        /(<script[^>]*>.*?<\/script>)/gi, // Script injection
        /(union.*select|select.*from|insert.*into|delete.*from)/gi, // SQL injection
        /(\.\.[\/\\]|\.\.%2f|\.\.%5c)/gi, // Path traversal
        /(eval\(|setTimeout\(|setInterval\()/gi, // Code injection
        /(document\.cookie|document\.write)/gi, // XSS attempts
      ],
      // Action to take when pattern is detected
      action: 'block', // 'log', 'block', 'captcha'
    },

    // Anomaly detection
    anomalyDetection: {
      enabled: true,
      // Thresholds for anomaly detection
      thresholds: {
        requestsPerMinute: 100,
        failedLoginsPerHour: 10,
        uniqueIpsPerHour: 1000,
        errorRatePercentage: 5,
      },
      // Actions to take when anomaly is detected
      actions: ['log', 'alert', 'rateLimit'],
    },
  },

  // =============================================================================
  // COMPLIANCE
  // =============================================================================

  compliance: {
    // GDPR Compliance
    gdpr: {
      enabled: true,
      // Cookie consent
      cookieConsent: {
        required: true,
        categories: ['necessary', 'analytics', 'marketing'],
        defaultConsent: { necessary: true, analytics: false, marketing: false },
      },
      // Data subject rights
      dataSubjectRights: {
        accessRequest: true,
        rectificationRequest: true,
        erasureRequest: true,
        portabilityRequest: true,
        restrictionRequest: true,
        objectionRequest: true,
      },
      // Data retention
      dataRetention: {
        defaultPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
        categories: {
          analytics: 26 * 30 * 24 * 60 * 60 * 1000, // 26 months
          marketing: 365 * 24 * 60 * 60 * 1000, // 1 year
          necessary: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
        },
      },
    },

    // CCPA Compliance
    ccpa: {
      enabled: true,
      // Do Not Sell My Personal Information
      doNotSell: true,
      // Consumer rights
      consumerRights: {
        knowRequest: true,
        deleteRequest: true,
        optOutRequest: true,
        nonDiscriminationRequest: true,
      },
    },

    // SOC 2 Compliance
    soc2: {
      enabled: true,
      // Trust service criteria
      criteria: {
        security: true,
        availability: true,
        processingIntegrity: true,
        confidentiality: true,
        privacy: true,
      },
    },
  },

  // =============================================================================
  // SECURITY UTILITIES
  // =============================================================================

  utils: {
    // Generate secure random string
    generateSecureRandom: (length = 32) => {
      return crypto.randomBytes(length).toString('hex');
    },

    // Hash password
    hashPassword: async (password, saltRounds = 12) => {
      const bcrypt = require('bcrypt');
      return await bcrypt.hash(password, saltRounds);
    },

    // Verify password
    verifyPassword: async (password, hash) => {
      const bcrypt = require('bcrypt');
      return await bcrypt.compare(password, hash);
    },

    // Encrypt data
    encrypt: (data, key) => {
      const algorithm = securityConfig.dataProtection.encryption.algorithm;
      const iv = crypto.randomBytes(securityConfig.dataProtection.encryption.ivLength);
      const cipher = crypto.createCipher(algorithm, key, iv);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    },

    // Decrypt data
    decrypt: (encryptedData, key) => {
      const algorithm = securityConfig.dataProtection.encryption.algorithm;
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');

      const decipher = crypto.createDecipher(algorithm, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    },

    // Sanitize input
    sanitizeInput: input => {
      if (typeof input !== 'string') return input;

      let sanitized = input;

      if (securityConfig.validation.sanitization.trim) {
        sanitized = sanitized.trim();
      }

      if (securityConfig.validation.sanitization.stripHtml) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
      }

      if (securityConfig.validation.sanitization.escapeHtml) {
        sanitized = sanitized
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }

      return sanitized;
    },

    // Validate email
    validateEmail: email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    // Validate password strength
    validatePassword: password => {
      const config = securityConfig.auth.password;
      const errors = [];

      if (password.length < config.minLength) {
        errors.push(`Password must be at least ${config.minLength} characters long`);
      }

      if (password.length > config.maxLength) {
        errors.push(`Password must be no more than ${config.maxLength} characters long`);
      }

      if (config.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      if (config.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      if (config.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    },

    // Generate CSP header
    generateCSPHeader: () => {
      const directives = securityConfig.csp.directives;
      const cspString = Object.entries(directives)
        .map(([key, values]) => {
          if (values.length === 0) return key;
          return `${key} ${values.join(' ')}`;
        })
        .join('; ');

      return securityConfig.csp.reportOnly
        ? `Content-Security-Policy-Report-Only: ${cspString}`
        : `Content-Security-Policy: ${cspString}`;
    },

    // Check for suspicious activity
    isSuspiciousActivity: request => {
      const patterns = securityConfig.monitoring.intrusionDetection.patterns;
      const requestString = JSON.stringify(request);

      return patterns.some(pattern => pattern.test(requestString));
    },
  },
};

// Export configuration
module.exports = securityConfig;

// Export for ES modules
module.exports.default = securityConfig;
