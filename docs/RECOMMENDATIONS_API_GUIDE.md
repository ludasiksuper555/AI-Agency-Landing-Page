# Руководство по API рекомендаций

Этот документ содержит подробную информацию о работе с API рекомендаций, включая примеры запросов, обработку ошибок и лучшие практики интеграции.

## Содержание

- [Обзор](#обзор)
- [Аутентификация](#аутентификация)
- [Конечные точки API](#конечные-точки-api)
- [Примеры запросов](#примеры-запросов)
- [Обработка ошибок](#обработка-ошибок)
- [Ограничения и квоты](#ограничения-и-квоты)
- [Лучшие практики](#лучшие-практики)
- [Часто задаваемые вопросы](#часто-задаваемые-вопросы)

## Обзор

API рекомендаций предоставляет доступ к системе персонализированных рекомендаций для улучшения пользовательского опыта. API построено на принципах REST и возвращает данные в формате JSON.

## Аутентификация

Для доступа к API рекомендаций необходимо использовать токен API. Токен можно получить в панели управления после регистрации.

```javascript
// Пример аутентификации
const fetchRecommendations = async () => {
  const response = await fetch('https://api.example.com/recommendations', {
    headers: {
      Authorization: `Bearer ${process.env.RECOMMENDATIONS_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};
```

## Конечные точки API

### Получение списка рекомендаций

```
GET /api/recommendations
```

#### Параметры запроса

| Параметр | Тип    | Описание                                                  |
| -------- | ------ | --------------------------------------------------------- |
| userId   | string | ID пользователя для персонализации рекомендаций           |
| limit    | number | Количество рекомендаций (по умолчанию: 10, максимум: 100) |
| category | string | Фильтрация по категории                                   |

#### Пример ответа

```json
{
  "recommendations": [
    {
      "id": "rec123",
      "title": "Оптимизация изображений с Next.js Image",
      "description": "Улучшение производительности сайта с помощью оптимизации изображений",
      "priority": "high",
      "category": "performance",
      "implementationTime": "2 часа"
    },
    {
      "id": "rec124",
      "title": "Настройка мониторинга производительности",
      "description": "Внедрение инструментов для отслеживания производительности приложения",
      "priority": "medium",
      "category": "monitoring",
      "implementationTime": "4 часа"
    }
  ],
  "total": 2,
  "page": 1,
  "pageSize": 10
}
```

### Создание новой рекомендации

```
POST /api/recommendations
```

#### Тело запроса

```json
{
  "title": "Внедрение PWA",
  "description": "Преобразование приложения в прогрессивное веб-приложение для улучшения пользовательского опыта",
  "priority": "low",
  "category": "user-experience",
  "implementationTime": "8 часов"
}
```

#### Пример ответа

```json
{
  "id": "rec125",
  "title": "Внедрение PWA",
  "description": "Преобразование приложения в прогрессивное веб-приложение для улучшения пользовательского опыта",
  "priority": "low",
  "category": "user-experience",
  "implementationTime": "8 часов",
  "createdAt": "2023-06-15T10:30:00Z"
}
```

### Получение детальной информации о рекомендации

```
GET /api/recommendations/{id}
```

#### Пример ответа

```json
{
  "id": "rec123",
  "title": "Оптимизация изображений с Next.js Image",
  "description": "Улучшение производительности сайта с помощью оптимизации изображений",
  "priority": "high",
  "category": "performance",
  "implementationTime": "2 часа",
  "createdAt": "2023-06-10T14:20:00Z",
  "steps": [
    "Заменить стандартные теги img на компонент Next.js Image",
    "Настроить оптимизацию размеров изображений",
    "Добавить ленивую загрузку для изображений ниже области видимости"
  ],
  "resources": [
    {
      "title": "Документация Next.js Image",
      "url": "https://nextjs.org/docs/api-reference/next/image"
    }
  ]
}
```

### Обновление рекомендации

```
PUT /api/recommendations/{id}
```

### Удаление рекомендации

```
DELETE /api/recommendations/{id}
```

## Обработка ошибок

API использует стандартные HTTP коды состояния для индикации успеха или неудачи запроса.

| Код | Описание                  |
| --- | ------------------------- |
| 200 | Успешный запрос           |
| 201 | Ресурс успешно создан     |
| 400 | Неверный запрос           |
| 401 | Не авторизован            |
| 403 | Доступ запрещен           |
| 404 | Ресурс не найден          |
| 429 | Слишком много запросов    |
| 500 | Внутренняя ошибка сервера |

### Пример ответа с ошибкой

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Отсутствует обязательный параметр: title",
    "status": 400
  }
}
```

## Ограничения и квоты

- Максимальное количество запросов: 100 запросов в минуту
- Максимальный размер ответа: 1 МБ
- Максимальное количество рекомендаций в одном запросе: 100

## Лучшие практики

1. **Кэширование**: Кэшируйте ответы API на стороне клиента для уменьшения количества запросов.

```javascript
const fetchRecommendationsWithCache = async userId => {
  const cacheKey = `recommendations_${userId}`;
  const cachedData = localStorage.getItem(cacheKey);

  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    // Проверяем, не устарел ли кэш (15 минут)
    if (Date.now() - timestamp < 15 * 60 * 1000) {
      return data;
    }
  }

  const response = await fetch(`https://api.example.com/recommendations?userId=${userId}`);
  const data = await response.json();

  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data,
      timestamp: Date.now(),
    })
  );

  return data;
};
```

2. **Обработка ошибок**: Всегда обрабатывайте возможные ошибки API.

```javascript
const fetchRecommendations = async () => {
  try {
    const response = await fetch('https://api.example.com/recommendations');

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || 'Произошла ошибка при получении рекомендаций');
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при получении рекомендаций:', error);
    // Показать пользователю сообщение об ошибке
    return { recommendations: [], error: error.message };
  }
};
```

3. **Пагинация**: Используйте пагинацию для больших наборов данных.

```javascript
const fetchAllRecommendations = async () => {
  let allRecommendations = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`https://api.example.com/recommendations?page=${page}&limit=50`);
    const data = await response.json();

    allRecommendations = [...allRecommendations, ...data.recommendations];

    if (data.recommendations.length < 50) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allRecommendations;
};
```

## Часто задаваемые вопросы

### Как получить API ключ?

API ключ можно получить в панели управления после регистрации. Перейдите в раздел "Настройки API" и нажмите "Создать новый ключ".

### Как часто обновляются рекомендации?

Рекомендации обновляются в реальном времени на основе действий пользователей и изменений в системе.

### Можно ли получить рекомендации для анонимных пользователей?

Да, для анонимных пользователей можно использовать параметр `sessionId` вместо `userId`.

### Как интегрировать API рекомендаций с React?

Пример интеграции с React:

```jsx
import { useState, useEffect } from 'react';

const RecommendationsList = ({ userId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://api.example.com/recommendations?userId=${userId}`);

        if (!response.ok) {
          throw new Error('Не удалось загрузить рекомендации');
        }

        const data = await response.json();
        setRecommendations(data.recommendations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  if (loading) return <p>Загрузка рекомендаций...</p>;
  if (error) return <p>Ошибка: {error}</p>;

  return (
    <div className="recommendations-list">
      <h2>Персональные рекомендации</h2>
      {recommendations.length === 0 ? (
        <p>Рекомендации не найдены</p>
      ) : (
        <ul>
          {recommendations.map(rec => (
            <li key={rec.id} className={`priority-${rec.priority}`}>
              <h3>{rec.title}</h3>
              <p>{rec.description}</p>
              <span className="category">{rec.category}</span>
              <span className="implementation-time">{rec.implementationTime}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecommendationsList;
```

---

Если у вас возникли вопросы или проблемы при использовании API рекомендаций, пожалуйста, обратитесь в службу поддержки или создайте issue в репозитории проекта.
