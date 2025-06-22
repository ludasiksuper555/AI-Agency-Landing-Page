import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

import { FilterParams, UserActivityDatabase } from '../../../lib/userActivityDatabase';
import { withApiMiddleware } from '../../../middleware/api';

/**
 * API-ендпоінт для отримання історії дій користувача
 * Приймає GET-запити з параметрами фільтрації
 * та повертає історію дій користувача
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Метод не дозволено' });
  }

  try {
    const {
      userId,
      limit = '50',
      offset = '0',
      actionType,
      resourceType,
      resourceId,
      startDate,
      endDate,
      username,
      email,
      sortBy,
      sortOrder,
    } = req.query;

    // Валідація параметрів
    const parsedLimit = Math.min(Number(limit) || 50, 100); // Обмежуємо максимальну кількість записів
    const parsedOffset = Number(offset) || 0;

    // Формуємо параметри фільтрації
    const filters: FilterParams = {};
    if (userId) filters.userId = userId as string;
    if (actionType) filters.actionType = actionType as string;
    if (resourceType) filters.resourceType = resourceType as string;
    if (resourceId) filters.resourceId = resourceId as string;
    if (username) filters.username = username as string;
    if (email) filters.email = email as string;

    // Параметри сортування
    if (sortBy) filters.sortBy = sortBy as string;
    if (sortOrder) filters.sortOrder = sortOrder as 'asc' | 'desc';

    // Обробка дат, якщо вони вказані
    if (startDate && !isNaN(Date.parse(startDate as string))) {
      filters.startDate = new Date(startDate as string);
    }

    if (endDate && !isNaN(Date.parse(endDate as string))) {
      filters.endDate = new Date(endDate as string);
    }

    // Отримуємо дані з бази даних
    const result = await UserActivityDatabase.getActivityHistory(filters, {
      limit: parsedLimit,
      offset: parsedOffset,
    });

    // Перетворюємо дати в ISO формат для JSON
    const formattedData = result.data.map(item => ({
      ...item,
      timestamp: item.timestamp.toISOString(),
    }));

    return res.status(200).json({
      data: formattedData,
      pagination: {
        total: result.total,
        limit: parsedLimit,
        offset: parsedOffset,
      },
    });
  } catch (error) {
    // console.error('Помилка при отриманні історії активності користувача:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
};

export default withApiMiddleware(handler);
