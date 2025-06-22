# Стандарты кодирования проекта

Этот документ описывает стандарты кодирования и лучшие практики для проекта.

## Содержание

1. [Общие принципы](#общие-принципы)
2. [TypeScript](#typescript)
3. [React компоненты](#react-компоненты)
4. [Стилизация](#стилизация)
5. [Именование](#именование)
6. [Структура файлов](#структура-файлов)
7. [Импорты](#импорты)
8. [Комментарии и документация](#комментарии-и-документация)
9. [Тестирование](#тестирование)
10. [Безопасность](#безопасность)

## Общие принципы

### 1. Читаемость кода

- Код должен быть самодокументируемым
- Используйте описательные имена переменных и функций
- Избегайте глубокой вложенности (максимум 3-4 уровня)
- Функции должны быть короткими и выполнять одну задачу

### 2. Консистентность

- Следуйте установленным конвенциям именования
- Используйте единообразный стиль форматирования
- Применяйте одинаковые паттерны во всем проекте

### 3. Производительность

- Избегайте преждевременной оптимизации
- Используйте мемоизацию для дорогих вычислений
- Оптимизируйте рендеринг React компонентов

## TypeScript

### Типы

```typescript
// ✅ Хорошо: Используйте интерфейсы для объектов
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Хорошо: Используйте type для союзов и примитивов
type Status = 'pending' | 'approved' | 'rejected';
type ID = string | number;

// ❌ Плохо: Избегайте any
const data: any = fetchData();

// ✅ Хорошо: Используйте unknown для неизвестных типов
const data: unknown = fetchData();
```

### Импорт типов

```typescript
// ✅ Хорошо: Используйте type-only импорты
import type { User, ApiResponse } from '../types';
import { fetchUser } from '../api';

// ❌ Плохо: Смешивание типов и значений
import { User, ApiResponse, fetchUser } from '../api';
```

### Дженерики

```typescript
// ✅ Хорошо: Описательные имена дженериков
interface ApiResponse<TData> {
  data: TData;
  success: boolean;
}

// ✅ Хорошо: Ограничения дженериков
function updateEntity<T extends { id: string }>(entity: T): T {
  return { ...entity, updatedAt: new Date().toISOString() };
}
```

## React компоненты

### Структура компонента

```typescript
// ✅ Хорошо: Четкая структура компонента
import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Логика загрузки пользователя
  }, [userId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="user-profile">
      {/* JSX */}
    </div>
  );
};

export default UserProfile;
```

### Хуки

```typescript
// ✅ Хорошо: Кастомные хуки
const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await api.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};
```

### Мемоизация

```typescript
// ✅ Хорошо: Используйте React.memo для компонентов
const ExpensiveComponent = React.memo<Props>(({ data }) => {
  return <div>{/* Дорогой рендеринг */}</div>;
});

// ✅ Хорошо: Используйте useMemo для дорогих вычислений
const processedData = useMemo(() => {
  return data.map(item => expensiveTransformation(item));
}, [data]);

// ✅ Хорошо: Используйте useCallback для функций
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

## Стилизация

### Tailwind CSS

```typescript
// ✅ Хорошо: Группировка классов по функциональности
const Button = ({ variant, children }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
};
```

### Адаптивность

```typescript
// ✅ Хорошо: Mobile-first подход
<div className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
  <div className="p-4 md:p-6 lg:p-8">
    {/* Контент */}
  </div>
</div>
```

## Именование

### Переменные и функции

```typescript
// ✅ Хорошо: camelCase для переменных и функций
const userName = 'john_doe';
const isUserActive = true;
const getUserById = (id: string) => {
  /* */
};

// ✅ Хорошо: Описательные имена
const filteredActiveUsers = users.filter(user => user.isActive);

// ❌ Плохо: Сокращения и неясные имена
const usr = 'john';
const flg = true;
const getData = () => {
  /* */
};
```

### Компоненты

```typescript
// ✅ Хорошо: PascalCase для компонентов
const UserProfile = () => {
  /* */
};
const NavigationMenu = () => {
  /* */
};

// ✅ Хорошо: Описательные имена компонентов
const UserProfileCard = () => {
  /* */
};
const ProductListItem = () => {
  /* */
};
```

### Константы

```typescript
// ✅ Хорошо: SCREAMING_SNAKE_CASE для констант
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_PAGE_SIZE = 20;
```

## Структура файлов

```
src/
├── components/           # React компоненты
│   ├── common/          # Общие компоненты
│   ├── forms/           # Формы
│   └── layout/          # Компоненты макета
├── hooks/               # Кастомные хуки
├── pages/               # Страницы Next.js
├── types/               # TypeScript типы
├── utils/               # Утилитарные функции
├── lib/                 # Библиотеки и конфигурация
├── styles/              # Стили
└── __tests__/           # Тесты
```

## Импорты

### Порядок импортов

```typescript
// 1. React и Next.js
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';

// 2. Внешние библиотеки
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';

// 3. Внутренние модули
import { Button } from '../components/common';
import { useUser } from '../hooks';
import type { User } from '../types';

// 4. Относительные импорты
import './styles.css';
```

### Алиасы импортов

```typescript
// ✅ Хорошо: Используйте алиасы для длинных путей
import { Button } from '@/components/common';
import { ApiClient } from '@/lib/api';
import type { User } from '@/types';
```

## Комментарии и документация

### JSDoc комментарии

```typescript
/**
 * Получает пользователя по ID
 * @param userId - Уникальный идентификатор пользователя
 * @returns Promise с данными пользователя
 * @throws {Error} Если пользователь не найден
 */
const getUserById = async (userId: string): Promise<User> => {
  // Реализация
};

/**
 * Компонент для отображения профиля пользователя
 * @param props - Свойства компонента
 * @param props.userId - ID пользователя для отображения
 * @param props.onUpdate - Callback для обновления пользователя
 */
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}
```

### Комментарии в коде

```typescript
// ✅ Хорошо: Объяснение сложной логики
const calculateDiscount = (price: number, userType: string) => {
  // Премиум пользователи получают 20% скидку
  if (userType === 'premium') {
    return price * 0.8;
  }

  // Обычные пользователи получают 10% скидку при покупке свыше $100
  return price > 100 ? price * 0.9 : price;
};

// ❌ Плохо: Очевидные комментарии
const age = 25; // Устанавливаем возраст в 25
```

## Тестирование

### Структура тестов

```typescript
// ✅ Хорошо: Описательные названия тестов
describe('UserProfile component', () => {
  it('should display user name when user data is loaded', () => {
    // Arrange
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };

    // Act
    render(<UserProfile user={mockUser} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should show loading state when user data is being fetched', () => {
    // Test implementation
  });
});
```

### Моки

```typescript
// ✅ Хорошо: Четкие моки
const mockApiClient = {
  getUser: jest.fn().mockResolvedValue(mockUser),
  updateUser: jest.fn().mockResolvedValue(updatedUser),
};

jest.mock('../lib/api', () => ({
  apiClient: mockApiClient,
}));
```

## Безопасность

### Валидация данных

```typescript
// ✅ Хорошо: Валидация входных данных
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const createUser = (userData: unknown): User => {
  if (!userData || typeof userData !== 'object') {
    throw new Error('Invalid user data');
  }

  const { name, email } = userData as Record<string, unknown>;

  if (typeof name !== 'string' || !validateEmail(email as string)) {
    throw new Error('Invalid user data format');
  }

  return { name, email } as User;
};
```

### Санитизация данных

```typescript
// ✅ Хорошо: Санитизация пользовательского ввода
const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};
```

## Инструменты

### Линтинг

```bash
# Проверка кода
npm run lint

# Автоматическое исправление
npm run lint:fix
```

### Форматирование

```bash
# Форматирование кода
npm run format

# Проверка форматирования
npm run format:check
```

### Проверка типов

```bash
# Проверка TypeScript типов
npm run type-check
```

## Заключение

Следование этим стандартам поможет поддерживать высокое качество кода, улучшить читаемость и облегчить сопровождение проекта. Регулярно обновляйте эти стандарты в соответствии с развитием проекта и появлением новых лучших практик.
