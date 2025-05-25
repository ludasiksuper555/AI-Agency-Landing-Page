# AI Agency Landing Page

## 📋 Описание

Современный лендинг для AI Agency, разработанный с использованием Next.js и React. Проект включает аутентификацию пользователей через Clerk, многоязычность, адаптивный дизайн и оптимизированную производительность.

## ✨ Основные функции

- **Аутентификация пользователей** — безопасная система входа и регистрации через Clerk
- **Многоязычность** — поддержка нескольких языков (английский, украинский, польский, немецкий)
- **Адаптивный дизайн** — оптимизация для всех устройств с использованием Tailwind CSS
- **Защищенные маршруты** — доступ к панели управления и профилю только для авторизованных пользователей
- **Оптимизированная производительность** — быстрая загрузка и отзывчивый интерфейс
- **Анимации** — плавные переходы с использованием Framer Motion

## 🛠️ Технологический стек

- **Frontend**: React 19, Next.js 15
- **Стилизация**: Tailwind CSS
- **Аутентификация**: Clerk
- **Анимации**: Framer Motion
- **Тестирование**: Jest, Testing Library
- **Типизация**: TypeScript
- **Линтинг и форматирование**: ESLint, Prettier
- **CI/CD**: GitHub Actions
- **CMS**: Contentful
- **Аналитика**: Google Analytics 4
- **Мониторинг ошибок**: Sentry
- **Кэширование API**: React Query
- **Документация API**: OpenAPI/Swagger
- **Контейнеризация**: Docker, Docker Compose

## 🚀 Установка и запуск

### Предварительные требования

- Node.js (версия 18 или выше)
- npm или yarn

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/ai-agency-landing-page.git
cd ai-agency-landing-page

# Установка зависимостей
npm install
# или
yarn install
```

### Настройка переменных окружения

Создайте файл `.env.local` в корне проекта и добавьте следующие переменные:

```env
# Clerk (аутентификация)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Маршруты
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Contentful CMS
CONTENTFUL_SPACE_ID=your_contentful_space_id
CONTENTFUL_ACCESS_TOKEN=your_contentful_access_token
CONTENTFUL_ENVIRONMENT=master

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# Sentry
SENTRY_DSN=your_sentry_dsn

# Общие настройки
NEXT_PUBLIC_SITE_URL=https://your-site-url.com
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Запуск в режиме разработки

```bash
npm run dev
# или
yarn dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000).

### Сборка для продакшена

```bash
npm run build
npm run start
# или
yarn build
yarn start
```

## 📁 Структура проекта

```
├── components/            # React компоненты
│   ├── ClerkProvider.tsx  # Провайдер аутентификации
│   ├── Contact.tsx        # Форма контактов
│   ├── Features.tsx       # Преимущества сервиса
│   ├── GoogleAnalytics.tsx # Компонент для аналитики
│   ├── Header.tsx         # Шапка сайта
│   ├── Hero.tsx           # Главный баннер
│   ├── SEO.tsx            # Компонент для SEO-оптимизации
│   └── ...                # Другие компоненты
├── lib/                   # Библиотеки и утилиты
│   ├── contentful.ts      # Клиент Contentful CMS
│   ├── reactQuery.ts      # Настройка React Query
│   └── sentry.ts          # Настройка Sentry
├── pages/                 # Страницы Next.js
│   ├── _app.tsx           # Главный компонент
│   ├── api/               # API-эндпоинты
│   │   └── health.ts      # Эндпоинт проверки работоспособности
│   ├── dashboard.tsx      # Панель управления
│   ├── index.tsx          # Главная страница
│   └── ...                # Другие страницы
├── styles/                # Стили
├── types/                 # TypeScript типы
│   └── contentfulTypes.ts # Типы для Contentful
├── utils/                 # Утилиты
├── Dockerfile             # Конфигурация Docker
├── docker-compose.yml     # Конфигурация Docker Compose
├── middleware.ts          # Middleware для защиты маршрутов
├── swagger.yaml           # Документация API
└── ...                    # Конфигурационные файлы
```

## 🧪 Запуск тестов

```bash
# Запуск всех тестов
npm run test

# Запуск тестов в режиме наблюдения
npm run test:watch

# Проверка покрытия тестами
npm run test:coverage
```

## 📝 Рекомендации по улучшению

### 1. Регулярное обновление зависимостей

- Установите и используйте `npm-check-updates` для автоматизации процесса обновления
- Настройте GitHub Actions для регулярной проверки и создания PR с обновлениями
- Регулярно проверяйте уязвимости с помощью `npm audit`

### 2. Мониторинг производительности

- Внедрите Google Analytics 4 для отслеживания пользовательских метрик
- Используйте Sentry для мониторинга ошибок и производительности в реальном времени
- Настройте отслеживание Web Vitals для контроля ключевых метрик производительности
- Внедрите Lighthouse CI для автоматизации аудита производительности

### 3. Расширение тестового покрытия

- Создайте интеграционные тесты для критических путей пользователя
- Добавьте тесты для процесса аутентификации, навигации и форм

### 4. Оптимизация изображений

- Замените стандартные теги `<img>` на компонент `Image` из Next.js
- Настройте автоматическую оптимизацию изображений

### 5. Прогрессивное веб-приложение (PWA)

- Установите и настройте `next-pwa`
- Создайте файл манифеста и необходимые иконки

## ✅ Реализованные улучшения

1. **Интеграция с CMS** — добавлен Contentful для управления контентом
2. **Аналитика** — интегрирован Google Analytics 4 для отслеживания пользовательских метрик
3. **Мониторинг ошибок** — внедрен Sentry для отслеживания ошибок и производительности
4. **Оптимизация SEO** — добавлен компонент SEO с метаданными и структурированными данными
5. **Кэширование API** — реализован React Query для эффективного кэширования запросов
6. **Документация API** — добавлена документация OpenAPI/Swagger
7. **Контейнеризация** — настроены Docker и Docker Compose для упрощения развертывания

## 📄 Лицензия

MIT