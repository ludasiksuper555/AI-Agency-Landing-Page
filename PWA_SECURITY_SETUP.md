# PWA та Безпека - Налаштування та Інструкції

## 📱 Progressive Web App (PWA)

### Що було реалізовано:

1. **Service Worker** (`/public/sw.js`)

   - Кешування статичних ресурсів
   - Офлайн підтримка
   - Background sync для форм
   - Push-повідомлення

2. **Web App Manifest** (`/public/manifest.json`)

   - Налаштування для встановлення як додаток
   - Іконки різних розмірів
   - Shortcuts до ключових сторінок

3. **PWA Компоненти**
   - `PWAInstallPrompt` - промпт для встановлення
   - `usePWA` - хук для роботи з PWA
   - Офлайн індикатори

### Налаштування:

1. **Генерація VAPID ключів для push-повідомлень:**

```bash
npx web-push generate-vapid-keys
```

2. **Додайте ключі в .env:**

```env
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
NOTIFICATION_API_KEY="your-notification-api-key"
```

3. **Створіть іконки PWA:**
   - Розмістіть іконки в `/public/icons/`
   - Розміри: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
   - Формати: PNG для растрових, SVG для векторних

## 🔒 Безпека

### Що було реалізовано:

1. **Content Security Policy (CSP)**

   - Захист від XSS атак
   - Контроль завантаження ресурсів
   - Звіти про порушення

2. **Rate Limiting**

   - Обмеження запитів по IP
   - Різні ліміти для різних endpoints
   - In-memory та Redis підтримка

3. **Security Headers**

   - HSTS
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy
   - Permissions-Policy

4. **Middleware Security**
   - Автоматичне застосування заголовків
   - CORS налаштування
   - Bot detection

### Налаштування безпеки:

1. **CSP налаштування в .env:**

```env
CSP_SCRIPT_SRC="'self' 'unsafe-inline' https://www.googletagmanager.com"
CSP_STYLE_SRC="'self' 'unsafe-inline' https://fonts.googleapis.com"
CSP_FONT_SRC="'self' https://fonts.gstatic.com"
CSP_IMG_SRC="'self' data: https: blob:"
CSP_CONNECT_SRC="'self' https://www.google-analytics.com"
```

2. **Rate Limiting налаштування:**

```env
RATE_LIMIT_API_REQUESTS="100"
RATE_LIMIT_API_WINDOW="900000"
RATE_LIMIT_AUTH_REQUESTS="5"
RATE_LIMIT_AUTH_WINDOW="900000"
```

3. **CORS налаштування:**

```env
CORS_ALLOWED_ORIGINS="http://localhost:3000,https://your-domain.com"
```

## 🚀 Встановлення та Запуск

1. **Встановіть залежності:**

```bash
npm install next-pwa workbox-webpack-plugin helmet express-rate-limit web-push
```

2. **Налаштуйте змінні середовища:**

```bash
cp .env.example .env.local
# Відредагуйте .env.local з вашими значеннями
```

3. **Запустіть проект:**

```bash
npm run dev
```

## 📊 Моніторинг

### API Endpoints для моніторингу:

1. **Security Health Check:**

   - `GET /api/security/health-check`
   - Перевіряє стан безпеки

2. **CSP Violation Reports:**

   - `POST /api/security/csp-report`
   - Отримує звіти про порушення CSP

3. **PWA Notifications:**

   - `POST /api/pwa/notifications` - підписка
   - `PUT /api/pwa/notifications` - відправка
   - `DELETE /api/pwa/notifications` - відписка

4. **Offline Sync:**
   - `POST /api/pwa/sync` - синхронізація офлайн даних

## 🔧 Налаштування Production

### 1. HTTPS

- PWA вимагає HTTPS в production
- Налаштуйте SSL сертифікат
- Оновіть NEXTAUTH_URL на https://

### 2. Redis для Rate Limiting

```env
RATE_LIMIT_REDIS_URL="redis://your-redis-server:6379"
```

### 3. Database для зберігання

- Замініть in-memory storage на базу даних
- Налаштуйте backup для push subscriptions

### 4. Monitoring

```env
SENTRY_DSN="your-sentry-dsn"
NEXT_PUBLIC_SENTRY_DSN="your-public-sentry-dsn"
```

## 🧪 Тестування

### PWA тестування:

1. Відкрийте Chrome DevTools
2. Перейдіть на вкладку "Application"
3. Перевірте Service Worker, Manifest, Storage

### Security тестування:

1. Використайте Mozilla Observatory
2. Перевірте заголовки через securityheaders.com
3. Тестуйте CSP через csp-evaluator.withgoogle.com

## 📱 Функції PWA

### Офлайн режим:

- Кешування сторінок та ресурсів
- Офлайн сторінка (`/offline.html`)
- Background sync для форм

### Push-повідомлення:

- Підписка на повідомлення
- Системні повідомлення (оновлення, новини)
- Персоналізовані повідомлення

### Встановлення:

- Автоматичний промпт встановлення
- Кастомний UI для встановлення
- Підтримка різних платформ

## 🔐 Security Features

### Захист від атак:

- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Clickjacking
- MIME type sniffing

### Rate Limiting:

- API endpoints
- Authentication
- Contact forms
- File uploads

### Monitoring:

- CSP violation reports
- Security health checks
- Performance metrics
- Error tracking

## 📞 Підтримка

Якщо у вас виникли питання або проблеми:

1. Перевірте логи в консолі браузера
2. Перевірте Network tab в DevTools
3. Перегляньте Application tab для PWA статусу
4. Перевірте server logs для security events

## 🔄 Оновлення

Для оновлення PWA:

1. Змініть версію в `manifest.json`
2. Оновіть cache names в `sw.js`
3. Користувачі отримають промпт про оновлення

Для оновлення безпеки:

1. Регулярно оновлюйте залежності
2. Моніторьте security advisories
3. Перевіряйте CSP reports
4. Аналізуйте rate limiting metrics
