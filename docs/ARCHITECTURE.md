# Архитектура проекта

Этот документ описывает архитектуру и структуру проекта, включая принципы проектирования, паттерны и организацию кода.

## Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Структура проекта](#структура-проекта)
3. [Слои приложения](#слои-приложения)
4. [Паттерны проектирования](#паттерны-проектирования)
5. [Управление состоянием](#управление-состоянием)
6. [Маршрутизация](#маршрутизация)
7. [Интернационализация](#интернационализация)
8. [Производительность](#производительность)
9. [Безопасность](#безопасность)
10. [Развертывание](#развертывание)

## Обзор архитектуры

### Технологический стек

- **Frontend Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Internationalization**: next-i18next
- **Build Tool**: Next.js встроенный Webpack
- **Package Manager**: npm

### Архитектурные принципы

1. **Модульность**: Код организован в независимые модули
2. **Разделение ответственности**: Четкое разделение логики, представления и данных
3. **Переиспользование**: Компоненты и утилиты максимально переиспользуемы
4. **Типобезопасность**: Строгая типизация с TypeScript
5. **Производительность**: Оптимизация загрузки и рендеринга
6. **Доступность**: Соответствие стандартам WCAG

## Структура проекта

```
project-root/
├── public/                  # Статические файлы
│   ├── locales/            # Файлы переводов
│   │   ├── en/
│   │   ├── de/
│   │   ├── pl/
│   │   └── uk/
│   └── images/             # Изображения
├── src/
│   ├── components/         # React компоненты
│   │   ├── common/        # Общие компоненты
│   │   ├── forms/         # Формы
│   │   ├── layout/        # Компоненты макета
│   │   └── sections/      # Секции страниц
│   ├── hooks/             # Кастомные хуки
│   ├── lib/               # Библиотеки и утилиты
│   ├── pages/             # Страницы Next.js
│   ├── styles/            # Глобальные стили
│   ├── types/             # TypeScript типы
│   └── utils/             # Утилитарные функции
├── docs/                  # Документация
├── __tests__/             # Тесты
└── config files           # Конфигурационные файлы
```

## Слои приложения

### 1. Слой представления (Presentation Layer)

**Компоненты**: `src/components/`

```typescript
// Пример структуры компонента
interface ComponentProps {
  // Типизированные пропсы
}

const Component: React.FC<ComponentProps> = props => {
  // Локальное состояние
  // Эффекты
  // Обработчики событий
  // JSX рендеринг
};

export default Component;
```

**Ответственности**:

- Рендеринг UI
- Обработка пользовательского ввода
- Локальное состояние компонентов
- Взаимодействие с хуками

### 2. Слой бизнес-логики (Business Logic Layer)

**Кастомные хуки**: `src/hooks/`

```typescript
// Пример кастомного хука
const useBusinessLogic = (params: Params) => {
  const [state, setState] = useState(initialState);

  const businessMethod = useCallback(() => {
    // Бизнес-логика
  }, [dependencies]);

  return {
    state,
    businessMethod,
    // Другие методы и состояния
  };
};
```

**Ответственности**:

- Бизнес-правила
- Валидация данных
- Состояние приложения
- Взаимодействие с API

### 3. Слой данных (Data Layer)

**API клиенты**: `src/lib/api/`
**Утилиты**: `src/utils/`

```typescript
// Пример API клиента
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    // HTTP GET запрос
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    // HTTP POST запрос
  }
}
```

**Ответственности**:

- HTTP запросы
- Кэширование данных
- Трансформация данных
- Обработка ошибок

## Паттерны проектирования

### 1. Component Composition

```typescript
// Базовый компонент
const Card = ({ children, className }) => (
  <div className={`card ${className}`}>
    {children}
  </div>
);

// Композитные компоненты
const CardHeader = ({ children }) => (
  <div className="card-header">{children}</div>
);

const CardBody = ({ children }) => (
  <div className="card-body">{children}</div>
);

// Использование
<Card>
  <CardHeader>Заголовок</CardHeader>
  <CardBody>Содержимое</CardBody>
</Card>
```

### 2. Render Props

```typescript
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean, error: string | null) => React.ReactNode;
}

const DataFetcher = <T,>({ url, children }: DataFetcherProps<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Логика загрузки данных

  return <>{children(data, loading, error)}</>;
};
```

### 3. Higher-Order Components (HOC)

```typescript
const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Please log in</div>;

    return <Component {...props} />;
  };
};

// Использование
const ProtectedComponent = withAuth(MyComponent);
```

### 4. Custom Hooks Pattern

```typescript
// Хук для управления формой
const useForm = <T>(initialValues: T, validationSchema?: ValidationSchema<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (field: keyof T) => (value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));

    if (validationSchema) {
      const fieldErrors = validateField(field, value, validationSchema);
      setErrors(prev => ({ ...prev, [field]: fieldErrors }));
    }
  };

  const handleBlur = (field: keyof T) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isValid: Object.keys(errors).length === 0,
  };
};
```

## Управление состоянием

### 1. Локальное состояние компонентов

```typescript
const Component = () => {
  const [localState, setLocalState] = useState(initialValue);

  // Используется для:
  // - UI состояние (открыт/закрыт модал)
  // - Временные данные формы
  // - Локальные флаги
};
```

### 2. React Context для глобального состояния

```typescript
// Контекст темы
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### 3. Server State с SWR/React Query

```typescript
// Хук для работы с серверными данными
const useUsers = () => {
  const { data, error, mutate } = useSWR('/api/users', fetcher);

  return {
    users: data,
    loading: !error && !data,
    error,
    refetch: mutate,
  };
};
```

## Маршрутизация

### Структура маршрутов

```
pages/
├── index.tsx              # Главная страница (/)
├── about.tsx              # О нас (/about)
├── services/
│   ├── index.tsx          # Услуги (/services)
│   └── [slug].tsx         # Конкретная услуга (/services/[slug])
├── contact.tsx            # Контакты (/contact)
└── _app.tsx               # Корневой компонент приложения
```

### Динамические маршруты

```typescript
// pages/services/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next';

interface ServicePageProps {
  service: Service;
}

const ServicePage: React.FC<ServicePageProps> = ({ service }) => {
  return (
    <div>
      <h1>{service.title}</h1>
      <p>{service.description}</p>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const services = await getServices();
  const paths = services.map(service => ({
    params: { slug: service.slug },
  }));

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const service = await getServiceBySlug(params?.slug as string);

  return {
    props: {
      service,
    },
  };
};

export default ServicePage;
```

## Интернационализация

### Структура переводов

```json
// public/locales/en/common.json
{
  "navigation": {
    "home": "Home",
    "about": "About",
    "services": "Services",
    "contact": "Contact"
  },
  "hero": {
    "title": "Welcome to Our Website",
    "description": "We provide excellent services"
  }
}
```

### Использование переводов

```typescript
import { useTranslation } from 'next-i18next';

const Component = () => {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.description')}</p>
    </div>
  );
};
```

### Конфигурация i18n

```javascript
// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'uk',
    locales: ['uk', 'en', 'de', 'pl'],
  },
  fallbackLng: {
    default: ['en'],
  },
  debug: process.env.NODE_ENV === 'development',
};
```

## Производительность

### 1. Code Splitting

```typescript
// Динамический импорт компонентов
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Отключить SSR для клиентских компонентов
});
```

### 2. Мемоизация

```typescript
// Мемоизация компонентов
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Дорогой рендеринг */}</div>;
});

// Мемоизация вычислений
const processedData = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// Мемоизация функций
const handleClick = useCallback((id: string) => {
  onClick(id);
}, [onClick]);
```

### 3. Оптимизация изображений

```typescript
import Image from 'next/image';

const OptimizedImage = () => (
  <Image
    src="/images/hero.jpg"
    alt="Hero image"
    width={800}
    height={600}
    priority // Для изображений above the fold
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
  />
);
```

## Безопасность

### 1. Валидация данных

```typescript
// Схема валидации
interface UserInput {
  name: string;
  email: string;
  age: number;
}

const validateUserInput = (input: unknown): UserInput => {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input');
  }

  const { name, email, age } = input as Record<string, unknown>;

  if (typeof name !== 'string' || name.length < 2) {
    throw new Error('Invalid name');
  }

  if (typeof email !== 'string' || !isValidEmail(email)) {
    throw new Error('Invalid email');
  }

  if (typeof age !== 'number' || age < 0 || age > 150) {
    throw new Error('Invalid age');
  }

  return { name, email, age };
};
```

### 2. Санитизация

```typescript
// Санитизация HTML
const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Компонент для безопасного отображения HTML
const SafeHtml: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = useMemo(() => sanitizeHtml(content), [content]);

  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};
