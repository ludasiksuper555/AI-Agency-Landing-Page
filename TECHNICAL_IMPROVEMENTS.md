# 🔧 Technical Improvements

**Приоритет**: 🔥 Критический
**Время выполнения**: 4-6 часов
**Статус**: Обязательно для production

---

## 📋 Обзор технических улучшений

### 1. Monitoring and Alerting

### 2. CI/CD Pipeline

### 3. Documentation

### 4. Code Quality

### 5. Performance Optimization

### 6. Security Enhancements

### 7. DevOps Improvements

---

## 📊 1. Monitoring and Alerting

### Application Performance Monitoring (APM)

**lib/monitoring/apm.ts**:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { performance } from 'perf_hooks';

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorData {
  message: string;
  stack?: string;
  url: string;
  userAgent?: string;
  userId?: string;
  timestamp: number;
}

class APMService {
  private metrics: MetricData[] = [];
  private errors: ErrorData[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  // Метрики производительности
  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    if (!this.isEnabled) return;

    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);
    this.sendMetricToService(metric);
  }

  // Отслеживание ошибок
  recordError(error: Error, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    const errorData: ErrorData = {
      message: error.message,
      stack: error.stack,
      url: context?.url || '',
      userAgent: context?.userAgent,
      userId: context?.userId,
      timestamp: Date.now(),
    };

    this.errors.push(errorData);
    this.sendErrorToService(errorData);
  }

  // Middleware для API routes
  apiMiddleware() {
    return (handler: Function) => {
      return async (req: NextApiRequest, res: NextApiResponse) => {
        const startTime = performance.now();
        const startMemory = process.memoryUsage();

        try {
          const result = await handler(req, res);

          // Записываем успешные метрики
          const duration = performance.now() - startTime;
          const endMemory = process.memoryUsage();
          const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

          this.recordMetric('api.request.duration', duration, {
            method: req.method || 'unknown',
            endpoint: req.url || 'unknown',
            status: res.statusCode.toString(),
          });

          this.recordMetric('api.request.memory', memoryDelta, {
            endpoint: req.url || 'unknown',
          });

          return result;
        } catch (error) {
          // Записываем ошибки
          this.recordError(error as Error, {
            url: req.url,
            method: req.method,
            userAgent: req.headers['user-agent'],
          });

          throw error;
        }
      };
    };
  }

  // Отправка метрик в внешний сервис
  private async sendMetricToService(metric: MetricData) {
    try {
      if (process.env.MONITORING_WEBHOOK_URL) {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'metric', data: metric }),
        });
      }
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }

  // Отправка ошибок в внешний сервис
  private async sendErrorToService(errorData: ErrorData) {
    try {
      if (process.env.ERROR_REPORTING_WEBHOOK_URL) {
        await fetch(process.env.ERROR_REPORTING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'error', data: errorData }),
        });
      }
    } catch (error) {
      console.error('Failed to send error:', error);
    }
  }

  // Получение статистики
  getStats() {
    return {
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      recentMetrics: this.metrics.slice(-10),
      recentErrors: this.errors.slice(-5),
    };
  }

  // Очистка старых данных
  cleanup() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    this.errors = this.errors.filter(e => e.timestamp > oneHourAgo);
  }
}

export const apmService = new APMService();

