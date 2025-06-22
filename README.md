# 🚀 AI Agency Landing Page

_Современная целевая страница для AI-агентства с аутентификацией Clerk, многоязычной поддержкой и продвинутыми функциями безопасности._

[![GitHub license](https://img.shields.io/github/license/ludasiksuper555/rules)](https://github.com/ludasiksuper555/rules/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/ludasiksuper555/rules)](https://github.com/ludasiksuper555/rules/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/ludasiksuper555/rules)](https://github.com/ludasiksuper555/rules/issues)
[![GitHub forks](https://img.shields.io/github/forks/ludasiksuper555/rules)](https://github.com/ludasiksuper555/rules/network)
[![CI/CD](https://github.com/ludasiksuper555/rules/workflows/CI/badge.svg)](https://github.com/ludasiksuper555/rules/actions)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF)](https://clerk.com/)

## 📑 Содержание

- [📋 Описание](#-описание)
- [🚀 Быстрый старт](#-быстрый-старт)
- [✨ Основные функции](#-основные-функции)
- [🛠️ Технологический стек](#️-технологический-стек)
- [📦 Установка](#-установка)
- [🏃‍♂️ Запуск](#️-запуск)
- [📚 Документация](#-documentation)
- [🤝 Участие в разработке](#-участие-в-разработке)
- [📄 Лицензия](#-лицензия)
- [📞 Поддержка](#-поддержка)

## 📋 Описание

Современная целевая страница для AI-агентства, построенная с использованием Next.js 15, React 19 и TypeScript. Проект включает в себя аутентификацию через Clerk, многоязычную поддержку, адаптивный дизайн и продвинутые функции безопасности.

## 🚀 Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/ludasiksuper555/rules.git
cd rules

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env.local
# Отредактируйте .env.local с вашими ключами

# Запустить в режиме разработки
npm run dev

# Открыть http://localhost:3000
```

> 📖 **Подробная инструкция**: См. [Руководство по установке](#installation) ниже

## ✨ Основные функции

- **Аутентификация пользователей** — безопасная система входа и регистрации через Clerk с поддержкой двухфакторной аутентификации
- **Многоязычность** — полная поддержка нескольких языков (украинский, английский, польский, немецкий)
- **Адаптивный дизайн** — оптимизация для всех устройств с использованием Tailwind CSS
- **Защищенные маршруты** — доступ к панели управления и профилю только для авторизованных пользователей
- **Оптимизированная производительность** — быстрая загрузка и отзывчивый интерфейс
- **Анимации** — плавные переходы с использованием Framer Motion
- **Мониторинг активности пользователей** — отслеживание действий пользователей с соблюдением требований безопасности
- **Интеграция с MGX** — поддержка интеграции с внешними сервисами
- **Панель безопасности** — инструменты для мониторинга и управления безопасностью

## 🛠️ Технологический стек

### 🎨 Frontend

- ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) **React 19** - Библиотека для создания пользовательских интерфейсов
- ![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white) **Next.js 15** - React фреймворк для production
- ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) **TypeScript** - Типизированный JavaScript
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-38B2AC?logo=tailwind-css&logoColor=white) **Tailwind CSS** - Utility-first CSS фреймворк
- ![Framer Motion](https://img.shields.io/badge/Framer%20Motion-11-0055FF?logo=framer&logoColor=white) **Framer Motion** - Библиотека анимаций

### 🔐 Аутентификация и безопасность

- ![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white) **Clerk** - Современная аутентификация и управление пользователями
- ![ISO 27001](https://img.shields.io/badge/ISO%2027001-Compliant-green) **ISO 27001 Compliance** - Соответствие стандартам безопасности

### 🌍 Интернационализация

- ![i18next](https://img.shields.io/badge/next--i18next-15-26A69A?logo=i18next&logoColor=white) **next-i18next** - Многоязычная поддержка
- **Поддерживаемые языки**: 🇷🇺 Русский, 🇺🇸 Английский, 🇪🇸 Испанский, 🇫🇷 Французский

### 🧪 Тестирование и качество кода

- ![Jest](https://img.shields.io/badge/Jest-29-C21325?logo=jest&logoColor=white) **Jest** - Фреймворк для тестирования
- ![ESLint](https://img.shields.io/badge/ESLint-8-4B32C3?logo=eslint&logoColor=white) **ESLint** - Линтер для JavaScript/TypeScript
- ![Prettier](https://img.shields.io/badge/Prettier-3-F7B93E?logo=prettier&logoColor=white) **Prettier** - Форматтер кода
- ![Testing Library](https://img.shields.io/badge/Testing%20Library-React-E33332?logo=testing-library&logoColor=white) **Testing Library** - Утилиты для тестирования

### 🚀 DevOps и мониторинг

- ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI/CD-2088FF?logo=github-actions&logoColor=white) **GitHub Actions** - CI/CD пайплайны
- ![Docker](https://img.shields.io/badge/Docker-Containerization-2496ED?logo=docker&logoColor=white) **Docker** - Контейнеризация
- ![Sentry](https://img.shields.io/badge/Sentry-Error%20Monitoring-362D59?logo=sentry&logoColor=white) **Sentry** - Мониторинг ошибок
- ![Google Analytics](https://img.shields.io/badge/Google%20Analytics-4-E37400?logo=google-analytics&logoColor=white) **Google Analytics 4** - Веб-аналитика

### 📊 CMS и API

- ![Contentful](https://img.shields.io/badge/Contentful-Headless%20CMS-2478CC?logo=contentful&logoColor=white) **Contentful** - Headless CMS
- ![React Query](https://img.shields.io/badge/React%20Query-5-FF4154?logo=react-query&logoColor=white) **React Query** - Управление состоянием сервера
- ![OpenAPI](https://img.shields.io/badge/OpenAPI-Swagger-85EA2D?logo=swagger&logoColor=white) **OpenAPI/Swagger** - Документация API

## 📦 Установка

### Предварительные требования

- ![Node.js](https://img.shields.io/badge/Node.js-18.17.0+-339933?logo=node.js&logoColor=white) **Node.js 18.17.0** или выше
- ![npm](https://img.shields.io/badge/npm-9+-CB3837?logo=npm&logoColor=white) **npm** или ![yarn](https://img.shields.io/badge/yarn-1.22+-2C8EBB?logo=yarn&logoColor=white) **yarn**
- ![Git](https://img.shields.io/badge/Git-Latest-F05032?logo=git&logoColor=white) **Git**

### Пошаговая установка

1. **Клонирование репозитория**

   ```bash
   git clone https://github.com/ludasiksuper555/rules.git
   cd rules
   ```

2. **Установка зависимостей**

   ```bash
   npm install
   # или
   yarn install
   ```

3. **Настройка переменных окружения**
   ```bash
   cp .env.example .env.local
   ```

### 🔧 Переменные окружения

Создайте файл `.env.local` и заполните следующие переменные:

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

# Безопасность
SECURITY_AUDIT_ENABLED=true
USER_ACTIVITY_TRACKING_ENABLED=true

# MGX Интеграция
MGX_API_KEY=your_mgx_api_key
MGX_ENDPOINT=https://api.mgx.com/v1

# API Keys
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_SECRET_KEY=your_secret_key
```

> 🔐 **Безопасность**: Никогда не коммитьте файл `.env.local` в репозиторий!

## 🏃‍♂️ Запуск

### Режим разработки

```bash
npm run dev
# или
yarn dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Продакшн сборка

```bash
# Создание оптимизированной сборки
npm run build

# Запуск продакшн сервера
npm run start
```

### Доступные команды

| Команда                 | Описание                          |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Запуск в режиме разработки        |
| `npm run build`         | Создание продакшн сборки          |
| `npm run start`         | Запуск продакшн сервера           |
| `npm run lint`          | Проверка кода линтером            |
| `npm run lint:fix`      | Исправление ошибок линтера        |
| `npm run format`        | Форматирование кода Prettier      |
| `npm run test`          | Запуск тестов                     |
| `npm run test:watch`    | Запуск тестов в режиме наблюдения |
| `npm run test:coverage` | Запуск тестов с покрытием         |
| `npm run type-check`    | Проверка типов TypeScript         |
| `npm run analyze`       | Анализ размера бандла             |
| `npm run lighthouse`    | Аудит производительности          |
| `npm run docker:build`  | Сборка Docker образа              |
| `npm run docker:run`    | Запуск в Docker контейнере        |

### 🐳 Запуск в Docker

```bash
# Сборка образа
docker build -t ai-agency-landing .

# Запуск контейнера
docker run -p 3000:3000 --env-file .env.local ai-agency-landing

# Или используйте docker-compose
docker-compose up --build
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
│   ├── LanguageSwitcher.tsx # Переключатель языков
│   ├── SecurityDashboard.tsx # Панель безопасности
│   ├── SEO.tsx            # Компонент для SEO-оптимизации
│   ├── TwoFactorAuth.tsx  # Двухфакторная аутентификация
│   ├── UserActivityDashboard.tsx # Мониторинг активности
│   └── ...                # Другие компоненты
├── docs/                  # Документация
│   ├── API_REFERENCE.md   # Документация по API
│   ├── LOCALIZATION.md    # Руководство по локализации
│   ├── ISO27001_COMPLIANCE_RECOMMENDATIONS.md # ISO 27001
│   └── ...                # Другая документация
├── lib/                   # Библиотеки и утилиты
│   ├── contentful.ts      # Клиент Contentful CMS
│   ├── reactQuery.ts      # Настройка React Query
│   ├── securityEventLogger.ts # Логирование событий безопасности
│   ├── sentry.ts          # Настройка Sentry
│   └── userActivityTracker.ts # Отслеживание активности
├── middleware/            # Middleware
│   ├── accessControl.ts   # Контроль доступа
│   ├── api.ts             # API middleware
│   ├── readOnlyAccess.ts  # Доступ только для чтения
│   └── twoFactorAuth.ts   # Двухфакторная аутентификация
├── pages/                 # Страницы Next.js
│   ├── _app.tsx           # Главный компонент
│   ├── api/               # API-эндпоинты
│   ├── admin/             # Административные страницы
│   │   └── security-dashboard.tsx # Панель безопасности
│   ├── dashboard.tsx      # Панель управления
│   ├── index.tsx          # Главная страница
│   └── ...                # Другие страницы
├── public/                # Публичные файлы
│   ├── locales/           # Файлы локализации
│   │   ├── uk/            # Украинский язык
│   │   ├── en/            # Английский язык
│   │   ├── de/            # Немецкий язык
│   │   └── pl/            # Польский язык
├── scripts/               # Скрипты
│   ├── generate-iso27001-compliance-report.js # Отчет о соответствии
│   └── ...                # Другие скрипты
├── styles/                # Стили
├── types/                 # TypeScript типы
├── utils/                 # Утилиты
├── .github/               # GitHub конфигурация
│   ├── workflows/         # GitHub Actions
│   │   ├── ci.yml         # Непрерывная интеграция
│   │   └── deploy.yml     # Деплой
│   └── CODEOWNERS         # Владельцы кода
├── Dockerfile             # Конфигурация Docker
├── docker-compose.yml     # Конфигурация Docker Compose
├── middleware.ts          # Middleware для защиты маршрутов
├── next-i18next.config.js # Конфигурация локализации
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

# Запуск интеграционных тестов
npm run test:integration

# Запуск проверок безопасности
npm run security:audit
```

## 🌐 Многоязычность

Проект поддерживает следующие языки:

- 🇺🇦 Украинский (uk) - основной язык
- 🇬🇧 Английский (en)
- 🇩🇪 Немецкий (de)
- 🇵🇱 Польский (pl)

Для добавления нового языка:

1. Добавьте код языка в `next-i18next.config.js`
2. Создайте соответствующую директорию в `public/locales/`
3. Скопируйте и переведите файлы из существующего языка
4. Обновите компонент `LanguageSwitcher.tsx`

Подробное руководство по локализации доступно в [LOCALIZATION.md](./docs/LOCALIZATION.md).

## 🔒 Безопасность

Проект соответствует стандарту ISO 27001 и включает:

- Двухфакторную аутентификацию
- Контроль доступа на основе ролей
- Мониторинг активности пользователей
- Логирование событий безопасности
- Защиту от CSRF и XSS атак
- Правила защиты веток GitHub

Подробная информация о безопасности доступна в [SECURITY.md](./SECURITY.md) и [SECURITY_DISCLOSURE.md](./SECURITY_DISCLOSURE.md).

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
8. **Безопасность** — внедрены механизмы в соответствии с ISO 27001
9. **Многоязычность** — реализована поддержка нескольких языков с помощью next-i18next

## 📚 Документация

### 📖 Основная документация

- [📋 Руководство по участию](CONTRIBUTING.md) - Как внести вклад в проект
- [🚀 Руководство по развертыванию](DEPLOYMENT.md) - Инструкции по развертыванию
- [🔧 API Документация](API.md) - Описание API эндпоинтов
- [❓ Поддержка](SUPPORT.md) - Получение помощи

### 📊 Планирование проекта

- [🗺️ Дорожная карта](ROADMAP.md) - Планы развития проекта
- [📋 Детальная дорожная карта](ROADMAP_DETAILED.md) - Подробные планы и метрики
- [📝 Журнал изменений](CHANGELOG.md) - История версий

### 👥 Сообщество

- [💰 Спонсоры](SPONSORS.md) - Наши спонсоры и партнеры
- [👨‍💻 Мейнтейнеры](MAINTAINERS.md) - Команда разработчиков
- [📜 Кодекс поведения](CODE_OF_CONDUCT.md) - Правила сообщества
- [🐛 Сообщить об ошибке](https://github.com/ludasiksuper555/rules/issues/new?template=bug_report.yml)
- [💡 Предложить функцию](https://github.com/ludasiksuper555/rules/issues/new?template=feature_request.yml)
- [💬 GitHub Discussions](https://github.com/ludasiksuper555/rules/discussions) - Обсуждения

## 🤝 Участие в разработке

Мы приветствуем вклад от сообщества! Вот как вы можете помочь:

### 🚀 Быстрый старт для разработчиков

1. **Fork** репозитория
2. **Clone** вашего fork
3. **Создайте** ветку для функции: `git checkout -b feature/amazing-feature`
4. **Внесите** изменения и **протестируйте** их
5. **Commit** изменения: `git commit -m 'Add amazing feature'`
6. **Push** в ветку: `git push origin feature/amazing-feature`
7. **Создайте** Pull Request

### 📋 Типы вкладов

- 🐛 **Исправление ошибок** - Помогите нам исправить баги
- ✨ **Новые функции** - Предложите и реализуйте новые возможности
- 📚 **Документация** - Улучшите документацию
- 🧪 **Тестирование** - Добавьте или улучшите тесты
- 🎨 **UI/UX** - Улучшите дизайн и пользовательский опыт
- 🌍 **Переводы** - Помогите с локализацией

### 📝 Правила

- Следуйте [Кодексу поведения](CODE_OF_CONDUCT.md)
- Прочитайте [Руководство по участию](CONTRIBUTING.md)
- Убедитесь, что все тесты проходят
- Добавьте тесты для новых функций
- Обновите документацию при необходимости

## 📄 Лицензия

Этот проект лицензирован под лицензией MIT. Подробности см. в файле [LICENSE](LICENSE).

```
MIT License

Copyright (c) 2024 AI Agency Landing Page

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Поддержка

Если у вас есть вопросы или нужна помощь:

### 💬 Каналы поддержки

- 📧 **Email**: [support@ai-agency.com](mailto:support@ai-agency.com)
- 💬 **GitHub Discussions**: [Обсуждения](https://github.com/ludasiksuper555/rules/discussions)
- 🐛 **Баг-репорты**: [Создать issue](https://github.com/ludasiksuper555/rules/issues/new?template=bug_report.yml)
- 💡 **Предложения**: [Запросить функцию](https://github.com/ludasiksuper555/rules/issues/new?template=feature_request.yml)
- 📚 **Документация**: [Руководство поддержки](SUPPORT.md)

### ⚡ Быстрые ссылки

- [🚀 Быстрый старт](#-быстрый-старт)
- [📦 Установка](#-установка)
- [🛠️ Технологический стек](#️-технологический-стек)
- [🤝 Участие в разработке](#-участие-в-разработке)

---

<div align="center">

**Сделано с ❤️ командой AI Agency**

[![GitHub stars](https://img.shields.io/github/stars/ludasiksuper555/rules?style=social)](https://github.com/ludasiksuper555/rules/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/ludasiksuper555/rules?style=social)](https://github.com/ludasiksuper555/rules/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/ludasiksuper555/rules?style=social)](https://github.com/ludasiksuper555/rules/watchers)

[⭐ Поставьте звезду](https://github.com/ludasiksuper555/rules) • [🐛 Сообщить об ошибке](https://github.com/ludasiksuper555/rules/issues) • [💡 Запросить функцию](https://github.com/ludasiksuper555/rules/issues/new?template=feature_request.yml)

</div>
