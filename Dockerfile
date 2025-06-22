# Базовый образ Node.js
FROM node:18-alpine AS base

# Установка рабочей директории
WORKDIR /app

# Установка зависимостей
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Сборка приложения
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Продакшн образ
FROM base AS runner
ENV NODE_ENV production

# Создание пользователя для запуска приложения
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копирование необходимых файлов
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Установка переменных окружения
ENV PORT 3000
EXPOSE 3000

# Запуск приложения от имени пользователя nextjs
USER nextjs

CMD ["node", "server.js"]
