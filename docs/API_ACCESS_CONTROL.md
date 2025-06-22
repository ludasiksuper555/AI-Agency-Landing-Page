# Налаштування контролю доступу до API згідно ISO 27001

Цей документ містить інструкції щодо налаштування контролю доступу до API для забезпечення неможливості змін у проекті та дотримання вимог ISO 27001 щодо безпеки інформації.

## Загальні принципи

- Всі API-ендпоінти повинні мати чітко визначені рівні доступу
- Користувачі повинні мати мінімально необхідні права для виконання своїх функцій
- Всі запити до API повинні проходити аутентифікацію та авторизацію
- Всі дії з API повинні логуватися для аудиту
- Зміни в системі дозволені тільки через спеціальні процеси схвалення

## Рівні доступу до API

Згідно з нашою реалізацією в `middleware/accessControl.ts` та `lib/userActivityTracker.ts`, ми визначаємо наступні рівні доступу:

### Ролі користувачів

- **VIEWER** - може тільки переглядати дані
- **COMMENTER** - може переглядати та коментувати
- **CONTRIBUTOR** - може створювати Pull Requests
- **MAINTAINER** - може схвалювати та зливати Pull Requests
- **ADMIN** - має повний доступ до системи

### Дозволи для API

- **canView** - дозвіл на перегляд даних
- **canComment** - дозвіл на додавання коментарів
- **canCreatePR** - дозвіл на створення Pull Requests
- **canApprovePR** - дозвіл на схвалення Pull Requests
- **canMerge** - дозвіл на злиття змін
- **canManageUsers** - дозвіл на управління користувачами

## Налаштування API-ендпоінтів

### 1. Використання middleware для контролю доступу

Всі API-ендпоінти повинні використовувати middleware для контролю доступу. Приклад використання:

```typescript
// pages/api/user-activity/track.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withAccessControl } from '../../../middleware/accessControl';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Логіка обробки запиту
  res.status(200).json({ success: true });
};

// Дозволяємо доступ тільки користувачам з правом перегляду
export default withAccessControl(handler, 'canView');
```

### 2. Розділення ендпоінтів за функціональністю

API-ендпоінти повинні бути розділені за функціональністю та мати відповідні рівні доступу:

- **Ендпоінти для читання** - доступні для всіх аутентифікованих користувачів
- **Ендпоінти для коментування** - доступні для користувачів з роллю COMMENTER і вище
- **Ендпоінти для створення PR** - доступні для користувачів з роллю CONTRIBUTOR і вище
- **Ендпоінти для схвалення та злиття змін** - доступні тільки для MAINTAINER і ADMIN
- **Адміністративні ендпоінти** - доступні тільки для ADMIN

### 3. Обмеження методів запитів

Для забезпечення неможливості змін, використовуйте middleware `withReadOnlyAccess` для ендпоінтів, які повинні бути доступні тільки для читання:

```typescript
// pages/api/data/get-resource.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withReadOnlyAccess, withAccessControl } from '../../../middleware/accessControl';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Логіка отримання даних
  res.status(200).json({ data: 'resource data' });
};

// Комбінуємо middleware для забезпечення тільки читання
export default withReadOnlyAccess(withAccessControl(handler, 'canView'));
```

## Перевірка дій користувачів

Використовуйте функції з `lib/userActivityTracker.ts` для перевірки та логування дій користувачів:

### 1. Перевірка дозволу на дію

```typescript
import { canPerformAction } from '../lib/userActivityTracker';

// В обробнику запиту
const canEdit = await canPerformAction(userId, 'edit', 'document', documentId);
if (!canEdit) {
  return res.status(403).json({ success: false, error: 'Недостатньо прав для редагування' });
}
```

### 2. Відстеження дій користувачів

```typescript
import { trackUserAction } from '../lib/userActivityTracker';

// Після успішного виконання дії
const action = trackUserAction({
  userId,
  actionType: 'view',
  actionDetails: 'Перегляд документа',
  resourceType: 'document',
  resourceId: documentId,
});

// Якщо action === null, дія заборонена
if (!action) {
  return res.status(403).json({ success: false, error: 'Дія заборонена' });
}
```

## Логування подій безпеки

Використовуйте функції з `lib/securityEventLogger.ts` для логування подій безпеки:

