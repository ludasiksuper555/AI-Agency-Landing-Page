# Анализ системы сбора информации о пользователях

## Текущая реализация

### 1. Системы аналитики и мониторинга

#### Google Analytics 4

- Интегрирован через компонент `GoogleAnalytics.tsx`
- Отслеживает переходы между страницами в `_app.tsx`
- Настроен через переменную окружения `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Отправляет базовые события при изменении маршрута

#### Sentry

- Настроен для отслеживания ошибок и производительности
- Интегрирован в `next.config.js` через `withSentryConfig`
- Инициализируется в `lib/sentry.ts`
- Настроен на запись 10% обычных сессий и 100% сессий с ошибками
- Имеет базовую функциональность для установки пользовательского контекста через `setUserContext`

### 2. Аутентификация пользователей

#### Clerk

- Используется для аутентификации пользователей
- Интегрирован через `ClerkProvider.tsx`
- Предоставляет базовую информацию о пользователе (ID, имя, email)
- Не отслеживает детальные действия пользователей

#### MGX Интеграция

- Дополнительная система аутентификации через MGX
- Хранит токен в localStorage
- Получает базовую информацию о пользователе (username, email)

### 3. Логирование

#### API Middleware

- В `middleware/api.ts` настроено базовое логирование API запросов
- Отправляет информацию в Sentry при ошибках
- Логирует URL и метод запроса
- Добавляет user-agent в теги Sentry

#### Audit Logger

- Реализован в `src/utils/audit-logger.js`
- Логирует события безопасности с типами, статусами и сервисами
- Не интегрирован напрямую с действиями пользователей

## Недостатки текущей системы

1. **Отсутствие единой системы** для отслеживания всех действий пользователей
2. **Нет детального логирования** конкретных действий (изменения, вопросы)
3. **Разрозненность данных** между Sentry, Google Analytics и внутренним логированием
4. **Отсутствие структурированного хранения** истории действий пользователей
5. **Нет возможности формирования отчетов** по активности пользователей

## План улучшений

### 1. Расширение системы логирования

#### Создание единого сервиса для отслеживания действий пользователей

```typescript
// lib/userActivityTracker.ts
import * as Sentry from '@sentry/nextjs';
import { logMessage } from './sentry';

export type UserAction = {
  userId: string;
  username?: string;
  email?: string;
  actionType: 'view' | 'edit' | 'question' | 'login' | 'logout' | 'api_call' | 'other';
  actionDetails: string;
  resourceType?: string;
  resourceId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

export const trackUserAction = (action: Omit<UserAction, 'timestamp'>) => {
  const actionWithTimestamp = {
    ...action,
    timestamp: new Date(),
  };

  // Логирование в консоль (для разработки)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[User Activity]', actionWithTimestamp);
  }

  // Отправка в Sentry для аналитики
  Sentry.addBreadcrumb({
    category: 'user-activity',
    message: action.actionDetails,
    data: {
      userId: action.userId,
      actionType: action.actionType,
      resourceType: action.resourceType,
      resourceId: action.resourceId,
      ...action.metadata,
    },
    level: 'info',
  });

  // Отправка события в Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', `user_${action.actionType}`, {
      event_category: 'user_activity',
      event_label: action.actionDetails,
      user_id: action.userId,
      resource_type: action.resourceType || 'none',
      resource_id: action.resourceId || 'none',
    });
  }

  // Сохранение в локальное хранилище для формирования отчетов
  saveActionToStorage(actionWithTimestamp);

  // Можно добавить отправку на сервер для постоянного хранения
  // sendActionToServer(actionWithTimestamp);

  return actionWithTimestamp;
};

// Сохранение действия в localStorage для временного хранения
const saveActionToStorage = (action: UserAction) => {
  if (typeof window === 'undefined') return;

  try {
    const storedActions = localStorage.getItem('user_actions');
    const actions = storedActions ? JSON.parse(storedActions) : [];

    // Ограничиваем количество хранимых действий (например, последние 100)
    if (actions.length >= 100) {
      actions.shift(); // Удаляем самое старое действие
    }

    actions.push(action);
    localStorage.setItem('user_actions', JSON.stringify(actions));
  } catch (error) {
    console.error('Failed to save user action to storage:', error);
  }
};

