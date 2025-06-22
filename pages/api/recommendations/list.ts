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
  // Перевірка методу запиту
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Метод ${req.method} не дозволений` });
  }

  try {
    const { userId, resourceType, resourceId, status } = req.query;

    // Фільтрація рекомендацій за параметрами запиту
    let filteredRecommendations = [...global.recommendations];

    if (resourceType) {
      filteredRecommendations = filteredRecommendations.filter(
        rec => rec.resourceType === resourceType
      );
    }

    if (resourceId) {
      filteredRecommendations = filteredRecommendations.filter(
        rec => rec.resourceId === resourceId
      );
    }

    if (status) {
      filteredRecommendations = filteredRecommendations.filter(rec => rec.status === status);
    }

    // Логуємо подію безпеки
    logSecurityEvent({
      userId: (userId as string) || 'anonymous',
      eventType: SecurityEventType.DATA_ACCESS,
      details: `Отримано список рекомендацій`,
      severity: SecurityEventSeverity.INFO,
      resourceType: 'recommendations',
      resourceId: 'list',
      metadata: {
        filters: { resourceType, resourceId, status },
        count: filteredRecommendations.length,
      },
    });

    return res.status(200).json({
      success: true,
      recommendations: filteredRecommendations,
    });
  } catch (error) {
    // console.error('Помилка при отриманні списку рекомендацій:', error);
    return res.status(500).json({ success: false, error: 'Внутрішня помилка сервера' });
  }
};

// Дозволяємо переглядати рекомендації користувачам з правом перегляду
export default withAccessControl(handler, 'canView');
