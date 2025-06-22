/**
 * Система журналирования событий безопасности в соответствии с ISO 27001
 *
 * Этот модуль предоставляет функциональность для логирования событий безопасности
 * в соответствии с требованиями ISO 27001:2013, раздел A.12.4 (Логирование и мониторинг)
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Типы событий безопасности в соответствии с ISO 27001
 */
export enum SecurityEventType {
  // События аутентификации
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_CHALLENGE = 'mfa_challenge',

  // События авторизации
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_CHANGE = 'permission_change',
  ROLE_CHANGE = 'role_change',

  // События управления данными
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  DATA_DELETION = 'data_deletion',
  DATA_EXPORT = 'data_export',

  // События конфигурации
  CONFIGURATION_CHANGE = 'configuration_change',
  SECURITY_SETTING_CHANGE = 'security_setting_change',
  SYSTEM_UPDATE = 'system_update',

  // События безопасности
  SECURITY_ALERT = 'security_alert',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  BRUTE_FORCE_ATTEMPT = 'brute_force_attempt',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',

  // События аудита
  AUDIT_STARTED = 'audit_started',
  AUDIT_COMPLETED = 'audit_completed',
  COMPLIANCE_CHECK = 'compliance_check',
}

/**
 * Уровни серьезности событий безопасности
 */
export enum SecurityEventSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Интерфейс события безопасности
 */
export interface SecurityEvent {
  // Основная информация
  eventId: string; // Уникальный идентификатор события
  eventType: SecurityEventType; // Тип события
  severity: SecurityEventSeverity; // Уровень серьезности
  timestamp: Date; // Время события
  status: 'success' | 'failure' | 'warning'; // Статус события
  message: string; // Описание события

  // Информация о пользователе
  userId?: string; // ID пользователя (если применимо)
  username?: string; // Имя пользователя (если применимо)
  userRole?: string; // Роль пользователя (если применимо)

  // Информация о запросе
  ipAddress?: string; // IP-адрес
  userAgent?: string; // User-Agent
  requestUrl?: string; // URL запроса
  requestMethod?: string; // Метод запроса (GET, POST, etc.)

  // Дополнительная информация
  resource?: string; // Ресурс, к которому осуществлялся доступ
  action?: string; // Действие, которое выполнялось
  result?: string; // Результат действия
  metadata?: Record<string, unknown>; // Дополнительные метаданные
}

/**
 * Генерирует уникальный идентификатор для события
 */
function generateEventId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Получает IP-адрес клиента
 */
function getClientIP(): string {
  // В реальном приложении здесь будет логика получения IP-адреса
  // из запроса или заголовков
  return 'unknown';
}

/**
 * Получает User-Agent клиента
 */
function getClientUserAgent(): string {
  // В реальном приложении здесь будет логика получения User-Agent
  // из запроса или заголовков
  return typeof window !== 'undefined' ? navigator.userAgent : 'unknown';
}

/**
 * Логирует событие безопасности
 * @param eventData Данные события безопасности
 */
export async function logSecurityEvent(
  eventData: Omit<SecurityEvent, 'eventId' | 'timestamp'>
): Promise<SecurityEvent> {
  // Создаем полное событие с добавлением ID и временной метки
  const event: SecurityEvent = {
    ...eventData,
    eventId: generateEventId(),
    timestamp: new Date(),
    ipAddress: eventData.ipAddress || getClientIP(),
    userAgent: eventData.userAgent || getClientUserAgent(),
  };

  // Логирование в консоль (для разработки)
  if (process.env.NODE_ENV !== 'production') {
    // console.log('[Security Event]', event);
  }

  // Отправка в Sentry
  Sentry.addBreadcrumb({
    category: 'security',
    message: event.message,
    level:
      event.severity === SecurityEventSeverity.CRITICAL
        ? 'fatal'
        : event.severity === SecurityEventSeverity.HIGH
          ? 'error'
          : event.severity === SecurityEventSeverity.MEDIUM
            ? 'warning'
            : event.severity === SecurityEventSeverity.LOW
              ? 'info'
              : 'debug',
    data: {
      eventId: event.eventId,
      eventType: event.eventType,
      userId: event.userId,
      resource: event.resource,
      action: event.action,
      result: event.result,
      status: event.status,
      ...event.metadata,
    },
  });

  // В реальном приложении здесь будет сохранение в базу данных
  // await saveEventToDatabase(event);

  // Проверка на подозрительную активность
  if (
    event.severity === SecurityEventSeverity.HIGH ||
    event.severity === SecurityEventSeverity.CRITICAL ||
    event.eventType === SecurityEventType.SUSPICIOUS_ACTIVITY
  ) {
    await alertSecurityTeam(event);
  }

  return event;
}

/**
 * Оповещает команду безопасности о критическом событии
 * @param event Событие безопасности
 */
