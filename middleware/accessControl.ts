import { getAuth } from '@clerk/nextjs/server';
import * as Sentry from '@sentry/nextjs';
import { NextApiRequest, NextApiResponse } from 'next';

// Типи ролей користувачів згідно ISO 27001
export enum UserRole {
  VIEWER = 'viewer', // Тільки перегляд
  COMMENTER = 'commenter', // Перегляд + коментарі
  CONTRIBUTOR = 'contributor', // Може створювати PR
  MAINTAINER = 'maintainer', // Може схвалювати PR
  ADMIN = 'admin', // Повний доступ
}

// Типи дозволів
export type Permission = {
  canView: boolean;
  canComment: boolean;
  canCreatePR: boolean;
  canApprovePR: boolean;
  canMerge: boolean;
  canManageUsers: boolean;
};

// Матриця дозволів для кожної ролі
export const rolePermissions: Record<UserRole, Permission> = {
  [UserRole.VIEWER]: {
    canView: true,
    canComment: false,
    canCreatePR: false,
    canApprovePR: false,
    canMerge: false,
    canManageUsers: false,
  },
  [UserRole.COMMENTER]: {
    canView: true,
    canComment: true,
    canCreatePR: false,
    canApprovePR: false,
    canMerge: false,
    canManageUsers: false,
  },
  [UserRole.CONTRIBUTOR]: {
    canView: true,
    canComment: true,
    canCreatePR: true,
    canApprovePR: false,
    canMerge: false,
    canManageUsers: false,
  },
  [UserRole.MAINTAINER]: {
    canView: true,
    canComment: true,
    canCreatePR: true,
    canApprovePR: true,
    canMerge: true,
    canManageUsers: false,
  },
  [UserRole.ADMIN]: {
    canView: true,
    canComment: true,
    canCreatePR: true,
    canApprovePR: true,
    canMerge: true,
    canManageUsers: true,
  },
};

// Функція для перевірки наявності дозволу
export const hasPermission = (
  userRole: UserRole,
  requiredPermission: keyof Permission
): boolean => {
  if (!userRole || !rolePermissions[userRole]) {
    return false;
  }

  return rolePermissions[userRole][requiredPermission];
};

// Функція для отримання ролі користувача з бази даних
// В реальному додатку тут буде запит до бази даних
export const getUserRole = async (userId: string): Promise<UserRole> => {
  try {
    // Тут має бути запит до бази даних для отримання ролі користувача
    // Для прикладу повертаємо роль VIEWER
    return UserRole.VIEWER;
  } catch (error) {
    console.error('Помилка при отриманні ролі користувача:', error);
    Sentry.captureException(error);
    return UserRole.VIEWER; // За замовчуванням - мінімальні права
  }
};

// Логування спроб доступу згідно ISO 27001
const logAccessAttempt = async (
  userId: string,
  resource: string,
  permission: string,
  granted: boolean
) => {
  try {
    const event = {
      userId,
      eventType: granted ? 'access_granted' : 'access_denied',
      details: `Спроба доступу до ${resource} з дозволом ${permission}`,
      ipAddress: '0.0.0.0', // В реальному додатку тут буде IP користувача
      userAgent: 'Unknown', // В реальному додатку тут буде User-Agent
      timestamp: new Date(),
      metadata: {
        resource,
        permission,
        granted,
      },
    };

    // Логування в консоль (для розробки)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Access Control]', event);
    }

    // Відправка в Sentry
    Sentry.addBreadcrumb({
      category: 'access-control',
      message: event.details,
      data: {
        userId: event.userId,
        eventType: event.eventType,
        ...event.metadata,
      },
      level: granted ? 'info' : 'warning',
    });

    // В реальному додатку тут буде запис в базу даних
  } catch (error) {
    console.error('Помилка при логуванні спроби доступу:', error);
    Sentry.captureException(error);
  }
};

// Middleware для контролю доступу згідно ISO 27001
export const accessControlMiddleware = (requiredPermission: keyof Permission) => {
  return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    try {
      // Перевірка аутентифікації
      const { userId } = getAuth(req);
      if (!userId) {
        logAccessAttempt('anonymous', req.url || 'unknown', requiredPermission, false);
        return res.status(401).json({ success: false, error: 'Необхідна аутентифікація' });
      }

      // Отримання ролі користувача
      const userRole = await getUserRole(userId);

      // Перевірка дозволу
      const hasAccess = hasPermission(userRole, requiredPermission);

      // Логування спроби доступу
      logAccessAttempt(userId, req.url || 'unknown', requiredPermission, hasAccess);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Недостатньо прав для виконання цієї дії',
          requiredPermission,
        });
      }

      // Якщо все добре, продовжуємо виконання запиту
      return next();
    } catch (error) {
      console.error('Помилка в middleware контролю доступу:', error);
      Sentry.captureException(error);
      return res.status(500).json({ success: false, error: 'Внутрішня помилка сервера' });
    }
  };
};

// Приклад використання в API-ендпоінті:
/*
// pages/api/user-activity/track.ts
;
import { accessControlMiddleware } from '../../middleware/accessControl';

// Middleware для перевірки дозволу на перегляд
const viewerAccessControl = accessControlMiddleware('canView');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return viewerAccessControl(req, res, async () => {
    // Логіка обробки запиту
    res.status(200).json({ success: true });
  });
}
*/

// Експорт функції для використання в API Routes
export const withAccessControl = (handler: any, requiredPermission: keyof Permission) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    return accessControlMiddleware(requiredPermission)(req, res, () => handler(req, res));
  };
};