// React Hook для клиентского мониторинга
export const useAPM = () => {
  const recordPageView = (page: string) => {
    apmService.recordMetric('page.view', 1, { page });
  };

  const recordUserAction = (action: string, value: number = 1) => {
    apmService.recordMetric('user.action', value, { action });
  };

  const recordError = (error: Error, context?: Record<string, any>) => {
    apmService.recordError(error, context);
  };

  return {
    recordPageView,
    recordUserAction,
    recordError,
  };
};
```

### Health Check System

**pages/api/health.ts**:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: HealthCheck[];
  version: string;
}

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse<HealthResponse>) {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];

  // Проверка базы данных
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      service: 'database',
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    });
  } catch (error) {
    checks.push({
      service: 'database',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Проверка внешних API
  try {
    const apiStart = Date.now();
    const response = await fetch(process.env.EXTERNAL_API_URL + '/health', {
      timeout: 5000,
    });

    if (response.ok) {
      checks.push({
        service: 'external_api',
        status: 'healthy',
        responseTime: Date.now() - apiStart,
      });
    } else {
      checks.push({
        service: 'external_api',
        status: 'degraded',
        error: `HTTP ${response.status}`,
      });
    }
  } catch (error) {
    checks.push({
      service: 'external_api',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Проверка памяти
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  checks.push({
    service: 'memory',
    status:
      memoryUsagePercent > 90 ? 'unhealthy' : memoryUsagePercent > 70 ? 'degraded' : 'healthy',
    responseTime: memoryUsagePercent,
  });

  // Общий статус
  const overallStatus = checks.some(c => c.status === 'unhealthy')
    ? 'unhealthy'
    : checks.some(c => c.status === 'degraded')
      ? 'degraded'
      : 'healthy';

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    version: process.env.npm_package_version || '1.0.0',
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
  res.status(statusCode).json(response);
}
```

---

