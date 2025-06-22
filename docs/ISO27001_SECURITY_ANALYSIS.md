# Технічний аналіз проекту згідно ISO 27001: Контроль доступу

## Резюме

Цей документ містить технічний аналіз проекту на відповідність стандарту ISO 27001 з фокусом на забезпечення контролю доступу та запобігання несанкціонованим змінам, дозволяючи при цьому збір рекомендацій від сторонніх користувачів.

## Поточний стан безпеки

### Аутентифікація та авторизація

- **Реалізовано**: Базова JWT-аутентифікація для API-запитів
- **Реалізовано**: Інтеграція з Clerk для аутентифікації користувачів
- **Реалізовано**: OAuth-інтеграція з GitHub та MGX
- **Відсутнє**: Обов'язкова двофакторна аутентифікація (2FA)
- **Відсутнє**: Детальна система ролей та дозволів

### Контроль доступу до репозиторію

- **Реалізовано**: Файл CODEOWNERS для визначення власників коду
- **Відсутнє**: Branch Protection Rules для запобігання прямим змінам
- **Відсутнє**: Обов'язкове рев'ю коду перед злиттям змін

### Моніторинг та аудит

- **Реалізовано**: Базове логування активності користувачів
- **Реалізовано**: Інтеграція з Sentry для відстеження помилок
- **Відсутнє**: Повноцінний аудит безпеки згідно ISO 27001

## Рекомендації щодо відповідності ISO 27001

### 1. Налаштування репозиторію Git (GitHub/GitLab)

#### 1.1. Обмеження доступу

```bash
# Зміна видимості репозиторію на приватний (через GitHub API)
curl -X PATCH \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO \
  -d '{"private":true}'
```

#### 1.2. Branch Protection Rules

1. Перейдіть до налаштувань репозиторію: Settings > Branches > Branch protection rules
2. Натисніть "Add rule"
3. Налаштуйте наступні параметри:
   - Branch name pattern: `main` (або інша основна гілка)
   - Require pull request reviews before merging: ✓
   - Required number of approvals: 2
   - Dismiss stale pull request approvals when new commits are pushed: ✓
   - Require review from Code Owners: ✓
   - Restrict who can push to matching branches: ✓
   - Do not allow bypassing the above settings: ✓

#### 1.3. Розширення файлу CODEOWNERS

Оновіть файл `.github/CODEOWNERS` для більш детального контролю:

```
# Власники безпеки
/src/utils/security-utils.js @security-team
/lib/userActivityTracker.ts @security-team
/middleware/ @security-team

# Власники API
/pages/api/ @api-team

# Власники документації
/docs/ @docs-team
```

### 2. Налаштування ролей користувачів

#### 2.1. Створення системи ролей

Розробіть систему ролей з чіткими дозволами:

```typescript
// types/userTypes.ts
export enum UserRole {
  VIEWER = 'viewer', // Тільки перегляд
  COMMENTER = 'commenter', // Перегляд + коментарі
  CONTRIBUTOR = 'contributor', // Може створювати PR
  MAINTAINER = 'maintainer', // Може схвалювати PR
  ADMIN = 'admin', // Повний доступ
}

export type Permission = {
  canView: boolean;
  canComment: boolean;
  canCreatePR: boolean;
  canApprovePR: boolean;
  canMerge: boolean;
  canManageUsers: boolean;
};

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
```

#### 2.2. Впровадження перевірки дозволів

```typescript
// lib/authUtils.ts
import { UserRole, Permission, rolePermissions } from '../types/userTypes';

export const hasPermission = (
  userRole: UserRole,
  requiredPermission: keyof Permission
): boolean => {
  if (!userRole || !rolePermissions[userRole]) {
    return false;
  }

  return rolePermissions[userRole][requiredPermission];
};

export const checkPermission = (userRole: UserRole, requiredPermission: keyof Permission): void => {
  if (!hasPermission(userRole, requiredPermission)) {
    throw new Error(
      `Недостатньо прав для виконання цієї дії. Необхідний дозвіл: ${requiredPermission}`
    );
  }
};
```

### 3. Журнали аудиту та моніторинг

#### 3.1. Розширення системи відстеження активності користувачів

Доповніть існуючий файл `lib/userActivityTracker.ts` для більш детального аудиту:

```typescript
// Додайте новий тип для подій безпеки
export type SecurityEvent = {
  userId: string;
  eventType:
    | 'login'
    | 'logout'
    | 'access_denied'
    | 'permission_change'
    | 'role_change'
    | 'security_setting_change';
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

// Функція для логування подій безпеки
export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp'>): SecurityEvent => {
  const eventWithTimestamp = {
    ...event,
    timestamp: new Date(),
    ipAddress: typeof window !== 'undefined' ? getClientIP() : undefined,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
  };

  // Логування в консоль (для розробки)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Security Event]', eventWithTimestamp);
  }

  // Відправка в Sentry
  Sentry.addBreadcrumb({
    category: 'security',
    message: event.details,
    data: {
      userId: event.userId,
      eventType: event.eventType,
      ...event.metadata,
    },
    level: 'warning',
  });

  // Збереження в базу даних
  saveSecurityEventToDatabase(eventWithTimestamp);

  return eventWithTimestamp;
};

// Допоміжна функція для отримання IP клієнта
const getClientIP = (): string => {
  // В реальному додатку тут буде логіка отримання IP
  return '0.0.0.0';
};

// Функція для збереження події безпеки в базу даних
const saveSecurityEventToDatabase = async (event: SecurityEvent): Promise<void> => {
  try {
    // В реальному додатку тут буде запис в базу даних
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
  } catch (error) {
    console.error('Помилка при збереженні події безпеки:', error);
    Sentry.captureException(error);
  }
};
```

