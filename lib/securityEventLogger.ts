import * as Sentry from '@sentry/nextjs';

import {
  SecurityEvent as BaseSecurityEvent,
  SecurityEventSeverity,
  SecurityEventType,
} from '../types';

// Расширенный интерфейс для логгера безопасности
export interface SecurityEvent extends Omit<BaseSecurityEvent, 'id' | 'timestamp' | 'details'> {
  details: string;
  timestamp: Date;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export { SecurityEventSeverity, SecurityEventType };

/**
 * Отримує IP-адресу клієнта
 * @returns IP-адреса або '0.0.0.0' якщо не вдалося отримати
 */
const getClientIP = (): string => {
  // В реальному додатку тут буде логіка отримання IP
  // Наприклад, з заголовків запиту
  return '0.0.0.0';
};

/**
 * Отримує User-Agent клієнта
 * @returns User-Agent або 'Unknown' якщо не вдалося отримати
 */
const getUserAgent = (): string => {
  if (typeof window !== 'undefined') {
    return navigator.userAgent;
  }
  return 'Unknown';
};

/**
 * Зберігає подію безпеки в базу даних
 * @param event Подія безпеки для збереження
 */
const saveSecurityEventToDatabase = async (event: SecurityEvent): Promise<void> => {
  try {
    // В реальному додатку тут буде запис в базу даних
    // Наприклад, з використанням Prisma, MongoDB або іншої БД

    // Для прикладу, відправляємо на API-ендпоінт
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Помилка при збереженні події безпеки: ${response.statusText}`);
      }
    }
  } catch (error) {
    console.error('Помилка при збереженні події безпеки:', error);
    Sentry.captureException(error);
  }
};

/**
 * Логує подію безпеки згідно ISO 27001
 * @param event Подія безпеки без часової мітки
 * @returns Подія безпеки з доданою часовою міткою
 */
export const logSecurityEvent = (
  event: Omit<SecurityEvent, 'timestamp' | 'ipAddress' | 'userAgent'>
): SecurityEvent => {
  const eventWithTimestamp: SecurityEvent = {
    ...event,
    timestamp: new Date(),
    ipAddress: getClientIP(),
    userAgent: getUserAgent(),
  };

  // Логування в консоль (для розробки)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Security Event]', eventWithTimestamp);
  }

  // Відправка в Sentry з відповідним рівнем
  let sentryLevel: Sentry.SeverityLevel = 'info';
  switch (event.severity) {
    case SecurityEventSeverity.WARNING:
      sentryLevel = 'warning';
      break;
    case SecurityEventSeverity.ERROR:
      sentryLevel = 'error';
      break;
    case SecurityEventSeverity.CRITICAL:
      sentryLevel = 'fatal';
      break;
    default:
      sentryLevel = 'info';
  }

  Sentry.addBreadcrumb({
    category: 'security',
    message: event.details,
    data: {
      userId: event.userId,
      eventType: event.eventType,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      ...event.metadata,
    },
    level: sentryLevel,
  });

  // Для критичних подій додатково створюємо повідомлення в Sentry
  if (event.severity === SecurityEventSeverity.CRITICAL) {
    Sentry.captureMessage(`Critical Security Event: ${event.eventType} - ${event.details}`, {
      level: 'fatal',
    });
  }

  // Збереження в базу даних
  saveSecurityEventToDatabase(eventWithTimestamp);

  return eventWithTimestamp;
};

/**
 * Логує спробу доступу до ресурсу
 * @param userId ID користувача
 * @param resource Ресурс, до якого здійснюється доступ
 * @param permission Необхідний дозвіл
 * @param granted Чи надано доступ
 */
export const logAccessAttempt = (
  userId: string,
  resource: string,
  permission: string,
  granted: boolean
): SecurityEvent => {
  return logSecurityEvent({
    userId,
    eventType: granted ? SecurityEventType.ACCESS_GRANTED : SecurityEventType.ACCESS_DENIED,
    details: `Спроба доступу до ${resource} з дозволом ${permission}`,
    severity: granted ? SecurityEventSeverity.INFO : SecurityEventSeverity.WARNING,
    resourceType: 'api',
    resourceId: resource,
    metadata: {
      permission,
      granted,
    },
  });
};

/**
 * Логує зміну ролі користувача
 * @param adminId ID адміністратора, який змінив роль
 * @param targetUserId ID користувача, чия роль змінена
 * @param oldRole Стара роль
 * @param newRole Нова роль
 */
export const logRoleChange = (
  adminId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string
): SecurityEvent => {
  return logSecurityEvent({
    userId: adminId,
    eventType: SecurityEventType.ROLE_CHANGE,
    details: `Зміна ролі користувача ${targetUserId} з ${oldRole} на ${newRole}`,
    severity: SecurityEventSeverity.WARNING,
    resourceType: 'user',
    resourceId: targetUserId,
    metadata: {
      targetUserId,
      oldRole,
      newRole,
    },
  });
};

/**
 * Логує зміну налаштувань безпеки
 * @param userId ID користувача, який змінив налаштування
 * @param settingName Назва налаштування
 * @param oldValue Старе значення
 * @param newValue Нове значення
 */
export const logSecuritySettingChange = (
  userId: string,
  settingName: string,
  oldValue: any,
  newValue: any
): SecurityEvent => {
  return logSecurityEvent({
    userId,
    eventType: SecurityEventType.SECURITY_SETTING_CHANGE,
    details: `Зміна налаштування безпеки ${settingName}`,
    severity: SecurityEventSeverity.WARNING,
    resourceType: 'security_setting',
    resourceId: settingName,
    metadata: {
      settingName,
      oldValue,
      newValue,
    },
  });
};

/**
 * Логує невдалу спробу аутентифікації
 * @param userId ID користувача або 'unknown'
 * @param reason Причина невдачі
 * @param attemptCount Кількість невдалих спроб
 */
export const logAuthenticationFailure = (
  userId: string,
  reason: string,
  attemptCount: number
): SecurityEvent => {
  const severity = attemptCount > 5 ? SecurityEventSeverity.ERROR : SecurityEventSeverity.WARNING;

  return logSecurityEvent({
    userId,
    eventType: SecurityEventType.AUTHENTICATION_FAILURE,
    details: `Невдала спроба аутентифікації: ${reason}`,
    severity,
    resourceType: 'authentication',
    metadata: {
      reason,
      attemptCount,
    },
  });
};
