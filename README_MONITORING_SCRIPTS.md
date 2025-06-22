# Система мониторинга и подготовки проекта

Этот документ описывает созданную систему скриптов для мониторинга, подготовки проекта и управления рисками.

## 📁 Структура файлов

```
scripts/
├── stage0-preparation.js          # Главный скрипт подготовки (Stage 0)
├── health-checks/
│   ├── validate-env.js            # Валидация переменных окружения
│   └── check-services.js          # Проверка состояния сервисов
├── git/
│   └── git-status-check.js        # Проверка статуса Git репозитория
├── backup/
│   └── project-backup.js          # Создание резервных копий проекта
├── buffer-time/
│   └── buffer-calculator.js       # Расчет буферного времени
├── fallback/
│   └── fallback-generator.js      # Генерация планов отката
└── monitoring/
    ├── health-check-service.ts    # TypeScript сервис мониторинга
    └── health-dashboard.tsx       # React компонент дашборда
```

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск полной подготовки (Stage 0)

```bash
npm run stage0
```

### Запуск отдельных компонентов

```bash
# Проверка переменных окружения
npm run stage0:env

# Проверка сервисов
npm run stage0:services

# Проверка Git статуса
npm run stage0:git

# Создание резервной копии
npm run stage0:backup

# Расчет буферного времени
npm run buffer:calculate

# Генерация планов отката
npm run fallback:generate

# Запуск сервиса мониторинга
npm run health:check

# Запуск в режиме разработки
npm run dev:health
```

## 📋 Описание компонентов

### 1. Stage 0 - Подготовка проекта (`stage0-preparation.js`)

**Назначение**: Комплексная проверка готовности проекта к разработке.

**Проверки**:

- ✅ Системные требования (Node.js, npm, Git)
- ✅ Зависимости проекта
- ✅ Переменные окружения
- ✅ Статус Git репозитория
- ✅ Состояние сервисов
- ✅ Создание резервных копий

**Результат**: Детальный отчет с рекомендациями и статусом готовности.

### 2. Валидация окружения (`validate-env.js`)

**Проверяет**:

- Обязательные переменные окружения
- Формат URL адресов
- Длину секретных ключей
- Предупреждения об отсутствующих опциональных переменных

### 3. Проверка сервисов (`check-services.js`)

**Мониторит**:

- 🐘 PostgreSQL базу данных
- 🔴 Redis кэш
- 🌐 Внешние API
- 📁 Файловую систему

**Метрики**: Время отклика, статус подключения, детали ошибок.

### 4. Git статус (`git-status-check.js`)

**Анализирует**:

- Текущую ветку
- Незафиксированные изменения
- Статус синхронизации с удаленным репозиторием
- Последний коммит
- Содержимое `.gitignore`

### 5. Резервное копирование (`project-backup.js`)

**Создает архив**:

- 📦 Git репозиторий (включая незафиксированные изменения)
- 🗄️ Дамп базы данных
- ⚙️ Файлы конфигурации (с маскировкой секретов)
- 📄 Package файлы

### 6. Расчет буферного времени (`buffer-calculator.js`)

**Учитывает факторы**:

- Сложность задачи (низкая/средняя/высокая)
- Уровень риска
- Тип задачи (разработка/тестирование/деплой)
- Опыт команды
- Внешние зависимости
- Блокирующие факторы

**Результат**: Рекомендуемое буферное время и детальный анализ.

### 7. Планы отката (`fallback-generator.js`)

**Генерирует планы**:

- 🎯 **Оптимальный**: Полная функциональность
- 🔄 **Альтернативный**: Измененный подход
- ⚡ **Минимальный**: Базовая функциональность
- 🚨 **Аварийный**: Критический минимум

**Включает**: Матрицу принятия решений и пути эскалации.

### 8. Сервис мониторинга (`health-check-service.ts`)

**TypeScript сервис** для real-time мониторинга:

- HTTP endpoints для проверки здоровья
- Периодические проверки
- Express middleware
- Метрики системы (память, uptime)

**API Endpoints**:

```
GET /health          # Общий статус
GET /health/detailed # Детальная информация
GET /health/metrics  # Системные метрики
```

### 9. Дашборд мониторинга (`health-dashboard.tsx`)

**React компонент** с функциями:

- 📊 Визуализация статуса сервисов
- 🔄 Автоматическое обновление
- 🌓 Темная/светлая тема
- 📱 Адаптивный дизайн
- 📈 Системные метрики
- 🔍 Детальная информация об ошибках

**Компоненты**:

- `HealthDashboard` - Полный дашборд
- `HealthWidget` - Компактный виджет
- `HealthDashboardExample` - Пример использования

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `.env` с необходимыми переменными:

```env
# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=user
DB_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Внешние API
MEAT_API_URL=https://api.example.com
ANALYTICS_API_URL=https://analytics.example.com
API_KEY=your-secret-api-key

# Приложение
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-key
```

### Настройка мониторинга

В файле `health-check-service.ts` можно настроить:

```typescript
const config = {
  checkInterval: 30000, // Интервал проверок (мс)
  timeout: 5000, // Таймаут запросов (мс)
  retries: 3, // Количество повторов
  services: {
    database: true, // Включить проверку БД
    redis: true, // Включить проверку Redis
    externalAPIs: true, // Включить проверку внешних API
    filesystem: true, // Включить проверку файловой системы
  },
};
```

## 📊 Интеграция в CI/CD

### GitHub Actions

```yaml
name: Pre-deployment checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  stage0-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run Stage 0 preparation
        run: npm run stage0
      - name: Generate fallback plans
        run: npm run fallback:generate
```

### Docker

```dockerfile
# Добавить в Dockerfile
COPY scripts/ ./scripts/
RUN npm run stage0:env
RUN npm run stage0:git
```

## 🔧 Расширение функциональности

### Добавление новой проверки сервиса

1. Отредактируйте `check-services.js`:

```javascript
const checkNewService = async () => {
  try {
    const startTime = Date.now();
    // Ваша логика проверки
    const responseTime = Date.now() - startTime;

    return {
      service: 'new-service',
      status: 'healthy',
      responseTime,
      details: {
        /* детали */
      },
    };
  } catch (error) {
    return {
      service: 'new-service',
      status: 'unhealthy',
      responseTime: 0,
      error: error.message,
    };
  }
};

// Добавить в массив проверок
const checks = [
  checkDatabase,
  checkRedis,
  checkExternalAPIs,
  checkFileSystem,
  checkNewService, // Новая проверка
];
```

### Кастомизация дашборда

```tsx
// Пример кастомного компонента
const CustomHealthDashboard = () => {
  return (
    <HealthDashboard
      apiEndpoint="/api/custom-health"
      refreshInterval={15000}
      theme="dark"
      showDetails={false}
    />
  );
};
```

## 🐛 Устранение неполадок

### Частые проблемы

1. **Ошибка подключения к базе данных**

   ```bash
   # Проверить статус PostgreSQL
   npm run stage0:services

   # Проверить переменные окружения
   npm run stage0:env
   ```

2. **Проблемы с Git**

   ```bash
   # Детальная проверка Git статуса
   npm run stage0:git
   ```

3. **Ошибки TypeScript**

   ```bash
   # Установить типы
   npm install @types/node @types/express

   # Компиляция TypeScript
   npx tsc --noEmit
   ```

### Логи и отладка

Все скрипты создают детальные логи:

```bash
# Логи Stage 0
cat stage0-report-YYYY-MM-DD-HH-mm-ss.json

# Логи резервного копирования
cat backup-report-YYYY-MM-DD-HH-mm-ss.json

# Логи планов отката
cat fallback-plans-YYYY-MM-DD-HH-mm-ss.json
```

## 📈 Метрики и KPI

### Отслеживаемые метрики

- **Время выполнения Stage 0**: < 2 минут
- **Успешность проверок**: > 95%
- **Время отклика сервисов**: < 1 секунды
- **Покрытие резервными копиями**: 100%
- **Точность буферного времени**: ±20%

### Дашборд метрик

Используйте `HealthWidget` для встраивания в существующие дашборды:

```tsx
<div className="dashboard">
  <HealthWidget compact={true} />
  {/* Другие виджеты */}
</div>
```

## 🔄 Обновления и поддержка

### Регулярные задачи

- Еженедельно: Обновление зависимостей
- Ежемесячно: Ревизия планов отката
- Ежеквартально: Анализ метрик буферного времени

### Версионирование

Все скрипты следуют семантическому версионированию:

- `MAJOR`: Кардинальные изменения API
- `MINOR`: Новая функциональность
- `PATCH`: Исправления ошибок

## 📞 Поддержка

Для получения помощи:

1. Проверьте логи выполнения
2. Запустите диагностику: `npm run stage0`
3. Изучите документацию в `STAGE_0_GUIDE.md`
4. Создайте issue с детальным описанием проблемы

---

**Версия документации**: 1.0.0
**Последнее обновление**: $(date)
**Совместимость**: Node.js 18+, TypeScript 5+, React 18+
