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
2. Додайте наступні рядки, замінивши значення на ваші дані:
   ```
   MGX_API_KEY=YOUR_MGX_API_KEY
   MGX_API_BASE_URL=https://mgx.dev/api
   MEAT_MARKET_API_BASE_URL=https://meat-analytics.com/api
   ```
3. Збережіть файл

### Створення компонента MGX інтеграції

1. Створіть або оновіть компонент `components/MGXIntegration.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { authenticateWithMGX, getMGXUserInfo, configureMGXIntegration, analyzeCodeWithMGX, syncWithGitHub } from '../utils/mgxUtils';

const MGXIntegration: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<{username: string; email: string} | null>(null);
  const [gitHubConnected, setGitHubConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [codeAnalysisResult, setCodeAnalysisResult] = useState('');
  const { code } = router.query;

  useEffect(() => {
    // Перевіряємо, чи є код авторизації в URL після перенаправлення з MGX
    if (code && typeof code === 'string') {
      handleAuthCode(code);
    }

    // Перевіряємо, чи є збережений токен
    const savedToken = localStorage.getItem('mgx_token');
    if (savedToken) {
      setIsAuthenticated(true);
      fetchUserInfo(savedToken);
    }
  }, [code]);

  // Інші функції та логіка компонента...

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{t('mgx.integration.title')}</h2>

      {!isAuthenticated ? (
        <button
          onClick={handleMGXAuth}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('mgx.auth.login')}
        </button>
      ) : (
        <div className="space-y-4">
          {userInfo && (
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <p><strong>{t('common.username')}:</strong> {userInfo.username}</p>
              <p><strong>{t('common.email')}:</strong> {userInfo.email}</p>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <button
              onClick={handleGitHubConnect}
              disabled={isLoading || gitHubConnected}
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
            >
              {gitHubConnected ? t('github.connected') : t('github.connect')}
            </button>

            {gitHubConnected && (
              <button
                onClick={handleSync}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {t('github.sync')}
              </button>
            )}
          </div>

          {syncStatus && (
            <div className="p-4 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded">
              {syncStatus}
            </div>
          )}

          {codeAnalysisResult && (
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <h3 className="text-lg font-semibold mb-2">{t('mgx.analysis.result')}</h3>
              <pre className="whitespace-pre-wrap">{codeAnalysisResult}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MGXIntegration;
```

### Налаштування утиліт для роботи з MGX

1. Створіть або оновіть файл `utils/mgxUtils.ts` з функціями для взаємодії з MGX API:

```typescript
// Базові URL для API
const MGX_API_BASE_URL = process.env.MGX_API_BASE_URL || 'https://mgx.dev/api';
const GITHUB_API_BASE_URL = 'https://api.github.com';
const MEAT_MARKET_API_BASE_URL =
  process.env.MEAT_MARKET_API_BASE_URL || 'https://meat-analytics.com/api';

/**
 * Автентифікація користувача через MGX
 * @param authCode Код авторизації, отриманий після перенаправлення з MGX
 * @returns Відповідь з токеном доступу або помилкою
 */
export const authenticateWithMGX = async (authCode: string) => {
  try {
    const response = await fetch(`${MGX_API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: authCode }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('MGX authentication error:', error);
    return { success: false, error: 'Authentication failed' };
  }
};

/**
 * Отримання інформації про користувача MGX
 * @param token Токен доступу MGX
 * @returns Інформація про користувача або null у разі помилки
 */
export const getMGXUserInfo = async (token: string) => {
  try {
    const response = await fetch(`${MGX_API_BASE_URL}/user/info`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching MGX user info:', error);
    return null;
  }
};
```

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
   GITHUB_REPO_OWNER=YOUR_GITHUB_USERNAME
   GITHUB_REPO_NAME=YOUR_REPOSITORY_NAME
   ```
2. Збережіть файл

### Налаштування функцій для роботи з GitHub API

1. Додайте наступні функції до файлу `utils/mgxUtils.ts` для взаємодії з GitHub API:

```typescript
/**
 * Синхронізація з GitHub репозиторієм
 * @param token Токен доступу MGX
 * @param params Параметри синхронізації
 * @returns Результат синхронізації
 */
export const syncWithGitHub = async (token: string, params: GitHubSyncParams) => {
  try {
    const response = await fetch(`${MGX_API_BASE_URL}/github/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('GitHub sync error:', error);
    return { success: false, error: 'Sync failed' };
  }
};