// Получение истории действий пользователя
export const getUserActionHistory = (userId?: string) => {
  if (typeof window === 'undefined') return [];

  try {
    const storedActions = localStorage.getItem('user_actions');
    if (!storedActions) return [];

    const actions = JSON.parse(storedActions) as UserAction[];

    // Если указан userId, фильтруем действия только этого пользователя
    return userId ? actions.filter(action => action.userId === userId) : actions;
  } catch (error) {
    console.error('Failed to get user action history:', error);
    return [];
  }
};

// Экспорт истории действий в формате CSV
export const exportUserActionsToCSV = (actions: UserAction[]) => {
  const headers = [
    'User ID',
    'Username',
    'Email',
    'Action Type',
    'Action Details',
    'Resource Type',
    'Resource ID',
    'Timestamp',
    'Metadata',
  ];

  const rows = actions.map(action => [
    action.userId,
    action.username || '',
    action.email || '',
    action.actionType,
    action.actionDetails,
    action.resourceType || '',
    action.resourceId || '',
    action.timestamp.toISOString(),
    action.metadata ? JSON.stringify(action.metadata) : '',
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  return csvContent;
};
```

### 2. Интеграция с существующими компонентами

#### Расширение middleware/api.ts для отслеживания API запросов

```typescript
// Дополнение к middleware/api.ts
import { trackUserAction } from '../lib/userActivityTracker';

export const withApiMiddleware =
  (handler: ApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Существующий код...

      // Добавляем отслеживание API запросов
      const userId = req.headers['x-user-id'] as string;
      if (userId) {
        trackUserAction({
          userId,
          actionType: 'api_call',
          actionDetails: `${req.method} ${req.url}`,
          resourceType: 'api',
          resourceId: req.url,
          metadata: {
            method: req.method,
            query: req.query,
            headers: {
              userAgent: req.headers['user-agent'],
              contentType: req.headers['content-type'],
            },
          },
        });
      }

      // Выполнение обработчика запроса
      await handler(req, res);
    } catch (error) {
      // Существующий код обработки ошибок...
    }
  };
```

#### Расширение \_app.tsx для отслеживания навигации

```typescript
// Дополнение к _app.tsx
import { trackUserAction } from '../lib/userActivityTracker';

function MyApp({ Component, pageProps }: AppProps) {
  // Существующий код...

  // Отслеживание изменений маршрута для аналитики
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Существующий код для Google Analytics...

      // Добавляем отслеживание навигации
      if (user?.id) {
        trackUserAction({
          userId: user.id,
          username: user.fullName || undefined,
          email: user.emailAddresses?.[0]?.emailAddress,
          actionType: 'view',
          actionDetails: `Просмотр страницы: ${url}`,
          resourceType: 'page',
          resourceId: url,
        });
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, gaMeasurementId, user]);

  // Остальной код...
}
```

#### Интеграция с Clerk для отслеживания входа/выхода

```typescript
// Дополнение к ClerkProvider.tsx
import { trackUserAction } from '../lib/userActivityTracker';

const ClerkProvider: React.FC<ClerkProviderProps> = ({ children }) => {
  // Существующий код...

  useEffect(() => {
    // Отслеживание входа пользователя
    const handleSignIn = (session: any) => {
      if (session?.user) {
        trackUserAction({
          userId: session.user.id,
          username: session.user.fullName || undefined,
          email: session.user.emailAddresses?.[0]?.emailAddress,
          actionType: 'login',
          actionDetails: 'Вход в систему',
          metadata: {
            provider: session.provider || 'clerk',
            deviceId: session.deviceId,
          },
        });
      }
    };

    // Отслеживание выхода пользователя
    const handleSignOut = (userId: string) => {
      if (userId) {
        trackUserAction({
          userId,
          actionType: 'logout',
          actionDetails: 'Выход из системы',
        });
      }
    };

    // Подписка на события Clerk
    // Примечание: реализация зависит от API Clerk

    // Остальной код...
  }, []);

  // Остальной код...
};
```

### 3. Создание компонентов для отображения активности

#### Компонент для отображения истории действий пользователя

```typescript
// components/UserActivityLog.tsx
import { useState, useEffect } from 'react';
import { getUserActionHistory, exportUserActionsToCSV, UserAction } from '../lib/userActivityTracker';

interface UserActivityLogProps {
  userId?: string;
  limit?: number;
  showExport?: boolean;
}

