import { NextApiRequest, NextApiResponse } from 'next';

import { withAccessControl } from '../../../middleware/accessControl';

/**
 * API ендпоінт для отримання інформації про API рекомендацій
 *
 * Цей ендпоінт надає загальну інформацію про доступні ендпоінти API рекомендацій
 * та їх призначення. Він служить як документація та точка входу для API рекомендацій.
 *
 * @route GET /api/recommendations
 * @access Публічний доступ
 */
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Перевірка методу запиту
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: `Метод ${req.method} не дозволений` });
  }

  try {
    // Повертаємо інформацію про API рекомендацій
    return res.status(200).json({
      success: true,
      name: 'Recommendations API',
      version: '1.0.0',
      description: 'API для створення, схвалення та перегляду рекомендацій',
      endpoints: [
        {
          path: '/api/recommendations/create',
          method: 'POST',
          description: 'Створення нової рекомендації',
          requiredPermission: 'canComment',
        },
        {
          path: '/api/recommendations/approve',
          method: 'POST',
          description: 'Схвалення або відхилення рекомендації',
          requiredPermission: 'canApprovePR',
        },
        {
          path: '/api/recommendations/list',
          method: 'GET',
          description: 'Отримання списку рекомендацій з фільтрацією',
          requiredPermission: 'canView',
        },
        {
          path: '/api/recommendations/[id]',
          method: 'GET',
          description: 'Отримання деталей конкретної рекомендації',
          requiredPermission: 'canView',
        },
      ],
      documentation: '/docs/RECOMMENDATIONS_API.md',
    });
  } catch (error) {
    // console.error('Помилка при отриманні інформації про API рекомендацій:', error);
    return res.status(500).json({ success: false, error: 'Внутрішня помилка сервера' });
  }
};

// Дозволяємо доступ до інформації про API всім користувачам
export default withAccessControl(handler, 'canView');
