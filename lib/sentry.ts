import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

// Инициализация Sentry только если DSN предоставлен
export const initSentry = () => {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1.0, // Захват 100% транзакций для мониторинга производительности
      // Настройка окружения в зависимости от режима сборки
      environment: process.env.NODE_ENV,
      // Интеграции по умолчанию
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          // Дополнительные настройки для записи сессий
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Настройка записи сессий для воспроизведения ошибок
      replaysSessionSampleRate: 0.1, // Запись 10% сессий
      replaysOnErrorSampleRate: 1.0, // Запись 100% сессий с ошибками
    });
  }
};

// Утилита для логирования ошибок
export const logError = (error: Error, context: Record<string, any> = {}) => {
  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, '\nContext:', context);
  }
};

// Утилита для логирования сообщений
export const logMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context: Record<string, any> = {}
) => {
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[${level}] ${message}`, context);
  }
};

// Утилита для установки пользовательского контекста
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  if (SENTRY_DSN) {
    Sentry.setUser(user);
  }
};

// Утилита для очистки пользовательского контекста
export const clearUserContext = () => {
  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }
};
