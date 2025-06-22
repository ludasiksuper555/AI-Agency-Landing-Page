import { getAuth } from '@clerk/nextjs/server';
import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

import { SecurityEventSeverity, SecurityEventType } from '../../../lib/securityEventLogger';
import { withAccessControl } from '../../../middleware/accessControl';

/**
 * Обробник API для логування подій безпеки
 * Цей ендпоінт приймає події безпеки та зберігає їх у базі даних
 * Доступ до цього ендпоінту обмежений згідно ISO 27001
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Перевірка методу запиту
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // Перевірка аутентифікації (додатково до middleware)
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Отримання даних з запиту
    const securityEvent = req.body;

    // Валідація даних
    if (!securityEvent || !securityEvent.eventType || !securityEvent.details) {
      return res.status(400).json({ success: false, error: 'Invalid event data' });
    }

    // Перевірка типу події
    if (!Object.values(SecurityEventType).includes(securityEvent.eventType)) {
      return res.status(400).json({ success: false, error: 'Invalid event type' });
    }

    // Перевірка рівня критичності
    if (!Object.values(SecurityEventSeverity).includes(securityEvent.severity)) {
      return res.status(400).json({ success: false, error: 'Invalid severity level' });
    }

    // Додавання додаткової інформації
    const enrichedEvent = {
      ...securityEvent,
      timestamp: securityEvent.timestamp || new Date(),
      ipAddress:
        securityEvent.ipAddress ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '0.0.0.0',
      userAgent: securityEvent.userAgent || req.headers['user-agent'] || 'Unknown',
    };

    // Логування в консоль (для розробки)
    if (process.env.NODE_ENV !== 'production') {
      // console.log('[API] Security Event:', enrichedEvent);
    }

    // Відправка в Sentry
    Sentry.addBreadcrumb({
      category: 'security-api',
      message: enrichedEvent.details,
      data: {
        userId: enrichedEvent.userId,
        eventType: enrichedEvent.eventType,
        severity: enrichedEvent.severity,
        ...enrichedEvent.metadata,
      },
      level:
        enrichedEvent.severity === SecurityEventSeverity.CRITICAL
          ? 'fatal'
          : enrichedEvent.severity === SecurityEventSeverity.ERROR
            ? 'error'
            : enrichedEvent.severity === SecurityEventSeverity.WARNING
              ? 'warning'
              : 'info',
    });

    // Для критичних подій додатково створюємо повідомлення в Sentry
    if (enrichedEvent.severity === SecurityEventSeverity.CRITICAL) {
      Sentry.captureMessage(
        `Critical Security Event: ${enrichedEvent.eventType} - ${enrichedEvent.details}`,
        {
          level: 'fatal',
        }
      );
    }

    // Збереження в базу даних
    // В реальному додатку тут буде запис в базу даних
    // Наприклад, з використанням Prisma, MongoDB або іншої БД

    // Імітація успішного збереження
    const savedEvent = {
      id: Date.now(),
      ...enrichedEvent,
    };

    return res.status(200).json({ success: true, event: savedEvent });
  } catch (error) {
    // console.error('Error logging security event:', error);
    Sentry.captureException(error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}

// Експорт обробника з middleware контролю доступу
// Тільки користувачі з роллю ADMIN або MAINTAINER можуть логувати події безпеки
export default withAccessControl(handler, 'canManageUsers');
