# Стандарты импортов и экспортов

## Общие принципы

### 1. Правила экспорта

#### Default exports

Используйте **default export** для:

- Страниц Next.js (`pages/**`)
- Основных компонентов UI
- Storybook файлов (`*.stories.*`)
- Конфигурационных файлов (`*.config.*`)

```typescript
// ✅ Правильно - страница
// pages/index.tsx
const HomePage = () => {
  return <div>Home</div>;
};

export default HomePage;

// ✅ Правильно - основной компонент
// components/Button.tsx
const Button = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};

export default Button;
```

#### Named exports

Используйте **named export** для:

- Провайдеров контекста
- Хуков
- Утилит и хелперов
- Типов и интерфейсов
- Констант

```typescript
// ✅ Правильно - провайдер
// components/NotificationProvider.tsx
export const NotificationProvider = ({ children }) => {
  // ...
};

export const useNotifications = () => {
  // ...
};

// ✅ Правильно - утилиты
// utils/helpers.ts
export const formatDate = (date: Date) => {
  // ...
};

export const validateEmail = (email: string) => {
  // ...
};
```

### 2. Правила импорта

#### Соответствие типу экспорта

```typescript
// ✅ Правильно - default import для default export
import Button from '../components/Button';

// ✅ Правильно - named import для named export
import { NotificationProvider, useNotifications } from '../components/NotificationProvider';

// ❌ Неправильно - default import для named export
import NotificationProvider from '../components/NotificationProvider';

// ❌ Неправильно - named import для default export
import { Button } from '../components/Button';
```

#### Порядок импортов

1. Внешние библиотеки
2. Внутренние модули (абсолютные пути)
3. Относительные импорты

```typescript
// ✅ Правильный порядок
import React from 'react';
import { NextPage } from 'next';
import { QueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/apiClient';
import { formatDate } from '@/utils/helpers';

import Layout from '../components/Layout';
import { NotificationProvider } from '../components/NotificationProvider';
```

### 3. Специальные случаи

#### Компоненты с множественными экспортами

Для компонентов, которые экспортируют и основной компонент, и хуки:

```typescript
// components/ThemeProvider.tsx
export const ThemeProvider = ({ children }) => {
  // ...
};

export const useTheme = () => {
  // ...
};

// Также можно добавить default export для удобства
export default ThemeProvider;
```

#### Индексные файлы

Используйте для группировки связанных экспортов:

```typescript
// components/Recommendations/index.ts
export { default as CreateRecommendation } from './CreateRecommendation';
export { default as RecommendationDetail } from './RecommendationDetail';
export { default as RecommendationsList } from './RecommendationsList';
export { default as RecommendationsSystem } from './RecommendationsSystem';

// Использование
import { CreateRecommendation, RecommendationsList } from '../components/Recommendations';
```

## Настройка инструментов

### ESLint правила

```javascript
// .eslintrc.js
rules: {
  'import/no-default-export': ['error', {
    allow: ['pages/**', '**/*.stories.*', '**/*.config.*']
  }],
  'import/prefer-default-export': 'off',
  'import/no-duplicates': 'error',
  'import/named': 'error',
  'import/default': 'error',
}
```

### TypeScript настройки

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### VS Code настройки

```json
// .vscode/settings.json
{
  "typescript.preferences.organizeImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

## Диагностика проблем

### Частые ошибки

1. **"Element type is invalid"**

   - Причина: Неправильный тип импорта
   - Решение: Проверить тип экспорта в исходном файле

2. **"Module not found"**

   - Причина: Неправильный путь или отсутствующий файл
   - Решение: Проверить путь и существование файла

3. **"Cannot read property of undefined"**
   - Причина: Named import для default export
   - Решение: Изменить на правильный тип импорта

### Быстрая проверка

```bash
# Проверка всех импортов в проекте
npx eslint . --ext .ts,.tsx --fix

# Проверка TypeScript ошибок
npx tsc --noEmit

# Поиск проблемных импортов
grep -r "import.*from.*components" --include="*.tsx" --include="*.ts" .
```

## Миграция существующего кода

### Пошаговый план

1. Запустить ESLint с новыми правилами
2. Исправить ошибки импортов по приоритету:
   - Критические (ломают сборку)
   - Предупреждения (потенциальные проблемы)
3. Обновить документацию компонентов
4. Добавить тесты для проверки импортов

### Автоматизация

```bash
# Скрипт для автоматического исправления
npm run lint:fix
npm run type-check
npm run test:imports
```

Этот документ должен регулярно обновляться при изменении архитектуры проекта.
