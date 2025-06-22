# Error Handling API Documentation

## Обзор

Система обработки ошибок включает в себя:

- **ErrorBoundary** - React компонент для перехвата ошибок
- **API эндпоинт** `/api/errors` - для логирования ошибок
- **useErrorHandler** - хук для функциональных компонентов
- **withErrorBoundary** - HOC для оборачивания компонентов

## ErrorBoundary Component

### Базовое использование

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### С кастомным fallback UI

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

const CustomErrorFallback = () => (
  <div className="p-4 text-center">
    <h2>Упс! Что-то пошло не так</h2>
    <p>Пожалуйста, попробуйте позже</p>
  </div>
);

function App() {
  return (
    <ErrorBoundary fallback={<CustomErrorFallback />}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### С обработчиком ошибок

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

const handleError = (error: Error, errorInfo: ErrorInfo) => {
  // Отправить в аналитику
  analytics.track('error_occurred', {
    error: error.message,
    component: errorInfo.componentStack,
  });
};

function App() {
  return (
    <ErrorBoundary onError={handleError}>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## useErrorHandler Hook

### Использование в функциональных компонентах

```tsx
import { useErrorHandler } from '@/components/ErrorBoundary';

function MyComponent() {
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      // Обработка данных
    } catch (error) {
      handleError(error as Error);
    }
  };

  return <button onClick={fetchData}>Загрузить данные</button>;
}
```

## withErrorBoundary HOC

### Оборачивание компонента

```tsx
import { withErrorBoundary } from '@/components/ErrorBoundary';

const MyComponent = () => {
  return <div>Мой компонент</div>;
};

// Оборачиваем компонент в ErrorBoundary
export default withErrorBoundary(MyComponent);
```

### С кастомными параметрами

```tsx
import { withErrorBoundary } from '@/components/ErrorBoundary';

const MyComponent = () => {
  return <div>Мой компонент</div>;
};

const CustomFallback = () => <div>Ошибка в MyComponent</div>;

const handleError = (error: Error) => {
  console.log('Error in MyComponent:', error);
};

export default withErrorBoundary(MyComponent, <CustomFallback />, handleError);
```

## API Endpoint: /api/errors

### Описание

Эндпоинт для логирования ошибок клиентского приложения.

**URL:** `POST /api/errors`

### Параметры запроса

```typescript
interface ErrorLogData {
  message: string; // Обязательно: сообщение об ошибке
  stack?: string; // Stack trace ошибки
  componentStack?: string; // React component stack
  timestamp: string; // Обязательно: время ошибки (ISO string)
  userAgent: string; // Обязательно: User Agent браузера
  url: string; // Обязательно: URL страницы
  userId?: string; // ID пользователя (если авторизован)
  sessionId?: string; // ID сессии
}
```

### Пример запроса

```javascript
fetch('/api/errors', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Cannot read property 'map' of undefined",
    stack: "TypeError: Cannot read property 'map' of undefined\n    at Component.render",
    componentStack: '    in Component (at App.js:10)\n    in App (at index.js:5)',
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: 'user_123',
    sessionId: 'session_456',
  }),
});
```

### Ответы

#### Успешный ответ (200)

```json
{
  "success": true,
  "message": "Error logged successfully",
  "errorId": "error_1642248600000_abc123"
}
```

#### Ошибка валидации (400)

```json
{
  "success": false,
  "message": "Missing required fields: message, timestamp, userAgent, url"
}
```

#### Метод не разрешен (405)

```json
{
  "success": false,
  "message": "Method not allowed. Only POST requests are accepted."
}
```

#### Внутренняя ошибка сервера (500)

```json
{
  "success": false,
  "message": "Internal server error while logging error"
}
```

## Интеграция в Layout

ErrorBoundary уже интегрирован в основной Layout компонент:

```tsx
// components/Layout.tsx
import ErrorBoundary from './ErrorBoundary';

const Layout: React.FC<LayoutProps> = ({ children, seo }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {seo && <SEO {...seo} />}
      <Header />
      <ErrorBoundary>
        <main className="flex-grow">{children}</main>
      </ErrorBoundary>
      <Footer />
    </div>
  );
};
```

## Лучшие практики

### 1. Гранулярные ErrorBoundary

```tsx
// Оборачивайте отдельные секции
function Dashboard() {
  return (
    <div>
      <ErrorBoundary fallback={<div>Ошибка в сайдбаре</div>}>
        <Sidebar />
      </ErrorBoundary>

      <ErrorBoundary fallback={<div>Ошибка в основном контенте</div>}>
        <MainContent />
      </ErrorBoundary>
    </div>
  );
}
```

### 2. Логирование контекста

```tsx
const handleError = (error: Error, errorInfo: ErrorInfo) => {
  // Добавляем контекст приложения
  const context = {
    userId: getCurrentUserId(),
    route: window.location.pathname,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    // Другие полезные данные
  };

  // Отправляем в систему логирования
  logError(error, { ...errorInfo, context });
};
```

### 3. Разные fallback для разных типов ошибок

```tsx
const getErrorFallback = (error: Error) => {
  if (error.message.includes('ChunkLoadError')) {
    return <ChunkLoadErrorFallback />;
  }

  if (error.message.includes('Network')) {
    return <NetworkErrorFallback />;
  }

  return <GenericErrorFallback />;
};
```

## Мониторинг и алерты

### Критические ошибки

Система автоматически определяет критические ошибки по ключевым словам:

- `ChunkLoadError`
- `Network Error`
- `Failed to fetch`
- `Script error`
- `SecurityError`

### Интеграция с внешними сервисами

```typescript
// Пример интеграции с Sentry
import * as Sentry from '@sentry/react';

const handleError = (error: Error, errorInfo: ErrorInfo) => {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
};
```

## Тестирование

### Тестирование ErrorBoundary

```tsx
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

test('ErrorBoundary catches and displays error', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

  render(
    <ErrorBoundary>
      <ThrowError shouldThrow={true} />
    </ErrorBoundary>
  );

  expect(screen.getByText(/что-то пошло не так/i)).toBeInTheDocument();

  consoleSpy.mockRestore();
});
```