/**
 * Аналіз коду за допомогою MGX
 * @param token Токен доступу MGX
 * @param params Параметри аналізу коду
 * @returns Результат аналізу
 */
export const analyzeCodeWithMGX = async (token: string, params: CodeAnalysisParams) => {
  try {
    const response = await fetch(`${MGX_API_BASE_URL}/code/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Code analysis error:', error);
    return { success: false, error: 'Analysis failed' };
  }
};

/**
 * Отримання списку гілок репозиторію
 * @param token Токен доступу GitHub
 * @param owner Власник репозиторію
 * @param repo Назва репозиторію
 * @returns Список гілок
 */
export const getRepositoryBranches = async (token: string, owner: string, repo: string) => {
  try {
    const response = await fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/branches`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching repository branches:', error);
    return [];
  }
};
```

### Налаштування захисту гілок GitHub

1. Створіть файл `.github/branch-protection.yml` з наступним вмістом:

```yaml
name: Branch Protection Rules

on:
  push:
    branches:
      - main
      - master

jobs:
  protect:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm ci

      - name: Configure branch protection
        uses: github/branch-protection-rules@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          owner: ${{ github.repository_owner }}
          repo: ${{ github.event.repository.name }}
          branch: main
          enforce_admins: true
          required_status_checks: true
          required_pull_request_reviews: true
          dismiss_stale_reviews: true
          require_code_owner_reviews: true
```

2. Налаштуйте файл `.github/CODEOWNERS` для визначення власників коду:

```
# Власники всього коду за замовчуванням
* @your-username

# Власники специфічних директорій
/src/components/ @frontend-team
/api/ @backend-team
```

## Крок 3: Налаштування оптимізації для браузера

### Активація Service Worker

1. Переконайтеся, що файл `sw.js` знаходиться в директорії `public`
2. Додайте наступний код до файлу `pages/_app.tsx` для реєстрації Service Worker:

```typescript
import { useEffect } from 'react';
import { initBrowserOptimizations } from '../utils/browserUtils';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';

function MyApp({ Component, pageProps }) {
  // Використовуємо хук для оптимізації продуктивності
  usePerformanceOptimization();

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
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};
```

### Налаштування оптимізації зображень

1. Переконайтеся, що всі зображення використовують атрибут `loading="lazy"` для відкладеного завантаження
2. Використовуйте сучасні формати зображень (WebP, AVIF) з резервними копіями для старих браузерів
3. Додайте наступний код до компонентів, які відображають зображення:

```typescript
import Image from 'next/image';

const OptimizedImage = ({ src, alt, width, height }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M0 0h40v40H0z' fill='%23f0f0f0'/%3E%3C/svg%3E"
    />
  );
};
```

### Налаштування метрик продуктивності

1. Створіть файл `utils/performanceMonitoring.ts` з наступним кодом:

```typescript
import { getCacheSettings } from './browserUtils';

