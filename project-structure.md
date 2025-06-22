# Структура проекта AI Agency Landing Page

## 📁 Архитектура проекта

```
├── 📁 components/          # React компоненты
│   ├── ui/                # Базовые UI компоненты
│   ├── forms/             # Формы
│   └── layout/            # Компоненты макета
├── 📁 pages/              # Next.js страницы
│   ├── api/               # API маршруты
│   └── _app.tsx           # Главный компонент приложения
├── 📁 lib/                # Библиотеки и утилиты
│   ├── api/               # API клиенты
│   ├── auth/              # Аутентификация
│   ├── config/            # Конфигурация
│   ├── monitoring/        # Мониторинг и аналитика
│   ├── security/          # Безопасность
│   └── utils/             # Вспомогательные функции
├── 📁 styles/             # Стили
├── 📁 public/             # Статические файлы
├── 📁 types/              # TypeScript типы
├── 📁 utils/              # Утилиты
├── 📁 hooks/              # React хуки
├── 📁 contexts/           # React контексты
├── 📁 constants/          # Константы
├── 📁 scripts/            # Скрипты автоматизации
└── 📁 docs/               # Документация
```

## 🛠️ Технологический стек

### Frontend

- **React 19** - UI библиотека
- **Next.js 15** - Full-stack фреймворк
- **TypeScript** - Типизация
- **Tailwind CSS** - Стилизация
- **Framer Motion** - Анимации

### Backend & API

- **Next.js API Routes** - Серверная логика
- **Clerk** - Аутентификация
- **Contentful** - CMS
- **React Query** - Управление состоянием сервера

### Инструменты разработки

- **ESLint** - Линтинг
- **Prettier** - Форматирование кода
- **Jest** - Тестирование
- **Storybook** - Разработка компонентов
- **GitHub Actions** - CI/CD

### Мониторинг и аналитика

- **Sentry** - Отслеживание ошибок
- **Google Analytics 4** - Веб-аналитика
- **Custom Monitoring** - Системный мониторинг

## 📋 Стандарты кодирования

### TypeScript

- Строгая типизация (`strict: true`)
- Избегание `any` типов
- Использование интерфейсов для объектов
- Экспорт типов отдельно от значений

### React

- Функциональные компоненты с хуками
- Мемоизация с `React.memo`, `useMemo`, `useCallback`
- Кастомные хуки для переиспользуемой логики
- Prop drilling избегается через контексты

### Стилизация

- Tailwind CSS классы
- Responsive design (mobile-first)
- Темная/светлая тема
- Accessibility (a11y) стандарты

### Файловая структура

- Kebab-case для файлов и папок
- PascalCase для компонентов
- camelCase для функций и переменных
- Индексные файлы для экспорта

## 🔧 Скрипты автоматизации

### Доступные команды

```bash
# Разработка
npm run dev              # Запуск dev сервера
npm run build            # Сборка продакшн
npm run start            # Запуск продакшн сервера

# Качество кода
npm run lint             # Проверка ESLint
npm run lint:fix         # Исправление ESLint
npm run type-check       # Проверка TypeScript
npm run format           # Форматирование Prettier

# Тестирование
npm run test             # Запуск тестов
npm run test:watch       # Тесты в watch режиме
npm run test:coverage    # Покрытие тестами

# Storybook
npm run storybook        # Запуск Storybook
npm run build-storybook  # Сборка Storybook

# Автоматизация
node scripts/fix-typescript-issues.js  # Исправление TS ошибок
```

## 🚀 Рекомендации по развитию

### Краткосрочные задачи

1. ✅ Исправление TypeScript ошибок
2. ✅ Настройка автоматического форматирования
3. 🔄 Улучшение покрытия тестами
4. 🔄 Оптимизация производительности

### Среднесрочные задачи

1. 📋 Внедрение E2E тестирования (Cypress/Playwright)
2. 📋 Настройка автоматического деплоя
3. 📋 Улучшение SEO оптимизации
4. 📋 Добавление PWA функций

### Долгосрочные задачи

1. 📋 Микрофронтенд архитектура
2. 📋 Serverless функции
3. 📋 Advanced analytics
4. 📋 AI/ML интеграции

## 📊 Метрики качества

### Производительность

- Lighthouse Score > 90
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1

### Качество кода

- TypeScript строгость: 100%
- ESLint ошибки: 0
- Test coverage > 80%
- Bundle size < 500KB

### Безопасность

- HTTPS везде
- CSP заголовки
- XSS защита
- CSRF токены

## 🔗 Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion)
