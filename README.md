# 🚀 AI Agency Landing Page

> Современная целевая страница для AI-агентства, построенная с использованием Next.js 15, React 19 и TypeScript

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple?style=for-the-badge)](https://web.dev/progressive-web-apps/)

## ✨ Ключевые особенности

### 🎯 Основной функционал

- **🔐 Аутентификация Clerk** - Безопасная система входа и регистрации
- **🌍 Мультиязычность** - Поддержка нескольких языков с i18n
- **📱 Адаптивный дизайн** - Оптимизация для всех устройств
- **⚡ PWA поддержка** - Прогрессивное веб-приложение
- **🛡️ Мониторинг безопасности** - Автоматические проверки безопасности
- **🎨 Современный UI/UX** - Красивый интерфейс с анимациями

### 🧪 Тестирование и качество

- **🔍 Комплексное тестирование** - Jest, React Testing Library, PWA тесты
- **📊 Lighthouse интеграция** - Автоматические проверки производительности
- **🔧 Автоматические исправления** - Скрипты для улучшения качества кода
- **📈 Мониторинг метрик** - Отслеживание Core Web Vitals
- **🚀 CI/CD готовность** - Полная автоматизация развертывания

## 🛠️ Технологический стек

### Frontend

- **Next.js 15** - React фреймворк с App Router
- **React 19** - Библиотека для создания пользовательских интерфейсов
- **TypeScript** - Типизированный JavaScript
- **Tailwind CSS** - Utility-first CSS фреймворк
- **Framer Motion** - Библиотека анимаций
- **Lucide React** - Современные иконки

### Аутентификация и безопасность

- **Clerk** - Полнофункциональная система аутентификации
- **CSP Headers** - Content Security Policy
- **HTTPS Redirect** - Принудительное использование HTTPS
- **Security Headers** - Дополнительные заголовки безопасности

### Интернационализация

- **next-intl** - Мультиязычная поддержка
- **Динамическая локализация** - Переключение языков на лету
- **SEO оптимизация** - Мультиязычные мета-теги

### Тестирование

- **Jest** - JavaScript тестовый фреймворк
- **React Testing Library** - Тестирование React компонентов
- **Playwright** - E2E тестирование
- **Lighthouse CI** - Автоматические проверки производительности
- **PWA Testing Suite** - Специализированные PWA тесты

### DevOps и CI/CD

- **GitHub Actions** - Автоматизация CI/CD
- **Husky** - Git hooks
- **lint-staged** - Проверка staged файлов
- **ESLint + Prettier** - Линтинг и форматирование
- **Automated deployment** - Автоматическое развертывание

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm или yarn
- Git

### Установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd ai-agency-landing

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Отредактируйте .env.local с вашими настройками

# Запуск в режиме разработки
npm run dev
```

### Настройка Clerk

1. Создайте аккаунт на [Clerk.dev](https://clerk.dev)
2. Создайте новое приложение
3. Скопируйте ключи в `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## 📜 Доступные скрипты

### Разработка

```bash
npm run dev          # Запуск сервера разработки
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен сервера
npm run preview      # Предварительный просмотр сборки
```

### Качество кода

```bash
npm run quality:check    # Полная проверка качества кода
npm run quality:fix      # Автоматическое исправление проблем
npm run quality:full     # Исправление + проверка

npm run lint            # ESLint проверка
npm run lint:fix        # ESLint исправления
npm run format          # Prettier форматирование
npm run type-check      # TypeScript проверка типов
```

### Тестирование

```bash
npm run test            # Запуск всех тестов
npm run test:watch      # Тесты в режиме наблюдения
npm run test:coverage   # Тесты с покрытием
npm run test:ci         # Тесты для CI

# PWA тестирование
npm run test:pwa        # PWA тесты с UI
npm run test:pwa:headless # PWA тесты без UI
npm run test:pwa:report   # Генерация отчета PWA тестов

# E2E тестирование
npm run test:e2e        # Playwright E2E тесты
npm run test:e2e:ui     # E2E тесты с UI
```

### Производительность

```bash
npm run lighthouse      # Lighthouse аудит
npm run lighthouse:ci   # Lighthouse для CI
npm run perf:analyze    # Анализ производительности
```

### Анализ и документация

```bash
npm run analyze         # Анализ размера бандла
npm run storybook       # Запуск Storybook
npm run build-storybook # Сборка Storybook
```

## 🧪 Тестирование

### Структура тестов

```
tests/
├── __tests__/          # Unit тесты
├── e2e/               # E2E тесты
├── pwa/               # PWA тесты
│   ├── installation.test.js
│   ├── offline.test.js
│   ├── performance.test.js
│   └── security.test.js
└── utils/             # Тестовые утилиты
```

### PWA тестирование

Проект включает комплексную систему тестирования PWA:

- **Установка PWA** - Проверка возможности установки
- **Офлайн функциональность** - Работа без интернета
- **Service Worker** - Корректная работа SW
- **Манифест** - Валидация web app manifest
- **Производительность** - Lighthouse метрики
- **Безопасность** - HTTPS и security headers

### Запуск тестов

```bash
# Все PWA тесты
npm run test:pwa

# Конкретный тест
npx playwright test tests/pwa/installation.test.js

# С отчетом
npm run test:pwa:report
```

## 🔧 Конфигурация

### ESLint

Проект использует расширенную конфигурацию ESLint:

- Next.js правила
- TypeScript поддержка
- React hooks правила
- Accessibility проверки
- Import сортировка

### Prettier

Автоматическое форматирование кода с настройками:

- 2 пробела для отступов
- Одинарные кавычки
- Точка с запятой
- Trailing commas

### Husky + lint-staged

Автоматические проверки перед коммитом:

- TypeScript проверка
- ESLint проверка
- Prettier форматирование
- Тесты
- PWA валидация

## 📊 Мониторинг производительности

### Lighthouse CI

Автоматические проверки:

- Performance: >90
- Accessibility: >90
- Best Practices: >90
- SEO: >90
- PWA: >90

### Core Web Vitals

Отслеживание ключевых метрик:

- **LCP** (Largest Contentful Paint) < 2.5s
- **FID** (First Input Delay) < 100ms
- **CLS** (Cumulative Layout Shift) < 0.1

## 🚀 Развертывание

### Vercel (рекомендуется)

```bash
# Установка Vercel CLI
npm i -g vercel

# Развертывание
vercel
```

### Docker

```bash
# Сборка образа
docker build -t ai-agency-landing .

# Запуск контейнера
docker run -p 3000:3000 ai-agency-landing
```

### Переменные окружения для продакшена

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Site
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Analytics (опционально)
NEXT_PUBLIC_GA_ID=
```

## 🔒 Безопасность

### Реализованные меры

- **CSP Headers** - Content Security Policy
- **HSTS** - HTTP Strict Transport Security
- **X-Frame-Options** - Защита от clickjacking
- **X-Content-Type-Options** - MIME type sniffing защита
- **Referrer Policy** - Контроль referrer информации
- **Permissions Policy** - Ограничение API доступа

### Регулярные проверки

```bash
# Аудит безопасности
npm audit

# Проверка зависимостей
npm run security:check

# Lighthouse security audit
npm run lighthouse
```

## 📈 Оптимизация производительности

### Реализованные оптимизации

- **Image Optimization** - Next.js Image компонент
- **Code Splitting** - Автоматическое разделение кода
- **Tree Shaking** - Удаление неиспользуемого кода
- **Compression** - Gzip/Brotli сжатие
- **Caching** - Оптимальные заголовки кеширования
- **Preloading** - Предзагрузка критических ресурсов

### Мониторинг

- **Bundle Analyzer** - Анализ размера бандла
- **Lighthouse CI** - Автоматические проверки
- **Core Web Vitals** - Отслеживание UX метрик

## 🤝 Участие в разработке

### Workflow

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Стандарты кода

- Используйте TypeScript для всех новых файлов
- Следуйте ESLint правилам
- Добавляйте тесты для новой функциональности
- Обновляйте документацию при необходимости

### Commit Convention

```
feat: добавить новую функцию
fix: исправить баг
docs: обновить документацию
style: изменения форматирования
refactor: рефакторинг кода
test: добавить тесты
chore: обновить зависимости
```

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) - За отличный React фреймворк
- [Clerk](https://clerk.dev/) - За простую аутентификацию
- [Tailwind CSS](https://tailwindcss.com/) - За utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - За плавные анимации
- [Vercel](https://vercel.com/) - За отличный хостинг

---

<div align="center">
  <p>Сделано с ❤️ для современного веба</p>
  <p>
    <a href="#">🌟 Поставьте звезду</a> |
    <a href="#">🐛 Сообщить о баге</a> |
    <a href="#">💡 Предложить улучшение</a>
  </p>
</div>
