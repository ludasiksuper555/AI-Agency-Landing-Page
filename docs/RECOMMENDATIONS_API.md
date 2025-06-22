# API Рекомендацій

Цей документ описує API для роботи з рекомендаціями в системі. API дозволяє створювати, переглядати, схвалювати та відхиляти рекомендації щодо покращення проекту.

## Загальна інформація

- **Базовий URL**: `/api/recommendations`
- **Формат даних**: JSON
- **Аутентифікація**: JWT токен (такий самий, як для інших API)

## Ендпоінти

### Створення рекомендації

```
POST /api/recommendations/create
```

#### Опис

Створює нову рекомендацію в системі.

#### Необхідні права

`canComment` - Право коментування (доступне для ролей COMMENTER, CONTRIBUTOR, MAINTAINER, ADMIN)

#### Параметри запиту

| Параметр       | Тип    | Опис                                                                                          |
| -------------- | ------ | --------------------------------------------------------------------------------------------- |
| userId         | string | Ідентифікатор користувача, який створює рекомендацію                                          |
| resourceType   | string | Тип ресурсу, до якого відноситься рекомендація (наприклад, 'code', 'documentation', 'design') |
| resourceId     | string | Ідентифікатор ресурсу                                                                         |
| recommendation | string | Текст рекомендації                                                                            |

#### Приклад запиту

```json
{
  "userId": "user123",
  "resourceType": "code",
  "resourceId": "components/UserProfile.tsx",
  "recommendation": "Рекомендую додати валідацію форми для покращення UX"
}
```

#### Приклад відповіді (успіх)

```json
{
  "success": true,
  "recommendationId": "rec123"
}
```

#### Приклад відповіді (помилка)

```json
{
  "success": false,
  "error": "Недостатньо прав для створення рекомендації"
}
```

### Схвалення/відхилення рекомендації

```
POST /api/recommendations/approve
```

#### Опис

Схвалює або відхиляє існуючу рекомендацію.

#### Необхідні права

`canApprovePR` - Право схвалення PR (доступне для ролей MAINTAINER, ADMIN)

#### Параметри запиту

| Параметр         | Тип     | Опис                                                          |
| ---------------- | ------- | ------------------------------------------------------------- |
| userId           | string  | Ідентифікатор користувача, який схвалює/відхиляє рекомендацію |
| recommendationId | string  | Ідентифікатор рекомендації                                    |
| approved         | boolean | `true` для схвалення, `false` для відхилення                  |
| comment          | string  | Опціональний коментар до рішення                              |

#### Приклад запиту

```json
{
  "userId": "admin456",
  "recommendationId": "rec123",
  "approved": true,
  "comment": "Погоджуюсь, це покращить UX"
}
```

#### Приклад відповіді (успіх)

```json
{
  "success": true
}
```

#### Приклад відповіді (помилка)

```json
{
  "success": false,
  "error": "Рекомендація не знайдена"
}
```

### Отримання списку рекомендацій

```
GET /api/recommendations/list
```

#### Опис

Отримує список рекомендацій з можливістю фільтрації.

#### Необхідні права

`canView` - Право перегляду (доступне для всіх авторизованих користувачів)

#### Параметри запиту (query string)

| Параметр     | Тип    | Опис                                                         | Обов'язковий                |
| ------------ | ------ | ------------------------------------------------------------ | --------------------------- |
| status       | string | Фільтр за статусом: 'pending', 'approved', 'rejected', 'all' | Ні (за замовчуванням 'all') |
| resourceType | string | Фільтр за типом ресурсу                                      | Ні                          |
| resourceId   | string | Фільтр за ідентифікатором ресурсу                            | Ні                          |
| page         | number | Номер сторінки для пагінації                                 | Ні (за замовчуванням 1)     |
| limit        | number | Кількість елементів на сторінці                              | Ні (за замовчуванням 10)    |

#### Приклад запиту

```
GET /api/recommendations/list?status=pending&resourceType=code&page=1&limit=20
```

