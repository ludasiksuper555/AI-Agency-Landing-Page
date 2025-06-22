import { NextApiRequest, NextApiResponse } from 'next';

import {
  logSecurityEvent,
  SecurityEventSeverity,
  SecurityEventType,
} from '../../../lib/securityEventLogger';
import { withAccessControl } from '../../../middleware/accessControl';
// Тимчасове сховище для рекомендацій (в реальному додатку буде база даних)
// Це посилання на те саме сховище, що використовується в create.ts
// В реальному додатку це буде доступ до бази даних
import type { UnknownRecord } from '../../../types/common';

declare global {
  var recommendations: UnknownRecord[];
}

if (!(global as any).recommendations) {
  (global as any).recommendations = [];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Перевірка методу запиту
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: `Метод ${req.method} не дозволений` });
  }

  try {
    const { userId, recommendationId, approved, comment } = req.body;

    // Валідація вхідних даних
    if (!userId || !recommendationId || approved === undefined) {
      return res.status(400).json({
        success: false,
        error: "Відсутні обов'язкові поля: userId, recommendationId, approved",
      });
    }

    // Пошук рекомендації в сховищі
    const recommendationIndex = global.recommendations.findIndex(
      rec => rec.id === recommendationId
    );

    if (recommendationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Рекомендацію не знайдено',
      });
    }

    // Оновлення статусу рекомендації
    global.recommendations[recommendationIndex] = {
      ...global.recommendations[recommendationIndex],
      status: approved ? 'approved' : 'rejected',
      updatedAt: new Date().toISOString(),
      approvedBy: userId,
      approvalComment: comment || '',
    };

    // Логуємо подію безпеки
    logSecurityEvent({
      userId,
      eventType: SecurityEventType.DATA_MODIFICATION,
      details: `${approved ? 'Схвалено' : 'Відхилено'} рекомендацію ${recommendationId}`,
      severity: SecurityEventSeverity.WARNING,
      resourceType: 'recommendation',
      resourceId: recommendationId,
      metadata: {
        approved,
        comment: comment || '',
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    // console.error('Помилка при схваленні/відхиленні рекомендації:', error);
    return res.status(500).json({ success: false, error: 'Внутрішня помилка сервера' });
  }
};

// Дозволяємо схвалювати рекомендації тільки користувачам з правом схвалення PR
export default withAccessControl(handler, 'canApprovePR');
