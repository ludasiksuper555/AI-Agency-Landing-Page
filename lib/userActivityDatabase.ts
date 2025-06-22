import * as Sentry from '@sentry/nextjs';

// Типи даних для роботи з активністю користувачів
export type UserActivityRecord = {
  id?: number;
  userId: string;
  username?: string;
  email?: string;
  actionType: string;
  actionDetails: string;
  resourceType?: string;
  resourceId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

export type UserQuestionRecord = {
  id?: number;
  questionId: string;
  userId: string;
  question: string;
  context?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  activityId?: number;
};

export type UserChangeRecord = {
  id?: number;
  changeId: string;
  userId: string;
  changeType: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
  activityId?: number;
};

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type FilterParams = {
  userId?: string;
  username?: string;
  email?: string;
  actionType?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

/**
 * Клас для роботи з базою даних активності користувачів
 * В реальному додатку тут буде підключення до бази даних
 * та методи для роботи з нею
 */
export class UserActivityDatabase {
  /**
   * Зберігає запис про активність користувача
   * @param activity Дані про активність
   * @returns Збережений запис з ID
   */
  static async saveActivity(
    activity: Omit<UserActivityRecord, 'id' | 'timestamp'>
  ): Promise<UserActivityRecord> {
    try {
      // В реальному додатку тут буде запис в базу даних
      // Наприклад, з використанням Prisma, MongoDB або іншої БД

      // Для прикладу, просто повертаємо об'єкт з ID
      return {
        ...activity,
        id: Date.now(), // Імітуємо генерацію ID
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Помилка при збереженні активності користувача:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Зберігає запис про запитання користувача
   * @param question Дані про запитання
   * @param activityId ID запису активності
   * @returns Збережений запис з ID
   */
  static async saveQuestion(
    question: Omit<UserQuestionRecord, 'id' | 'timestamp'>,
    activityId?: number
  ): Promise<UserQuestionRecord> {
    try {
      // В реальному додатку тут буде запис в базу даних

      // Для прикладу, просто повертаємо об'єкт з ID
      const result: UserQuestionRecord = {
        ...question,
        id: Date.now(), // Імітуємо генерацію ID
        timestamp: new Date(),
      };

      if (activityId !== undefined) {
        result.activityId = activityId;
      }

      return result;
    } catch (error) {
      console.error('Помилка при збереженні запитання користувача:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Зберігає запис про зміни, внесені користувачем
   * @param change Дані про зміни
   * @param activityId ID запису активності
   * @returns Збережений запис з ID
   */
  static async saveChange(
    change: Omit<UserChangeRecord, 'id' | 'timestamp'>,
    activityId?: number
  ): Promise<UserChangeRecord> {
    try {
      // В реальному додатку тут буде запис в базу даних

      // Для прикладу, просто повертаємо об'єкт з ID
      const result: UserChangeRecord = {
        ...change,
        id: Date.now(), // Імітуємо генерацію ID
        timestamp: new Date(),
      };

      if (activityId !== undefined) {
        result.activityId = activityId;
      }

      return result;
    } catch (error) {
      console.error('Помилка при збереженні змін користувача:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Отримує історію активності користувачів з фільтрацією та пагінацією
   * @param filters Параметри фільтрації
   * @param pagination Параметри пагінації
   * @returns Масив записів активності та інформація про пагінацію
   */
  static async getActivityHistory(
    filters: FilterParams = {},
    pagination: PaginationParams = { limit: 50, offset: 0 }
  ): Promise<{ data: UserActivityRecord[]; total: number }> {
    try {
      // В реальному додатку тут буде запит до бази даних

      // Для прикладу, повертаємо тестові дані
      const mockData: UserActivityRecord[] = [
        {
          id: 1,
          userId: filters.userId || 'user_123',
          username: 'Тестовий користувач',
          actionType: 'login',
          actionDetails: 'Вхід в систему',
          timestamp: new Date(),
        },
        {
          id: 2,
          userId: filters.userId || 'user_123',
          username: 'Тестовий користувач',
          actionType: 'view',
          actionDetails: 'Перегляд сторінки: /dashboard',
          resourceType: 'page',
          resourceId: '/dashboard',
          timestamp: new Date(Date.now() - 5 * 60000),
        },
        {
          id: 3,
          userId: filters.userId || 'user_123',
          username: 'Тестовий користувач',
          actionType: 'edit',
          actionDetails: 'Редагування профілю',
          resourceType: 'profile',
          resourceId: filters.userId || 'user_123',
          timestamp: new Date(Date.now() - 15 * 60000),
        },
        {
          id: 4,
          userId: filters.userId || 'user_123',
          username: 'Тестовий користувач',
          actionType: 'question',
          actionDetails: 'Задано питання: "Як налаштувати інтеграцію з GitHub?"',
          resourceType: 'support',
          timestamp: new Date(Date.now() - 60 * 60000),
        },
        {
          id: 5,
          userId: filters.userId || 'user_123',
          username: 'Тестовий користувач',
          actionType: 'change',
          actionDetails: 'Внесено зміни: update для profile',
          resourceType: 'profile',
          resourceId: filters.userId || 'user_123',
          timestamp: new Date(Date.now() - 120 * 60000),
          metadata: {
            changeType: 'update',
            fields: ['name', 'email'],
          },
        },
      ];

      // Фільтрація за типом дії
      let filteredData = mockData;

      if (filters.actionType) {
        filteredData = filteredData.filter(item => item.actionType === filters.actionType);
      }

      if (filters.resourceType) {
        filteredData = filteredData.filter(item => item.resourceType === filters.resourceType);
      }

      if (filters.resourceId) {
        filteredData = filteredData.filter(item => item.resourceId === filters.resourceId);
      }

      if (filters.startDate) {
        filteredData = filteredData.filter(item => item.timestamp >= filters.startDate!);
      }

      if (filters.endDate) {
        filteredData = filteredData.filter(item => item.timestamp <= filters.endDate!);
      }

      // Сортування за часом (від найновіших до найстаріших)
      filteredData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Пагінація
      const limit = pagination.limit || 50;
      const offset = pagination.offset || 0;
      const paginatedData = filteredData.slice(offset, offset + limit);

      return {
        data: paginatedData,
        total: filteredData.length,
      };
    } catch (error) {
      console.error('Помилка при отриманні історії активності:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Отримує історію запитань користувача
   * @param userId ID користувача
   * @param pagination Параметри пагінації
   * @returns Масив записів запитань та інформація про пагінацію
   */
  static async getUserQuestions(
    userId: string,
    pagination: PaginationParams = { limit: 50, offset: 0 }
  ): Promise<{ data: UserQuestionRecord[]; total: number }> {
    try {
      // В реальному додатку тут буде запит до бази даних

      // Для прикладу, повертаємо тестові дані
      const mockData: UserQuestionRecord[] = [
        {
          id: 1,
          questionId: 'q_1623456789',
          userId,
          question: 'Як налаштувати інтеграцію з GitHub?',
          context: 'Користувач намагався підключити репозиторій',
          timestamp: new Date(Date.now() - 60 * 60000),
          activityId: 4,
        },
        {
          id: 2,
          questionId: 'q_1623456790',
          userId,
          question: 'Як змінити налаштування профілю?',
          timestamp: new Date(Date.now() - 2 * 60 * 60000),
          activityId: 6,
        },
      ];

      // Сортування за часом (від найновіших до найстаріших)
      mockData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Пагінація
      const limit = pagination.limit || 50;
      const offset = pagination.offset || 0;
      const paginatedData = mockData.slice(offset, offset + limit);

      return {
        data: paginatedData,
        total: mockData.length,
      };
    } catch (error) {
      console.error('Помилка при отриманні історії запитань:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Отримує історію змін, внесених користувачем
   * @param userId ID користувача
   * @param pagination Параметри пагінації
   * @returns Масив записів змін та інформація про пагінацію
   */
  static async getUserChanges(
    userId: string,
    pagination: PaginationParams = { limit: 50, offset: 0 }
  ): Promise<{ data: UserChangeRecord[]; total: number }> {
    try {
      // В реальному додатку тут буде запит до бази даних

      // Для прикладу, повертаємо тестові дані
      const mockData: UserChangeRecord[] = [
        {
          id: 1,
          changeId: 'ch_1623456789',
          userId,
          changeType: 'update',
          entityType: 'profile',
          entityId: userId,
          changes: {
            name: { old: "Старе ім'я", new: "Нове ім'я" },
            email: { old: 'old@example.com', new: 'new@example.com' },
          },
          timestamp: new Date(Date.now() - 120 * 60000),
          activityId: 5,
        },
        {
          id: 2,
          changeId: 'ch_1623456790',
          userId,
          changeType: 'create',
          entityType: 'document',
          entityId: 'doc_123',
          timestamp: new Date(Date.now() - 3 * 60 * 60000),
          activityId: 7,
        },
      ];

      // Сортування за часом (від найновіших до найстаріших)
      mockData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Пагінація
      const limit = pagination.limit || 50;
      const offset = pagination.offset || 0;
      const paginatedData = mockData.slice(offset, offset + limit);

      return {
        data: paginatedData,
        total: mockData.length,
      };
    } catch (error) {
      console.error('Помилка при отриманні історії змін:', error);
      Sentry.captureException(error);
      throw error;
    }
  }
}
