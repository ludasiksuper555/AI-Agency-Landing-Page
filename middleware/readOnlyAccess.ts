import { NextApiRequest, NextApiResponse } from 'next';

import {
  logSecurityEvent,
  SecurityEventSeverity,
  SecurityEventType,
} from '../lib/securityEventLogger';

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Middleware для забезпечення режиму "тільки для читання" згідно з ISO 27001
 * Блокує всі запити, які можуть змінювати дані (POST, PUT, DELETE, PATCH)
 *
 * @param handler Обробник API-запиту
 * @returns Обробник з перевіркою методу запиту
 */
export const withReadOnlyAccess = (handler: NextApiHandler): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Дозволяємо тільки GET та HEAD запити
    const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];

    if (!allowedMethods.includes(req.method || '')) {
      // Отримуємо інформацію про користувача з запиту
      const userId = (req.headers['x-user-id'] as string) || 'unknown';

      // Логуємо спробу зміни даних
      logSecurityEvent({
        userId,
        eventType: SecurityEventType.ACCESS_DENIED,
        details: `Спроба виконання забороненої операції: ${req.method} ${req.url}`,
        severity: SecurityEventSeverity.WARNING,
        resourceType: 'api',
        resourceId: req.url || 'unknown',
        metadata: {
          method: req.method,
          path: req.url,
          headers: req.headers,
          query: req.query,
          body: req.body,
        },
      });

      // Повертаємо помилку 403 Forbidden
      return res.status(403).json({
        success: false,
        error:
          'Доступ заборонено. Система працює в режимі "тільки для читання" згідно з ISO 27001.',
      });
    }

    // Якщо метод дозволений, передаємо запит далі
    return handler(req, res);
  };
};

/**
 * Middleware для обмеження доступу за IP-адресою
 *
 * @param handler Обробник API-запиту
 * @param allowedIPs Масив дозволених IP-адрес
 * @returns Обробник з перевіркою IP-адреси
 */
export const withIPRestriction = (
  handler: NextApiHandler,
  allowedIPs: string[]
): NextApiHandler => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Отримуємо IP-адресу клієнта
    const clientIP =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

    // Перевіряємо, чи дозволена IP-адреса
    if (!allowedIPs.includes(clientIP)) {
      // Отримуємо інформацію про користувача з запиту
      const userId = (req.headers['x-user-id'] as string) || 'unknown';

      // Логуємо спробу доступу з недозволеної IP-адреси
      logSecurityEvent({
        userId,
        eventType: SecurityEventType.ACCESS_DENIED,
        details: `Спроба доступу з недозволеної IP-адреси: ${clientIP}`,
        severity: SecurityEventSeverity.WARNING,
        resourceType: 'api',
        resourceId: req.url || 'unknown',
        metadata: {
          ip: clientIP,
          method: req.method,
          path: req.url,
        },
      });

      // Повертаємо помилку 403 Forbidden
      return res.status(403).json({
        success: false,
        error: 'Доступ заборонено. Ваша IP-адреса не має дозволу на доступ до цього ресурсу.',
      });
    }

    // Якщо IP-адреса дозволена, передаємо запит далі
    return handler(req, res);
  };
};

/**
 * Middleware для обмеження частоти запитів
 *
 * @param handler Обробник API-запиту
 * @param maxRequests Максимальна кількість запитів
 * @param windowMs Вікно часу в мілісекундах
 * @returns Обробник з обмеженням частоти запитів
 */
export const withRateLimit = (
  handler: NextApiHandler,
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 хвилина за замовчуванням
): NextApiHandler => {
  // Зберігаємо лічильники запитів для кожного користувача/IP
  const requestCounts: Record<string, { count: number; resetTime: number }> = {};

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Отримуємо ідентифікатор клієнта (IP-адреса або ID користувача)
    const clientId =
      (req.headers['x-user-id'] as string) ||
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();

    // Ініціалізуємо або оновлюємо лічильник для клієнта
    if (!requestCounts[clientId] || requestCounts[clientId].resetTime <= now) {
      requestCounts[clientId] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      requestCounts[clientId].count += 1;
    }

    // Перевіряємо, чи не перевищено ліміт
    if (requestCounts[clientId].count > maxRequests) {
      // Логуємо спробу перевищення ліміту запитів
      logSecurityEvent({
        userId: (req.headers['x-user-id'] as string) || 'unknown',
        eventType: SecurityEventType.ACCESS_DENIED,
        details: `Перевищено ліміт запитів: ${maxRequests} за ${windowMs}ms`,
        severity: SecurityEventSeverity.WARNING,
        resourceType: 'api',
        resourceId: req.url || 'unknown',
        metadata: {
          clientId,
          method: req.method,
          path: req.url,
          requestCount: requestCounts[clientId].count,
          limit: maxRequests,
          windowMs,
        },
      });

      // Встановлюємо заголовки з інформацією про ліміт
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader(
        'X-RateLimit-Reset',
        Math.ceil(requestCounts[clientId].resetTime / 1000).toString()
      );

      // Повертаємо помилку 429 Too Many Requests
      return res.status(429).json({
        success: false,
        error: 'Забагато запитів. Спробуйте пізніше.',
      });
    }

    // Встановлюємо заголовки з інформацією про ліміт
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader(
      'X-RateLimit-Remaining',
      (maxRequests - requestCounts[clientId].count).toString()
    );
    res.setHeader(
      'X-RateLimit-Reset',
      Math.ceil(requestCounts[clientId].resetTime / 1000).toString()
    );

    // Якщо ліміт не перевищено, передаємо запит далі
    return handler(req, res);
  };
};
