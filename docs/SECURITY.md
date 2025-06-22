# Руководство по безопасности

## Обзор

Этот документ описывает политики безопасности, лучшие практики и процедуры для AI Agency Landing Page.

## 🔒 Политика безопасности

### Поддерживаемые версии

| Версия | Поддержка безопасности           |
| ------ | -------------------------------- |
| 2.x.x  | ✅ Полная поддержка              |
| 1.x.x  | ⚠️ Критические обновления только |
| < 1.0  | ❌ Не поддерживается             |

### Сообщение об уязвимостях

Если вы обнаружили уязвимость безопасности, пожалуйста:

1. **НЕ создавайте публичный issue**
2. Отправьте email на: security@ai-agency.com
3. Включите подробное описание уязвимости
4. Предоставьте шаги для воспроизведения
5. Укажите потенциальное влияние

**Время ответа**: 24 часа
**Время исправления**: 72 часа для критических уязвимостей

## 🛡️ Архитектура безопасности

### Принципы безопасности

1. **Defense in Depth** - многоуровневая защита
2. **Principle of Least Privilege** - минимальные необходимые права
3. **Zero Trust** - проверка всех запросов
4. **Security by Design** - безопасность с самого начала
5. **Fail Secure** - безопасный отказ при ошибках

### Модель угроз

```mermaid
graph TD
    A[Пользователь] --> B[CDN/WAF]
    B --> C[Load Balancer]
    C --> D[Next.js App]
    D --> E[API Routes]
    E --> F[Database]

    G[Атакующий] -.-> B
    G -.-> D
    G -.-> E
    G -.-> F

    H[Мониторинг] --> D
    H --> E
    H --> F
```

## 🔐 Аутентификация и авторизация

### JWT токены

```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken';
import { NextApiRequest } from 'next';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export class JWTService {
  private readonly secret: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor() {
    this.secret = process.env.JWT_SECRET!;
    this.issuer = process.env.JWT_ISSUER || 'ai-agency';
    this.audience = process.env.JWT_AUDIENCE || 'ai-agency-users';

    if (!this.secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: '1h',
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256',
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: 'refresh' }, this.secret, {
      expiresIn: '7d',
      issuer: this.issuer,
      audience: this.audience,
      algorithm: 'HS256',
    });
  }

  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  extractTokenFromRequest(req: NextApiRequest): string | null {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}

export const jwtService = new JWTService();
```

### Middleware для аутентификации

```typescript
// middleware/auth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { jwtService } from '../lib/auth/jwt';
import { rateLimiter } from '../lib/security/rate-limiter';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Rate limiting
      const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const isAllowed = await rateLimiter.checkLimit(clientIp as string);

      if (!isAllowed) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      // Token extraction and verification
      const token = jwtService.extractTokenFromRequest(req);

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const payload = jwtService.verifyToken(token);

      // Attach user to request
      (req as AuthenticatedRequest).user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };

      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: 'Invalid authentication' });
    }
  };
}

// Role-based access control
export function withRole(roles: string[]) {
  return function (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      return handler(req, res);
    });
  };
}
```

## 🚫 Защита от атак

### CSRF Protection

```typescript
// lib/security/csrf.ts
import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export class CSRFProtection {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
  }

  generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const data = `${sessionId}:${timestamp}`;
    const hash = crypto.createHmac('sha256', this.secret).update(data).digest('hex');

    return Buffer.from(`${data}:${hash}`).toString('base64');
  }

  verifyToken(token: string, sessionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [receivedSessionId, timestamp, hash] = decoded.split(':');

      // Check session ID
      if (receivedSessionId !== sessionId) {
        return false;
      }

      // Check timestamp (token valid for 1 hour)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 3600000) {
        return false;
      }

      // Verify hash
      const data = `${receivedSessionId}:${timestamp}`;
      const expectedHash = crypto.createHmac('sha256', this.secret).update(data).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
    } catch (error) {
      return false;
    }
  }
}

export const csrfProtection = new CSRFProtection();

export function withCSRF(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return handler(req, res);
    }

    const token = req.headers['x-csrf-token'] as string;
    const sessionId = req.headers['x-session-id'] as string;

    if (!token || !sessionId || !csrfProtection.verifyToken(token, sessionId)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }

    return handler(req, res);
  };
}
```

