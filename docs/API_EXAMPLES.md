# Приклади використання API

## Вступ

Цей документ містить практичні приклади використання API проекту AI Agency Landing Page. Тут ви знайдете готові зразки запитів та відповідей для найпоширеніших сценаріїв використання API.

## Аутентифікація

### Отримання JWT токену

**Запит:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Відповідь (успіх):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2023-12-31T23:59:59Z"
}
```

**Відповідь (помилка):**

```json
{
  "error": "invalid_credentials",
  "message": "Невірний email або пароль",
  "status": 401
}
```

### Оновлення токену

**Запит:**

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer REFRESH_TOKEN

{}
```

**Відповідь (успіх):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2023-12-31T23:59:59Z"
}
```

## Користувачі

### Отримання профілю користувача

**Запит:**

```http
GET /users/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Відповідь (успіх):**

```json
{
  "id": "user_123",
  "name": "Іван Петренко",
  "email": "ivan@example.com",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "profile": {
    "avatar_url": "https://example.com/avatars/user_123.jpg",
    "bio": "Розробник програмного забезпечення",
    "location": "Київ, Україна"
  }
}
```

### Оновлення профілю користувача

**Запит:**

```http
PUT /users/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Іван Петренко",
  "profile": {
    "bio": "Старший розробник програмного забезпечення",
    "location": "Львів, Україна"
  }
}
```

**Відповідь (успіх):**

```json
{
  "id": "user_123",
  "name": "Іван Петренко",
  "email": "ivan@example.com",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-06-15T14:30:45Z",
  "profile": {
    "avatar_url": "https://example.com/avatars/user_123.jpg",
    "bio": "Старший розробник програмного забезпечення",
    "location": "Львів, Україна"
  }
}
```

## Проекти

### Отримання списку проектів

**Запит:**

```http
GET /projects
Authorization: Bearer YOUR_JWT_TOKEN
```

**Відповідь (успіх):**

```json
{
  "data": [
    {
      "id": "project_1",
      "name": "Веб-сайт компанії",
      "description": "Корпоративний веб-сайт з адаптивним дизайном",
      "status": "active",
      "created_at": "2023-02-15T10:00:00Z",
      "updated_at": "2023-05-20T14:30:00Z"
    },
    {
      "id": "project_2",
      "name": "Мобільний додаток",
      "description": "Додаток для iOS та Android",
      "status": "pending",
      "created_at": "2023-04-10T09:15:00Z",
      "updated_at": "2023-04-10T09:15:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "per_page": 10,
    "total_pages": 1
  }
}
```

### Створення нового проекту

**Запит:**

```http
POST /projects
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Інтернет-магазин",
  "description": "Електронна комерція з інтеграцією платіжних систем",
  "status": "active"
}
```

**Відповідь (успіх):**

```json
{
  "id": "project_3",
  "name": "Інтернет-магазин",
  "description": "Електронна комерція з інтеграцією платіжних систем",
  "status": "active",
  "created_at": "2023-06-20T11:45:30Z",
  "updated_at": "2023-06-20T11:45:30Z"
}
```

## Обробка помилок

### Помилка аутентифікації

```json
{
  "error": "unauthorized",
  "message": "Необхідна аутентифікація",
  "status": 401
}
```

### Помилка валідації

```json
{
  "error": "validation_error",
  "message": "Помилка валідації даних",
  "status": 422,
  "errors": {
    "name": ["Поле 'name' є обов'язковим"],
    "email": ["Невірний формат email"]
  }
}
```

### Помилка сервера

```json
{
  "error": "server_error",
  "message": "Внутрішня помилка сервера",
  "status": 500
}
```

## Приклади використання з різними мовами програмування

### JavaScript (Fetch API)

```javascript
// Отримання профілю користувача
async function getUserProfile() {
  try {
    const response = await fetch('https://api.example.com/v1/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Профіль користувача:', data);
    return data;
  } catch (error) {
    console.error('Помилка при отриманні профілю:', error);
  }
}
```

### TypeScript (Axios)

```typescript
import axios from 'axios';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  profile: {
    avatar_url: string;
    bio: string;
    location: string;
  };
}

// Оновлення профілю користувача
async function updateUserProfile(name: string, bio: string, location: string): Promise<UserProfile> {
  try {
    const { data } = await axios.put<UserProfile>(
      'https://api.example.com/v1/users/profile',
      {
        name,
        profile: {
          bio,
          location
        }
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Помилка API:', error.response?.data);
    } else {
      console.error('Неочікувана помилка:', error);
    }
    throw error;
  }
}
```

### Python (Requests)

```python
import requests

# Отримання списку проектів
def get_projects():
    url = "https://api.example.com/v1/projects"
    headers = {
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Помилка: {response.status_code}")
        print(response.json())
        return None

# Створення нового проекту
def create_project(name, description, status="active"):
    url = "https://api.example.com/v1/projects"
    headers = {
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    }
    payload = {
        "name": name,
        "description": description,
        "status": status
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 201:
        return response.json()
    else:
        print(f"Помилка: {response.status_code}")
        print(response.json())
        return None
```

## Обмеження API

- Максимальна кількість запитів: 100 запитів на хвилину
- Максимальний розмір запиту: 10 МБ
- Термін дії JWT токену: 1 година
- Термін дії refresh токену: 30 днів

## Рекомендації з безпеки

1. Зберігайте JWT токени в безпечному місці
2. Не передавайте токени через URL параметри
3. Використовуйте HTTPS для всіх запитів
4. Оновлюйте токени до їх закінчення терміну дії
5. Перевіряйте підпис токенів на стороні клієнта

## Контакти підтримки

Якщо у вас виникли питання або проблеми з використанням API, будь ласка, зв'яжіться з нами:

- Email: api-support@aiagency.com
- Документація: https://docs.aiagency.com/api
- Статус API: https://status.aiagency.com