## 🚀 2. CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/ci-cd.yml**:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Этап тестирования
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  # Этап сборки
  build:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: |
            .next/
            public/
            package.json
            package-lock.json
          retention-days: 7

  # Этап безопасности
  security:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run security audit
        run: npm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run CodeQL analysis
        uses: github/codeql-action/init@v2
        with:
          languages: javascript

      - name: Perform CodeQL analysis
        uses: github/codeql-action/analyze@v2

  # Этап развертывания (staging)
  deploy-staging:
    needs: [build, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    environment:
      name: staging
      url: https://staging.example.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Здесь будет реальный скрипт развертывания

      - name: Run smoke tests
        run: |
          echo "Running smoke tests on staging"
          # Здесь будут smoke tests

  # Этап развертывания (production)
  deploy-production:
    needs: [build, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    environment:
      name: production
      url: https://example.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files

      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Здесь будет реальный скрипт развертывания

      - name: Run post-deployment tests
        run: |
          echo "Running post-deployment tests"
          # Здесь будут post-deployment tests

      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### Docker Configuration

**Dockerfile**:

```dockerfile
# Multi-stage build для оптимизации размера
FROM node:18-alpine AS base

# Установка зависимостей
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**docker-compose.yml**:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## 📚 3. Documentation

### API Documentation Generator

**scripts/generate-api-docs.js**:

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Генератор документации API
class APIDocGenerator {
  constructor() {
    this.routes = [];
    this.schemas = new Map();
  }

  // Сканирование API routes
  scanRoutes() {
    const apiFiles = glob.sync('pages/api/**/*.{js,ts}', {
      ignore: ['**/*.test.*', '**/*.spec.*'],
    });

    apiFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const route = this.parseRoute(file, content);
      if (route) {
        this.routes.push(route);
      }
    });
  }

  // Парсинг route файла
  parseRoute(filePath, content) {
    const routePath = filePath
      .replace('pages/api', '')
      .replace(/\.(js|ts)$/, '')
      .replace(/\/index$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1');

    // Извлечение комментариев JSDoc
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
    const jsdocMatches = content.match(jsdocRegex);

    if (!jsdocMatches) return null;

    const documentation = this.parseJSDoc(jsdocMatches[0]);

    // Определение HTTP методов
    const methods = [];
    if (content.includes("req.method === 'GET'")) methods.push('GET');
    if (content.includes("req.method === 'POST'")) methods.push('POST');
    if (content.includes("req.method === 'PUT'")) methods.push('PUT');
    if (content.includes("req.method === 'DELETE'")) methods.push('DELETE');
    if (content.includes("req.method === 'PATCH'")) methods.push('PATCH');

    return {
      path: routePath || '/',
      methods: methods.length > 0 ? methods : ['GET'],
      ...documentation,
    };
  }

  // Парсинг JSDoc комментариев
  parseJSDoc(jsdoc) {
    const lines = jsdoc.split('\n').map(line => line.replace(/^\s*\*\s?/, ''));

    const result = {
      summary: '',
      description: '',
      parameters: [],
      responses: [],
      tags: [],
    };

    let currentSection = 'description';

    lines.forEach(line => {
      if (line.startsWith('@summary')) {
        result.summary = line.replace('@summary', '').trim();
      } else if (line.startsWith('@param')) {
        const paramMatch = line.match(/@param\s+{([^}]+)}\s+(\w+)\s+(.+)/);
        if (paramMatch) {
          result.parameters.push({
            name: paramMatch[2],
            type: paramMatch[1],
            description: paramMatch[3],
          });
        }
      } else if (line.startsWith('@returns')) {
        const returnMatch = line.match(/@returns\s+{([^}]+)}\s+(.+)/);
        if (returnMatch) {
          result.responses.push({
            status: '200',
            type: returnMatch[1],
            description: returnMatch[2],
          });
        }
      } else if (line.startsWith('@tag')) {
        result.tags.push(line.replace('@tag', '').trim());
      } else if (line.trim() && !line.startsWith('@')) {
        result.description += line + ' ';
      }
    });

    result.description = result.description.trim();
    return result;
  }

  // Генерация OpenAPI спецификации
  generateOpenAPI() {
    const openapi = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
        description: 'Автоматически сгенерированная документация API',
      },
      servers: [
        {
          url: 'http://localhost:3000/api',
          description: 'Development server',
        },
        {
          url: 'https://api.example.com',
          description: 'Production server',
        },
      ],
      paths: {},
    };

    this.routes.forEach(route => {
      if (!openapi.paths[route.path]) {
        openapi.paths[route.path] = {};
      }

      route.methods.forEach(method => {
        openapi.paths[route.path][method.toLowerCase()] = {
          summary: route.summary || `${method} ${route.path}`,
          description: route.description,
          tags: route.tags,
          parameters: route.parameters.map(param => ({
            name: param.name,
            in: 'query',
            description: param.description,
            schema: { type: param.type },
          })),
          responses: {
            200: {
              description: 'Success',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
            400: {
              description: 'Bad Request',
            },
            500: {
              description: 'Internal Server Error',
            },
          },
        };
      });
    });

    return openapi;
  }

  // Генерация Markdown документации
  generateMarkdown() {
    let markdown = '# API Documentation\n\n';
    markdown += 'Автоматически сгенерированная документация API.\n\n';

    // Группировка по тегам
    const groupedRoutes = this.routes.reduce((groups, route) => {
      const tag = route.tags[0] || 'General';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(route);
      return groups;
    }, {});

    Object.entries(groupedRoutes).forEach(([tag, routes]) => {
      markdown += `## ${tag}\n\n`;

      routes.forEach(route => {
        markdown += `### ${route.methods.join(', ')} ${route.path}\n\n`;

        if (route.summary) {
          markdown += `**Summary:** ${route.summary}\n\n`;
        }

        if (route.description) {
          markdown += `${route.description}\n\n`;
        }

        if (route.parameters.length > 0) {
          markdown += '**Parameters:**\n\n';
          route.parameters.forEach(param => {
            markdown += `- \`${param.name}\` (${param.type}): ${param.description}\n`;
          });
          markdown += '\n';
        }

        markdown += '---\n\n';
      });
    });

    return markdown;
  }

  // Сохранение документации
  save() {
    this.scanRoutes();

    const openapi = this.generateOpenAPI();
    const markdown = this.generateMarkdown();

    // Создание директории для документации
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Сохранение файлов
    fs.writeFileSync(path.join(docsDir, 'openapi.json'), JSON.stringify(openapi, null, 2));

    fs.writeFileSync(path.join(docsDir, 'api.md'), markdown);

    console.log('✅ API documentation generated successfully!');
    console.log(`📁 Files saved to: ${docsDir}`);
    console.log(`📄 OpenAPI spec: ${path.join(docsDir, 'openapi.json')}`);
    console.log(`📄 Markdown docs: ${path.join(docsDir, 'api.md')}`);
  }
}

// Запуск генератора
if (require.main === module) {
  const generator = new APIDocGenerator();
  generator.save();
}