### Rate Limiting

```typescript
// lib/security/rate-limiter.ts
import Redis from 'ioredis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiter {
  private redis: Redis;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async checkLimit(identifier: string): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const window = Math.floor(Date.now() / this.config.windowMs);
    const windowKey = `${key}:${window}`;

    const current = await this.redis.incr(windowKey);

    if (current === 1) {
      await this.redis.expire(windowKey, Math.ceil(this.config.windowMs / 1000));
    }

    return current <= this.config.maxRequests;
  }

  async getRemainingRequests(identifier: string): Promise<number> {
    const key = `rate_limit:${identifier}`;
    const window = Math.floor(Date.now() / this.config.windowMs);
    const windowKey = `${key}:${window}`;

    const current = await this.redis.get(windowKey);
    const used = current ? parseInt(current) : 0;

    return Math.max(0, this.config.maxRequests - used);
  }

  async resetLimit(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`;
    const window = Math.floor(Date.now() / this.config.windowMs);
    const windowKey = `${key}:${window}`;

    await this.redis.del(windowKey);
  }
}

// Различные конфигурации для разных эндпоинтов
export const rateLimiters = {
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 минут
    maxRequests: 100,
  }),

  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 минут
    maxRequests: 5, // Строже для аутентификации
  }),

  contact: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 час
    maxRequests: 3, // Ограничение для контактной формы
  }),
};
```

### XSS Protection

```typescript
// lib/security/xss-protection.ts
import DOMPurify from 'isomorphic-dompurify';
import { escape } from 'html-escaper';

export class XSSProtection {
  // Очистка HTML контента
  static sanitizeHTML(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href'],
      ALLOW_DATA_ATTR: false,
    });
  }

  // Экранирование HTML сущностей
  static escapeHTML(text: string): string {
    return escape(text);
  }

  // Валидация и очистка пользовательского ввода
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.escapeHTML(input.trim());
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.escapeHTML(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  // Content Security Policy
  static getCSPHeader(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.ai-agency.com https://www.google-analytics.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ];

    return directives.join('; ');
  }
}

// Middleware для XSS защиты
export function withXSSProtection(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Установка CSP заголовков
    res.setHeader('Content-Security-Policy', XSSProtection.getCSPHeader());
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Очистка входных данных
    if (req.body) {
      req.body = XSSProtection.sanitizeInput(req.body);
    }

    if (req.query) {
      req.query = XSSProtection.sanitizeInput(req.query);
    }

    return handler(req, res);
  };
}
```

### SQL Injection Protection

```typescript
// lib/security/sql-protection.ts
import { Pool } from 'pg';

export class DatabaseSecurity {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  // Безопасное выполнение запросов с параметрами
  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();

    try {
      // Логирование запросов в development
      if (process.env.NODE_ENV === 'development') {
        console.log('Executing query:', { text, params });
      }

      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      // Мониторинг медленных запросов
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, text);
      }

      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Валидация и экранирование идентификаторов
  escapeIdentifier(identifier: string): string {
    return '"' + identifier.replace(/"/g, '""') + '"';
  }

  // Построение безопасных WHERE условий
  buildWhereClause(conditions: Record<string, any>): { text: string; params: any[] } {
    const clauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(conditions)) {
      // Валидация имени колонки
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        throw new Error(`Invalid column name: ${key}`);
      }

      if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
        clauses.push(`${this.escapeIdentifier(key)} IN (${placeholders})`);
        params.push(...value);
      } else {
        clauses.push(`${this.escapeIdentifier(key)} = $${paramIndex++}`);
        params.push(value);
      }
    }

    return {
      text: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
      params,
    };
  }

  // Безопасное получение записей
  async findMany(
    table: string,
    conditions: Record<string, any> = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    } = {}
  ): Promise<any[]> {
    // Валидация имени таблицы
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    const { text: whereClause, params } = this.buildWhereClause(conditions);
    let paramIndex = params.length + 1;

    let query = `SELECT * FROM ${this.escapeIdentifier(table)} ${whereClause}`;

    // Сортировка
    if (options.orderBy) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(options.orderBy)) {
        throw new Error(`Invalid order by column: ${options.orderBy}`);
      }
      const direction = options.orderDirection === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${this.escapeIdentifier(options.orderBy)} ${direction}`;
    }

    // Лимит
    if (options.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    // Смещение
    if (options.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const result = await this.query(query, params);
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = new DatabaseSecurity();
```

