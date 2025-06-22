import { NextApiRequest, NextApiResponse } from 'next';

import {
  logSecurityEvent,
  SecurityEventSeverity,
  SecurityEventType,
} from '../../../lib/securityEventLogger';
import { withAccessControl } from '../../../middleware/accessControl';
import type { UnknownRecord } from '../../../types/common';

// Використовуємо глобальне сховище рекомендацій
declare global {
  var recommendations: UnknownRecord[];
}

if (!(global as any).recommendations) {
  (global as any).recommendations = [];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Отримуємо ID рекомендації з URL
  const { id } = req.query;
  const userId = (req.headers['user-id'] as string) || 'anonymous';

  // Перевірка методу запиту
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Метод ${req.method} не дозволений` });
  }

  try {
    // Пошук рекомендації в сховищі
    const recommendation = global.recommendations.find(rec => rec.id === id);

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Рекомендацію не знайдено',
      });
    }

    // Логуємо подію безпеки
    logSecurityEvent({
      userId,
      eventType: SecurityEventType.DATA_ACCESS,
      details: `Отримано деталі рекомендації ${id}`,
      severity: SecurityEventSeverity.INFO,
      resourceType: 'recommendation',
      resourceId: id as string,
      metadata: {
        recommendationStatus: recommendation.status,
      },
    });

    return res.status(200).json({
      success: true,
      recommendation,
    });
  } catch (error) {
    // console.error('Помилка при отриманні деталей рекомендації:', error);
    return res.status(500).json({ success: false, error: 'Внутрішня помилка сервера' });
  }
};

// Дозволяємо переглядати деталі рекомендації користувачам з правом перегляду
export default withAccessControl(handler, 'canView');
