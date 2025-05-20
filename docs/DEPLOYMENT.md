# Руководство по развертыванию

Этот документ содержит инструкции по развертыванию проекта в различных средах.

## Содержание

- [Требования](#требования)
- [Локальное развертывание](#локальное-развертывание)
- [Развертывание на Vercel](#развертывание-на-vercel)
- [Развертывание на Netlify](#развертывание-на-netlify)
- [Настройка CI/CD](#настройка-cicd)
- [Переменные окружения](#переменные-окружения)

## Требования

- Node.js 14.x или выше
- npm 7.x или выше
- Git

## Локальное развертывание

1. Клонируйте репозиторий:

```bash
git clone https://github.com/username/project-name.git
cd project-name
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env.local` и добавьте необходимые переменные окружения:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

4. Запустите проект в режиме разработки:

```bash
npm run dev
```

5. Откройте [http://localhost:3000](http://localhost:3000) в вашем браузере.

## Развертывание на Vercel

1. Создайте аккаунт на [Vercel](https://vercel.com) (если у вас его еще нет).

2. Установите Vercel CLI:

```bash
npm install -g vercel
```

3. Войдите в свой аккаунт Vercel:

```bash
vercel login
```

4. Разверните проект:

```bash
vercel
```

5. Для продакшн-деплоя используйте:

```bash
vercel --prod
```

## Развертывание на Netlify

1. Создайте аккаунт на [Netlify](https://netlify.com) (если у вас его еще нет).

2. Установите Netlify CLI:

```bash
npm install -g netlify-cli
```

3. Войдите в свой аккаунт Netlify:

```bash
netlify login
```

4. Разверните проект:

```bash
netlify deploy
```

5. Для продакшн-деплоя используйте:

```bash
netlify deploy --prod
```

## Настройка CI/CD

Проект уже содержит настройки GitHub Actions для непрерывной интеграции. Файл конфигурации находится в `.github/workflows/ci.yml`.

Для настройки непрерывного развертывания:

1. Добавьте секреты в настройках вашего GitHub репозитория:
   - `VERCEL_TOKEN` - токен API Vercel
   - `VERCEL_ORG_ID` - ID организации Vercel
   - `VERCEL_PROJECT_ID` - ID проекта Vercel

2. Создайте файл `.github/workflows/cd.yml` со следующим содержимым:

```yaml
name: Continuous Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '14'
      - name: Install Vercel CLI
        run: npm install -g vercel
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Переменные окружения

Создайте файл `.env.local` для локальной разработки или добавьте эти переменные в настройках вашей платформы развертывания:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# API URL
NEXT_PUBLIC_API_URL=your_api_url

# Analytics (опционально)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

---

Если у вас возникли проблемы с развертыванием, обратитесь к [руководству по устранению неполадок](../TROUBLESHOOTING.md) или создайте issue в репозитории проекта.