## 🔍 Мониторинг безопасности

### Security Event Logging

```typescript
// lib/security/security-logger.ts
import winston from 'winston';

interface SecurityEvent {
  type:
    | 'auth_failure'
    | 'rate_limit_exceeded'
    | 'suspicious_activity'
    | 'data_breach'
    | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
}

export class SecurityLogger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'ai-agency-security' },
      transports: [
        new winston.transports.File({ filename: 'logs/security-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/security-combined.log' }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.simple(),
        })
      );
    }
  }

  logSecurityEvent(event: SecurityEvent): void {
    this.logger.log({
      level: this.mapSeverityToLevel(event.severity),
      message: `Security Event: ${event.type}`,
      ...event,
    });

    // Отправка критических событий в систему мониторинга
    if (event.severity === 'critical') {
      this.sendAlert(event);
    }
  }

  private mapSeverityToLevel(severity: string): string {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warn';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  private async sendAlert(event: SecurityEvent): Promise<void> {
    try {
      // Отправка в Slack
      if (process.env.SLACK_SECURITY_WEBHOOK) {
        await fetch(process.env.SLACK_SECURITY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Critical Security Event: ${event.type}`,
            attachments: [
              {
                color: 'danger',
                fields: [
                  { title: 'Type', value: event.type, short: true },
                  { title: 'Severity', value: event.severity, short: true },
                  { title: 'IP', value: event.ip, short: true },
                  { title: 'User ID', value: event.userId || 'Unknown', short: true },
                  { title: 'Details', value: JSON.stringify(event.details), short: false },
                ],
                timestamp: event.timestamp.toISOString(),
              },
            ],
          }),
        });
      }

      // Отправка email администраторам
      if (process.env.ADMIN_EMAIL) {
        // Реализация отправки email
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
}

export const securityLogger = new SecurityLogger();

// Middleware для логирования безопасности
export function withSecurityLogging(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress) as string;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
      await handler(req, res);

      // Логирование подозрительной активности
      const responseTime = Date.now() - startTime;
      if (responseTime > 5000) {
        securityLogger.logSecurityEvent({
          type: 'suspicious_activity',
          severity: 'medium',
          ip,
          userAgent,
          details: {
            path: req.url,
            method: req.method,
            responseTime,
            reason: 'Slow response time',
          },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      // Логирование ошибок безопасности
      securityLogger.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        ip,
        userAgent,
        details: {
          path: req.url,
          method: req.method,
          error: error.message,
        },
        timestamp: new Date(),
      });

      throw error;
    }
  };
}
```

### Intrusion Detection

```typescript
// lib/security/intrusion-detection.ts
import { securityLogger } from './security-logger';

