# API Documentation

## Базовая информация

**Base URL:** `https://api.example.com/v1`

**Аутентификация:** JWT Bearer Token

```bash
Authorization: Bearer <your-jwt-token>
```

## Эндпоинты

### Аутентификация

#### POST /auth/login

Вход в систему.

**Параметры запроса:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "expiresIn": 3600
}
```

#### POST /auth/register

Регистрация нового пользователя.

**Параметры запроса:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Doe",
  "confirmPassword": "password123"
}
```

**Ответ (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_124",
    "email": "newuser@example.com",
    "name": "Jane Doe",
    "role": "user"
  }
}
```

#### POST /auth/refresh

Обновление JWT токена.

**Параметры запроса:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

**Ответ (200):**

```json
{
  "success": true,
  "token": "new_jwt_token_here",
  "expiresIn": 3600
}
```

### Пользователи

#### GET /users/profile

Получение профиля текущего пользователя.

**Заголовки:**

```
Authorization: Bearer <jwt-token>
```

**Ответ (200):**

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatars/user_123.jpg",
    "role": "user",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-20T14:22:00Z",
    "preferences": {
      "theme": "dark",
      "language": "ru",
      "notifications": true
    }
  }
}
```

#### PUT /users/profile

Обновление профиля пользователя.

**Заголовки:**

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Параметры запроса:**

```json
{
  "name": "John Smith",
  "avatar": "https://example.com/avatars/new_avatar.jpg",
  "preferences": {
    "theme": "light",
    "language": "en",
    "notifications": false
  }
}
```

**Ответ (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Smith",
    "avatar": "https://example.com/avatars/new_avatar.jpg",
    "role": "user",
    "preferences": {
      "theme": "light",
      "language": "en",
      "notifications": false
    }
  }
}
```

#### GET /users

Получение списка пользователей (только для администраторов).

**Query параметры:**

- `page` (number): Номер страницы (по умолчанию: 1)
- `limit` (number): Количество записей на странице (по умолчанию: 20, максимум: 100)
- `search` (string): Поиск по имени или email
- `role` (string): Фильтр по роли (user, admin, moderator)
- `sortBy` (string): Сортировка (name, email, createdAt)
- `sortOrder` (string): Порядок сортировки (asc, desc)

**Пример запроса:**

```
GET /users?page=1&limit=10&search=john&role=user&sortBy=createdAt&sortOrder=desc
```

**Ответ (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastLoginAt": "2024-01-20T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Контент

#### GET /content/posts

Получение списка постов.

**Query параметры:**

- `page` (number): Номер страницы
- `limit` (number): Количество записей
- `category` (string): Фильтр по категории
- `status` (string): Статус поста (draft, published, archived)
- `authorId` (string): ID автора

**Ответ (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "post_123",
      "title": "Заголовок поста",
      "content": "Содержимое поста...",
      "excerpt": "Краткое описание...",
      "status": "published",
      "category": "technology",
      "tags": ["javascript", "react", "api"],
      "author": {
        "id": "user_123",
        "name": "John Doe",
        "avatar": "https://example.com/avatars/user_123.jpg"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T12:45:00Z",
      "publishedAt": "2024-01-15T14:00:00Z",
      "viewsCount": 1250,
      "likesCount": 45,
      "commentsCount": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "totalPages": 25
  }
}
```

#### POST /content/posts

Создание нового поста.

**Параметры запроса:**

```json
{
  "title": "Новый пост",
  "content": "Содержимое нового поста...",
  "excerpt": "Краткое описание нового поста",
  "category": "technology",
  "tags": ["javascript", "tutorial"],
  "status": "draft",
  "featuredImage": "https://example.com/images/post_image.jpg",
  "publishAt": "2024-01-20T10:00:00Z"
}
```

**Ответ (201):**

```json
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": "post_124",
    "title": "Новый пост",
    "content": "Содержимое нового поста...",
    "status": "draft",
    "author": {
      "id": "user_123",
      "name": "John Doe"
    },
    "createdAt": "2024-01-20T09:30:00Z"
  }
}
```

### Обработка ошибок

#### POST /api/errors

Логирование ошибок клиентского приложения.

**Параметры запроса:**

```json
{
  "message": "Cannot read property 'map' of undefined",
  "stack": "TypeError: Cannot read property 'map' of undefined\n    at Component.render",
  "componentStack": "    in Component (at App.js:10)\n    in App (at index.js:5)",
  "timestamp": "2024-01-20T10:30:00Z",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "url": "https://example.com/dashboard",
  "userId": "user_123",
  "sessionId": "session_456"
}
```

**Ответ (200):**

```json
{
  "success": true,
  "message": "Error logged successfully",
  "errorId": "error_1642248600000_abc123"
}
```

### Файлы

#### POST /files/upload

Загрузка файла.

**Content-Type:** `multipart/form-data`

**Параметры:**

- `file` (File): Файл для загрузки
- `category` (string): Категория файла (avatar, document, image)
- `description` (string): Описание файла

**Ответ (200):**

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": "file_123",
    "filename": "document.pdf",
    "originalName": "my-document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "url": "https://cdn.example.com/files/file_123.pdf",
    "category": "document",
    "uploadedAt": "2024-01-20T10:30:00Z"
  }
}
```

## Коды ошибок

### 400 Bad Request

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred",
  "requestId": "req_123456789"
}
```

## Rate Limiting

- **Общие эндпоинты:** 100 запросов в минуту
- **Аутентификация:** 5 попыток в минуту
- **Загрузка файлов:** 10 запросов в минуту
- **API ошибок:** 50 запросов в минуту

## Примеры использования

### JavaScript/TypeScript

```typescript
// Базовый API клиент
class ApiClient {
  private baseUrl = 'https://api.example.com/v1';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Аутентификация
  async login(email: string, password: string) {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Профиль пользователя
  async getProfile() {
    return this.request<ProfileResponse>('/users/profile');
  }

  // Обновление профиля
  async updateProfile(data: UpdateProfileData) {
    return this.request<ProfileResponse>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Логирование ошибок
  async logError(errorData: ErrorLogData) {
    return this.request<ErrorResponse>('/api/errors', {
      method: 'POST',
      body: JSON.stringify(errorData),
    });
  }
}

// Использование
const api = new ApiClient();

// Вход в систему
try {
  const response = await api.login('user@example.com', 'password123');
  api.setToken(response.token);
  console.log('Logged in successfully:', response.user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### React Hook для API

```typescript
import { useState, useEffect } from 'react';

function useApi<T>(endpoint: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.request<T>(endpoint, options);
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}

// Использование в компоненте
function UserProfile() {
  const { data: profile, loading, error } = useApi<ProfileResponse>('/users/profile');

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;
  if (!profile) return <div>Профиль не найден</div>;

  return (
    <div>
      <h1>{profile.user.name}</h1>
      <p>{profile.user.email}</p>
    </div>
  );
}
```