const UserActivityLog: React.FC<UserActivityLogProps> = ({
  userId,
  limit = 50,
  showExport = true
}) => {
  const [actions, setActions] = useState<UserAction[]>([]);

  useEffect(() => {
    const userActions = getUserActionHistory(userId);
    setActions(userActions.slice(-limit).reverse()); // Последние N действий в обратном порядке
  }, [userId, limit]);

  const handleExport = () => {
    const csvContent = exportUserActionsToCSV(actions.reverse()); // Возвращаем к хронологическому порядку

    // Создаем файл для скачивания
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `user-activity-${userId || 'all'}-${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'view': return 'bg-blue-100 text-blue-800';
      case 'edit': return 'bg-yellow-100 text-yellow-800';
      case 'question': return 'bg-purple-100 text-purple-800';
      case 'login': return 'bg-green-100 text-green-800';
      case 'logout': return 'bg-red-100 text-red-800';
      case 'api_call': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">История активности пользователя</h2>
        {showExport && actions.length > 0 && (
          <button
            onClick={handleExport}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Экспорт CSV
          </button>
        )}
      </div>

      {actions.length === 0 ? (
        <p className="text-gray-500 text-center py-4">История действий пуста</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Время</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действие</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ресурс</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actions.map((action, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(action.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getActionTypeColor(action.actionType)}`}>
                      {action.actionType}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{action.actionDetails}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {action.resourceType && `${action.resourceType}${action.resourceId ? `: ${action.resourceId}` : ''}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserActivityLog;
```

### 4. Создание API для сохранения и получения данных

#### API для сохранения действий пользователя

```typescript
// pages/api/user-activity/log.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware } from '../../../middleware/api';
import * as Sentry from '@sentry/nextjs';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, actionType, actionDetails, resourceType, resourceId, metadata } = req.body;

    // Валидация данных
    if (!userId || !actionType || !actionDetails) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Здесь можно добавить сохранение в базу данных
    // Например, с использованием Prisma, MongoDB или другой БД

    // Для примера просто логируем в Sentry
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

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging user activity:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default withApiMiddleware(handler);
```

#### API для получения истории действий

```typescript
// pages/api/user-activity/history.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withApiMiddleware } from '../../../middleware/api';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limit = 50, offset = 0 } = req.query;

    // Здесь должен быть код для получения данных из БД
    // Для примера возвращаем заглушку

    const mockData = [
      {
        userId: userId || 'user_123',
        username: 'Тестовый пользователь',
        actionType: 'login',
        actionDetails: 'Вход в систему',
        timestamp: new Date().toISOString(),
      },
      {
        userId: userId || 'user_123',
        username: 'Тестовый пользователь',
        actionType: 'view',
        actionDetails: 'Просмотр страницы: /dashboard',
        resourceType: 'page',
        resourceId: '/dashboard',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      },
    ];

    return res.status(200).json({
      data: mockData,
      pagination: {
        total: mockData.length,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching user activity history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default withApiMiddleware(handler);
```

## Рекомендации по внедрению

1. **Поэтапное внедрение**:

   - Сначала реализовать базовую систему отслеживания
   - Затем добавить интеграцию с существующими компонентами
   - В последнюю очередь реализовать API и компоненты отображения

2. **Соблюдение приватности**:

   - Не собирать личные данные без согласия пользователя
   - Добавить настройки приватности для пользователей
   - Обеспечить соответствие GDPR и другим нормам защиты данных

3. **Оптимизация производительности**:

   - Использовать дебаунсинг для частых событий
   - Группировать события перед отправкой на сервер
   - Ограничивать объем хранимых данных на клиенте

4. **Расширение функциональности**:
   - Добавить аналитические дашборды для администраторов
   - Реализовать уведомления о подозрительной активности
   - Интегрировать с системой поддержки пользователей

## Заключение

Предложенная система позволит собирать детальную информацию о действиях пользователей, включая их вопросы и изменения в проекте. Это даст возможность формировать подробные отчеты о пользовательской активности, выявлять проблемные места в интерфейсе и улучшать пользовательский опыт на основе реальных данных.

Интеграция с существующими системами (Sentry, Google Analytics) обеспечит единый подход к сбору и анализу данных, а также позволит использовать уже имеющиеся инструменты для визуализации и анализа информации.
