# Налаштування GitHub Issues для збору рекомендацій згідно ISO 27001

Цей документ містить інструкції щодо налаштування GitHub Issues для збору рекомендацій від сторонніх користувачів без можливості прямого внесення змін у код, відповідно до вимог ISO 27001 щодо контролю доступу.

## Загальні принципи

- Сторонні користувачі можуть залишати рекомендації через Issues
- Користувачі не мають прав на внесення прямих змін у код
- Всі рекомендації проходять процес рев'ю відповідальними особами
- Ведеться повний аудит всіх дій з рекомендаціями

## Налаштування шаблонів Issues

### 1. Створення шаблонів для різних типів рекомендацій

1. Створіть директорію `.github/ISSUE_TEMPLATE/` у вашому репозиторії
2. Додайте наступні шаблони:

#### Шаблон для загальних рекомендацій

Створіть файл `.github/ISSUE_TEMPLATE/recommendation.md`:

```markdown
---
name: Загальна рекомендація
about: Запропонуйте ідею або рекомендацію для покращення проекту
title: '[РЕКОМЕНДАЦІЯ] '
labels: enhancement, recommendation
assignees: ''
---

## Опис рекомендації

<!-- Детально опишіть вашу рекомендацію -->

## Очікувані переваги

<!-- Які переваги принесе впровадження вашої рекомендації? -->

## Додаткова інформація

<!-- Будь-яка додаткова інформація, контекст або приклади -->
```

#### Шаблон для рекомендацій щодо безпеки

Створіть файл `.github/ISSUE_TEMPLATE/security_recommendation.md`:

```markdown
---
name: Рекомендація з безпеки
about: Запропонуйте покращення безпеки проекту
title: '[БЕЗПЕКА] '
labels: security, recommendation
assignees: '@security-team'
---

## Опис рекомендації з безпеки

<!-- Детально опишіть вашу рекомендацію щодо покращення безпеки -->

## Потенційні ризики

<!-- Які ризики безпеки можуть бути зменшені завдяки вашій рекомендації? -->

## Пропоноване рішення

<!-- Опишіть ваше бачення реалізації цієї рекомендації -->

## Додаткова інформація

<!-- Будь-яка додаткова інформація, посилання на стандарти безпеки тощо -->
```

#### Шаблон для рекомендацій щодо документації

Створіть файл `.github/ISSUE_TEMPLATE/documentation_recommendation.md`:

```markdown
---
name: Рекомендація щодо документації
about: Запропонуйте покращення документації проекту
title: '[ДОКУМЕНТАЦІЯ] '
labels: documentation, recommendation
assignees: '@docs-team'
---

## Яку документацію потрібно покращити

<!-- Вкажіть, яку частину документації потрібно покращити -->

## Пропоновані зміни

<!-- Опишіть, які саме зміни ви пропонуєте внести -->

## Причина рекомендації

<!-- Чому ці зміни покращать документацію? -->
```

### 2. Налаштування конфігурації шаблонів

Створіть файл `.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Питання щодо проекту
    url: https://github.com/yourusername/yourrepository/discussions/categories/q-a
    about: Будь ласка, задавайте загальні питання у розділі Discussions
  - name: Політика безпеки
    url: https://github.com/yourusername/yourrepository/security/policy
    about: Будь ласка, ознайомтеся з нашою політикою безпеки перед повідомленням про вразливості
```

## Налаштування ролей та дозволів

### 1. Створення команд з різними рівнями доступу

1. Перейдіть до налаштувань організації: **Settings > Organizations > [Your Organization] > Teams**
2. Створіть наступні команди:
   - `recommendation-reviewers` - для рев'ю рекомендацій
   - `security-team` - для рев'ю рекомендацій з безпеки
   - `docs-team` - для рев'ю рекомендацій з документації

### 2. Налаштування дозволів для репозиторію

1. Перейдіть до налаштувань репозиторію: **Settings > Manage access**
2. Додайте створені команди з відповідними рівнями доступу:
   - `recommendation-reviewers` - роль **Triage**
   - `security-team` - роль **Triage** або **Write** (залежно від потреб)
   - `docs-team` - роль **Triage** або **Write** (залежно від потреб)

## Налаштування автоматизації для обробки рекомендацій

### 1. Створення GitHub Actions для автоматичного тегування та призначення

Створіть файл `.github/workflows/issue-management.yml`:

```yaml
name: Issue Management

on:
  issues:
    types: [opened, labeled, unlabeled]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-label issues
        uses: actions/github-script@v6
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            const issue = context.payload.issue;

            // Автоматичне додавання мітки "needs-triage" для нових issues
            if (context.payload.action === 'opened') {
              await github.rest.issues.addLabels({
                issue_number: issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: ['needs-triage']
              });
              
              // Додавання коментаря з подякою
              await github.rest.issues.createComment({
                issue_number: issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: 'Дякуємо за вашу рекомендацію! Наша команда розгляне її найближчим часом.'
              });
            }

            // Логіка для призначення відповідальних осіб на основі міток
            const securityLabels = ['security', 'безпека'];
            const docLabels = ['documentation', 'документація'];

            const hasSecurityLabel = issue.labels.some(label => 
              securityLabels.includes(label.name.toLowerCase()));

            const hasDocLabel = issue.labels.some(label => 
              docLabels.includes(label.name.toLowerCase()));

            if (hasSecurityLabel) {
              // Призначення команди безпеки
              try {
                await github.rest.issues.addAssignees({
                  issue_number: issue.number,
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  assignees: ['security-team-lead']
                });
              } catch (error) {
                console.log('Помилка при призначенні команди безпеки:', error);
              }
            } else if (hasDocLabel) {
              // Призначення команди документації
              try {
                await github.rest.issues.addAssignees({
                  issue_number: issue.number,
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  assignees: ['docs-team-lead']
                });
              } catch (error) {
                console.log('Помилка при призначенні команди документації:', error);
              }
            }
```

