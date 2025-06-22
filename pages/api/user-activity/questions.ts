import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

import { UserActivityDatabase } from '../../../lib/userActivityDatabase';
import { withApiMiddleware } from '../../../middleware/api';

/**
 * API-ендпоінт для збереження запитань користувачів
 * Приймає POST-запити з інформацією про запитання користувача
 * та зберігає їх для подальшого аналізу
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  try {
    const { userId, question, context, metadata } = req.body;

    // Валідація даних
    if (!userId || !question) {
      return res.status(400).json({ error: "Відсутні обов'язкові поля" });
    }

    // Логування в Sentry для аналітики
    Sentry.addBreadcrumb({
      category: 'user-question',
      message: `Користувач задав питання: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`,
      data: {
        userId,
        questionLength: question.length,
        hasContext: !!context,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
      level: 'info',
    });

    // Генеруємо унікальний ID для питання
    const questionId = `q_${Date.now()}`;

    // Логування активності користувача
    const activityData = {
      userId,
      actionType: 'question',
      actionDetails: `Задано питання: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"`,
      resourceType: 'support',
      metadata: {
        questionId,
        questionLength: question.length,
        ...metadata,
      },
    };

    // Зберігаємо активність в базу даних
    const savedActivity = await UserActivityDatabase.saveActivity(activityData);

    // Зберігаємо деталі питання в базу даних
    const savedQuestion = await UserActivityDatabase.saveQuestion(
      {
        questionId,
        userId,
        question,
        context,
        metadata,
      },
      savedActivity.id
    );

    // Відправляємо успішну відповідь
    return res.status(200).json({
      success: true,
      questionId,
      activityId: savedActivity.id,
      id: savedQuestion.id,
    });
  } catch (error) {
    // console.error('Помилка при збереженні питання користувача:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
};

export default withApiMiddleware(handler);
