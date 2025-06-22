# Стандарты кодирования и автоматизация качества

## Обзор

Данный документ описывает внедренные стандарты кодирования и автоматизацию проверки качества кода в проекте.

## Автоматизированные проверки

### Pre-commit хуки

При каждом коммите автоматически выполняются:

1. **ESLint** - проверка и автоматическое исправление ошибок кода
2. **Prettier** - форматирование кода
3. **TypeScript** - проверка типов
4. **Jest** - запуск тестов для измененных файлов
5. **npm audit** - проверка безопасности зависимостей

### Доступные команды

```bash
# Проверка качества кода
npm run quality:check

# Проверка форматирования без изменений
npm run format:check

# Тесты для CI/CD
npm run test:ci

# Аудит безопасности
npm run security:audit
npm run security:fix
```

## Стандарты логирования

### Замена console.log

❌ **Неправильно:**

```javascript
console.log('Backup started');
console.error('Failed to create directory');
```

✅ **Правильно:**

```javascript
// Для событий безопасности
logSecurityEvent({
  event: 'backup_started',
  timestamp: new Date(),
  details: { type: 'full_backup' },
});

// Для критических ошибок
process.stderr.write(`Failed to create directory: ${error.message}\n`);

// Для отладки (только в development)
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

### Структура логов безопасности

```typescript
interface SecurityEvent {
  event: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'critical';
  details: Record<string, any>;
  userId?: string;
  sessionId?: string;
}
```

## TypeScript стандарты

### Обработка неиспользуемых переменных

❌ **Неправильно:**

```typescript
function processData(data: any, unusedParam: string) {
  return data.map(item => item.value);
}
```

✅ **Правильно:**

```typescript
function processData(data: DataItem[], _unusedParam: string) {
  return data.map(item => item.value);
}
```

### Типизация вместо any

❌ **Неправильно:**

```typescript
function handleResponse(response: any) {
  return response.data;
}
```

✅ **Правильно:**

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function handleResponse<T>(response: ApiResponse<T>): T {
  return response.data;
}
```

## Обработка многоязычного контента

### Экранирование апострофов в украинском тексте

❌ **Неправильно:**

```javascript
const message = 'Дані м'ясного ринку';
```

✅ **Правильно:**

```javascript
const message = "Дані м'ясного ринку";
// или
const message = "Дані м'ясного ринку";
```

## Конфигурация ESLint

### Правила для разных типов файлов

```javascript
// .eslintrc.js
module.exports = {
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/prefer-const': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
```

## Тестирование

### Структура тестов

```typescript
// Тест логирования
describe('Security Logging', () => {
  test('should log backup events correctly', () => {
    const mockLogSecurityEvent = jest.fn();

    runFullBackup();

    expect(mockLogSecurityEvent).toHaveBeenCalledWith({
      event: 'backup_started',
      timestamp: expect.any(Date),
      details: expect.any(Object),
    });
  });
});
```

## CI/CD интеграция

### GitHub Actions workflow

```yaml
name: Quality Check
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run quality:check
      - run: npm run security:audit
```

## Мониторинг качества

### Метрики для отслеживания

1. **Покрытие тестами** - минимум 80%
2. **ESLint ошибки** - 0 errors, warnings допустимы
3. **TypeScript ошибки** - 0 errors
4. **Уязвимости безопасности** - 0 high/critical
5. **Время сборки** - отслеживание производительности

### Инструменты мониторинга

- **SonarQube** - анализ качества кода
- **Snyk** - мониторинг безопасности
- **Lighthouse CI** - производительность
- **Bundle Analyzer** - размер бандла

## Рекомендации для разработчиков

1. **Запускайте `npm run quality:check` перед push**
2. **Используйте типизированные интерфейсы вместо any**
3. **Добавляйте тесты для новой функциональности**
4. **Документируйте сложную бизнес-логику**
5. **Регулярно обновляйте зависимости**

## Устранение проблем

### Частые ошибки и решения

1. **ESLint ошибки** - `npm run lint:fix`
2. **Форматирование** - `npm run format`
3. **TypeScript ошибки** - `npm run type-check`
4. **Уязвимости** - `npm run security:fix`
5. **Тесты** - `npm run test:coverage`

Для получения помощи обращайтесь к документации в папке `docs/` или создавайте issue в репозитории.
