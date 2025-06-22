# Улучшенные стандарты кодирования

## TypeScript

### Строгая типизация

#### ❌ Избегать

```typescript
// Использование any
const data: any = fetchData();
function processData(input: any): any {
  return input.someProperty;
}

// Неявные типы
const items = [];
const config = {};
```

#### ✅ Правильно

```typescript
// Явные типы
interface UserData {
  id: string;
  name: string;
  email: string;
}

const data: UserData = fetchData();
function processData(input: UserData): string {
  return input.name;
}

// Типизированные коллекции
const items: UserData[] = [];
const config: Record<string, string> = {};
```

### Использование утилитарных типов

```typescript
// Из types/common.ts
import type { UnknownRecord, ApiResponse, ComponentProps, EventHandler } from '../types/common';

// Вместо any используйте подходящие типы
function handleApiResponse(response: ApiResponse<UserData>): void {
  // ...
}

function createComponent(props: ComponentProps): JSX.Element {
  // ...
}
```

### Обработка событий

```typescript
// Типизированные обработчики событий
const handleClick: EventHandler<MouseEvent> = event => {
  event.preventDefault();
  // ...
};

const handleChange: ChangeHandler = event => {
  setValue(event.target.value);
};
```

## React компоненты

### Типизация пропсов

```typescript
interface ButtonProps extends BaseComponentProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: EventHandler<MouseEvent>;
}

const Button: React.FC<ButtonProps> = ({
  variant,
  size = 'md',
  disabled = false,
  onClick,
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        { 'btn-disabled': disabled },
        className
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
```

### Хуки с типизацией

```typescript
// Типизированный useState
const [user, setUser] = useState<UserData | null>(null);
const [loading, setLoading] = useState<boolean>(false);
const [errors, setErrors] = useState<string[]>([]);

// Типизированный useCallback
const handleSubmit = useCallback<SubmitHandler>(event => {
  event.preventDefault();
  // ...
}, []);

// Типизированный useEffect
useEffect(() => {
  const fetchUser = async (): Promise<void> => {
    try {
      const userData = await api.getUser(userId);
      setUser(userData);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Unknown error']);
    }
  };

  fetchUser();
}, [userId]);
```

## API и асинхронные операции

### Типизированные API вызовы

```typescript
// API клиент с типизацией
class ApiClient {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(endpoint);
    return response.json();
  }

  async post<T, D = UnknownRecord>(endpoint: string, data: D): Promise<ApiResponse<T>> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

// Использование
const api = new ApiClient();
const users = await api.get<UserData[]>('/api/users');
const newUser = await api.post<UserData, CreateUserData>('/api/users', userData);
```

### Обработка ошибок

```typescript
// Типизированные ошибки
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: UnknownRecord
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Обработка с типизацией
try {
  const result = await api.getData();
  return result;
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode}: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error('Unknown error occurred');
  }
  throw error;
}
```

## Валидация и формы

### Типизированная валидация

```typescript
interface LoginFormData {
  email: string;
  password: string;
}

const validateLoginForm = (data: LoginFormData): ValidationResult => {
  const errors: string[] = [];

  if (!data.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else if (data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: {
      email: data.email.toLowerCase().trim(),
      password: data.password,
    },
  };
};
```

## Тестирование

### Типизированные моки

```typescript
// Mock функции с типизацией
const mockApiCall = jest.fn<Promise<ApiResponse<UserData>>, [string]>();
const mockEventHandler = jest.fn<void, [MouseEvent]>();

// Mock компоненты
const MockComponent: React.FC<MockComponentProps> = ({ children, ...props }) => (
  <div data-testid="mock-component" {...props}>
    {children}
  </div>
);

// Типизированные тесты
describe('UserComponent', () => {
  it('should render user data correctly', () => {
    const mockUser: UserData = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    };

    render(<UserComponent user={mockUser} />);

    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });
});
```

## Конфигурация и константы

### Типизированная конфигурация

```typescript
interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    analytics: boolean;
    darkMode: boolean;
    notifications: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'en' | 'uk' | 'ru';
  };
}

const config: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 5000,
    retries: 3,
  },
  features: {
    analytics: process.env.NODE_ENV === 'production',
    darkMode: true,
    notifications: true,
  },
  ui: {
    theme: 'auto',
    language: 'en',
  },
};
```

## Утилиты и хелперы

### Типизированные утилиты

```typescript
// Типизированные утилиты для работы с данными
function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

// Типизированные предикаты
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

// Использование
const users: (UserData | null)[] = await Promise.all(userIds.map(fetchUser));
const validUsers = users.filter(isNotNull);
const usersByRole = groupBy(validUsers, 'role');
```

## ESLint правила

В `.eslintrc.json` добавлены строгие правила:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/ban-types": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error"
  }
}
```

## Рекомендации

1. **Всегда используйте явные типы** вместо `any`
2. **Создавайте интерфейсы** для всех объектов данных
3. **Используйте утилитарные типы** из `types/common.ts`
4. **Типизируйте все функции** включая параметры и возвращаемые значения
5. **Используйте строгие настройки TypeScript** в `tsconfig.json`
6. **Пишите типизированные тесты** с правильными моками
7. **Документируйте сложные типы** с помощью комментариев
8. **Используйте type guards** для проверки типов во время выполнения
9. **Избегайте type assertions** (`as`) без крайней необходимости
10. **Регулярно обновляйте типы** при изменении API или структур данных

## Инструменты для проверки

- `npm run type-check` - проверка типов TypeScript
- `npm run lint` - проверка ESLint правил
- `npm run test` - запуск типизированных тестов
- `npm run build` - сборка с проверкой типов

Эти стандарты помогут поддерживать высокое качество кода и избежать ошибок типизации.
