# Налаштування інтеграції між Trae, GitHub, браузером та MGX

## Вступ

Цей документ містить покрокові інструкції з налаштування інтеграції між Trae, GitHub репозиторієм, браузером та MGX (MetaGPT X). Правильне налаштування забезпечить ефективну взаємодію між усіма компонентами системи.

## Передумови

Перед початком налаштування переконайтеся, що у вас є:

1. Обліковий запис MGX з доступом до API
2. Обліковий запис GitHub з правами на цільовий репозиторій
3. Встановлений Node.js версії 14.0.0 або вище
4. Встановлений npm версії 6.0.0 або вище

## Крок 1: Налаштування MGX інтеграції

### Отримання API ключа MGX

1. Увійдіть до свого облікового запису MGX на сайті [mgx.dev](https://mgx.dev)
2. Перейдіть до розділу "Налаштування" > "API ключі"
3. Створіть новий API ключ з правами на читання та запис
4. Скопіюйте згенерований ключ та збережіть його в безпечному місці

### Налаштування MGX в Trae

1. Створіть файл `.env.local` в кореневій директорії проекту
2. Додайте наступний рядок, замінивши `YOUR_MGX_API_KEY` на ваш API ключ:
   ```
   MGX_API_KEY=YOUR_MGX_API_KEY
   ```
3. Збережіть файл

## Крок 2: Налаштування GitHub інтеграції

### Створення OAuth додатку GitHub

1. Увійдіть до свого облікового запису GitHub
2. Перейдіть до "Settings" > "Developer settings" > "OAuth Apps"
3. Натисніть "New OAuth App"
4. Заповніть форму:
   - Application name: Trae Integration
   - Homepage URL: URL вашого додатку Trae
   - Authorization callback URL: `https://your-trae-app.com/api/auth/callback/github`
5. Натисніть "Register application"
6. Скопіюйте Client ID та згенеруйте Client Secret

### Налаштування GitHub в Trae

1. Додайте наступні рядки до файлу `.env.local`:
   ```
   GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
   GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
   ```
2. Збережіть файл

## Крок 3: Налаштування оптимізації для браузера

### Активація Service Worker

1. Переконайтеся, що файл `sw.js` знаходиться в директорії `public`
2. Додайте наступний код до файлу `pages/_app.tsx` для реєстрації Service Worker:

```typescript
import { useEffect } from 'react';
import { initBrowserOptimizations } from '../utils/browserUtils';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Ініціалізація оптимізацій для браузера
    initBrowserOptimizations({
      enableServiceWorker: true,
      enableLazyLoading: true,
      prefetchResources: [
        '/static/fonts/main.woff2',
        '/static/images/logo.svg'
      ],
      collectMetrics: true,
      mgxToken: localStorage.getItem('mgx_token')
    });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

### Налаштування кешування статичних ресурсів

1. Відкрийте файл `next.config.js`
2. Додайте або оновіть конфігурацію заголовків:

```javascript
module.exports = {
  // ... інші налаштування
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

## Крок 4: Тестування інтеграції

### Перевірка MGX інтеграції

1. Запустіть додаток Trae: `npm run dev`
2. Відкрийте сторінку MGX інтеграції
3. Натисніть кнопку "Увійти через MGX"
4. Після успішної авторизації, перевірте функціонал налаштування інтеграції

### Перевірка GitHub інтеграції

1. На сторінці MGX інтеграції натисніть "Connect GitHub Account"
2. Після авторизації через GitHub, спробуйте синхронізувати репозиторій
3. Перевірте, чи працює аналіз коду через MGX

### Перевірка оптимізацій для браузера

1. Відкрийте інструменти розробника в браузері (F12)
2. Перейдіть на вкладку "Application" > "Service Workers"
3. Переконайтеся, що Service Worker активний
4. Перевірте вкладку "Cache Storage" для підтвердження кешування ресурсів

## Усунення несправностей

### Проблеми з MGX авторизацією

- Перевірте правильність API ключа
- Переконайтеся, що MGX сервіс доступний
- Перевірте консоль браузера на наявність помилок

### Проблеми з GitHub інтеграцією

- Перевірте правильність Client ID та Client Secret
- Переконайтеся, що URL зворотного виклику налаштований правильно
- Перевірте, чи маєте ви необхідні права доступу до репозиторію

### Проблеми з Service Worker

- Переконайтеся, що ваш сайт працює через HTTPS (або localhost для розробки)
- Очистіть кеш браузера та Service Worker
- Перевірте консоль на наявність помилок реєстрації Service Worker

## Висновок

Після успішного налаштування всіх компонентів, ви отримаєте повноцінну інтеграцію між Trae, GitHub, браузером та MGX. Це забезпечить ефективний робочий процес, покращену продуктивність та розширені можливості для розробки та підтримки проектів.

Для отримання додаткової інформації зверніться до наступних документів:
- [TRAE_MGX_INTEGRATION.md](./TRAE_MGX_INTEGRATION.md) - огляд системи взаємодії
- [INTEGRATION_ALGORITHMS.md](./INTEGRATION_ALGORITHMS.md) - детальні алгоритми взаємодії
- [GITHUB_INTEGRATION.md](./GITHUB_INTEGRATION.md) - додаткова інформація про інтеграцію з GitHub