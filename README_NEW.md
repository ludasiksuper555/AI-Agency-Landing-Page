# AI Agency Landing Page

[![ISO 27001 Compliant](https://img.shields.io/badge/ISO%2027001-Compliant-blue)](./docs/ISO27001_COMPLIANCE_RECOMMENDATIONS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI/CD](https://github.com/your-username/ai-agency-landing-page/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/ai-agency-landing-page/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-13.4.19-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Localization](https://img.shields.io/badge/Localization-4%20languages-green)](./docs/LOCALIZATION.md)

## 📋 Описание

Современная платформа для AI Agency, специализирующаяся на консалтинге в мясной индустрии. Проект включает полнофункциональную систему аутентификации, многоязычность, адаптивный дизайн, систему рекомендаций, мониторинг активности пользователей и соответствует стандартам ISO 27001 для обеспечения безопасности данных.

## ✨ Основные функции

### 🔐 Безопасность и аутентификация

- **Clerk Authentication** — безопасная система входа и регистрации
- **Двухфакторная аутентификация (2FA)** — дополнительный уровень защиты
- **Защищенные маршруты** — контроль доступа к административным панелям
- **Мониторинг активности пользователей** — отслеживание действий с соблюдением требований безопасности
- **ISO 27001 соответствие** — стандарты информационной безопасности

### 🌍 Интернационализация

- **Многоязычность** — поддержка украинского, английского, польского и немецкого языков
- **Динамическое переключение языков** — без перезагрузки страницы
- **Локализованный контент** — адаптация под региональные особенности

### 📊 Аналитика и мониторинг

- **Панель мониторинга мясной индустрии** — специализированные аналитические инструменты
- **Система рекомендаций** — персонализированные предложения
- **Экспорт данных** — возможность выгрузки аналитики
- **Google Analytics 4** — веб-аналитика
- **Sentry мониторинг** — отслеживание ошибок

### 🎨 UI/UX

- **Адаптивный дизайн** — оптимизация для всех устройств
- **Темная/светлая тема** — переключение режимов отображения
- **Анимации Framer Motion** — плавные переходы и интерактивность
- **Chakra UI компоненты** — современный дизайн-система
- **Tailwind CSS** — утилитарные стили

### 🔗 Интеграции

- **Contentful CMS** — управление контентом
- **MGX Integration** — интеграция с внешними сервисами
- **GitHub Integration** — интеграция с репозиториями
- **AWS Services** — облачные сервисы
- **RAG System** — система поиска и генерации ответов

## 🛠️ Технологический стек

### Frontend

- **React** 18.2.0 — библиотека для создания пользовательских интерфейсов
- **Next.js** 13.4.19 — фреймворк для React с SSR/SSG
- **TypeScript** 5.8.3 — типизированный JavaScript
- **Tailwind CSS** 3.3.5 — утилитарный CSS фреймворк
- **Chakra UI** 3.21.0 — компонентная библиотека
- **Framer Motion** 10.18.0 — библиотека анимаций

### Аутентификация и безопасность

- **Clerk** 6.19.4 — система аутентификации
- **Two-Factor Authentication** — двухфакторная аутентификация
- **Middleware защита** — защита маршрутов

### Управление состоянием и данными

- **Zustand** 5.0.5 — управление состоянием
- **React Query** 4.32.6 — кэширование и синхронизация данных
- **Contentful** 10.5.1 — headless CMS

### Интернационализация

- **next-i18next** 14.0.0 — интернационализация для Next.js
- **4 языка** — украинский, английский, польский, немецкий

### Мониторинг и аналитика

- **Sentry** 7.64.0 — мониторинг ошибок
- **Google Analytics** — веб-аналитика
- **Custom Analytics** — собственная система аналитики

### Тестирование

- **Jest** 29.7.0 — фреймворк тестирования
- **Testing Library** 14.0.0 — утилиты для тестирования React
- **Cypress** — E2E тестирование
- **Storybook** 9.0.10 — разработка и тестирование компонентов

### DevOps и инструменты

- **Docker** — контейнеризация
- **GitHub Actions** — CI/CD
- **ESLint** — линтинг кода
- **Prettier** — форматирование кода
- **Husky** — Git hooks

## 🚀 Установка и запуск

### Предварительные требования

- **Node.js** 18.0.0 или выше
- **npm** или **yarn**
- **Git**

### Клонирование репозитория

```bash
git clone https://github.com/your-username/ai-agency-landing-page.git
cd ai-agency-landing-page
```

### Установка зависимостей

```bash
npm install
# или
yarn install
```

### Настройка переменных окружения

1. Скопируйте файл `.env.example` в `.env.local`:

```bash
cp .env.example .env.local
```

2. Заполните необходимые переменные окружения:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Contentful CMS
CONTENTFUL_SPACE_ID=your_contentful_space_id
CONTENTFUL_ACCESS_TOKEN=your_contentful_access_token

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_measurement_id

# Sentry
SENTRY_DSN=your_sentry_dsn
```

### Запуск в режиме разработки

```bash
npm run dev
# или
yarn dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

### Сборка для продакшена

```bash
npm run build
npm start
# или
yarn build
yarn start
```

## 📁 Структура проекта

```
├── .github/                 # GitHub workflows и шаблоны
│   ├── workflows/          # CI/CD пайплайны
│   ├── ISSUE_TEMPLATE/     # Шаблоны для issues
│   └── PULL_REQUEST_TEMPLATE.md
├── components/             # React компоненты
│   ├── ui/                # Базовые UI компоненты
│   ├── Recommendations/   # Система рекомендаций
│   ├── RAG/              # RAG система компоненты
│   └── Notification/     # Система уведомлений
├── pages/                 # Next.js страницы
│   ├── api/              # API маршруты
│   ├── admin/            # Административные страницы
│   ├── recommendations/  # Страницы рекомендаций
│   └── sign-in/          # Аутентификация
├── lib/                   # Библиотеки и утилиты
│   ├── mcp/              # MCP интеграция
│   ├── metrics/          # Система метрик
│   └── reporting/        # Система отчетов
├── hooks/                 # Кастомные React хуки
├── utils/                 # Утилитарные функции
├── types/                 # TypeScript типы
├── styles/                # Глобальные стили
├── middleware/            # Next.js middleware
├── docs/                  # Документация проекта
├── tests/                 # Тесты
├── cypress/               # E2E тесты
└── public/                # Статические файлы
    └── locales/          # Файлы переводов
```

## 🌍 Переменные окружения

### Обязательные переменные

| Переменная                          | Описание                   | Пример         |
| ----------------------------------- | -------------------------- | -------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Публичный ключ Clerk       | `pk_test_...`  |
| `CLERK_SECRET_KEY`                  | Секретный ключ Clerk       | `sk_test_...`  |
| `CONTENTFUL_SPACE_ID`               | ID пространства Contentful | `abc123def456` |
| `CONTENTFUL_ACCESS_TOKEN`           | Токен доступа Contentful   | `CFPAT-...`    |

### Опциональные переменные

| Переменная                      | Описание                      | По умолчанию |
| ------------------------------- | ----------------------------- | ------------ |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID           | -            |
| `SENTRY_DSN`                    | Sentry DSN для мониторинга    | -            |
| `MGX_API_KEY`                   | Ключ API MGX                  | -            |
| `RAG_ENABLED`                   | Включение RAG системы         | `false`      |
| `SECURITY_AUDIT_ENABLED`        | Включение аудита безопасности | `true`       |

## 🧪 Запуск тестов

### Unit тесты (Jest)

```bash
# Запуск всех тестов
npm test

# Запуск тестов в watch режиме
npm run test:watch

# Запуск тестов с покрытием
npm run test:coverage
```

### E2E тесты (Cypress)

```bash
# Запуск Cypress в интерактивном режиме
npm run cypress:open

# Запуск E2E тестов в headless режиме
npm run cypress:run

# Запуск компонентных тестов
npm run cypress:component
```

### Линтинг и проверка типов

```bash
# Проверка ESLint
npm run lint

# Исправление ESLint ошибок
npm run lint:fix

# Проверка TypeScript
npm run type-check

# Комплексная проверка
npm run check:all
```

## 🔧 Важные нюансы

### Производительность

- **SWC минификация отключена** из-за проблем с бинарными файлами на Windows
- **Dynamic imports** используются для компонентов с SSR проблемами
- **Image optimization** настроена для Contentful CDN
- **Bundle size monitoring** с помощью `.bundlesizerc.json`

### Безопасность

- **Middleware защита** всех административных маршрутов
- **CORS настройки** для API эндпоинтов
- **Rate limiting** для предотвращения злоупотреблений
- **Input validation** на всех формах
- **XSS protection** через Content Security Policy

### Интернационализация

- **Файлы переводов** в `public/locales/`
- **Fallback на английский** при отсутствии перевода
- **RTL поддержка** готова к реализации
- **Динамическое переключение** без перезагрузки

### Мониторинг

- **Sentry** для отслеживания ошибок в продакшене
- **Google Analytics** для веб-аналитики
- **Custom metrics** для бизнес-метрик
- **Performance monitoring** встроен в Sentry

## 📚 Документация

- [Архитектура проекта](./docs/ARCHITECTURE.md)
- [API документация](./API.md)
- [Руководство по развертыванию](./docs/DEPLOYMENT.md)
- [Стандарты кодирования](./docs/CODING_STANDARDS.md)
- [Безопасность](./SECURITY.md)
- [Интернационализация](./docs/LOCALIZATION.md)
- [Тестирование](./docs/API_TESTING.md)

## 🤝 Участие в разработке

Пожалуйста, ознакомьтесь с [CONTRIBUTING.md](./CONTRIBUTING.md) для получения информации о том, как внести свой вклад в проект.

## 📄 Лицензия

Этот проект лицензирован под лицензией MIT - см. файл [LICENSE](./LICENSE) для подробностей.

## 🆘 Поддержка

Если у вас возникли проблемы, пожалуйста:

1. Проверьте [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Поищите существующие [Issues](https://github.com/your-username/ai-agency-landing-page/issues)
3. Создайте новый Issue с подробным описанием проблемы

## 🔗 Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Clerk Documentation](https://clerk.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
