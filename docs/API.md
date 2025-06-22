# API Документация

## Обзор

AI Agency Landing Page предоставляет несколько API endpoints для интеграции с внешними системами и управления контентом.

## Базовый URL

```
Production: https://ai-agency.com/api
Development: http://localhost:3000/api
```

## Аутентификация

Все API запросы требуют аутентификации через Clerk. Включите токен в заголовок:

```http
Authorization: Bearer <your-token>
```

## Endpoints

### 🏠 Главная страница

#### GET /api/hero

Получить данные для секции Hero.

**Ответ:**

```json
{
  "title": "AI Agency",
  "subtitle": "Революционные решения искусственного интеллекта",
  "description": "Мы создаем инновационные AI решения...",
  "cta": {
    "primary": "Начать проект",
    "secondary": "Узнать больше"
  },
  "image": "/images/hero-bg.jpg"
}
```

#### PUT /api/hero

Обновить данные секции Hero.

**Тело запроса:**

```json
{
  "title": "string",
  "subtitle": "string",
  "description": "string",
  "cta": {
    "primary": "string",
    "secondary": "string"
  }
}
```

### 👥 Команда

#### GET /api/team

Получить список членов команды.

**Параметры запроса:**

- `page` (number, optional): Номер страницы (по умолчанию: 1)
- `limit` (number, optional): Количество элементов на странице (по умолчанию: 10)
- `department` (string, optional): Фильтр по отделу

**Ответ:**

```json
{
  "data": [
    {
      "id": "1",
      "name": "Иван Иванов",
      "position": "Lead AI Engineer",
      "department": "Engineering",
      "bio": "Специалист по машинному обучению...",
      "avatar": "/images/team/ivan.jpg",
      "social": {
        "linkedin": "https://linkedin.com/in/ivan",
        "github": "https://github.com/ivan",
        "twitter": "https://twitter.com/ivan"
      },
      "skills": ["Python", "TensorFlow", "PyTorch"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### POST /api/team

Добавить нового члена команды.

**Тело запроса:**

```json
{
  "name": "string",
  "position": "string",
  "department": "string",
  "bio": "string",
  "avatar": "string",
  "social": {
    "linkedin": "string",
    "github": "string",
    "twitter": "string"
  },
  "skills": ["string"]
}
```

#### PUT /api/team/:id

Обновить информацию о члене команды.

#### DELETE /api/team/:id

Удалить члена команды.

### 🚀 Услуги

#### GET /api/services

Получить список услуг.

**Ответ:**

```json
{
  "data": [
    {
      "id": "1",
      "title": "Машинное обучение",
      "description": "Разработка ML моделей...",
      "icon": "brain",
      "features": ["Анализ данных", "Предиктивная аналитика"],
      "price": {
        "from": 50000,
        "currency": "RUB",
        "period": "проект"
      },
      "category": "AI Development"
    }
  ]
}
```

### 📧 Контакты

#### POST /api/contact

Отправить сообщение через форму обратной связи.

**Тело запроса:**

```json
{
  "name": "string",
  "email": "string",
  "company": "string",
  "message": "string",
  "service": "string",
  "budget": "string"
}
```

**Ответ:**

```json
{
  "success": true,
  "message": "Сообщение отправлено успешно",
  "id": "contact-123"
}
```

### 📊 Аналитика

#### GET /api/analytics/stats

Получить статистику сайта.

**Ответ:**

```json
{
  "visitors": {
    "total": 10000,
    "unique": 7500,
    "returning": 2500
  },
  "pageViews": 25000,
  "bounceRate": 0.35,
  "avgSessionDuration": 180,
  "topPages": [
    {
      "path": "/",
      "views": 8000,
      "title": "Главная"
    }
  ],
  "conversions": {
    "contacts": 150,
    "rate": 0.015
  }
}
```

### 🌐 Локализация

#### GET /api/i18n/translations/:locale

Получить переводы для указанной локали.

**Параметры:**

- `locale` (string): Код языка (ru, en, etc.)

**Ответ:**

```json
{
  "common": {
    "loading": "Загрузка...",
    "error": "Ошибка",
    "success": "Успешно"
  },
  "navigation": {
    "home": "Главная",
    "about": "О нас",
    "services": "Услуги",
    "contact": "Контакты"
  }
}
```

## Коды ошибок

| Код | Описание                  |
| --- | ------------------------- |
| 200 | Успешный запрос           |
| 201 | Ресурс создан             |
| 400 | Неверный запрос           |
| 401 | Не авторизован            |
| 403 | Доступ запрещен           |
| 404 | Ресурс не найден          |
| 422 | Ошибка валидации          |
| 429 | Превышен лимит запросов   |
| 500 | Внутренняя ошибка сервера |

## Лимиты запросов

- **Общий лимит**: 1000 запросов в час
- **Аутентифицированные пользователи**: 5000 запросов в час
- **Форма обратной связи**: 10 запросов в час с одного IP

## Примеры использования

### JavaScript/TypeScript

```typescript
// Получить данные команды
const response = await fetch('/api/team', {
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const teamData = await response.json();
```

### cURL

```bash
# Отправить сообщение
curl -X POST https://ai-agency.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Иван Петров",
    "email": "ivan@example.com",
    "message": "Интересует разработка AI решения"
  }'
```

### Python

```python
import requests

# Получить услуги
response = requests.get(
    'https://ai-agency.com/api/services',
    headers={'Authorization': f'Bearer {token}'}
)

services = response.json()
```

## Webhooks

### Настройка

Для получения уведомлений о событиях настройте webhook endpoints:

```json
{
  "url": "https://your-domain.com/webhook",
  "events": ["contact.created", "team.updated"],
  "secret": "your-webhook-secret"
}
```

### События

- `contact.created` - Новое сообщение через форму
- `team.updated` - Обновление информации о команде
- `service.created` - Добавление новой услуги

## SDK

### JavaScript SDK

```bash
npm install @ai-agency/sdk
```

```typescript
import { AIAgencyClient } from '@ai-agency/sdk';

const client = new AIAgencyClient({
  apiKey: 'your-api-key',
  baseURL: 'https://ai-agency.com/api',
});

// Получить команду
const team = await client.team.list();

// Отправить сообщение
const contact = await client.contact.create({
  name: 'Иван',
  email: 'ivan@example.com',
  message: 'Привет!',
});
```

## Поддержка

По вопросам API обращайтесь:

- Email: api@ai-agency.com
- Документация: https://docs.ai-agency.com
- GitHub Issues: https://github.com/ai-agency-team/ai-agency-landing-page/issues