#### 3.2. Створення API-ендпоінту для подій безпеки

```typescript
// pages/api/security/log.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import * as Sentry from '@sentry/nextjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Перевірка методу запиту
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // Перевірка аутентифікації
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Перевірка ролі користувача (адміністратор або служба безпеки)
    // Тут має бути перевірка ролі користувача

    // Отримання даних з запиту
    const securityEvent = req.body;

    // Валідація даних
    if (!securityEvent || !securityEvent.eventType || !securityEvent.details) {
      return res.status(400).json({ success: false, error: 'Invalid event data' });
    }

    // Збереження в базу даних
    // В реальному додатку тут буде запис в базу даних

    // Відправка в систему моніторингу безпеки
    Sentry.captureMessage(`Security Event: ${securityEvent.eventType}`, {
      level: 'warning',
      extra: securityEvent,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error logging security event:', error);
    Sentry.captureException(error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
```

### 4. Збір рекомендацій без можливості прямих змін

#### 4.1. Налаштування GitHub Issues для збору рекомендацій

Створіть шаблони для Issues:

```markdown
<!-- .github/ISSUE_TEMPLATE/recommendation.md -->

name: Рекомендація щодо покращення
about: Запропонуйте ідею або рекомендацію для проекту
title: '[РЕКОМЕНДАЦІЯ] '
labels: enhancement, recommendation
assignees: ''

---

## Опис рекомендації

<!-- Детально опишіть вашу рекомендацію -->

## Очікувані переваги

<!-- Які переваги принесе впровадження вашої рекомендації? -->

## Додаткова інформація

<!-- Будь-яка додаткова інформація, контекст або приклади -->
```

#### 4.2. Налаштування процесу Pull Requests

Створіть шаблон для Pull Request:

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## Опис змін

<!-- Опишіть зміни, які ви пропонуєте -->

## Пов'язані Issues

<!-- Вкажіть пов'язані Issues, наприклад: Fixes #123 -->

## Тип змін

- [ ] Виправлення помилки (non-breaking change)
- [ ] Нова функціональність (non-breaking change)
- [ ] Зміна, що порушує сумісність (breaking change)
- [ ] Документація або рефакторинг

## Контрольний список

- [ ] Мій код відповідає стилю цього проекту
- [ ] Я додав тести, що покривають мої зміни
- [ ] Всі тести проходять
- [ ] Я оновив документацію

## Додаткова інформація

<!-- Будь-яка додаткова інформація, контекст або скріншоти -->
```

### 5. Впровадження двофакторної аутентифікації (2FA)

#### 5.1. Налаштування обов'язкової 2FA для GitHub

1. Перейдіть до налаштувань організації: Settings > Organizations > [Your Organization]
2. Виберіть "Authentication security"
3. Увімкніть "Require two-factor authentication"

#### 5.2. Впровадження 2FA в додатку

```typescript
// lib/twoFactorAuth.ts
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Генерація секрету для 2FA
export const generateTwoFactorSecret = (userId: string) => {
  const secret = speakeasy.generateSecret({
    name: `TRAE Rules App (${userId})`,
    length: 20,
  });

  return {
    otpAuthUrl: secret.otpauth_url,
    base32: secret.base32,
  };
};

// Генерація QR-коду для 2FA
export const generateQRCode = async (otpAuthUrl: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(otpAuthUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

// Перевірка коду 2FA
export const verifyTwoFactorToken = (token: string, secret: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Дозволяє невелике відхилення в часі
  });
};
```

## План впровадження

### Короткострокові заходи (1-2 тижні)

1. Оновити файл CODEOWNERS для більш детального контролю
2. Налаштувати Branch Protection Rules для основних гілок
3. Створити шаблони для Issues та Pull Requests
4. Зробити репозиторій приватним

### Середньострокові заходи (1-2 місяці)

1. Впровадити систему ролей та дозволів
2. Розширити систему аудиту та моніторингу
3. Налаштувати обов'язкову 2FA для GitHub
4. Створити документацію з безпеки для команди

### Довгострокові заходи (3-6 місяців)

1. Впровадити 2FA в додатку
2. Провести аудит безпеки згідно ISO 27001
3. Автоматизувати процеси безпеки через CI/CD
4. Регулярно оновлювати залежності та перевіряти на вразливості

## Висновок

Запропоновані заходи дозволять забезпечити відповідність проекту вимогам ISO 27001 щодо контролю доступу, запобігти несанкціонованим змінам, але при цьому зберегти можливість отримання рекомендацій від сторонніх користувачів. Впровадження цих заходів слід проводити поетапно, починаючи з найбільш критичних аспектів безпеки.

## Додаткові ресурси

- [ISO 27001 Official Documentation](https://www.iso.org/isoiec-27001-information-security.html)
- [GitHub Security Best Practices](https://docs.github.com/en/github/administering-a-repository/securing-your-repository)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