export const initPerformanceMonitoring = () => {
  // Відстеження Web Vitals
  if ('web-vitals' in window) {
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getLCP(sendToAnalytics);
    });
  }

  // Функція для відправки метрик в аналітику
  const sendToAnalytics = metric => {
    // Відправка метрик в MGX для аналізу
    const mgxToken = localStorage.getItem('mgx_token');
    if (mgxToken) {
      fetch('/api/performance-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mgxToken}`,
        },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
        }),
      });
    }
  };
};
```

````

## Крок 4: Тестування інтеграції

### Перевірка MGX інтеграції

1. Запустіть додаток Trae: `npm run dev`
2. Відкрийте сторінку MGX інтеграції (зазвичай `/mgx-integration`)
3. Натисніть кнопку "Увійти через MGX"
4. Після успішної авторизації, перевірте функціонал налаштування інтеграції
5. Перевірте відображення інформації про користувача MGX
6. Спробуйте виконати аналіз даних м'ясного ринку через MGX API

```javascript
// Приклад тестового коду для перевірки MGX інтеграції
const testMGXIntegration = async () => {
  const token = localStorage.getItem('mgx_token');
  if (!token) {
    console.error('MGX токен не знайдено. Спочатку авторизуйтесь.');
    return false;
  }

  try {
    // Перевірка отримання інформації про користувача
    const userInfo = await getMGXUserInfo(token);
    console.log('Інформація про користувача MGX:', userInfo);

    // Перевірка аналізу даних
    const analysisResult = await analyzeMeatMarketData(token, {
      region: 'EU',
      period: 'last_month',
      dataType: 'prices'
    });
    console.log('Результат аналізу даних:', analysisResult);

    return true;
  } catch (error) {
    console.error('Помилка тестування MGX інтеграції:', error);
    return false;
  }
};
````

### Перевірка GitHub інтеграції

1. На сторінці MGX інтеграції натисніть "Connect GitHub Account"
2. Після авторизації через GitHub, спробуйте синхронізувати репозиторій
3. Перевірте, чи працює аналіз коду через MGX
4. Перевірте можливість отримання списку гілок репозиторію
5. Спробуйте виконати аналіз безпеки коду
6. Перевірте роботу захисту гілок

```javascript
// Приклад тестового коду для перевірки GitHub інтеграції
const testGitHubIntegration = async () => {
  const token = localStorage.getItem('mgx_token');
  const githubToken = localStorage.getItem('github_token');
  if (!token || !githubToken) {
    console.error('Токени не знайдено. Спочатку авторизуйтесь.');
    return false;
  }

  try {
    // Перевірка синхронізації з GitHub
    const syncResult = await syncWithGitHub(token, {
      repository: process.env.GITHUB_REPO_NAME || 'AI-Agency-Landing-Page',
      branch: 'main',
      commitMessage: 'Test sync from Trae',
    });
    console.log('Результат синхронізації:', syncResult);

    // Перевірка аналізу коду
    const analysisResult = await analyzeCodeWithMGX(token, {
      repository: process.env.GITHUB_REPO_NAME || 'AI-Agency-Landing-Page',
      branch: 'main',
      analysisType: 'security',
    });
    console.log('Результат аналізу коду:', analysisResult);

    // Перевірка отримання гілок
    const branches = await getRepositoryBranches(
      githubToken,
      process.env.GITHUB_REPO_OWNER || 'your-username',
      process.env.GITHUB_REPO_NAME || 'AI-Agency-Landing-Page'
    );
    console.log('Гілки репозиторію:', branches);

    return true;
  } catch (error) {
    console.error('Помилка тестування GitHub інтеграції:', error);
    return false;
  }
};
```

### Перевірка оптимізацій для браузера

1. Відкрийте інструменти розробника в браузері (F12)
2. Перейдіть на вкладку "Application" > "Service Workers"
3. Переконайтеся, що Service Worker активний
4. Перевірте вкладку "Cache Storage" для підтвердження кешування ресурсів
5. Запустіть аудит Lighthouse для перевірки продуктивності
6. Перевірте метрики Web Vitals (LCP, FID, CLS)
7. Перевірте, чи працює відкладене завантаження зображень