```

### 3. CSP (Content Security Policy)

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## Развертывание

### 1. Сборка проекта

```bash
# Установка зависимостей
npm install

# Проверка типов
npm run type-check

# Линтинг
npm run lint

# Тестирование
npm run test

# Сборка
npm run build

# Запуск продакшн сервера
npm start
```

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
```

### 3. Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

## Мониторинг и аналитика

### 1. Производительность

```typescript
// Мониторинг Web Vitals
export function reportWebVitals(metric: NextWebVitalsMetric) {
  switch (metric.name) {
    case 'FCP':
      // First Contentful Paint
      break;
    case 'LCP':
      // Largest Contentful Paint
      break;
    case 'CLS':
      // Cumulative Layout Shift
      break;
    case 'FID':
      // First Input Delay
      break;
    case 'TTFB':
      // Time to First Byte
      break;
    default:
      break;
  }

  // Отправка метрик в аналитику
  analytics.track(metric.name, {
    value: metric.value,
    label: metric.label,
  });
}
```

### 2. Обработка ошибок

```typescript
// Error Boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Логирование ошибки
    console.error('Error caught by boundary:', error, errorInfo);

    // Отправка ошибки в систему мониторинга
    errorReporting.captureException(error, {
      extra: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Что-то пошло не так</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Заключение

Эта архитектура обеспечивает:

- **Масштабируемость**: Модульная структура позволяет легко добавлять новые функции
- **Поддерживаемость**: Четкое разделение ответственности упрощает сопровождение
- **Производительность**: Оптимизации на всех уровнях
- **Безопасность**: Встроенные механизмы защиты
- **Доступность**: Соответствие стандартам веб-доступности
- **Интернационализация**: Поддержка множественных языков

Регулярно пересматривайте и обновляйте архитектуру в соответствии с ростом проекта и появлением новых требований.
