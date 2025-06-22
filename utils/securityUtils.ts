/**
 * Security utility functions
 * Утиліти для забезпечення безпеки
 */

import * as crypto from 'crypto';

/**
 * Генерує безпечний випадковий рядок
 */
export const generateSecureToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Хешує пароль з сіллю
 */
export const hashPassword = (password: string, salt?: string): { hash: string; salt: string } => {
  const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, passwordSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: passwordSalt };
};

/**
 * Перевіряє пароль
 */
export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

/**
 * Перевіряє силу пароля
 */
export const checkPasswordStrength = (
  password: string
): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} => {
  const feedback: string[] = [];
  let score = 0;

  // Довжина
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Пароль повинен містити принаймні 8 символів');
  }

  // Великі літери
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Додайте великі літери');
  }

  // Малі літери
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Додайте малі літери');
  }

  // Цифри
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Додайте цифри');
  }

  // Спеціальні символи
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Додайте спеціальні символи');
  }

  return {
    score,
    feedback,
    isStrong: score >= 4,
  };
};

/**
 * Санітизує HTML для запобігання XSS
 */
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Валідує та санітизує URL
 */
export const sanitizeUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // Дозволяємо тільки HTTP та HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    return urlObj.toString();
  } catch {
    return null;
  }
};

/**
 * Генерує CSRF токен
 */
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('base64');
};

/**
 * Перевіряє CSRF токен
 */
export const verifyCSRFToken = (token: string, sessionToken: string): boolean => {
  return crypto.timingSafeEqual(Buffer.from(token, 'base64'), Buffer.from(sessionToken, 'base64'));
};

/**
 * Обмежує частоту запитів (rate limiting)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Видаляємо старі запити
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Створює екземпляр rate limiter
 */
export const createRateLimiter = (maxRequests = 100, windowMs = 60000): RateLimiter => {
  return new RateLimiter(maxRequests, windowMs);
};

/**
 * Маскує чутливі дані для логування
 */
export const maskSensitiveData = (data: unknown): unknown => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  const masked: Record<string, any> = { ...data };
  for (const [key, value] of Object.entries(masked)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    }
  }

  return masked;
};
