/**
 * Audit Logger Module
 *
 * Цей модуль забезпечує функціональність аудиту безпеки для інтеграції з AWS AGI сервісами
 * відповідно до вимог ISO 27001.
 */

// Імпорт залежностей
import fs from 'fs';
import path from 'path';

import { generateSecureHash } from './security-utils';

// Конфігурація логера
const LOG_DIRECTORY = process.env.LOG_DIRECTORY || 'logs';
const SECURITY_LOG_FILE = 'security-audit.log';
const ENABLE_CONSOLE_LOGGING = process.env.NODE_ENV !== 'production';

/**
 * Ініціалізація директорії для логів
 */
function initLogDirectory() {
  try {
    if (!fs.existsSync(LOG_DIRECTORY)) {
      fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
    }
  } catch (error) {
    // Используем stderr для критических ошибок инициализации
    process.stderr.write(`Failed to initialize log directory: ${error.message}\n`);
  }
}

/**
 * Логування події безпеки
 * @param {Object} eventData - Дані про подію безпеки
 * @returns {boolean} - Результат логування
 */
export function logSecurityEvent(eventData) {
  try {
    // Перевірка наявності необхідних полів
    if (!eventData || !eventData.eventType || !eventData.status || !eventData.service) {
      throw new Error('Invalid security event data format');
    }

    // Додавання додаткових метаданих
    const enrichedEventData = {
      ...eventData,
      timestamp: eventData.timestamp || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      applicationName: 'Trae',
      eventId: generateSecureHash(`${eventData.eventType}-${eventData.service}-${Date.now()}`),
    };

    // Форматування запису логу
    const logEntry = JSON.stringify(enrichedEventData);

    // Ініціалізація директорії для логів
    initLogDirectory();

    // Запис у файл логу
    const logFilePath = path.join(LOG_DIRECTORY, SECURITY_LOG_FILE);
    fs.appendFileSync(logFilePath, `${logEntry}\n`);

    // Виведення в консоль, якщо увімкнено
    if (ENABLE_CONSOLE_LOGGING) {
      // console.log(`[SECURITY AUDIT] ${logEntry}`);
    }

    return true;
  } catch (error) {
    // Используем stderr для критических ошибок логирования
    process.stderr.write(`Security event logging failed: ${error.message}\n`);

    // Спроба аварійного логування в консоль
    if (ENABLE_CONSOLE_LOGGING) {
      // console.error('[SECURITY AUDIT FAILURE]', error, eventData);
    }

    return false;
  }
}

/**
 * Отримання логів безпеки за період
 * @param {Date} startDate - Початкова дата
 * @param {Date} endDate - Кінцева дата
 * @returns {Array} - Масив записів логу
 */
export function getSecurityLogs(startDate, endDate) {
  try {
    // Перевірка наявності файлу логу
    const logFilePath = path.join(LOG_DIRECTORY, SECURITY_LOG_FILE);
    if (!fs.existsSync(logFilePath)) {
      return [];
    }

    // Читання файлу логу
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    const logLines = logContent.split('\n').filter(line => line.trim());

    // Парсинг та фільтрація записів логу за датою
    const logs = logLines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null);

    // Фільтрація за датою, якщо вказано
    if (startDate || endDate) {
      return logs.filter(log => {
        const logDate = new Date(log.timestamp);
        const afterStart = startDate ? logDate >= startDate : true;
        const beforeEnd = endDate ? logDate <= endDate : true;
        return afterStart && beforeEnd;
      });
    }

    return logs;
  } catch (error) {
    // console.error(`Failed to retrieve security logs: ${error.message}`);
    return [];
  }
}

/**
 * Генерація звіту аудиту безпеки
 * @param {Date} startDate - Початкова дата
 * @param {Date} endDate - Кінцева дата
 * @returns {Object} - Звіт аудиту
 */
export function generateAuditReport(startDate, endDate) {
  try {
    // Отримання логів за вказаний період
    const logs = getSecurityLogs(startDate, endDate);

    // Аналіз логів
    const eventTypes = {};
    const services = {};
    const statuses = {};
    const timeline = [];

    logs.forEach(log => {
      // Підрахунок за типом події
      eventTypes[log.eventType] = (eventTypes[log.eventType] || 0) + 1;

      // Підрахунок за сервісом
      services[log.service] = (services[log.service] || 0) + 1;

      // Підрахунок за статусом
      statuses[log.status] = (statuses[log.status] || 0) + 1;

      // Додавання до таймлайну
      timeline.push({
        timestamp: log.timestamp,
        eventType: log.eventType,
        service: log.service,
        status: log.status,
      });
    });

    // Сортування таймлайну за часом
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Формування звіту
    return {
      reportGeneratedAt: new Date().toISOString(),
      period: {
        startDate: startDate ? startDate.toISOString() : 'beginning',
        endDate: endDate ? endDate.toISOString() : 'now',
      },
      summary: {
        totalEvents: logs.length,
        eventTypes,
        services,
        statuses,
      },
      timeline,
      complianceStatus: {
        iso27001: checkISO27001Compliance(logs),
      },
    };
  } catch (error) {
    // console.error(`Failed to generate audit report: ${error.message}`);
    return {
      error: error.message,
      reportGeneratedAt: new Date().toISOString(),
    };
  }
}

/**
 * Перевірка відповідності логів вимогам ISO 27001
 * @param {Array} logs - Масив записів логу
 * @returns {Object} - Результат перевірки
 */
function checkISO27001Compliance(logs) {
  // Перевірка наявності необхідних типів подій для відповідності ISO 27001
  const requiredEventTypes = [
    'authentication',
    'authorization',
    'data_access',
    'configuration_change',
    'security_alert',
  ];

  const presentEventTypes = new Set(logs.map(log => log.eventType));
  const missingEventTypes = requiredEventTypes.filter(type => !presentEventTypes.has(type));

  // Перевірка наявності подій з різними статусами
  const hasFailedEvents = logs.some(log => log.status === 'failed');
  const hasSuccessEvents = logs.some(log => log.status === 'success');

  // Оцінка відповідності
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
    recommendations: missingEventTypes.map(type => `Додати логування подій типу '${type}'`),
  };
}

/**
 * Очищення старих логів
 * @param {number} daysToKeep - Кількість днів для зберігання логів
 * @returns {boolean} - Результат очищення
 */
export function cleanupOldLogs(daysToKeep = 90) {
  try {
    // Отримання всіх логів
    const logs = getSecurityLogs();

    // Визначення дати відсікання
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Фільтрація логів, які потрібно зберегти
    const logsToKeep = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= cutoffDate;
    });

    // Запис відфільтрованих логів назад у файл
    const logFilePath = path.join(LOG_DIRECTORY, SECURITY_LOG_FILE);
    fs.writeFileSync(logFilePath, logsToKeep.map(log => JSON.stringify(log)).join('\n') + '\n');

    // Логування події очищення
    logSecurityEvent({
      eventType: 'log_cleanup',
      status: 'success',
      service: 'audit_logger',
      details: `Cleaned up logs older than ${daysToKeep} days. Kept ${logsToKeep.length} of ${logs.length} logs.`,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    // console.error(`Log cleanup failed: ${error.message}`);
    return false;
  }
}

// Функції вже експортовані індивідуально вище
