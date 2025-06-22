# Реализация обязательной двухфакторной аутентификации

## Введение

Данный документ описывает реализацию обязательной двухфакторной аутентификации (2FA) для ролей администратора и менеджера в соответствии с требованиями стандарта ISO 27001. Обязательная 2FA является критическим компонентом безопасности, который защищает привилегированные учетные записи от несанкционированного доступа.

## Текущее состояние

В настоящее время двухфакторная аутентификация является опциональной для всех пользователей, включая администраторов и менеджеров. Это создает потенциальный риск безопасности, так как привилегированные учетные записи могут быть скомпрометированы при отсутствии дополнительного уровня защиты.

## Требования ISO 27001

Стандарт ISO 27001 требует применения многофакторной аутентификации для привилегированных учетных записей (A.9.4.2 - Безопасные процедуры входа в систему). Согласно стандарту, организации должны использовать строгие методы аутентификации для доступа к критическим системам и данным.

## Реализация обязательной 2FA

### Обновление файла twoFactorAuth.ts

Для реализации обязательной 2FA для администраторов и менеджеров необходимо обновить файл `twoFactorAuth.ts`, добавив проверку роли пользователя и принудительное требование 2FA для привилегированных ролей.

```typescript
// Импорт необходимых модулей
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import * as Sentry from '@sentry/nextjs';
import { getUserRole, UserRole } from '../utils/accessControl';

// Функция для проверки, является ли пользователь администратором или менеджером
const isAdminOrMaintainer = async (userId: string): Promise<boolean> => {
  try {
    const userRole = await getUserRole(userId);
    return userRole === UserRole.Admin || userRole === UserRole.Maintainer;
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error checking user role:', error);
    return false;
  }
};

// Middleware для проверки двухфакторной аутентификации
export const withTwoFactorAuth = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => {
  try {
    const session = await getSession({ req });

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    const is2FAEnabled = session.user.twoFactorEnabled;
    const is2FAVerified = session.user.twoFactorVerified;

    // Проверка, является ли пользователь администратором или менеджером
    const isPrivilegedUser = await isAdminOrMaintainer(userId);

    // Для администраторов и менеджеров 2FA обязательна
    if (isPrivilegedUser) {
      // Если 2FA не включена, требуем включить
      if (!is2FAEnabled) {
        return res.status(403).json({
          error: 'Two-factor authentication is required for administrators and maintainers',
          requireSetup2FA: true,
        });
      }

      // Если 2FA включена, но не верифицирована в текущей сессии
      if (!is2FAVerified) {
        return res.status(403).json({
          error: 'Two-factor authentication verification required',
          require2FAVerification: true,
        });
      }
    } else {
      // Для обычных пользователей проверяем 2FA только если она включена
      if (is2FAEnabled && !is2FAVerified) {
        return res.status(403).json({
          error: 'Two-factor authentication verification required',
          require2FAVerification: true,
        });
      }
    }

    // Логирование успешной аутентификации
    console.log(`User ${userId} authenticated with 2FA: ${is2FAVerified}`);

    // Продолжаем выполнение запроса
    next();
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error in 2FA middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

### Обновление клиентской части

Для обеспечения плавного пользовательского опыта необходимо обновить клиентскую часть, чтобы перенаправлять администраторов и менеджеров на страницу настройки 2FA, если она не включена.

```typescript
// Пример обработки ответа API на клиенте
const handleApiRequest = async () => {
  try {
    const response = await fetch('/api/protected-resource');

    if (response.status === 403) {
      const data = await response.json();

      if (data.requireSetup2FA) {
        // Перенаправление на страницу настройки 2FA
        router.push('/settings/security/setup-2fa');
        return;
      }

      if (data.require2FAVerification) {
        // Перенаправление на страницу верификации 2FA
        router.push('/auth/verify-2fa');
        return;
      }
    }

    // Обработка успешного ответа
    const data = await response.json();
    // ...
  } catch (error) {
    console.error('API request failed:', error);
  }
};
```

## Мониторинг и аудит

### Логирование событий 2FA

Для обеспечения аудита и мониторинга необходимо реализовать детальное логирование событий 2FA.

```typescript
// Пример функции логирования событий 2FA
const log2FAEvent = async (userId: string, eventType: string, details: any) => {
  try {
    await db.securityLogs.create({
      data: {
        userId,
        eventType,
        details: JSON.stringify(details),
        timestamp: new Date(),
        ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error logging 2FA event:', error);
  }
};

// Использование функции логирования в middleware
export const withTwoFactorAuth = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => {
  try {
    // ... существующий код ...

    // Логирование успешной аутентификации
    await log2FAEvent(userId, '2FA_VERIFICATION', {
      success: true,
      isPrivilegedUser,
    });

    // Продолжаем выполнение запроса
    next();
  } catch (error) {
    // ... обработка ошибок ...
  }
};
```

### Оповещения о подозрительной активности

Для оперативного реагирования на подозрительную активность необходимо реализовать систему оповещений.

```typescript
// Пример функции оповещения о подозрительной активности
const alertSuspiciousActivity = async (userId: string, details: any) => {
  try {
    // Отправка оповещения в Slack
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `⚠️ Suspicious 2FA activity detected for user ${userId}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `⚠️ *Suspicious 2FA activity detected*\n*User:* ${userId}\n*Details:* ${JSON.stringify(details)}`,
            },
          },
        ],
      }),
    });

    // Отправка оповещения по email
    await sendEmail({
      to: process.env.SECURITY_EMAIL,
      subject: `Suspicious 2FA activity detected for user ${userId}`,
      text: `Suspicious 2FA activity detected for user ${userId}. Details: ${JSON.stringify(details)}`,
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error sending alert:', error);
  }
};
```

## Восстановление доступа

### Процедура восстановления доступа при потере устройства 2FA

Для обеспечения непрерывности бизнеса необходимо реализовать процедуру восстановления доступа при потере устройства 2FA.

```typescript
// Пример API-эндпоинта для восстановления доступа
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, recoveryCode } = req.body;

    // Проверка валидности recovery code
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        recoveryCode: true,
        role: true,
      },
    });

    if (!user || user.recoveryCode !== recoveryCode) {
      return res.status(400).json({ error: 'Invalid recovery code' });
    }

    // Генерация нового recovery code
    const newRecoveryCode = generateRecoveryCode();

    // Сброс 2FA и обновление recovery code
    await db.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        recoveryCode: newRecoveryCode,
      },
    });

    // Логирование события восстановления доступа
    await log2FAEvent(user.id, '2FA_RECOVERY', {
      success: true,
      method: 'recovery_code',
    });

    // Оповещение о восстановлении доступа
    await alertSuspiciousActivity(user.id, {
      event: '2FA_RECOVERY',
      method: 'recovery_code',
    });

    // Если пользователь является администратором или менеджером,
    // требуем немедленно настроить 2FA заново
    if (user.role === 'ADMIN' || user.role === 'MAINTAINER') {
      return res.status(200).json({
        success: true,
        requireSetup2FA: true,
        newRecoveryCode,
      });
    }

    return res.status(200).json({
      success: true,
      newRecoveryCode,
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error in recovery process:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Интеграция с CI/CD

### Проверка обязательной 2FA в CI/CD

Для обеспечения соответствия требованиям безопасности необходимо реализовать проверку обязательной 2FA в CI/CD.

```javascript
// Пример скрипта проверки обязательной 2FA в CI/CD
const checkMandatory2FA = async () => {
  try {
    // Получение списка администраторов и менеджеров
    const privilegedUsers = await db.user.findMany({
      where: {
        OR: [{ role: 'ADMIN' }, { role: 'MAINTAINER' }],
      },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
      },
    });

    // Проверка наличия 2FA у привилегированных пользователей
    const usersWithout2FA = privilegedUsers.filter(user => !user.twoFactorEnabled);

    if (usersWithout2FA.length > 0) {
      console.error('The following privileged users do not have 2FA enabled:');
      usersWithout2FA.forEach(user => {
        console.error(`- ${user.email} (${user.id})`);
      });

      // Отправка оповещения
      await alertSuspiciousActivity('SYSTEM', {
        event: 'MANDATORY_2FA_CHECK',
        usersWithout2FA: usersWithout2FA.map(user => user.email),
      });

      // Завершение процесса с ошибкой
      process.exit(1);
    }

    console.log('All privileged users have 2FA enabled.');
  } catch (error) {
    console.error('Error checking mandatory 2FA:', error);
    process.exit(1);
  }
};

checkMandatory2FA();
```

## Заключение

Реализация обязательной двухфакторной аутентификации для администраторов и менеджеров является критическим компонентом безопасности, который защищает привилегированные учетные записи от несанкционированного доступа. Данная реализация соответствует требованиям стандарта ISO 27001 и обеспечивает дополнительный уровень защиты для критических систем и данных.