### 2. Налаштування автоматичного аудиту дій з рекомендаціями

Створіть файл `.github/workflows/issue-audit.yml`:

```yaml
name: Issue Audit

on:
  issues:
    types:
      [
        opened,
        edited,
        deleted,
        transferred,
        pinned,
        unpinned,
        closed,
        reopened,
        assigned,
        unassigned,
        labeled,
        unlabeled,
        locked,
        unlocked,
      ]
  issue_comment:
    types: [created, edited, deleted]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - name: Log issue activity
        uses: actions/github-script@v6
        with:
          github-token: ${{secrets.GITHUB_TOKEN}}
          script: |
            const payload = context.payload;
            const action = context.payload.action;
            const issueNumber = payload.issue ? payload.issue.number : null;

            // Формування даних для аудиту
            const auditData = {
              timestamp: new Date().toISOString(),
              action: action,
              issueNumber: issueNumber,
              user: payload.sender.login,
              eventType: context.eventName,
              details: {}
            };

            // Додавання специфічних деталей залежно від типу події
            if (context.eventName === 'issues') {
              auditData.details.title = payload.issue.title;
              auditData.details.labels = payload.issue.labels.map(l => l.name);
              if (action === 'edited' && payload.changes) {
                auditData.details.changes = payload.changes;
              }
            } else if (context.eventName === 'issue_comment') {
              auditData.details.commentId = payload.comment.id;
              if (action === 'edited' && payload.changes) {
                auditData.details.changes = payload.changes;
              }
            }

            // В реальному середовищі тут можна відправити дані в систему аудиту
            // Наприклад, через webhook або API
            console.log('Audit data:', JSON.stringify(auditData, null, 2));

            // Для демонстрації додаємо мітку audit-logged
            if (issueNumber) {
              try {
                await github.rest.issues.addLabels({
                  issue_number: issueNumber,
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  labels: ['audit-logged']
                });
              } catch (error) {
                console.log('Помилка при додаванні мітки аудиту:', error);
              }
            }
```

## Налаштування процесу розгляду рекомендацій

### 1. Створення проектної дошки для відстеження рекомендацій

1. Перейдіть до **Projects** у вашому репозиторії
2. Натисніть **New project**
3. Виберіть шаблон **Board**
4. Створіть наступні колонки:
   - **Нові рекомендації**
   - **На розгляді**
   - **Схвалено**
   - **Відхилено**
   - **Впроваджено**

### 2. Автоматизація проектної дошки

Налаштуйте автоматичні правила для дошки:

1. Нові Issues з міткою `recommendation` автоматично додаються в колонку **Нові рекомендації**
2. Issues з міткою `in-review` переміщуються в колонку **На розгляді**
3. Issues з міткою `approved` переміщуються в колонку **Схвалено**
4. Issues з міткою `rejected` переміщуються в колонку **Відхилено**
5. Закриті Issues з міткою `implemented` переміщуються в колонку **Впроваджено**

## Документація для користувачів

Створіть файл `CONTRIBUTING.md` у корені репозиторію з інструкціями для користувачів:

```markdown
# Як зробити внесок у проект

Дякуємо за ваш інтерес до покращення нашого проекту! Ми цінуємо всі рекомендації та пропозиції.

## Надсилання рекомендацій

1. Перейдіть до розділу [Issues](https://github.com/yourusername/yourrepository/issues)
2. Натисніть **New issue**
3. Виберіть відповідний шаблон для вашої рекомендації:
   - **Загальна рекомендація** - для загальних ідей та пропозицій
   - **Рекомендація з безпеки** - для пропозицій щодо покращення безпеки
   - **Рекомендація щодо документації** - для пропозицій щодо покращення документації
4. Заповніть всі необхідні поля та надайте детальний опис
5. Натисніть **Submit new issue**

## Процес розгляду рекомендацій

1. Після надсилання рекомендації, вона буде розглянута нашою командою
2. Ми можемо задати додаткові питання або попросити уточнення в коментарях
3. Рекомендація може бути схвалена, відхилена або відкладена
4. Якщо рекомендація схвалена, вона буде впроваджена нашою командою

## Політика безпеки

Якщо ви виявили вразливість безпеки, будь ласка, дотримуйтесь нашої [Політики безпеки](SECURITY.md) замість створення публічного Issue.

## Кодекс поведінки

Участь у проекті передбачає дотримання нашого [Кодексу поведінки](CODE_OF_CONDUCT.md).
```

## Відповідність ISO 27001

Ці налаштування відповідають вимогам ISO 27001 щодо контролю доступу та забезпечують:

- Збір рекомендацій від сторонніх користувачів без можливості прямого внесення змін
- Чіткий процес розгляду та схвалення рекомендацій
- Повний аудит всіх дій з рекомендаціями
- Розподіл обов'язків між різними командами
- Автоматизацію процесів для зменшення ризику людської помилки

## Додаткові заходи безпеки

- Регулярно перевіряйте журнали доступу до репозиторію
- Проводьте періодичний аудит прав доступу
- Оновлюйте шаблони та процеси на основі зворотного зв'язку
- Забезпечте навчання команди щодо обробки рекомендацій згідно з вимогами ISO 27001
