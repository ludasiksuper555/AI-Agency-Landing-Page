import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

import { UserActivityDatabase } from '../../../lib/userActivityDatabase';
import { withApiMiddleware } from '../../../middleware/api';

/**
 * API-ендпоінт для збереження змін, внесених користувачем
 * Приймає POST-запити з інформацією про зміни, внесені користувачем
 * та зберігає їх для подальшого аналізу
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  try {
    const { userId, changeType, entityType, entityId, changes, metadata } = req.body;

    // Валідація даних
    if (!userId || !changeType || !entityType || !entityId) {
      return res.status(400).json({ error: "Відсутні обов'язкові поля" });
    }

    // Логування в Sentry для аналітики
    Sentry.addBreadcrumb({
      category: 'user-change',
      message: `Користувач вніс зміни: ${changeType} для ${entityType}`,
      data: {
        userId,
        changeType,
        entityType,
        entityId,
        hasChanges: !!changes,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
      level: 'info',
    });

    // Генеруємо унікальний ID для зміни
    const changeId = `ch_${Date.now()}`;

    // Логування активності користувача
    const activityData = {
      userId,
      actionType: 'change',
      actionDetails: `Внесено зміни: ${changeType} для ${entityType}`,
      resourceType: entityType,
      resourceId: entityId,
      metadata: {
        changeId,
        changeType,
        ...metadata,
      },
    };

    // Зберігаємо активність в базу даних
    const savedActivity = await UserActivityDatabase.saveActivity(activityData);

    // Зберігаємо деталі змін в базу даних
    const savedChange = await UserActivityDatabase.saveChange(
      {
        changeId,
        userId,
        changeType,
        entityType,
        entityId,
        changes,
        metadata,
      },
      savedActivity.id
    );

    // Відправляємо успішну відповідь
    return res.status(200).json({
      success: true,
      changeId,
      activityId: savedActivity.id,
      id: savedChange.id,
    });
  } catch (error) {
    // console.error('Помилка при збереженні змін користувача:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
};

export default withApiMiddleware(handler);