```javascript
// Приклад тестового коду для перевірки оптимізацій браузера
const testBrowserOptimizations = () => {
  // Перевірка Service Worker
  const serviceWorkerActive = navigator.serviceWorker.controller !== null;
  console.log('Service Worker активний:', serviceWorkerActive);

  // Перевірка кешування
  const checkCacheStorage = async () => {
    if ('caches' in window) {
      const cacheNames = await window.caches.keys();
      console.log('Наявні кеші:', cacheNames);

      // Перевірка наявності статичних ресурсів у кеші
      const staticCache = await caches.open('static-resources');
      const cachedResources = await staticCache.keys();
      console.log(
        'Кешовані ресурси:',
        cachedResources.map(req => req.url)
      );

      return cachedResources.length > 0;
    }
    return false;
  };

  // Перевірка відкладеного завантаження зображень
  const checkLazyLoading = () => {
    const images = document.querySelectorAll('img[loading="lazy"]');
    console.log('Кількість зображень з відкладеним завантаженням:', images.length);
    return images.length > 0;
  };

  // Запуск перевірок
  checkCacheStorage().then(hasCachedResources => {
    console.log('Є кешовані ресурси:', hasCachedResources);
  });

  const hasLazyImages = checkLazyLoading();
  console.log('Є зображення з відкладеним завантаженням:', hasLazyImages);

  // Перевірка Web Vitals
  if ('web-vitals' in window) {
    import('web-vitals').then(({ getLCP, getFID, getCLS }) => {
      getLCP(metric => console.log('LCP:', metric.value));
      getFID(metric => console.log('FID:', metric.value));
      getCLS(metric => console.log('CLS:', metric.value));
    });
  }
};
```

### Комплексне тестування всіх компонентів

1. Створіть файл `tests/integration/integration-test.js` для автоматизованого тестування:

```javascript
describe('Інтеграційне тестування', () => {
  beforeAll(async () => {
    // Налаштування тестового середовища
    await page.goto('http://localhost:3000/mgx-integration');
  });

  test('MGX авторизація працює коректно', async () => {
    // Тестування авторизації MGX
    await page.click('[data-testid="mgx-login-button"]');
    // Очікування перенаправлення та авторизації
    await page.waitForNavigation();
    // Перевірка успішної авторизації
    const userInfoElement = await page.waitForSelector('[data-testid="user-info"]');
    expect(userInfoElement).not.toBeNull();
  });

  test('GitHub інтеграція працює коректно', async () => {
    // Тестування GitHub інтеграції
    await page.click('[data-testid="github-connect-button"]');
    // Очікування авторизації GitHub
    await page.waitForNavigation();
    // Перевірка успішного підключення
    const syncButton = await page.waitForSelector('[data-testid="github-sync-button"]');
    expect(syncButton).not.toBeNull();

    // Тестування синхронізації
    await syncButton.click();
    const syncStatus = await page.waitForSelector('[data-testid="sync-status"]');
    expect(syncStatus).not.toBeNull();
  });

  test('Оптимізації браузера працюють коректно', async () => {
    // Перевірка Service Worker
    const swRegistrations = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistrations();
    });
    expect(swRegistrations.length).toBeGreaterThan(0);

    // Перевірка кешування
    const cacheKeys = await page.evaluate(async () => {
      return await caches.keys();
    });
    expect(cacheKeys.length).toBeGreaterThan(0);
  });
});
```

## Усунення несправностей

### Проблеми з MGX авторизацією

