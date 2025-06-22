import * as Sentry from '@sentry/nextjs';

import { UserActivityRecord, UserChangeRecord, UserQuestionRecord } from './userActivityDatabase';

/**
 * Типи форматів для експорту даних
 */
export type ExportFormat = 'csv' | 'json' | 'excel';

/**
 * Параметри для експорту даних
 */
export type ExportParams = {
  format: ExportFormat;
  fileName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
};

/**
 * Клас для експорту даних про активність користувачів у різних форматах
 */
export class UserActivityExport {
  /**
   * Експортує дані про активність користувачів у вказаному форматі
   * @param data Масив записів активності користувачів
   * @param params Параметри експорту
   * @returns Дані у вказаному форматі або URL для завантаження
   */
  static exportActivityData(data: UserActivityRecord[], params: ExportParams): string {
    try {
      switch (params.format) {
        case 'csv':
          return this.exportToCSV(data, params);
        case 'json':
          return this.exportToJSON(data);
        case 'excel':
          return this.exportToExcelCSV(data, params);
        default:
          throw new Error(`Непідтримуваний формат експорту: ${params.format}`);
      }
    } catch (error) {
      console.error('Помилка при експорті даних активності:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Експортує дані про зміни користувачів у вказаному форматі
   * @param data Масив записів змін користувачів
   * @param params Параметри експорту
   * @returns Дані у вказаному форматі або URL для завантаження
   */
  static exportChangesData(data: UserChangeRecord[], params: ExportParams): string {
    try {
      switch (params.format) {
        case 'csv':
          return this.exportChangesToCSV(data, params);
        case 'json':
          return this.exportToJSON(data);
        case 'excel':
          return this.exportChangesToExcelCSV(data, params);
        default:
          throw new Error(`Непідтримуваний формат експорту: ${params.format}`);
      }
    } catch (error) {
      console.error('Помилка при експорті даних про зміни:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Експортує дані про запитання користувачів у вказаному форматі
   * @param data Масив записів запитань користувачів
   * @param params Параметри експорту
   * @returns Дані у вказаному форматі або URL для завантаження
   */
  static exportQuestionsData(data: UserQuestionRecord[], params: ExportParams): string {
    try {
      switch (params.format) {
        case 'csv':
          return this.exportQuestionsToCSV(data, params);
        case 'json':
          return this.exportToJSON(data);
        case 'excel':
          return this.exportQuestionsToExcelCSV(data, params);
        default:
          throw new Error(`Непідтримуваний формат експорту: ${params.format}`);
      }
    } catch (error) {
      console.error('Помилка при експорті даних про запитання:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Експортує дані у форматі CSV
   * @param data Масив записів активності користувачів
   * @param params Параметри експорту
   * @returns Рядок у форматі CSV
   */
  private static exportToCSV(data: UserActivityRecord[], params: ExportParams): string {
    const headers = [
      'ID',
      'Користувач ID',
      "Ім'я користувача",
      'Email',
      'Тип дії',
      'Деталі дії',
      'Тип ресурсу',
      'ID ресурсу',
      'Час',
      'Метадані',
    ];

    const rows = data.map(item => [
      item.id || '',
      item.userId,
      item.username || '',
      item.email || '',
      item.actionType,
      item.actionDetails,
      item.resourceType || '',
      item.resourceId || '',
      this.formatDate(item.timestamp, params.dateFormat),
      item.metadata ? JSON.stringify(item.metadata) : '',
    ]);

    return this.generateCSV(headers, rows, params.includeHeaders !== false);
  }

  /**
   * Експортує дані про зміни у форматі CSV
   * @param data Масив записів змін користувачів
   * @param params Параметри експорту
   * @returns Рядок у форматі CSV
   */
  private static exportChangesToCSV(data: UserChangeRecord[], params: ExportParams): string {
    const headers = [
      'ID',
      'ID зміни',
      'Користувач ID',
      'Тип зміни',
      'Тип сутності',
      'ID сутності',
      'Зміни',
      'Час',
      'Метадані',
      'ID активності',
    ];

    const rows = data.map(item => [
      item.id || '',
      item.changeId,
      item.userId,
      item.changeType,
      item.entityType,
      item.entityId,
      item.changes ? JSON.stringify(item.changes) : '',
      this.formatDate(item.timestamp, params.dateFormat),
      item.metadata ? JSON.stringify(item.metadata) : '',
      item.activityId || '',
    ]);

    return this.generateCSV(headers, rows, params.includeHeaders !== false);
  }

  /**
   * Експортує дані про запитання у форматі CSV
   * @param data Масив записів запитань користувачів
   * @param params Параметри експорту
   * @returns Рядок у форматі CSV
   */
  private static exportQuestionsToCSV(data: UserQuestionRecord[], params: ExportParams): string {
    const headers = [
      'ID',
      'ID запитання',
      'Користувач ID',
      'Запитання',
      'Контекст',
      'Час',
      'Метадані',
      'ID активності',
    ];

    const rows = data.map(item => [
      item.id || '',
      item.questionId,
      item.userId,
      item.question,
      item.context || '',
      this.formatDate(item.timestamp, params.dateFormat),
      item.metadata ? JSON.stringify(item.metadata) : '',
      item.activityId || '',
    ]);

    return this.generateCSV(headers, rows, params.includeHeaders !== false);
  }

  /**
   * Експортує дані у форматі JSON
   * @param data Масив даних для експорту
   * @returns Рядок у форматі JSON
   */
  private static exportToJSON(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Експортує дані у форматі Excel-сумісного CSV
   * @param data Масив записів активності користувачів
   * @param params Параметри експорту
   * @returns Рядок у форматі CSV, сумісному з Excel
   */
  private static exportToExcelCSV(data: UserActivityRecord[], params: ExportParams): string {
    // Для Excel використовуємо крапку з комою як роздільник
    const csvData = this.exportToCSV(data, params);
    return csvData.replace(/,/g, ';');
  }

  /**
   * Експортує дані про зміни у форматі Excel-сумісного CSV
   * @param data Масив записів змін користувачів
   * @param params Параметри експорту
   * @returns Рядок у форматі CSV, сумісному з Excel
   */
  private static exportChangesToExcelCSV(data: UserChangeRecord[], params: ExportParams): string {
    const csvData = this.exportChangesToCSV(data, params);
    return csvData.replace(/,/g, ';');
  }

  /**
   * Експортує дані про запитання у форматі Excel-сумісного CSV
   * @param data Масив записів запитань користувачів
   * @param params Параметри експорту
   * @returns Рядок у форматі CSV, сумісному з Excel
   */
  private static exportQuestionsToExcelCSV(
    data: UserQuestionRecord[],
    params: ExportParams
  ): string {
    const csvData = this.exportQuestionsToCSV(data, params);
    return csvData.replace(/,/g, ';');
  }

  /**
   * Генерує рядок у форматі CSV з заголовками та рядками даних
   * @param headers Масив заголовків
   * @param rows Масив рядків даних
   * @param includeHeaders Чи включати заголовки
   * @returns Рядок у форматі CSV
   */
  private static generateCSV(
    headers: string[],
    rows: any[][],
    includeHeaders: boolean = true
  ): string {
    // Екрануємо спеціальні символи та обгортаємо значення в лапки
    const escapeCSV = (value: any) => {
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvRows = rows.map(row => row.map(escapeCSV).join(','));

    if (includeHeaders) {
      csvRows.unshift(headers.map(escapeCSV).join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Форматує дату у вказаному форматі
   * @param date Дата для форматування
   * @param format Формат дати (опціонально)
   * @returns Відформатована дата у вигляді рядка
   */
  private static formatDate(date: Date, format?: string): string {
    if (!date) return '';

    if (format === 'iso') {
      return date.toISOString();
    }

    if (format === 'local') {
      return date.toLocaleString('uk-UA');
    }

    // За замовчуванням використовуємо формат ISO
    return date.toISOString();
  }

  /**
   * Створює URL для завантаження даних у вигляді файлу
   * @param data Дані для завантаження
   * @param fileName Ім'я файлу
   * @param mimeType MIME-тип файлу
   * @returns URL для завантаження
   */
  static createDownloadURL(data: string, fileName: string, mimeType: string): string {
    // Перевіряємо, що ми на клієнті
    if (typeof window === 'undefined') {
      throw new Error('Функція доступна тільки на клієнті');
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);

    // Створюємо тимчасовий елемент для завантаження
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Очищаємо ресурси
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    return url;
  }

  /**
   * Завантажує дані про активність користувачів у вказаному форматі
   * @param data Масив записів активності користувачів
   * @param params Параметри експорту
   */
  static downloadActivityData(data: UserActivityRecord[], params: ExportParams): void {
    const fileName = params.fileName || `user-activity-${new Date().toISOString().slice(0, 10)}`;
    let exportedData: string;
    let mimeType: string;

    switch (params.format) {
      case 'csv':
        exportedData = this.exportToCSV(data, params);
        mimeType = 'text/csv;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.csv`, mimeType);
        break;
      case 'json':
        exportedData = this.exportToJSON(data);
        mimeType = 'application/json;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.json`, mimeType);
        break;
      case 'excel':
        exportedData = this.exportToExcelCSV(data, params);
        mimeType = 'text/csv;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.csv`, mimeType);
        break;
      default:
        throw new Error(`Непідтримуваний формат експорту: ${params.format}`);
    }
  }

  /**
   * Завантажує дані про зміни користувачів у вказаному форматі
   * @param data Масив записів змін користувачів
   * @param params Параметри експорту
   */
  static downloadChangesData(data: UserChangeRecord[], params: ExportParams): void {
    const fileName = params.fileName || `user-changes-${new Date().toISOString().slice(0, 10)}`;
    let exportedData: string;
    let mimeType: string;

    switch (params.format) {
      case 'csv':
        exportedData = this.exportChangesToCSV(data, params);
        mimeType = 'text/csv;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.csv`, mimeType);
        break;
      case 'json':
        exportedData = this.exportToJSON(data);
        mimeType = 'application/json;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.json`, mimeType);
        break;
      case 'excel':
        exportedData = this.exportChangesToExcelCSV(data, params);
        mimeType = 'text/csv;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.csv`, mimeType);
        break;
      default:
        throw new Error(`Непідтримуваний формат експорту: ${params.format}`);
    }
  }

  /**
   * Завантажує дані про запитання користувачів у вказаному форматі
   * @param data Масив записів запитань користувачів
   * @param params Параметри експорту
   */
  static downloadQuestionsData(data: UserQuestionRecord[], params: ExportParams): void {
    const fileName = params.fileName || `user-questions-${new Date().toISOString().slice(0, 10)}`;
    let exportedData: string;
    let mimeType: string;

    switch (params.format) {
      case 'csv':
        exportedData = this.exportQuestionsToCSV(data, params);
        mimeType = 'text/csv;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.csv`, mimeType);
        break;
      case 'json':
        exportedData = this.exportToJSON(data);
        mimeType = 'application/json;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.json`, mimeType);
        break;
      case 'excel':
        exportedData = this.exportQuestionsToExcelCSV(data, params);
        mimeType = 'text/csv;charset=utf-8';
        this.createDownloadURL(exportedData, `${fileName}.csv`, mimeType);
        break;
      default:
        throw new Error(`Непідтримуваний формат експорту: ${params.format}`);
    }
  }
}
