# Схема бази даних для відстеження активності користувачів

Цей документ описує структуру бази даних для зберігання інформації про активність користувачів у системі.

## Таблиці

### UserActivity

Основна таблиця для зберігання всіх типів активності користувачів.

```sql
CREATE TABLE UserActivity (
  id SERIAL PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  email VARCHAR(255),
  actionType VARCHAR(50) NOT NULL,
  actionDetails TEXT NOT NULL,
  resourceType VARCHAR(100),
  resourceId VARCHAR(255),
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Індекси для швидкого пошуку
CREATE INDEX idx_user_activity_user_id ON UserActivity(userId);
CREATE INDEX idx_user_activity_action_type ON UserActivity(actionType);
CREATE INDEX idx_user_activity_timestamp ON UserActivity(timestamp);
CREATE INDEX idx_user_activity_resource ON UserActivity(resourceType, resourceId);
```

### UserQuestions

Таблиця для зберігання запитань користувачів.

```sql
CREATE TABLE UserQuestions (
  id SERIAL PRIMARY KEY,
  questionId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  question TEXT NOT NULL,
  context TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  activityId INTEGER REFERENCES UserActivity(id)
);

-- Індекси для швидкого пошуку
CREATE INDEX idx_user_questions_user_id ON UserQuestions(userId);
CREATE INDEX idx_user_questions_timestamp ON UserQuestions(timestamp);
```

### UserChanges

Таблиця для зберігання змін, внесених користувачами.

```sql
CREATE TABLE UserChanges (
  id SERIAL PRIMARY KEY,
  changeId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  changeType VARCHAR(100) NOT NULL,
  entityType VARCHAR(100) NOT NULL,
  entityId VARCHAR(255) NOT NULL,
  changes JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  activityId INTEGER REFERENCES UserActivity(id)
);

-- Індекси для швидкого пошуку
CREATE INDEX idx_user_changes_user_id ON UserChanges(userId);
CREATE INDEX idx_user_changes_entity ON UserChanges(entityType, entityId);
CREATE INDEX idx_user_changes_timestamp ON UserChanges(timestamp);
```

## Приклад використання

### Запис активності користувача

```sql
INSERT INTO UserActivity (userId, username, actionType, actionDetails, resourceType, resourceId, metadata)
VALUES (
  'user_123',
  'Тестовий користувач',
  'view',
  'Перегляд сторінки: /dashboard',
  'page',
  '/dashboard',
  '{"browser": "Chrome", "device": "Desktop", "ip": "192.168.1.1"}'
);
```

### Запис запитання користувача

```sql
-- Спочатку записуємо активність
INSERT INTO UserActivity (userId, username, actionType, actionDetails, resourceType, metadata)
VALUES (
  'user_123',
  'Тестовий користувач',
  'question',
  'Задано питання: "Як налаштувати інтеграцію з GitHub?"',
  'support',
  '{"source": "chat"}'
) RETURNING id;

-- Потім записуємо деталі запитання
INSERT INTO UserQuestions (questionId, userId, question, context, metadata, activityId)
VALUES (
  'q_1623456789',
  'user_123',
  'Як налаштувати інтеграцію з GitHub?',
  'Користувач намагався підключити репозиторій',
  '{"priority": "high"}',
  1 -- ID з попереднього запиту
);
```

### Запис змін, внесених користувачем

```sql
-- Спочатку записуємо активність
INSERT INTO UserActivity (userId, username, actionType, actionDetails, resourceType, resourceId, metadata)
VALUES (
  'user_123',
  'Тестовий користувач',
  'change',
  'Внесено зміни: update для profile',
  'profile',
  'user_123',
  '{"source": "settings"}'
) RETURNING id;

-- Потім записуємо деталі змін
INSERT INTO UserChanges (changeId, userId, changeType, entityType, entityId, changes, metadata, activityId)
VALUES (
  'ch_1623456789',
  'user_123',
  'update',
  'profile',
  'user_123',
  '{"name": {"old": "Старе ім\'я", "new": "Нове ім\'я"}, "email": {"old": "old@example.com", "new": "new@example.com"}}',
  '{"ip": "192.168.1.1"}',
  2 -- ID з попереднього запиту
);
```

### Отримання історії активності користувача

```sql
SELECT * FROM UserActivity
WHERE userId = 'user_123'
ORDER BY timestamp DESC
LIMIT 50 OFFSET 0;
```

### Отримання історії запитань користувача

```sql
SELECT q.*, a.actionDetails, a.timestamp
FROM UserQuestions q
JOIN UserActivity a ON q.activityId = a.id
WHERE q.userId = 'user_123'
ORDER BY a.timestamp DESC;
```

### Отримання історії змін користувача

```sql
SELECT c.*, a.actionDetails, a.timestamp
FROM UserChanges c
JOIN UserActivity a ON c.activityId = a.id
WHERE c.userId = 'user_123'
ORDER BY a.timestamp DESC;
```

## Рекомендації щодо впровадження

1. Використовуйте транзакції при записі пов'язаних даних (активність + запитання/зміни)
2. Реалізуйте механізм очищення старих даних для оптимізації розміру бази даних
3. Розгляньте можливість шардингу даних за часовими періодами для великих обсягів даних
4. Впровадіть механізм анонімізації чутливих даних користувачів
5. Налаштуйте регулярне резервне копіювання таблиць з активністю користувачів
