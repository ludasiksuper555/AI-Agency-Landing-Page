# Stage 0: Подготовка к разработке

## Обзор

Stage 0 - это подготовительный этап, который обеспечивает готовность проекта к разработке. Этот этап включает проверку системных требований, валидацию окружения, проверку сервисов и создание резервных копий.

## Цели Stage 0

- ✅ Проверить системные требования
- ✅ Валидировать переменные окружения
- ✅ Проверить статус Git репозитория
- ✅ Проверить доступность сервисов
- ✅ Создать резервную копию проекта
- ✅ Подготовить отчеты о готовности

## Структура файлов

```
scripts/
├── stage0-preparation.js          # Главный скрипт Stage 0
├── health-checks/
│   ├── validate-env.js            # Валидация переменных окружения
│   └── check-services.js          # Проверка сервисов
├── backup/
│   └── project-backup.js          # Резервное копирование
└── git/
    └── git-status-check.js        # Проверка Git статуса
```

## Быстрый запуск

### 1. Запуск полной подготовки

```bash
# Запуск всех проверок Stage 0
node scripts/stage0-preparation.js
```

### 2. Запуск отдельных компонентов

```bash
# Валидация переменных окружения
node scripts/health-checks/validate-env.js

# Проверка сервисов
node scripts/health-checks/check-services.js

# Резервное копирование
node scripts/backup/project-backup.js

# Проверка Git статуса
node scripts/git/git-status-check.js
```

## Детальное описание компонентов

### 1. Проверка системных требований

**Что проверяется:**

- Версия Node.js (рекомендуется >= 16)
- Версия npm
- Наличие Git
- Свободное место на диске

**Критерии успеха:**

- Node.js установлен и доступен
- npm установлен и доступен
- Git установлен и доступен
- Достаточно свободного места (> 1GB)

### 2. Проверка зависимостей

**Что проверяется:**

- Наличие package.json
- Наличие lock файла (package-lock.json, yarn.lock, pnpm-lock.yaml)
- Наличие node_modules
- Критические зависимости (react, next)

**Критерии успеха:**

- package.json существует
- Lock файл присутствует
- node_modules установлены
- Все критические зависимости найдены

### 3. Валидация переменных окружения

**Обязательные переменные:**

- `NODE_ENV`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

**Опциональные переменные:**

