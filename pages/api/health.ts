import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
};

/**
 * API-эндпоинт для проверки работоспособности приложения
 * Используется для Docker healthcheck и мониторинга
 */
export default function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
  // Проверка метода запроса
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
    return;
  }

  // Формирование ответа
  const healthResponse: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Отправка ответа
  res.status(200).json(healthResponse);
}
