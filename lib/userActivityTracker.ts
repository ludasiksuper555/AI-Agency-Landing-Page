import * as Sentry from '@sentry/nextjs';

import { logSecurityEvent, SecurityEventSeverity, SecurityEventType } from './securityEventLogger';

export type UserAction = {
  userId: string;
  username?: string;
  email?: string;
  actionType:
    | 'view'
    | 'edit'
    | 'question'
    | 'login'
    | 'logout'
    | 'api_call'
    | 'change'
    | 'download'
    | 'upload'
    | 'share'
    | 'other';
  actionDetails: string;
  resourceType?: string;
  resourceId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  isAuthorized?: boolean; // Чи авторизована дія згідно з ISO 27001
  securityLevel?: 'low' | 'medium' | 'high' | 'critical'; // Рівень безпеки дії
};

export type UserQuestion = {
  userId: string;
  question: string;
  context?: string;
  metadata?: Record<string, any>;
};

export type UserChange = {
  userId: string;
  changeType: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
};

/**
 * Отримує історію змін користувача з сервера
 * @param params Параметри запиту (userId, limit, offset, changeType)
 * @returns Promise з результатом запиту
 */
export const fetchUserChangesHistory = async (params: {
  userId?: string;
  changeType?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    // Перевіряємо, що ми на клієнті
    if (typeof window === 'undefined') {
      return { success: false, error: 'Функція доступна тільки на клієнті' };
    }

    // Формуємо параметри запиту
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.changeType) queryParams.append('changeType', params.changeType);
    if (params.entityType) queryParams.append('entityType', params.entityType);
    if (params.entityId) queryParams.append('entityId', params.entityId);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) queryParams.append('endDate', params.endDate.toISOString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // Відправляємо запит на API
    const response = await fetch(`/api/user-activity/changes?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Помилка при отриманні історії змін: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Помилка при отриманні історії змін користувача:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Невідома помилка' };
  }
};

/**
 * Отримує історію запитань користувача з сервера
 * @param params Параметри запиту (userId, limit, offset)
 * @returns Promise з результатом запиту
 */
export const fetchUserQuestionsHistory = async (params: {
  userId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    // Перевіряємо, що ми на клієнті
    if (typeof window === 'undefined') {
      return { success: false, error: 'Функція доступна тільки на клієнті' };
    }

    // Формуємо параметри запиту
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate.toISOString());
    if (params.endDate) queryParams.append('endDate', params.endDate.toISOString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    // Відправляємо запит на API
    const response = await fetch(`/api/user-activity/questions?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Помилка при отриманні історії запитань: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Помилка при отриманні історії запитань користувача:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Невідома помилка' };
  }
};

/**
 * Зберігає дію користувача в локальне сховище
 * @param action Дія користувача для збереження
 */
const saveActionToStorage = (action: UserAction): void => {
  try {
    if (typeof window === 'undefined') return;

    // Отримуємо поточний список дій або створюємо новий
    const actionsKey = `user_actions_${action.userId}`;
    const storedActions = localStorage.getItem(actionsKey);
    const actions = storedActions ? JSON.parse(storedActions) : [];

    // Додаємо нову дію та обмежуємо розмір списку до 100 елементів
    actions.push(action);
    if (actions.length > 100) {
      actions.shift(); // Видаляємо найстаріший запис
    }

    // Зберігаємо оновлений список
    localStorage.setItem(actionsKey, JSON.stringify(actions));
  } catch (error) {
    console.error('Помилка при збереженні дії в локальне сховище:', error);
    // Логуємо помилку в Sentry
    Sentry.captureException(error);
  }
};

/**
 * Перевіряє, чи дозволена дія згідно з ISO 27001
 * @param action Дія користувача для перевірки
 * @returns true, якщо дія дозволена, false - якщо ні
 */
const isActionAuthorized = (action: UserAction): boolean => {
  // Дії, які змінюють дані, потребують додаткової перевірки
  const modifyingActions = ['edit', 'change', 'upload', 'share'];

  // Якщо дія не змінює дані, вона дозволена
  if (!modifyingActions.includes(action.actionType)) {
    return true;
  }

  // В реальному додатку тут буде перевірка прав доступу користувача
  // Наприклад, через перевірку ролі або спеціальних дозволів

  // Для прикладу, дозволяємо тільки перегляд та запитання
  // Всі інші дії заборонені згідно з вимогами ISO 27001
  return false;
};

/**
 * Визначає рівень безпеки дії згідно з ISO 27001
 * @param action Дія користувача
 * @returns Рівень безпеки дії
 */
const getSecurityLevel = (action: UserAction): 'low' | 'medium' | 'high' | 'critical' => {
  // Критичні дії
  if (['edit', 'change', 'upload', 'share'].includes(action.actionType)) {
    return 'critical';
  }

  // Високий рівень безпеки
  if (['login', 'logout', 'api_call'].includes(action.actionType)) {
    return 'high';
  }

  // Середній рівень безпеки
  if (['download', 'question'].includes(action.actionType)) {
    return 'medium';
  }

  // Низький рівень безпеки
  return 'low';
};

/**
 * Відправляє дію користувача на сервер для збереження
 * @param action Дія користувача для відправки
 */