```typescript
import {
  logSecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
} from '../lib/securityEventLogger';

// Логування спроби несанкціонованого доступу
logSecurityEvent({
  userId,
  eventType: SecurityEventType.ACCESS_DENIED,
  details: `Спроба редагування документа ${documentId} без необхідних прав`,
  severity: SecurityEventSeverity.WARNING,
  resourceType: 'document',
  resourceId: documentId,
});
```

## Налаштування обмеження частоти запитів

Для захисту від атак на відмову в обслуговуванні, використовуйте middleware `withRateLimit`:

```typescript
// pages/api/data/get-resource.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimit, withAccessControl } from '../../../middleware/accessControl';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Логіка отримання даних
  res.status(200).json({ data: 'resource data' });
};

// Обмеження: 100 запитів за хвилину
export default withRateLimit(withAccessControl(handler, 'canView'), 100, 60 * 1000);
```

## Обмеження доступу за IP-адресою

Для критичних API-ендпоінтів використовуйте обмеження за IP-адресою:

```typescript
// pages/api/admin/settings.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withIPRestriction, withAccessControl } from '../../../middleware/accessControl';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Логіка адміністративних налаштувань
  res.status(200).json({ success: true });
};

// Дозволяємо доступ тільки з певних IP-адрес
const allowedIPs = ['192.168.1.1', '10.0.0.1'];
export default withIPRestriction(withAccessControl(handler, 'canManageUsers'), allowedIPs);
```

## Процес внесення рекомендацій

### 1. Створення API-ендпоінту для рекомендацій

```typescript
// pages/api/recommendations/create.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withAccessControl } from '../../../middleware/accessControl';
import {
  logSecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../lib/securityEventLogger';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, resourceType, resourceId, recommendation } = req.body;

    // Зберігаємо рекомендацію в базу даних
    // В реальному додатку тут буде код для збереження

    // Логуємо подію
    logSecurityEvent({
      userId,
      eventType: SecurityEventType.DATA_ACCESS,
      details: `Створено рекомендацію для ${resourceType} ${resourceId}`,
      severity: SecurityEventSeverity.INFO,
      resourceType,
      resourceId,
      metadata: {
        recommendationType: 'suggestion',
        recommendationContent: recommendation,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Помилка при створенні рекомендації:', error);
    return res.status(500).json({ success: false, error: 'Внутрішня помилка сервера' });
  }
};

// Дозволяємо створювати рекомендації користувачам з правом коментування
export default withAccessControl(handler, 'canComment');
```

### 2. Створення API-ендпоінту для схвалення рекомендацій

```typescript
// pages/api/recommendations/approve.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withAccessControl } from '../../../middleware/accessControl';
import {
  logSecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../lib/securityEventLogger';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, recommendationId, approved } = req.body;

    // Оновлюємо статус рекомендації в базі даних
    // В реальному додатку тут буде код для оновлення

    // Логуємо подію
    logSecurityEvent({
      userId,
      eventType: SecurityEventType.DATA_MODIFICATION,
      details: `${approved ? 'Схвалено' : 'Відхилено'} рекомендацію ${recommendationId}`,
      severity: SecurityEventSeverity.WARNING,
      resourceType: 'recommendation',
      resourceId: recommendationId,
      metadata: {
        approved,
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Помилка при схваленні рекомендації:', error);
    return res.status(500).json({ success: false, error: 'Внутрішня помилка сервера' });
  }
};

// Дозволяємо схвалювати рекомендації тільки користувачам з правом схвалення PR
export default withAccessControl(handler, 'canApprovePR');
```

## Відповідність ISO 27001

Ці налаштування відповідають наступним вимогам ISO 27001:

- **A.9.1** - Вимоги бізнесу до контролю доступу
- **A.9.2** - Управління доступом користувачів
- **A.9.4** - Контроль доступу до систем та додатків
- **A.12.4** - Протоколювання та моніторинг
- **A.14.1** - Безпека в процесах розробки та підтримки
- **A.14.2** - Безпека в процесах розробки та підтримки

## Регулярний аудит

1. Проводьте регулярний аудит журналів безпеки (щонайменше раз на тиждень)
2. Перевіряйте всі спроби несанкціонованого доступу
3. Аналізуйте патерни використання API для виявлення аномалій
4. Оновлюйте налаштування контролю доступу при зміні вимог безпеки

## Навчання користувачів

1. Проводьте регулярні тренінги з безпеки для всіх користувачів API
2. Документуйте процес внесення рекомендацій та їх схвалення
3. Інформуйте користувачів про зміни в політиках безпеки
