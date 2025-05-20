# Керівництво з інтеграції API

## Вступ

Цей документ містить детальну інформацію про інтеграцію з API проекту AI Agency Landing Page. Тут ви знайдете приклади використання API, рекомендації щодо обробки помилок та найкращі практики для ефективної інтеграції.

## Передумови

Для успішної інтеграції з нашим API вам потрібно:

1. Зареєструватися на платформі та отримати API-ключ
2. Ознайомитися з основною [документацією API](../API.md)
3. Налаштувати середовище розробки для роботи з REST API

## Аутентифікація

### Отримання JWT токену

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Відповідь:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2023-12-31T23:59:59Z"
}
```

### Оновлення токену

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer REFRESH_TOKEN

{}
```

## Приклади інтеграції

### Отримання даних користувача (JavaScript)

```javascript
async function getUserProfile() {
  try {
    const response = await fetch('https://api.example.com/v1/users/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${yourJwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}
```

### Створення нового проекту (TypeScript)

```typescript
interface Project {
  name: string;
  description: string;
  status?: 'active' | 'pending' | 'completed';
  tags?: string[];
}

async function createProject(project: Project): Promise<{ id: string }> {
  try {
    const response = await fetch('https://api.example.com/v1/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yourJwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}
```

## Обробка помилок

API повертає стандартні HTTP-коди статусу для індикації успіху або невдачі запиту:

| Код статусу | Опис |
|------------|-------|
| 200 | OK - Запит успішно виконано |
| 201 | Created - Ресурс успішно створено |
| 400 | Bad Request - Неправильний запит |
| 401 | Unauthorized - Необхідна аутентифікація |
| 403 | Forbidden - Доступ заборонено |
| 404 | Not Found - Ресурс не знайдено |
| 429 | Too Many Requests - Перевищено ліміт запитів |
| 500 | Internal Server Error - Внутрішня помилка сервера |

### Структура відповіді з помилкою

```json
{
  "error": {
    "code": "invalid_input",
    "message": "Неправильний формат електронної пошти",
    "details": {
      "field": "email",
      "value": "invalid-email",
      "constraint": "email"
    }
  }
}
```

## Обмеження та ліміти

- Максимальна кількість запитів: 100 запитів за хвилину
- Максимальний розмір запиту: 5 МБ
- Час очікування відповіді: 30 секунд

## Рекомендації щодо продуктивності

1. **Кешування**: Кешуйте відповіді API, які не змінюються часто
2. **Пакетна обробка**: Використовуйте пакетні запити для масових операцій
3. **Стиснення**: Використовуйте стиснення gzip для зменшення обсягу даних
4. **Асинхронні операції**: Для довготривалих операцій використовуйте асинхронні запити

## Безпека

1. **Зберігайте токени безпечно**: Ніколи не зберігайте JWT-токени у локальному сховищі браузера
2. **Використовуйте HTTPS**: Завжди використовуйте HTTPS для запитів до API
3. **Валідуйте вхідні дані**: Завжди перевіряйте дані перед відправкою на сервер
4. **Оновлюйте залежності**: Регулярно оновлюйте бібліотеки для запобігання вразливостям

## Підтримка та зворотний зв'язок

Якщо у вас виникли проблеми з інтеграцією або є пропозиції щодо покращення API, будь ласка, створіть issue в нашому [репозиторії GitHub](https://github.com/ludasiksuper555/AI-Agency-Landing-Page/issues) або зв'яжіться з нами за адресою api-support@example.com.

## Зміни в API

Ми дотримуємося принципів семантичного версіонування для нашого API. Всі зміни, що порушують зворотну сумісність, будуть анонсовані заздалегідь та впроваджені в нових версіях API.

Слідкуйте за нашим [блогом](https://example.com/blog) та [Twitter](https://twitter.com/example) для отримання інформації про оновлення API.