const sendActionToServer = async (action: UserAction): Promise<void> => {
  try {
    if (typeof window === 'undefined') return;

    // Перевіряємо, чи дозволена дія
    const isAuthorized = isActionAuthorized(action);
    action.isAuthorized = isAuthorized;

    // Визначаємо рівень безпеки дії
    action.securityLevel = getSecurityLevel(action);

    // Якщо дія не дозволена, логуємо подію безпеки
    if (!isAuthorized) {
      const securityEvent: any = {
        userId: action.userId,
        eventType: SecurityEventType.ACCESS_DENIED,
        details: `Спроба виконання недозволеної дії: ${action.actionType} - ${action.actionDetails}`,
        severity: SecurityEventSeverity.WARNING,
        resourceType: action.resourceType || 'unknown',
        resourceId: action.resourceId || 'unknown',
      };

      if (action.metadata !== undefined) {
        securityEvent.metadata = action.metadata;
      }

      logSecurityEvent(securityEvent);

      // Для критичних дій додатково створюємо повідомлення в Sentry
      if (action.securityLevel === 'critical') {
        Sentry.captureMessage(
          `Спроба виконання критичної недозволеної дії: ${action.actionType} - ${action.actionDetails}`,
          {
            level: 'warning',
            tags: {
              userId: action.userId,
              actionType: action.actionType,
              resourceType: action.resourceType || 'unknown',
            },
          }
        );
      }
    }

    // Відправляємо дані на API
    const response = await fetch('/api/user-activity/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      throw new Error(`Помилка при відправці дії на сервер: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Помилка при відправці дії користувача на сервер:', error);
    // Логуємо помилку в Sentry
    Sentry.captureException(error);
  }
};

/**
 * Відстежує дію користувача та відправляє дані в різні системи аналітики
 * @param action Інформація про дію користувача
 * @returns Дія з доданою часовою міткою або null, якщо дія заборонена
 */
export const trackUserAction = (action: Omit<UserAction, 'timestamp'>) => {
  const actionWithTimestamp = {
    ...action,
    timestamp: new Date(),
  };

  // Логування в консоль (для розробки)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[User Activity]', actionWithTimestamp);
  }

  // Перевіряємо, чи дозволена дія згідно з ISO 27001
  const isAuthorized = isActionAuthorized(actionWithTimestamp);
  actionWithTimestamp.isAuthorized = isAuthorized;

  // Визначаємо рівень безпеки дії
  actionWithTimestamp.securityLevel = getSecurityLevel(actionWithTimestamp);

  // Відправка в Sentry для аналітики
  Sentry.addBreadcrumb({
    category: 'user-activity',
    message: action.actionDetails,
    data: {
      userId: action.userId,
      actionType: action.actionType,
      resourceType: action.resourceType,
      resourceId: action.resourceId,
      isAuthorized,
      securityLevel: actionWithTimestamp.securityLevel,
      ...action.metadata,
    },
    level: isAuthorized ? 'info' : 'warning',
  });

  // Відправка події в Google Analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', `user_${action.actionType}`, {
      event_category: 'user_activity',
      event_label: action.actionDetails,
      user_id: action.userId,
      resource_type: action.resourceType || 'none',
      resource_id: action.resourceId || 'none',
      is_authorized: isAuthorized,
    });
  }

  // Збереження в локальне сховище для формування звітів
  saveActionToStorage(actionWithTimestamp);

  // Відправка на сервер для постійного зберігання
  sendActionToServer(actionWithTimestamp);

  // Якщо дія не дозволена, логуємо подію безпеки
  if (!isAuthorized) {
    // Для дій, які змінюють дані, логуємо спробу несанкціонованого доступу
    if (['edit', 'change', 'upload', 'share'].includes(action.actionType)) {
      logSecurityEvent({
        userId: action.userId,
        eventType: SecurityEventType.ACCESS_DENIED,
        details: `Спроба виконання недозволеної дії: ${action.actionType} - ${action.actionDetails}`,
        severity: SecurityEventSeverity.WARNING,
        resourceType: action.resourceType || 'unknown',
        resourceId: action.resourceId || 'unknown',
        metadata: {
          ...action.metadata,
          actionType: action.actionType,
          actionDetails: action.actionDetails,
        },
      });

      // Повертаємо null для заборонених дій, щоб вказати, що дія не була виконана
      return null;
    }
  }

  return actionWithTimestamp;
};

/**
 * Перевіряє, чи може користувач виконати певну дію згідно з ISO 27001
 * @param userId ID користувача
 * @param actionType Тип дії
 * @param resourceType Тип ресурсу
 * @param resourceId ID ресурсу
 * @returns Promise з результатом перевірки
 */
export const canPerformAction = async (
  userId: string,
  actionType: UserAction['actionType'],
  resourceType?: string,
  resourceId?: string
): Promise<boolean> => {
  try {
    // Перевіряємо, що ми на клієнті
    if (typeof window === 'undefined') {
      return false;
    }

    // Відправляємо запит на API для перевірки прав
    const response = await fetch('/api/user-activity/check-permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        actionType,
        resourceType,
        resourceId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Помилка при перевірці прав: ${response.statusText}`);
    }

    const result = await response.json();
    return result.allowed === true;
  } catch (error) {
    console.error('Помилка при перевірці прав користувача:', error);
    // Логуємо помилку в Sentry
    Sentry.captureException(error);
    // У випадку помилки забороняємо дію
    return false;
  }
};

/**
 * Отримує історію активності користувача
 * @param userId ID користувача
 * @param limit Кількість записів для отримання
 * @param offset Зміщення для пагінації
 * @returns Promise з історією активності
 */
export const fetchUserActivityHistory = async (
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<UserAction[]> => {
  try {
    const response = await fetch('/api/user-activity/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        limit,
        offset,
      }),
    });

    if (!response.ok) {
      throw new Error(`Помилка при отриманні історії активності: ${response.statusText}`);
    }

    const result = await response.json();
    return result.activities || [];
  } catch (error) {
    console.error('Помилка при отриманні історії активності користувача:', error);
    // Логуємо помилку в Sentry
    Sentry.captureException(error);
    return [];
  }
};
