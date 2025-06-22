import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

import { UserActivityDatabase } from '../../../lib/userActivityDatabase';
import { withApiMiddleware } from '../../../middleware/api';

/**
 * API-ендпоінт для збереження дій користувача
 * Приймає POST-запити з інформацією про дії користувача
 * та зберігає їх в базу даних і Sentry для аналітики
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  try {
    const {
      userId,
      username,
      email,
      actionType,
      actionDetails,
      resourceType,
      resourceId,
      metadata,
    } = req.body;

    // Валідація даних
    if (!userId || !actionType || !actionDetails) {
      return res.status(400).json({ error: "Відсутні обов'язкові поля" });
    }

    // Логування в Sentry
    Sentry.addBreadcrumb({
      category: 'user-activity',
      message: actionDetails,
      data: {
        userId,
        actionType,
        resourceType,
        resourceId,
        ...metadata,
      },
      level: 'info',
    });

    // Зберігаємо активність в базу даних
    const savedActivity = await UserActivityDatabase.saveActivity({
      userId,
      username,
      email,
      actionType,
      actionDetails,
      resourceType,
      resourceId,
      metadata,
    });

    // Відправляємо успішну відповідь
    return res.status(200).json({
      success: true,
      activityId: savedActivity.id,
    });
  } catch (error) {
    // console.error('Ошибка при логировании активности пользователя:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export default withApiMiddleware(handler);