async function alertSecurityTeam(event: SecurityEvent): Promise<void> {
  // В реальном приложении здесь будет логика оповещения команды безопасности
  // например, отправка email, SMS, или интеграция с системой мониторинга
  // console.warn(`[SECURITY ALERT] ${event.severity.toUpperCase()}: ${event.message}`);

  // Отправка события в Sentry
  if (event.severity === SecurityEventSeverity.CRITICAL) {
    Sentry.captureMessage(`CRITICAL SECURITY EVENT: ${event.message}`, 'fatal');
  } else if (event.severity === SecurityEventSeverity.HIGH) {
    Sentry.captureMessage(`HIGH SECURITY EVENT: ${event.message}`, 'error');
  }
}

/**
 * Проверяет соответствие логов требованиям ISO 27001
 * @param logs Массив событий безопасности
 */
export function checkISO27001Compliance(logs: SecurityEvent[]): {
  compliant: boolean;
  complianceScore: 'low' | 'medium' | 'high';
  missingEventTypes: SecurityEventType[];
  recommendations: string[];
} {
  // Минимальный набор типов событий, требуемых ISO 27001
  const requiredEventTypes = [
    SecurityEventType.LOGIN_SUCCESS,
    SecurityEventType.LOGIN_FAILURE,
    SecurityEventType.ACCESS_GRANTED,
    SecurityEventType.ACCESS_DENIED,
    SecurityEventType.DATA_ACCESS,
    SecurityEventType.DATA_MODIFICATION,
    SecurityEventType.CONFIGURATION_CHANGE,
    SecurityEventType.SECURITY_ALERT,
  ];

  const presentEventTypes = new Set(logs.map(log => log.eventType));
  const missingEventTypes = requiredEventTypes.filter(type => !presentEventTypes.has(type));

  // Проверка наличия событий с разными статусами
  const hasFailedEvents = logs.some(log => log.status === 'failure');
  const hasSuccessEvents = logs.some(log => log.status === 'success');

  // Оценка соответствия
  const complianceScore =
    missingEventTypes.length === 0 && hasFailedEvents && hasSuccessEvents
      ? 'high'
      : missingEventTypes.length <= 2
        ? 'medium'
        : 'low';

  return {
    compliant: missingEventTypes.length === 0,
    complianceScore,
    missingEventTypes,
    recommendations: missingEventTypes.map(type => `Добавить логирование событий типа '${type}'`),
  };
}

/**
 * Генерирует отчет по событиям безопасности за указанный период
 * @param startDate Начальная дата периода
 * @param endDate Конечная дата периода
 */
export async function generateSecurityReport(
  _startDate: Date,
  _endDate: Date
): Promise<{
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecurityEventSeverity, number>;
  topIpAddresses: Array<{ ip: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  complianceStatus: ReturnType<typeof checkISO27001Compliance>;
}> {
  // В реальном приложении здесь будет запрос к базе данных
  // для получения событий за указанный период
  const events: SecurityEvent[] = [];

  // Подсчет событий по типу
  const eventsByType = Object.values(SecurityEventType).reduce(
    (acc, type) => {
      acc[type] = events.filter(event => event.eventType === type).length;
      return acc;
    },
    {} as Record<SecurityEventType, number>
  );

  // Подсчет событий по уровню серьезности
  const eventsBySeverity = Object.values(SecurityEventSeverity).reduce(
    (acc, severity) => {
      acc[severity] = events.filter(event => event.severity === severity).length;
      return acc;
    },
    {} as Record<SecurityEventSeverity, number>
  );

  // Топ IP-адресов
  const ipCounts = events.reduce(
    (acc, event) => {
      if (event.ipAddress) {
        acc[event.ipAddress] = (acc[event.ipAddress] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const topIpAddresses = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Топ пользователей
  const userCounts = events.reduce(
    (acc, event) => {
      if (event.userId) {
        acc[event.userId] = (acc[event.userId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const topUsers = Object.entries(userCounts)
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Проверка соответствия ISO 27001
  const complianceStatus = checkISO27001Compliance(events);

  return {
    totalEvents: events.length,
    eventsByType,
    eventsBySeverity,
    topIpAddresses,
    topUsers,
    complianceStatus,
  };
}

/**
 * Пример использования:
 *
 * ```typescript
 * import { logSecurityEvent, SecurityEventType, SecurityEventSeverity } from './securityEventLogger';
 *
 * // Логирование успешного входа в систему
 * await logSecurityEvent({
 *   eventType: SecurityEventType.LOGIN_SUCCESS,
 *   severity: SecurityEventSeverity.INFO,
 *   status: 'success',
 *   message: 'Пользователь успешно вошел в систему',
 *   userId: '123',
 *   username: 'john.doe',
 *   userRole: 'user',
 *   ipAddress: '192.168.1.1',
 *   metadata: {
 *     loginMethod: 'password',
 *   }
 * });
 *
 * // Логирование подозрительной активности
 * await logSecurityEvent({
 *   eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
 *   severity: SecurityEventSeverity.HIGH,
 *   status: 'warning',
 *   message: 'Обнаружено несколько неудачных попыток входа',
 *   userId: '123',
 *   username: 'john.doe',
 *   ipAddress: '192.168.1.1',
 *   metadata: {
 *     failedAttempts: 5,
 *     timeWindow: '10 minutes'
 *   }
 * });
 * ```
 */