module.exports = APIDocGenerator;
```

### Component Documentation

**scripts/generate-component-docs.js**:

````javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Генератор документации компонентов
class ComponentDocGenerator {
  constructor() {
    this.components = [];
  }

  // Сканирование компонентов
  scanComponents() {
    const componentFiles = glob.sync('components/**/*.{tsx,jsx}', {
      ignore: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
    });

    componentFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const component = this.parseComponent(file, content);
      if (component) {
        this.components.push(component);
      }
    });
  }

  // Парсинг компонента
  parseComponent(filePath, content) {
    const componentName = path.basename(filePath, path.extname(filePath));

    // Извлечение интерфейса props
    const interfaceRegex = new RegExp(`interface\\s+${componentName}Props\\s*{([^}]+)}`, 's');
    const interfaceMatch = content.match(interfaceRegex);

    const props = [];
    if (interfaceMatch) {
      const propsContent = interfaceMatch[1];
      const propLines = propsContent.split('\n').filter(line => line.trim());

      propLines.forEach(line => {
        const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+);?\s*(?:\/\/\s*(.+))?/);
        if (propMatch) {
          props.push({
            name: propMatch[1],
            optional: !!propMatch[2],
            type: propMatch[3].trim(),
            description: propMatch[4] || '',
          });
        }
      });
    }

    // Извлечение JSDoc комментариев
    const jsdocRegex = /\/\*\*([\s\S]*?)\*\//;
    const jsdocMatch = content.match(jsdocRegex);

    let description = '';
    let examples = [];

    if (jsdocMatch) {
      const jsdocContent = jsdocMatch[1];
      const lines = jsdocContent.split('\n').map(line => line.replace(/^\s*\*\s?/, ''));

      let currentSection = 'description';
      let currentExample = '';

      lines.forEach(line => {
        if (line.startsWith('@example')) {
          currentSection = 'example';
          currentExample = '';
        } else if (line.startsWith('@')) {
          if (currentSection === 'example' && currentExample) {
            examples.push(currentExample.trim());
            currentExample = '';
          }
          currentSection = 'other';
        } else if (currentSection === 'description' && line.trim()) {
          description += line + ' ';
        } else if (currentSection === 'example') {
          currentExample += line + '\n';
        }
      });

      if (currentExample) {
        examples.push(currentExample.trim());
      }
    }

    return {
      name: componentName,
      filePath,
      description: description.trim(),
      props,
      examples,
    };
  }

  // Генерация Markdown документации
  generateMarkdown() {
    let markdown = '# Component Documentation\n\n';
    markdown += 'Автоматически сгенерированная документация компонентов.\n\n';

    // Оглавление
    markdown += '## Table of Contents\n\n';
    this.components.forEach(component => {
      markdown += `- [${component.name}](#${component.name.toLowerCase()})\n`;
    });
    markdown += '\n';

    // Документация компонентов
    this.components.forEach(component => {
      markdown += `## ${component.name}\n\n`;

      if (component.description) {
        markdown += `${component.description}\n\n`;
      }

      markdown += `**File:** \`${component.filePath}\`\n\n`;

      // Props
      if (component.props.length > 0) {
        markdown += '### Props\n\n';
        markdown += '| Name | Type | Required | Description |\n';
        markdown += '|------|------|----------|-------------|\n';

        component.props.forEach(prop => {
          const required = prop.optional ? 'No' : 'Yes';
          markdown += `| \`${prop.name}\` | \`${prop.type}\` | ${required} | ${prop.description} |\n`;
        });

        markdown += '\n';
      }

      // Examples
      if (component.examples.length > 0) {
        markdown += '### Examples\n\n';
        component.examples.forEach((example, index) => {
          markdown += `#### Example ${index + 1}\n\n`;
          markdown += '```tsx\n';
          markdown += example;
          markdown += '\n```\n\n';
        });
      }

      markdown += '---\n\n';
    });

    return markdown;
  }

  // Сохранение документации
  save() {
    this.scanComponents();

    const markdown = this.generateMarkdown();

    // Создание директории для документации
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Сохранение файла
    fs.writeFileSync(path.join(docsDir, 'components.md'), markdown);

    console.log('✅ Component documentation generated successfully!');
    console.log(`📄 Components docs: ${path.join(docsDir, 'components.md')}`);
  }
}

// Запуск генератора
if (require.main === module) {
  const generator = new ComponentDocGenerator();
  generator.save();
}

module.exports = ComponentDocGenerator;
````
