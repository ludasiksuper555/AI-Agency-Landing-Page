# Довідник API

## Вступ

Цей документ містить повну технічну документацію API для проекту AI Agency Landing Page. Тут ви знайдете детальний опис усіх доступних ендпоінтів, параметрів запитів, форматів відповідей та кодів помилок.

## Базовий URL

```
https://api.example.com/v1
```

## Формати даних

API підтримує обмін даними у форматі JSON. Усі запити повинні містити заголовок `Content-Type: application/json` для методів, що передають дані у тілі запиту (POST, PUT, PATCH).

## Аутентифікація

API використовує JWT (JSON Web Tokens) для аутентифікації. Токен повинен бути переданий у заголовку `Authorization` з префіксом `Bearer`:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Отримання токену

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Відповідь (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2023-12-31T23:59:59Z"
}
```

**Відповідь (401 Unauthorized):**

```json
{
  "error": "invalid_credentials",
  "message": "Невірний email або пароль"
}
```

### Оновлення токену

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer REFRESH_TOKEN

{}
```

**Відповідь (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2023-12-31T23:59:59Z"
}
```

## Користувачі

### Отримання профілю користувача

```http
GET /users/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Відповідь (200 OK):**

```json
{
  "id": "user_123",
  "name": "Іван Іванов",
  "email": "ivan@example.com",
  "role": "user",
  "avatar": "https://example.com/avatars/ivan.jpg",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Відповідь (401 Unauthorized):**

```json
{
  "error": "unauthorized",
  "message": "Необхідна аутентифікація"
}
```

### Оновлення профілю користувача

```http
PUT /users/profile
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "name": "Нове Ім'я",
  "email": "new.email@example.com",
  "avatar": "https://example.com/avatars/new-avatar.jpg"
}
```

**Відповідь (200 OK):**

```json
{
  "id": "user_123",
  "name": "Нове Ім'я",
  "email": "new.email@example.com",
  "role": "user",
  "avatar": "https://example.com/avatars/new-avatar.jpg",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-02T00:00:00Z"
}
```

**Відповідь (400 Bad Request):**

```json
{
  "error": "validation_error",
  "message": "Помилка валідації",
  "details": {
    "email": ["Невірний формат email"]
  }
}
```

### Зміна паролю

```http
POST /users/change-password
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "current_password": "current_password",
  "new_password": "new_password",
  "new_password_confirmation": "new_password"
}
```

**Відповідь (200 OK):**

```json
{
  "message": "Пароль успішно змінено"
}
```

**Відповідь (400 Bad Request):**

```json
{
  "error": "validation_error",
  "message": "Помилка валідації",
  "details": {
    "current_password": ["Невірний поточний пароль"],
    "new_password": ["Пароль повинен містити мінімум 8 символів"]
  }
}
```

## Команда

### Отримання списку членів команди

```http
GET /team
Authorization: Bearer YOUR_JWT_TOKEN
```

**Параметри запиту:**

- `limit` (опціонально): Кількість записів на сторінці (за замовчуванням 10)
- `page` (опціонально): Номер сторінки (за замовчуванням 1)
- `sort` (опціонально): Поле для сортування (`name`, `position`, `created_at`)
- `order` (опціонально): Порядок сортування (`asc`, `desc`)

**Приклад:**

```
GET /team?limit=5&page=2&sort=name&order=asc
```

**Відповідь (200 OK):**

```json
{
  "data": [
    {
      "id": "member_1",
      "name": "Анна Смирнова",
      "position": "Frontend Developer",
      "bio": "Експерт з React та TypeScript",
      "avatar": "https://example.com/avatars/anna.jpg",
      "social": {
        "linkedin": "https://linkedin.com/in/anna-smirnova",
        "github": "https://github.com/annasmirnova",
        "twitter": "https://twitter.com/annasmirnova"
      }
    },
    {
      "id": "member_2",
      "name": "Петро Петров",
      "position": "Backend Developer",
      "bio": "Спеціаліст з Node.js та бази даних",
      "avatar": "https://example.com/avatars/petr.jpg",
      "social": {
        "linkedin": "https://linkedin.com/in/petro-petrov",
        "github": "https://github.com/petropetrov"
      }
    }
  ],
  "meta": {
    "total": 10,
    "page": 2,
    "limit": 5,
    "pages": 2
  }
}
```

### Отримання інформації про члена команди

```http
GET /team/{id}
Authorization: Bearer YOUR_JWT_TOKEN
```

**Відповідь (200 OK):**

```json
{
  "id": "member_1",
  "name": "Анна Смирнова",
  "position": "Frontend Developer",
  "bio": "Експерт з React та TypeScript з більш ніж 5-річним досвідом розробки веб-додатків. Спеціалізується на створенні високопродуктивних інтерфейсів користувача.",
  "avatar": "https://example.com/avatars/anna.jpg",
  "social": {
    "linkedin": "https://linkedin.com/in/anna-smirnova",
    "github": "https://github.com/annasmirnova",
    "twitter": "https://twitter.com/annasmirnova"
  },
  "projects": [
    {
      "id": "project_1",
      "name": "E-commerce Platform",
      "description": "Розробка інтерфейсу для платформи електронної комерції"
    },
    {
      "id": "project_2",
      "name": "CRM System",
      "description": "Створення панелі адміністратора для CRM системи"
    }
  ],
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Відповідь (404 Not Found):**

```json
{
  "error": "not_found",
  "message": "Член команди не знайдений"
}
```

## Проекти

### Отримання списку проектів

```http
GET /projects
Authorization: Bearer YOUR_JWT_TOKEN
```

**Параметри запиту:**

- `limit` (опціонально): Кількість записів на сторінці (за замовчуванням 10)
- `page` (опціонально): Номер сторінки (за замовчуванням 1)
- `status` (опціонально): Фільтр за статусом (`active`, `pending`, `completed`)
- `sort` (опціонально): Поле для сортування (`name`, `created_at`, `status`)
- `order` (опціонально): Порядок сортування (`asc`, `desc`)

**Відповідь (200 OK):**

```json
{
  "data": [
    {
      "id": "project_1",
      "name": "E-commerce Platform",
      "description": "Розробка платформи електронної комерції з використанням React та Node.js",
      "status": "active",
      "thumbnail": "https://example.com/thumbnails/ecommerce.jpg",
      "tags": ["React", "Node.js", "MongoDB"],
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    },
    {
      "id": "project_2",
      "name": "CRM System",
      "description": "Розробка CRM системи для управління клієнтами",
      "status": "completed",
      "thumbnail": "https://example.com/thumbnails/crm.jpg",
      "tags": ["Vue.js", "Express", "PostgreSQL"],
      "created_at": "2022-11-15T00:00:00Z",
      "updated_at": "2023-02-20T00:00:00Z"
    }
  ],
  "meta": {
    "total": 8,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### Створення нового проекту

```http
POST /projects
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "name": "Mobile App",
  "description": "Розробка мобільного додатку для iOS та Android",
  "status": "pending",
  "tags": ["React Native", "Firebase"]
}
```

**Відповідь (201 Created):**

```json
{
  "id": "project_3",
  "name": "Mobile App",
  "description": "Розробка мобільного додатку для iOS та Android",
  "status": "pending",
  "thumbnail": null,
  "tags": ["React Native", "Firebase"],
  "created_at": "2023-03-15T00:00:00Z",
  "updated_at": "2023-03-15T00:00:00Z"
}
```

**Відповідь (400 Bad Request):**

```json
{
  "error": "validation_error",
  "message": "Помилка валідації",
  "details": {
    "name": ["Поле є обов'язковим"],
    "status": ["Значення повинно бути одним з: active, pending, completed"]
  }
}
```

## Обробка помилок

API використовує стандартні HTTP коди статусу для індикації успіху або невдачі запиту:

- `200 OK`: Запит виконано успішно
- `201 Created`: Ресурс успішно створено
- `400 Bad Request`: Невірний запит (помилка валідації)
- `401 Unauthorized`: Необхідна аутентифікація
- `403 Forbidden`: Доступ заборонено
- `404 Not Found`: Ресурс не знайдено
- `422 Unprocessable Entity`: Семантична помилка
- `429 Too Many Requests`: Перевищено ліміт запитів
- `500 Internal Server Error`: Внутрішня помилка сервера

У випадку помилки, відповідь містить об'єкт з інформацією про помилку:

```json
{
  "error": "error_code",
  "message": "Опис помилки",
  "details": {}
}
```

## Обмеження швидкості

API має обмеження на кількість запитів, які можна зробити за певний період часу. Поточні обмеження:

- 100 запитів на хвилину для аутентифікованих користувачів
- 20 запитів на хвилину для неаутентифікованих користувачів

При перевищенні ліміту, API поверне статус `429 Too Many Requests` з заголовком `Retry-After`, який вказує, через скільки секунд можна повторити запит.

## Версіонування

API використовує версіонування в URL. Поточна версія - `v1`. При значних змінах в API, буде випущена нова версія (наприклад, `v2`), при цьому стара версія буде підтримуватися протягом певного періоду часу.

## Підтримка

Якщо у вас виникли питання або проблеми з використанням API, зверніться до нашої команди підтримки:

- Email: api-support@example.com
- Документація: https://docs.example.com/api
- Статус API: https://status.example.com
