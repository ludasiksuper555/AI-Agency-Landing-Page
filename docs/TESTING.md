# Руководство по тестированию

## Обзор

Этот документ описывает стратегию тестирования, инструменты и лучшие практики для AI Agency Landing Page.

## 🧪 Стратегия тестирования

### Пирамида тестирования

```
    /\     E2E Tests (10%)
   /  \    - Cypress
  /____\   - Playwright
 /      \  Integration Tests (20%)
/        \ - React Testing Library
\        / - API Tests
 \______/  Unit Tests (70%)
          - Jest
          - Component Tests
```

### Типы тестов

1. **Unit Tests (70%)** - Тестирование отдельных функций и компонентов
2. **Integration Tests (20%)** - Тестирование взаимодействия между компонентами
3. **E2E Tests (10%)** - Тестирование пользовательских сценариев

## 🛠️ Инструменты тестирования

### Jest

- **Назначение**: Unit и Integration тесты
- **Конфигурация**: `jest.config.js`
- **Покрытие кода**: Встроенная поддержка

### React Testing Library

- **Назначение**: Тестирование React компонентов
- **Философия**: Тестирование поведения, а не реализации
- **Утилиты**: `render`, `screen`, `fireEvent`, `waitFor`

### Cypress

- **Назначение**: E2E тестирование
- **Конфигурация**: `cypress.config.js`
- **Особенности**: Визуальное тестирование, временные путешествия

### Storybook

- **Назначение**: Визуальное тестирование компонентов
- **Интеграция**: Автоматические тесты взаимодействия
- **Документация**: Живая документация компонентов

## 📁 Структура тестов

```
project/
├── __tests__/                 # Unit тесты
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── hooks/
├── cypress/                   # E2E тесты
│   ├── e2e/
│   ├── fixtures/
│   ├── support/
│   └── plugins/
├── stories/                   # Storybook тесты
│   ├── components/
│   └── pages/
└── test-utils/               # Тестовые утилиты
    ├── setup.ts
    ├── mocks/
    └── helpers/
```

## 🧩 Unit тестирование

### Тестирование компонентов

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('applies correct variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

### Тестирование утилит

```typescript
// __tests__/utils/formatters.test.ts
import { formatDate, formatNumber, slugify } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-12-25');
      expect(formatDate(date)).toBe('December 25, 2023');
    });
  });

  describe('formatNumber', () => {
    it('formats large numbers with commas', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
  });

  describe('slugify', () => {
    it('converts text to URL-friendly slug', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('AI & Machine Learning')).toBe('ai-machine-learning');
    });
  });
});
```

### Тестирование хуков

```typescript
// __tests__/hooks/useLocalStorage.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when no stored value exists', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('stores and retrieves values', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('new value');
    });

    expect(result.current[0]).toBe('new value');
    expect(localStorage.getItem('test-key')).toBe('"new value"');
  });
});
```

## 🔗 Integration тестирование

### Тестирование страниц

```typescript
// __tests__/pages/HomePage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from '@/pages/index';
import { mockApiResponse } from '@/test-utils/mocks';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Home Page', () => {
  beforeEach(() => {
    mockApiResponse('/api/hero', { title: 'Welcome to AI Agency' });
  });

  it('renders hero section', async () => {
    render(<HomePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Welcome to AI Agency')).toBeInTheDocument();
    });
  });

  it('displays services section', () => {
    render(<HomePage />, { wrapper: createWrapper() });
    expect(screen.getByTestId('services-section')).toBeInTheDocument();
  });
});
```

### Тестирование API

```typescript
// __tests__/api/contact.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/contact';

describe('/api/contact', () => {
  it('handles POST request successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      success: true,
      message: 'Message sent successfully',
    });
  });

  it('validates required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'John Doe' }, // Missing email and message
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Missing required fields',
    });
  });
});
```

## 🎭 E2E тестирование

### Cypress тесты

```typescript
// cypress/e2e/homepage.cy.ts
describe('Homepage E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('displays hero section and CTA', () => {
    cy.get('[data-testid="hero-section"]').should('be.visible');
    cy.get('[data-testid="cta-button"]').should('contain.text', 'Get Started').should('be.visible');
  });

  it('navigates to contact page', () => {
    cy.get('[data-testid="contact-link"]').click();
    cy.url().should('include', '/contact');
    cy.get('h1').should('contain.text', 'Contact Us');
  });

  it('submits contact form', () => {
    cy.visit('/contact');

    cy.get('[data-testid="name-input"]').type('John Doe');
    cy.get('[data-testid="email-input"]').type('john@example.com');
    cy.get('[data-testid="message-input"]').type('Hello, I need help with AI solutions.');

    cy.get('[data-testid="submit-button"]').click();

    cy.get('[data-testid="success-message"]')
      .should('be.visible')
      .should('contain.text', 'Message sent successfully');
  });

  it('is responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="desktop-navigation"]').should('not.be.visible');
  });
});
```

### Accessibility тесты

```typescript
// cypress/e2e/accessibility.cy.ts
describe('Accessibility Tests', () => {
  it('has no accessibility violations on homepage', () => {
    cy.visit('/');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('supports keyboard navigation', () => {
    cy.visit('/');

    // Tab through navigation
    cy.get('body').tab();
    cy.focused().should('contain.text', 'Home');

    cy.focused().tab();
    cy.focused().should('contain.text', 'Services');

    cy.focused().tab();
    cy.focused().should('contain.text', 'About');
  });

  it('has proper ARIA labels', () => {
    cy.visit('/');

    cy.get('[data-testid="main-navigation"]').should('have.attr', 'aria-label', 'Main navigation');

    cy.get('[data-testid="hero-heading"]')
      .should('have.attr', 'role', 'heading')
      .should('have.attr', 'aria-level', '1');
  });
});
```

## 📊 Visual тестирование

### Storybook тесты

```typescript
// stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { expect } from '@storybook/jest';
import { within, userEvent } from '@storybook/testing-library';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await expect(button).toBeInTheDocument();
    await expect(button).toHaveClass('bg-blue-600');

    await userEvent.click(button);
    await expect(button).toHaveFocus();
  },
};

export const Interactive: Story = {
  args: {
    children: 'Click me',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Test hover state
    await userEvent.hover(button);
    await expect(button).toHaveClass('hover:bg-blue-700');

    // Test click
    await userEvent.click(button);

    // Test keyboard interaction
    await userEvent.keyboard('{Enter}');
  },
};
```

## 🔧 Настройка тестовой среды

### Jest конфигурация

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/test-utils/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Тестовые утилиты

```typescript
// test-utils/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Mock Service Worker

```typescript
// test-utils/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// test-utils/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/contact', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Message sent successfully',
      })
    );
  }),

  rest.get('/api/hero', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        title: 'Welcome to AI Agency',
        subtitle: 'Transform your business with AI',
        cta: 'Get Started',
      })
    );
  }),
];
```

## 📈 Покрытие кода

### Цели покрытия

- **Общее покрытие**: 80%+
- **Функции**: 80%+
- **Ветки**: 80%+
- **Строки**: 80%+

### Генерация отчетов

```bash
# Запуск тестов с покрытием
npm run test:coverage

