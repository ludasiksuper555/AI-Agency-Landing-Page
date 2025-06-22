import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

type ApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * Middleware для обработки API запросов
 * Добавляет обработку ошибок, логирование и кэширование
 */
export const withApiMiddleware =
  (handler: ApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Добавляем CORS заголовки
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
      );

      // Обработка OPTIONS запросов (preflight)
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      // Добавляем контекст запроса в Sentry для отслеживания ошибок
      Sentry.configureScope(scope => {
        scope.setTag('endpoint', req.url || 'unknown');
        scope.setTag('method', req.method || 'unknown');
        if (req.headers['user-agent']) {
          scope.setTag('user-agent', req.headers['user-agent']);
        }
      });

      // Логирование запроса
      console.log(`API Request: ${req.method} ${req.url}`);

      // Выполнение обработчика запроса
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);

      // Отправка ошибки в Sentry
      Sentry.captureException(error);

      // Отправка ответа с ошибкой
      const statusCode =
        error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;

      res.status(statusCode).json({
        error: true,
        message:
          process.env.NODE_ENV === 'production'
            ? 'Внутренняя ошибка сервера'
            : error instanceof Error
              ? error.message
              : String(error),
      });
    }
  };

/**
 * Middleware для кэширования ответов API
 * @param seconds Время кэширования в секундах
 */
export const withCache = (seconds: number) => (req: NextApiRequest, res: NextApiResponse) => {
  // Добавляем заголовки кэширования
  res.setHeader('Cache-Control', `s-maxage=${seconds}, stale-while-revalidate`);
};
