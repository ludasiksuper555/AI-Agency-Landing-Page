# Автоматизация проверок безопасности в CI/CD

## Введение

Данный документ описывает подход к автоматизации проверок безопасности в CI/CD пайплайне для обеспечения соответствия стандарту ISO 27001. Автоматизация проверок безопасности позволяет выявлять уязвимости на ранних этапах разработки, снижать риски и обеспечивать соответствие требованиям безопасности.

## Текущее состояние CI/CD

В настоящее время CI/CD пайплайн включает базовые проверки:

- Сборка проекта
- Запуск юнит-тестов
- Линтинг кода
- Проверка форматирования

## Расширенные проверки безопасности

### Статический анализ кода (SAST)

#### Интеграция CodeQL

CodeQL - это мощный инструмент для статического анализа кода, который позволяет выявлять уязвимости и проблемы безопасности в коде.

```yaml
# Пример интеграции CodeQL в GitHub Actions
jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

#### Настройка правил CodeQL

Для обеспечения соответствия ISO 27001 необходимо настроить правила CodeQL для выявления следующих типов уязвимостей:

- Инъекции (SQL, NoSQL, Command)
- Межсайтовый скриптинг (XSS)
- Небезопасное хранение чувствительных данных
- Небезопасная аутентификация
- Небезопасное управление сессиями
- Неправильная настройка безопасности

### Проверка зависимостей

#### Интеграция Dependabot

Dependabot автоматически проверяет зависимости проекта на наличие известных уязвимостей и создает PR для их обновления.

```yaml
# Пример конфигурации Dependabot в .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'daily'
    open-pull-requests-limit: 10
    labels:
      - 'dependencies'
      - 'security'
    ignore:
      # Игнорировать обновления некритичных зависимостей
      - dependency-name: 'lodash'
        versions: ['4.x']
```

#### Интеграция npm audit

npm audit позволяет проверять зависимости проекта на наличие известных уязвимостей.

```yaml
# Пример интеграции npm audit в GitHub Actions
jobs:
  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=high
```

### Проверка секретов и чувствительных данных

#### Интеграция GitLeaks

GitLeaks позволяет выявлять секреты и чувствительные данные в коде.

```yaml
# Пример интеграции GitLeaks в GitHub Actions
jobs:
  gitleaks:
    name: GitLeaks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: GitLeaks
        uses: zricethezav/gitleaks-action@v1.6.0
```

#### Настройка правил GitLeaks

Для обеспечения соответствия ISO 27001 необходимо настроить правила GitLeaks для выявления следующих типов секретов:

- API ключи
- Токены доступа
- Пароли
- Приватные ключи
- Сертификаты
- Конфиденциальные данные

### Проверка Docker образов

#### Интеграция Trivy

Trivy позволяет сканировать Docker образы на наличие уязвимостей.

```yaml
# Пример интеграции Trivy в GitHub Actions
jobs:
  trivy:
    name: Trivy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t my-app:${{ github.sha }} .

      - name: Scan Docker image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'my-app:${{ github.sha }}'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'
```

### Проверка соответствия ISO 27001

#### Интеграция скрипта проверки соответствия

Для автоматизации проверки соответствия ISO 27001 необходимо разработать скрипт, который будет проверять соответствие проекта требованиям стандарта.

```yaml
# Пример интеграции скрипта проверки соответствия в GitHub Actions
jobs:
  iso27001-compliance:
    name: ISO 27001 Compliance
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run ISO 27001 compliance check
        run: node scripts/generate-iso27001-compliance-report.js

      - name: Upload compliance report
        uses: actions/upload-artifact@v3
        with:
          name: iso27001-compliance-report
          path: iso27001-compliance-report.md
```

## Интеграция с системой уведомлений

### Настройка уведомлений о проблемах безопасности

Для оперативного реагирования на проблемы безопасности необходимо настроить уведомления о выявленных уязвимостях.

```yaml
# Пример интеграции с Slack для уведомлений о проблемах безопасности
jobs:
  notify-security-issues:
    name: Notify Security Issues
    runs-on: ubuntu-latest
    needs: [analyze, security-audit, gitleaks, trivy, iso27001-compliance]
    if: failure()
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Автоматизация создания отчетов о безопасности

### Генерация отчетов о безопасности

Для обеспечения прозрачности и контроля безопасности необходимо автоматизировать создание отчетов о безопасности.

```yaml
# Пример интеграции генерации отчетов о безопасности в GitHub Actions
jobs:
  security-report:
    name: Security Report
    runs-on: ubuntu-latest
    needs: [analyze, security-audit, gitleaks, trivy, iso27001-compliance]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Generate security report
        run: node scripts/generate-security-report.js

      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.md
```

## Интеграция с системой управления инцидентами

### Автоматическое создание инцидентов

Для оперативного реагирования на проблемы безопасности необходимо автоматизировать создание инцидентов в системе управления инцидентами.

```yaml
# Пример интеграции с Jira для создания инцидентов
jobs:
  create-security-incident:
    name: Create Security Incident
    runs-on: ubuntu-latest
    needs: [analyze, security-audit, gitleaks, trivy, iso27001-compliance]
    if: failure()
    steps:
      - name: Create Jira issue
        uses: atlassian/gajira-create@v3
        with:
          project: SEC
          issuetype: Incident
          summary: Security issue detected in ${{ github.repository }}
          description: |
            Security issue detected in ${{ github.repository }} at ${{ github.sha }}.
            Please check the security report for details.
          fields: '{"customfield_10016": "High", "customfield_10017": "Security"}'
        env:
          JIRA_BASE_URL: ${{ secrets.JIRA_BASE_URL }}
          JIRA_USER_EMAIL: ${{ secrets.JIRA_USER_EMAIL }}
          JIRA_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
```

## Реализация в коде

### Обновление файла ci.yml

```yaml
# Пример обновления файла .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    name: Build and Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=high

  analyze:
    name: CodeQL Analysis
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript, typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  gitleaks:
    name: GitLeaks
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: GitLeaks
        uses: zricethezav/gitleaks-action@v1.6.0

  trivy:
    name: Trivy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t my-app:${{ github.sha }} .

      - name: Scan Docker image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'my-app:${{ github.sha }}'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          vuln-type: 'os,library'
          severity: 'CRITICAL,HIGH'

  iso27001-compliance:
    name: ISO 27001 Compliance
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run ISO 27001 compliance check
        run: node scripts/generate-iso27001-compliance-report.js

      - name: Upload compliance report
        uses: actions/upload-artifact@v3
        with:
          name: iso27001-compliance-report
          path: iso27001-compliance-report.md

  security-report:
    name: Security Report
    runs-on: ubuntu-latest
    needs: [build, security-audit, analyze, gitleaks, trivy, iso27001-compliance]
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Generate security report
        run: node scripts/generate-security-report.js

      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-report.md

  notify:
    name: Notify
    runs-on: ubuntu-latest
    needs: [build, security-audit, analyze, gitleaks, trivy, iso27001-compliance, security-report]
    if: failure()
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Заключение

Автоматизация проверок безопасности в CI/CD пайплайне позволяет выявлять уязвимости на ранних этапах разработки, снижать риски и обеспечивать соответствие требованиям безопасности ISO 27001. Регулярное обновление и расширение автоматизированных проверок безопасности позволяет поддерживать высокий уровень безопасности проекта.