interface SuspiciousPattern {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export class IntrusionDetectionSystem {
  private suspiciousPatterns: SuspiciousPattern[] = [
    {
      name: 'SQL_INJECTION',
      pattern: /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/i,
      severity: 'high',
      description: 'Potential SQL injection attempt',
    },
    {
      name: 'XSS_ATTEMPT',
      pattern: /<script[^>]*>.*?<\/script>/i,
      severity: 'high',
      description: 'Potential XSS attack',
    },
    {
      name: 'PATH_TRAVERSAL',
      pattern: /\.\.[\/\\]/,
      severity: 'medium',
      description: 'Potential path traversal attempt',
    },
    {
      name: 'COMMAND_INJECTION',
      pattern: /[;&|`$(){}\[\]]/,
      severity: 'high',
      description: 'Potential command injection',
    },
  ];

  private failedAttempts = new Map<string, number>();
  private blockedIPs = new Set<string>();

  analyzeRequest(req: NextApiRequest): void {
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress) as string;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Проверка заблокированных IP
    if (this.blockedIPs.has(ip)) {
      throw new Error('IP address is blocked');
    }

    // Анализ параметров запроса
    const allParams = {
      ...req.query,
      ...req.body,
      url: req.url,
      userAgent,
    };

    for (const [key, value] of Object.entries(allParams)) {
      if (typeof value === 'string') {
        this.checkForSuspiciousPatterns(value, ip, userAgent, key);
      }
    }

    // Проверка частоты запросов
    this.checkRequestFrequency(ip, userAgent);
  }

  private checkForSuspiciousPatterns(
    input: string,
    ip: string,
    userAgent: string,
    parameter: string
  ): void {
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.pattern.test(input)) {
        securityLogger.logSecurityEvent({
          type: 'suspicious_activity',
          severity: pattern.severity,
          ip,
          userAgent,
          details: {
            pattern: pattern.name,
            description: pattern.description,
            parameter,
            value: input,
          },
          timestamp: new Date(),
        });

        this.incrementFailedAttempts(ip);

        if (pattern.severity === 'critical' || pattern.severity === 'high') {
          throw new Error('Suspicious activity detected');
        }
      }
    }
  }

  private checkRequestFrequency(ip: string, userAgent: string): void {
    // Простая проверка частоты запросов
    // В реальном приложении используйте Redis или другое хранилище
    const key = `${ip}:${Date.now()}`;
    // Реализация проверки частоты
  }

  private incrementFailedAttempts(ip: string): void {
    const current = this.failedAttempts.get(ip) || 0;
    const newCount = current + 1;

    this.failedAttempts.set(ip, newCount);

    // Блокировка после 5 подозрительных попыток
    if (newCount >= 5) {
      this.blockedIPs.add(ip);

      securityLogger.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'critical',
        ip,
        userAgent: 'Unknown',
        details: {
          reason: 'IP blocked due to multiple suspicious attempts',
          attemptCount: newCount,
        },
        timestamp: new Date(),
      });

      // Автоматическая разблокировка через 1 час
      setTimeout(
        () => {
          this.blockedIPs.delete(ip);
          this.failedAttempts.delete(ip);
        },
        60 * 60 * 1000
      );
    }
  }

  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.failedAttempts.delete(ip);
  }
}

export const ids = new IntrusionDetectionSystem();

// Middleware для обнаружения вторжений
export function withIntrusionDetection(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      ids.analyzeRequest(req);
      return handler(req, res);
    } catch (error) {
      if (
        error.message === 'Suspicious activity detected' ||
        error.message === 'IP address is blocked'
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }
      throw error;
    }
  };
}
```

## 🔐 Шифрование данных

### Encryption Service

```typescript
// lib/security/encryption.ts
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly key: Buffer;

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY;
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    this.key = crypto.scryptSync(keyString, 'salt', this.keyLength);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, this.key, { iv });

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Объединяем IV, tag и зашифрованные данные
    return iv.toString('hex') + tag.toString('hex') + encrypted;
  }

  decrypt(encryptedData: string): string {
    const iv = Buffer.from(encryptedData.slice(0, this.ivLength * 2), 'hex');
    const tag = Buffer.from(
      encryptedData.slice(this.ivLength * 2, (this.ivLength + this.tagLength) * 2),
      'hex'
    );
    const encrypted = encryptedData.slice((this.ivLength + this.tagLength) * 2);

    const decipher = crypto.createDecipher(this.algorithm, this.key, { iv });
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
  }

  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export const encryption = new EncryptionService();
```

## 🌐 HTTPS и TLS

### SSL/TLS Configuration

```javascript
// next.config.js - HTTPS конфигурация
const nextConfig = {
  // Принудительное использование HTTPS в production
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/(.*)',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://ai-agency.com/:path*',
          permanent: true,
        },
      ];
    }
    return [];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## 🔒 Переменные окружения

### Безопасное управление секретами

```bash
# .env.example - Пример переменных окружения

# Основные настройки
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://ai-agency.com

# Безопасность
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ISSUER=ai-agency
JWT_AUDIENCE=ai-agency-users
ENCRYPTION_KEY=your-encryption-key-here
CSRF_SECRET=your-csrf-secret-here

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/ai_agency
REDIS_URL=redis://localhost:6379

# Внешние сервисы
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Мониторинг и алерты
SLACK_SECURITY_WEBHOOK=https://hooks.slack.com/services/...
ADMIN_EMAIL=admin@ai-agency.com

# API ключи (только для production)
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
SENTRY_DSN=https://your-sentry-dsn
```

### Валидация переменных окружения

```typescript
// lib/config/env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Безопасность
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string(),
  JWT_AUDIENCE: z.string(),
  ENCRYPTION_KEY: z.string().min(32),
  CSRF_SECRET: z.string().min(32),

  // База данных
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string(),

  // Мониторинг
  SLACK_SECURITY_WEBHOOK: z.string().url().optional(),
  ADMIN_EMAIL: z.string().email(),

  // Аналитика
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    console.error(error.errors);
    process.exit(1);
  }
}

// Валидация при запуске приложения
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}
```

## 🔍 Аудит безопасности

### Автоматический аудит

```json
// package.json - скрипты для аудита
{
  "scripts": {
    "security:audit": "npm audit --audit-level=moderate",
    "security:fix": "npm audit fix",
    "security:check": "npm run security:audit && npm run security:snyk",
    "security:snyk": "snyk test",
    "security:lighthouse": "lighthouse-ci",
    "security:headers": "node scripts/check-security-headers.js"
  }
}
```

### Проверка заголовков безопасности

```javascript
// scripts/check-security-headers.js
const https = require('https');
const { URL } = require('url');

const requiredHeaders = {
  'strict-transport-security': 'HSTS header missing',
  'x-content-type-options': 'X-Content-Type-Options header missing',
  'x-frame-options': 'X-Frame-Options header missing',
  'x-xss-protection': 'X-XSS-Protection header missing',
  'content-security-policy': 'CSP header missing',
  'referrer-policy': 'Referrer-Policy header missing',
};

function checkSecurityHeaders(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: 'HEAD',
    };

