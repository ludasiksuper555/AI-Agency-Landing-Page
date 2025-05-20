# AI Agency Landing Page

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Clerk](https://img.shields.io/badge/Clerk-6.19.4-purple)

## 📋 Описание

Современный лендинг для AI Agency с интегрированной системой аутентификации Clerk. Проект разработан с использованием Next.js, React, TypeScript и Tailwind CSS, предоставляя безопасную и удобную платформу для взаимодействия с клиентами.

## 🔗 Демо

- **Живое демо**: [https://ludasiksuper555.github.io/AI-Agency-Landing-Page](https://ludasiksuper555.github.io/AI-Agency-Landing-Page)
- **Репозиторий**: [GitHub](https://github.com/ludasiksuper555/AI-Agency-Landing-Page)

## 📸 Скриншоты

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Главная+страница" alt="Главная страница" width="800"/>
  <p><em>Главная страница с Hero секцией</em></p>
  
  <img src="https://via.placeholder.com/800x450?text=Панель+управления" alt="Панель управления" width="800"/>
  <p><em>Защищенная панель управления</em></p>
  
  <img src="https://via.placeholder.com/800x450?text=Мобильная+версия" alt="Мобильная версия" width="400"/>
  <p><em>Адаптивный дизайн для мобильных устройств</em></p>
</div>

## ✨ Основные функции

- **Современный адаптивный дизайн** - оптимизирован для всех устройств
- **Аутентификация через Clerk** - безопасная регистрация и вход пользователей
- **Украинская локализация** - полная поддержка украинского языка
- **Защищенные разделы** - безопасный доступ к панели управления и профилю
- **Компоненты лендинга** - Hero, Services, Team, Contact и другие секции
- **Оптимизированная производительность** - быстрая загрузка и отзывчивый интерфейс

## 🛠️ Технологический стек

- **Frontend**: Next.js, React, TypeScript
- **Стилизация**: Tailwind CSS
- **Аутентификация**: Clerk
- **Анимации**: Framer Motion
- **Сборка**: npm

## 🚀 Установка и запуск

### Предварительные требования

- Node.js (версия 18.x или выше)
- npm или yarn
- Git

### Установка

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/ludasiksuper555/AI-Agency-Landing-Page.git
   cd AI-Agency-Landing-Page
   ```

2. Установите зависимости:
   ```bash
   npm install
   # или
   yarn install
   ```

3. Создайте файл `.env.local` в корне проекта и добавьте следующие переменные окружения:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

### Запуск в режиме разработки

```bash
npm run dev
# или
yarn dev
```

Откройте [http://localhost:3000](http://localhost:3000) в вашем браузере.

### Сборка для продакшена

```bash
npm run build
npm run start
# или
yarn build
yarn start
```

### Детальная документация по сборке

#### Системные требования

- **Операционная система**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Процессор**: Dual-core 2 ГГц или выше
- **Оперативная память**: Минимум 4 ГБ (рекомендуется 8 ГБ)
- **Дисковое пространство**: Минимум 1 ГБ свободного места
- **Node.js**: Версия 18.x или выше (рекомендуется LTS)
- **npm**: Версия 8.x или выше

#### Переменные окружения

##### Обязательные переменные

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

##### Опциональные переменные

```
NEXT_PUBLIC_API_URL=https://your-api-url.com  # URL вашего API (если используется)
NEXT_PUBLIC_SITE_URL=https://your-site-url.com  # URL вашего сайта
NODE_ENV=development|production  # Окружение (по умолчанию: development)
```

#### Скрипты сборки

| Команда | Описание |
|---------|----------|
| `npm run dev` | Запуск в режиме разработки с горячей перезагрузкой |
| `npm run build` | Сборка оптимизированной версии для продакшена |
| `npm run start` | Запуск собранного приложения |
| `npm run lint` | Проверка кода с помощью ESLint |
| `npm run test` | Запуск тестов |
| `npm run analyze` | Анализ размера бандла |

#### Процесс сборки

1. **Разработка**:
   - Запустите `npm run dev` для локальной разработки
   - Доступ по адресу: http://localhost:3000
   - Поддерживает горячую перезагрузку

2. **Тестирование**:
   - Запустите `npm run test` для выполнения тестов
   - Используйте `npm run lint` для проверки качества кода

3. **Продакшн-сборка**:
   - Выполните `npm run build` для создания оптимизированной сборки
   - Результат сохраняется в директории `.next`
   - Запустите `npm run start` для запуска продакшн-версии

4. **Анализ бандла**:
   - Выполните `npm run analyze` для анализа размера бандла
   - Помогает оптимизировать размер приложения

#### Оптимизация производительности

- **Изображения**: Используйте компонент `next/image` для автоматической оптимизации
- **Шрифты**: Применяйте локальные шрифты через `next/font`
- **CSS**: Минимизируйте неиспользуемые стили с помощью PurgeCSS
- **JavaScript**: Включите разделение кода с помощью динамического импорта

#### Развертывание

##### Vercel (рекомендуется)

```bash
npm install -g vercel
vercel login
vercel
```

##### Netlify

```bash
npm install -g netlify-cli
netlify login
netlify deploy
```

##### Docker

```bash
# Сборка образа
docker build -t ai-agency-landing .

# Запуск контейнера
docker run -p 3000:3000 ai-agency-landing
```

#### Устранение неполадок

- **Проблема**: Ошибка при установке зависимостей
  **Решение**: Удалите `node_modules` и `package-lock.json`, затем выполните `npm install`

- **Проблема**: Ошибки сборки с Clerk
  **Решение**: Проверьте правильность ключей Clerk в `.env.local`

- **Проблема**: Медленная сборка
  **Решение**: Увеличьте объем памяти для Node.js: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

## 📖 Примеры использования

### Интеграция с Clerk

```tsx
// pages/_app.tsx
import { ClerkProvider } from '../components/ClerkProvider';

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default MyApp;
```

### Создание защищенной страницы

```tsx
// pages/dashboard.tsx
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Dashboard = () => {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);
  
  if (!isLoaded || !userId) {
    return <div>Загрузка...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Панель управления</h1>
      {/* Содержимое панели управления */}
    </div>
  );
};

export default Dashboard;
```

### Использование компонентов

```tsx
// pages/index.tsx
import Hero from '../components/Hero';
import Services from '../components/Services';
import Team from '../components/Team';
import Contact from '../components/Contact';

const Home = () => {
  return (
    <div>
      <Hero />
      <Services />
      <Team />
      <Contact />
    </div>
  );
};

export default Home;
```

## 📁 Структура проекта

```
├── components/         # React компоненты
│   ├── ClerkProvider.tsx  # Провайдер аутентификации
│   ├── Contact.tsx     # Секция контактов
│   ├── FAQ.tsx         # Часто задаваемые вопросы
│   ├── Features.tsx    # Особенности сервиса
│   ├── Footer.tsx      # Подвал сайта
│   ├── Header.tsx      # Шапка сайта
│   ├── Hero.tsx        # Главная секция
│   ├── Pricing.tsx     # Тарифы
│   ├── Services.tsx    # Услуги
│   ├── Team.tsx        # Команда
│   └── Testimonials.tsx # Отзывы
├── data/               # Данные
│   └── teamData.ts     # Информация о команде
├── pages/              # Страницы Next.js
│   ├── _app.tsx        # Корневой компонент
│   ├── dashboard.tsx   # Панель управления (защищенная)
│   ├── index.tsx       # Главная страница
│   ├── profile.tsx     # Профиль пользователя (защищенная)
│   └── sign-in/        # Страницы аутентификации
├── public/             # Статические файлы
├── styles/             # Стили
│   └── globals.css     # Глобальные стили
├── types/              # TypeScript типы
└── utils/              # Утилиты
```

## 📄 Документация

Дополнительная документация доступна в директории `/docs`:

- [Руководство по развертыванию](./docs/DEPLOYMENT.md)
- [API документация](./API.md)
- [Руководство по стилю кода](./STYLE_GUIDE.md)
- [Устранение неполадок](./TROUBLESHOOTING.md)
- [Дорожная карта](./ROADMAP.md)

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, ознакомьтесь с [руководством по внесению вклада](./CONTRIBUTING.md) перед началом работы.

## 📝 Лицензия

Этот проект распространяется под лицензией MIT. Смотрите файл [LICENSE](./LICENSE) для получения дополнительной информации.

## 📞 Контакты

Если у вас есть вопросы или предложения, пожалуйста, создайте [issue](https://github.com/your-username/ai-agency-landing-page/issues) или свяжитесь с нами по электронной почте: support@example.com