- `REDIS_URL`
- `MEAT_API_URL`
- `ANALYTICS_API_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

**Проверки:**

- Наличие обязательных переменных
- Валидация URL форматов
- Проверка длины секретных ключей
- Предупреждения об отсутствующих опциональных переменных

### 4. Проверка Git статуса

**Что проверяется:**

- Наличие Git репозитория
- Текущая ветка
- Состояние рабочей директории
- Область индексации (staging area)
- Статус относительно удаленного репозитория
- Информация о последнем коммите
- Наличие и содержимое .gitignore

**Рекомендации:**

- Работать в основной ветке (main/master/develop)
- Чистая рабочая директория
- Синхронизация с удаленным репозиторием
- Актуальный .gitignore

### 5. Проверка сервисов

**Проверяемые сервисы:**

- **База данных (PostgreSQL)**

  - Подключение к DATABASE_URL
  - Выполнение тестового запроса
  - Получение версии БД

- **Redis**

  - Подключение к REDIS_URL
  - Тестовые операции SET/GET/DEL
  - Получение информации о сервере

- **Внешние API**

  - Проверка доступности MEAT_API_URL
  - Проверка доступности ANALYTICS_API_URL
  - HTTP статус коды и время ответа

- **Файловая система**
  - Наличие критических файлов и директорий
  - Права доступа

### 6. Резервное копирование

**Что сохраняется:**

- **Git репозиторий**

  - Bundle всех веток
  - Информация о текущем состоянии
  - Diff несохраненных изменений

- **База данных**

  - SQL дамп через pg_dump
  - Размер и метаданные

- **Файлы окружения**

  - Все .env файлы
  - Секреты замаскированы для безопасности

- **Файлы пакетов**
  - package.json
  - Lock файлы (package-lock.json, yarn.lock, etc.)

**Формат резервной копии:**

- Создается ZIP архив
- Временные файлы удаляются
- Генерируется отчет о процессе

## Интеграция с package.json

Добавьте следующие скрипты в ваш `package.json`:

```json
{
  "scripts": {
    "stage0": "node scripts/stage0-preparation.js",
    "stage0:env": "node scripts/health-checks/validate-env.js",
    "stage0:services": "node scripts/health-checks/check-services.js",
    "stage0:backup": "node scripts/backup/project-backup.js",
    "stage0:git": "node scripts/git/git-status-check.js",
    "prepare": "npm run stage0"
  }
}
```

## Отчеты и логи

### Структура отчетов

Все отчеты сохраняются в директории `reports/`:

```
reports/
├── stage0-preparation-[timestamp].json    # Общий отчет Stage 0
├── env-validation-[timestamp].json        # Отчет валидации окружения
├── health-check-[timestamp].json          # Отчет проверки сервисов
├── git-status-[timestamp].json            # Отчет Git статуса
└── project-backup-[timestamp]-report.json # Отчет резервного копирования
```

### Формат отчета Stage 0

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "stage": "Stage 0 - Preparation",
  "duration": 15000,
  "summary": {
    "total": 6,
    "successful": 5,
    "failed": 1,
    "errors": 1,
    "warnings": 2,
    "status": "ready_with_warnings"
  },
  "results": [...],
  "errors": [...],
  "warnings": [...],
  "recommendations": [...]
}
```

### Статусы готовности

- **`ready`** - Проект полностью готов к разработке
- **`ready_with_warnings`** - Готов с предупреждениями
- **`not_ready`** - Есть критические ошибки

## Коды выхода

- **0** - Успешное выполнение
- **1** - Критические ошибки
- **2** - Предупреждения (только для отдельных компонентов)

## Устранение проблем

### Частые проблемы

1. **Node.js не найден**

   ```bash
   # Установите Node.js с официального сайта
   # https://nodejs.org/
   ```

2. **DATABASE_URL не настроен**

   ```bash
   # Создайте .env файл с настройками БД
   echo "DATABASE_URL=postgresql://user:pass@localhost:5432/dbname" > .env
   ```

3. **node_modules отсутствует**

   ```bash
   npm install
   ```

4. **Git репозиторий не инициализирован**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

5. **Несохраненные изменения в Git**
   ```bash
   git add .
   git commit -m "Save current changes"
   ```

### Рекомендации по настройке

1. **Создайте .env.example**

   ```env
   NODE_ENV=development
   DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   REDIS_URL=redis://localhost:6379
   ```

2. **Настройте .gitignore**

   ```gitignore
   node_modules/
   .env
   .env.local
   .next/
   dist/
   build/
   *.log
   ```

3. **Установите зависимости для резервного копирования**
   ```bash
   npm install --save-dev archiver
   ```

## Интеграция с CI/CD

Stage 0 можно интегрировать в CI/CD пайплайн:

```yaml
# .github/workflows/preparation.yml
name: Stage 0 Preparation

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  preparation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run stage0:env
      - run: npm run stage0:git
```

## Следующие шаги

После успешного завершения Stage 0:

1. Проверьте отчет в `reports/stage0-preparation-*.json`
2. Устраните все критические ошибки
3. По возможности устраните предупреждения
4. Переходите к **Stage 1: Настройка и конфигурация**

## Поддержка

Если возникают проблемы:

1. Проверьте логи в консоли
2. Изучите отчеты в директории `reports/`
3. Следуйте рекомендациям из отчета
4. Обратитесь к разделу "Устранение проблем"

---

**Важно:** Stage 0 является критически важным этапом. Не переходите к следующим этапам без успешного завершения подготовки.