# Просмотр HTML отчета
open coverage/lcov-report/index.html
```

### Исключения из покрытия

```javascript
// Исключить файл из покрытия
/* istanbul ignore file */

// Исключить функцию
/* istanbul ignore next */
function debugFunction() {
  console.log('Debug info');
}

// Исключить ветку
if (process.env.NODE_ENV === 'development') {
  /* istanbul ignore next */
  console.log('Development mode');
}
```

## 🚀 Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Build Storybook
        run: npm run build-storybook

      - name: Run Storybook tests
        run: npm run storybook:test

  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          wait-on: 'http://localhost:3000'
          browser: chrome
```

## 🎯 Лучшие практики

### Принципы тестирования

1. **AAA Pattern**: Arrange, Act, Assert
2. **Given-When-Then**: BDD подход
3. **Test Pyramid**: Больше unit тестов, меньше E2E
4. **Fail Fast**: Быстрое обнаружение проблем

### Именование тестов

```typescript
// ❌ Плохо
it('test button', () => {});

// ✅ Хорошо
it('should call onClick handler when button is clicked', () => {});
it('should display loading spinner when loading prop is true', () => {});
it('should be disabled when disabled prop is true', () => {});
```

### Организация тестов

```typescript
describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with correct text', () => {});
    it('should apply correct CSS classes', () => {});
  });

  describe('Interactions', () => {
    it('should handle click events', () => {});
    it('should handle keyboard events', () => {});
  });

  describe('States', () => {
    it('should show loading state', () => {});
    it('should show disabled state', () => {});
  });
});
```

### Моки и заглушки

```typescript
// ✅ Мокать внешние зависимости
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
  }),
}));

// ✅ Использовать MSW для API
const server = setupServer(
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ data: 'test' }));
  })
);

// ❌ Избегать мокания внутренней логики
// jest.mock('./utils', () => ({ calculate: jest.fn() }));
```

## 🔍 Отладка тестов

### Полезные команды

```bash
# Запуск конкретного теста
npm test -- Button.test.tsx

# Запуск в watch режиме
npm run test:watch

# Отладка с verbose выводом
npm test -- --verbose

# Обновление снапшотов
npm test -- --updateSnapshot
```

### Отладка в VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## 📚 Ресурсы

### Документация

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)
- [Storybook Testing](https://storybook.js.org/docs/react/writing-tests/introduction)

### Полезные библиотеки

- `@testing-library/user-event` - Симуляция пользовательских действий
- `@testing-library/jest-dom` - Дополнительные матчеры для Jest
- `msw` - Mock Service Worker для API мокинга
- `cypress-axe` - Accessibility тестирование

## 📞 Поддержка

По вопросам тестирования:

- Email: qa@ai-agency.com
- Slack: #testing
- Wiki: https://wiki.ai-agency.com/testing