#### Приклад відповіді

```json
{
  "success": true,
  "recommendations": [
    {
      "id": "rec123",
      "userId": "user123",
      "resourceType": "code",
      "resourceId": "components/UserProfile.tsx",
      "recommendation": "Рекомендую додати валідацію форми для покращення UX",
      "status": "pending",
      "createdAt": "2023-05-15T10:30:00Z"
    },
    {
      "id": "rec124",
      "userId": "user456",
      "resourceType": "code",
      "resourceId": "components/LoginForm.tsx",
      "recommendation": "Додати індикатор завантаження при відправці форми",
      "status": "pending",
      "createdAt": "2023-05-16T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Отримання деталей рекомендації

```
GET /api/recommendations/[id]
```

#### Опис

Отримує детальну інформацію про конкретну рекомендацію.

#### Необхідні права

`canView` - Право перегляду (доступне для всіх авторизованих користувачів)

#### Параметри запиту

| Параметр | Тип    | Опис                       | Розташування |
| -------- | ------ | -------------------------- | ------------ |
| id       | string | Ідентифікатор рекомендації | URL          |

#### Приклад запиту

```
GET /api/recommendations/rec123
```

#### Приклад відповіді

```json
{
  "success": true,
  "recommendation": {
    "id": "rec123",
    "userId": "user123",
    "userDetails": {
      "name": "Іван Петренко",
      "email": "ivan@example.com",
      "role": "CONTRIBUTOR"
    },
    "resourceType": "code",
    "resourceId": "components/UserProfile.tsx",
    "recommendation": "Рекомендую додати валідацію форми для покращення UX",
    "status": "approved",
    "createdAt": "2023-05-15T10:30:00Z",
    "updatedAt": "2023-05-17T09:15:00Z",
    "approvedBy": "admin456",
    "approverDetails": {
      "name": "Марія Коваленко",
      "email": "maria@example.com",
      "role": "ADMIN"
    },
    "approvalComment": "Погоджуюсь, це покращить UX",
    "implementationStatus": "pending"
  }
}
```

## Безпека та логування

Всі дії з API рекомендацій логуються в системі безпеки. Для кожної дії створюється запис у журналі безпеки з наступною інформацією:

- Тип події (створення, схвалення, відхилення)
- Користувач, який виконав дію
- Дата та час
- IP-адреса
- Деталі дії

Це забезпечує аудит та відповідність вимогам ISO 27001.

## Обмеження частоти запитів

Для захисту від зловживань, API має наступні обмеження:

- Створення рекомендацій: 10 запитів за хвилину для одного користувача
- Схвалення/відхилення: 20 запитів за хвилину для одного користувача
- Отримання списку: 60 запитів за хвилину для одного користувача

## Інтеграція з іншими системами

API рекомендацій інтегрується з наступними системами:

1. **Система сповіщень** - надсилає сповіщення при створенні нових рекомендацій та зміні їх статусу
2. **GitHub** - дозволяє автоматично створювати issues на основі схвалених рекомендацій
3. **Система аналітики** - відстежує статистику рекомендацій для покращення процесів розробки

## Приклади використання

### Створення рекомендації (JavaScript)

```javascript
async function createRecommendation() {
  const response = await fetch('/api/recommendations/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId: currentUser.id,
      resourceType: 'code',
      resourceId: 'components/UserProfile.tsx',
      recommendation: 'Рекомендую додати валідацію форми для покращення UX',
    }),
  });

  const data = await response.json();
  if (data.success) {
    console.log('Рекомендація успішно створена:', data.recommendationId);
  } else {
    console.error('Помилка при створенні рекомендації:', data.error);
  }
}
```

### Схвалення рекомендації (TypeScript)

```typescript
async function approveRecommendation(recommendationId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/recommendations/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        userId: getCurrentUser().id,
        recommendationId,
        approved: true,
        comment: 'Погоджуюсь із рекомендацією',
      }),
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Помилка при схваленні рекомендації:', error);
    return false;
  }
}
```