    const req = https.request(options, res => {
      const headers = res.headers;
      const results = [];

      for (const [header, message] of Object.entries(requiredHeaders)) {
        if (!headers[header]) {
          results.push({ header, status: 'MISSING', message });
        } else {
          results.push({ header, status: 'PRESENT', value: headers[header] });
        }
      }

      resolve(results);
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000';

  try {
    console.log(`Checking security headers for: ${url}`);
    const results = await checkSecurityHeaders(url);

    let hasIssues = false;

    results.forEach(result => {
      if (result.status === 'MISSING') {
        console.error(`❌ ${result.message}`);
        hasIssues = true;
      } else {
        console.log(`✅ ${result.header}: ${result.value}`);
      }
    });

    if (hasIssues) {
      process.exit(1);
    } else {
      console.log('\n✅ All security headers are present!');
    }
  } catch (error) {
    console.error('Error checking headers:', error.message);
    process.exit(1);
  }
}

main();
```

## 📋 Чек-лист безопасности

### Разработка

- [ ] Валидация всех пользовательских входных данных
- [ ] Использование параметризованных запросов к БД
- [ ] Экранирование HTML вывода
- [ ] Проверка авторизации для всех защищенных эндпоинтов
- [ ] Использование HTTPS для всех соединений
- [ ] Безопасное хранение секретов
- [ ] Логирование событий безопасности
- [ ] Регулярное обновление зависимостей

### Инфраструктура

- [ ] Настройка WAF (Web Application Firewall)
- [ ] Мониторинг безопасности в реальном времени
- [ ] Резервное копирование данных
- [ ] Настройка SSL/TLS сертификатов
- [ ] Ограничение доступа к административным панелям
- [ ] Настройка системы обнаружения вторжений
- [ ] Регулярные тесты на проникновение

### Соответствие стандартам

- [ ] GDPR compliance для обработки персональных данных
- [ ] OWASP Top 10 защита
- [ ] SOC 2 Type II соответствие
- [ ] ISO 27001 стандарты

## 📞 Контакты по безопасности

**Security Team**

- Email: security@ai-agency.com
- PGP Key: [Публичный ключ]
- Response Time: 24 часа

**Bug Bounty Program**

- Platform: HackerOne
- Scope: https://ai-agency.com/*
- Rewards: $100 - $5000

**Emergency Contact**

- Phone: +1-XXX-XXX-XXXX
- Available: 24/7
- For critical security incidents only