- Перевірте правильність API ключа в файлі `.env.local`
- Переконайтеся, що MGX сервіс доступний (спробуйте відкрити [mgx.dev](https://mgx.dev) у браузері)
- Перевірте консоль браузера на наявність помилок
- Перевірте мережеві запити в інструментах розробника браузера (вкладка Network)
- Спробуйте очистити локальне сховище браузера та кукі для вашого домену
- Перевірте, чи правильно налаштовані CORS заголовки на сервері MGX

```javascript
// Приклад перевірки MGX з'єднання
const checkMGXConnection = async () => {
  try {
    const response = await fetch(`${MGX_API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('MGX сервіс доступний');
      return true;
    } else {
      console.error('MGX сервіс недоступний, статус:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Помилка перевірки MGX:', error);
    return false;
  }
};
```

### Проблеми з GitHub інтеграцією

- Перевірте правильність Client ID та Client Secret в файлі `.env.local`
- Переконайтеся, що URL зворотного виклику налаштований правильно в налаштуваннях OAuth додатку
- Перевірте, чи маєте ви необхідні права доступу до репозиторію
- Перевірте, чи не досягнуто ліміт запитів до GitHub API (перевірте заголовки відповіді)
- Переконайтеся, що токен GitHub не прострочений
- Перевірте журнали GitHub Actions на наявність помилок

```javascript
// Приклад перевірки лімітів GitHub API
const checkGitHubRateLimit = async token => {
  try {
    const response = await fetch(`${GITHUB_API_BASE_URL}/rate_limit`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const data = await response.json();
    console.log('GitHub API ліміти:', data.rate);
    return data.rate;
  } catch (error) {
    console.error('Помилка перевірки лімітів GitHub API:', error);
    return null;
  }
};
```

### Проблеми з Service Worker

- Переконайтеся, що ваш сайт працює через HTTPS (або localhost для розробки)
- Очистіть кеш браузера та Service Worker через інструменти розробника (Application > Service Workers > Unregister)
- Перевірте консоль на наявність помилок реєстрації Service Worker
- Переконайтеся, що файл `sw.js` доступний за правильним шляхом
- Перевірте, чи підтримує ваш браузер Service Worker API
- Перевірте, чи не блокують Service Worker розширення браузера або налаштування безпеки

```javascript
// Приклад перевірки підтримки Service Worker
const checkServiceWorkerSupport = () => {
  if ('serviceWorker' in navigator) {
    console.log('Service Worker підтримується браузером');
    return true;
  } else {
    console.error('Service Worker не підтримується браузером');
    return false;
  }
};

// Приклад очищення Service Worker
const clearServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Service Worker видалено');
    }
    return true;
  }
  return false;
};
```

### Проблеми з продуктивністю

- Перевірте метрики Web Vitals за допомогою інструментів розробника браузера (Lighthouse)
- Переконайтеся, що всі зображення оптимізовані та використовують атрибут `loading="lazy"`
- Перевірте, чи правильно налаштовані заголовки кешування для статичних ресурсів
- Перевірте розмір бандлів JavaScript та CSS за допомогою інструментів аналізу бандлів
- Переконайтеся, що використовуєте сучасні формати зображень (WebP, AVIF)

```javascript
// Приклад перевірки метрик продуктивності
const checkPerformanceMetrics = () => {
  if ('performance' in window) {
    const navigationStart = performance.timing.navigationStart;
    const loadEventEnd = performance.timing.loadEventEnd;
    const loadTime = loadEventEnd - navigationStart;

    console.log('Час завантаження сторінки:', loadTime, 'мс');

    // Перевірка FCP (First Contentful Paint)
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      console.log('First Contentful Paint:', fcpEntry.startTime, 'мс');
    }

    return {
      loadTime,
      fcp: fcpEntry ? fcpEntry.startTime : null,
    };
  }

  return null;
};
```

### Загальні рекомендації з усунення несправностей

1. **Перевірте журнали** - Завжди перевіряйте консоль браузера та серверні журнали для виявлення помилок
2. **Ізолюйте проблему** - Спробуйте визначити, чи проблема пов'язана з MGX, GitHub, браузером або Trae
3. **Перевірте мережеві запити** - Використовуйте вкладку Network в інструментах розробника для аналізу запитів
4. **Оновіть залежності** - Переконайтеся, що всі пакети та залежності оновлені до останніх версій
5. **Перевірте сумісність браузера** - Переконайтеся, що функції, які ви використовуєте, підтримуються цільовими браузерами

## Висновок

Після успішного налаштування всіх компонентів, ви отримаєте повноцінну інтеграцію між Trae, GitHub, браузером та MGX. Це забезпечить ефективний робочий процес, покращену продуктивність та розширені можливості для розробки та підтримки проектів.

Для отримання додаткової інформації зверніться до наступних документів:

- [TRAE_MGX_INTEGRATION.md](./TRAE_MGX_INTEGRATION.md) - огляд системи взаємодії
- [INTEGRATION_ALGORITHMS.md](./INTEGRATION_ALGORITHMS.md) - детальні алгоритми взаємодії
- [GITHUB_INTEGRATION.md](./GITHUB_INTEGRATION.md) - додаткова інформація про інтеграцію з GitHub
