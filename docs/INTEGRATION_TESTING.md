# Інтеграційне тестування

## Вступ

Цей документ описує підходи та методики інтеграційного тестування для проекту AI Agency Landing Page. Інтеграційні тести перевіряють взаємодію між різними компонентами та модулями системи, забезпечуючи їх коректну спільну роботу.

## Інструменти тестування

Для інтеграційного тестування проекту використовуються наступні інструменти:

- **Jest**: Основний фреймворк для тестування
- **React Testing Library**: Бібліотека для тестування React компонентів
- **Mock Service Worker (MSW)**: Для мокування API запитів
- **Cypress**: Для end-to-end тестування

## Структура тестів

Інтеграційні тести розміщуються в директорії `__tests__/integration`. Кожен тестовий файл повинен мати суфікс `.integration.test.tsx` або `.integration.test.ts`.

```
__tests__/
  integration/
    header-navigation.integration.test.tsx
    authentication-flow.integration.test.tsx
    contact-form.integration.test.tsx
```

## Приклади інтеграційних тестів

### Тестування навігації через Header

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../pages/_app';

describe('Header Navigation Integration', () => {
  test('навігація між сторінками через меню в хедері працює коректно', async () => {
    render(
      <BrowserRouter>
        <App Component={() => <div>Test Page</div>} pageProps={{}} />
      </BrowserRouter>
    );

    // Знаходимо та клікаємо на пункт меню "Про нас"
    const aboutLink = screen.getByText('Про нас');
    fireEvent.click(aboutLink);

    // Перевіряємо, що URL змінився
    expect(window.location.pathname).toBe('/about');

    // Знаходимо та клікаємо на пункт меню "Контакти"
    const contactLink = screen.getByText('Контакти');
    fireEvent.click(contactLink);

    // Перевіряємо, що URL змінився
    expect(window.location.pathname).toBe('/contact');
  });
});
```

### Тестування процесу аутентифікації

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { BrowserRouter } from 'react-router-dom';
import App from '../pages/_app';

// Налаштування мок-сервера для імітації API
const server = setupServer(
  rest.post('https://api.example.com/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'fake-jwt-token',
        expires_at: '2099-12-31T23:59:59Z',
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Authentication Flow Integration', () => {
  test('користувач може увійти в систему і перенаправляється на дашборд', async () => {
    render(
      <BrowserRouter>
        <App Component={() => <div>Sign In Page</div>} pageProps={{}} />
      </BrowserRouter>
    );

    // Переходимо на сторінку входу
    const signInLink = screen.getByText('Увійти');
    fireEvent.click(signInLink);

    // Заповнюємо форму входу
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Пароль');
    const submitButton = screen.getByRole('button', { name: 'Увійти' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    // Перевіряємо, що після успішного входу користувач перенаправляється на дашборд
    await waitFor(() => {
      expect(window.location.pathname).toBe('/dashboard');
    });

    // Перевіряємо, що в хедері відображається ім'я користувача
    const userMenu = screen.getByText('Тестовий Користувач');
    expect(userMenu).toBeInTheDocument();
  });
});
```

### Тестування форми контактів

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import Contact from '../components/Contact';

// Налаштування мок-сервера
const server = setupServer(
  rest.post('https://api.example.com/v1/contact', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Повідомлення успішно надіслано',
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Contact Form Integration', () => {
  test('форма контактів відправляє дані та показує повідомлення про успіх', async () => {
    const mockSubmit = jest.fn();

    render(<Contact title="Зв'яжіться з нами" email="contact@example.com" onSubmit={mockSubmit} />);

    // Заповнюємо форму
    const nameInput = screen.getByLabelText("Ім'я");
    const emailInput = screen.getByLabelText('Email');
    const messageInput = screen.getByLabelText('Повідомлення');
    const submitButton = screen.getByRole('button', { name: 'Надіслати' });

    fireEvent.change(nameInput, { target: { value: 'Тест Тестович' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Тестове повідомлення' } });
    fireEvent.click(submitButton);

    // Перевіряємо, що функція onSubmit була викликана з правильними даними
    expect(mockSubmit).toHaveBeenCalledWith({
      name: 'Тест Тестович',
      email: 'test@example.com',
      message: 'Тестове повідомлення',
    });

    // Перевіряємо, що з'явилося повідомлення про успіх
    await waitFor(() => {
      const successMessage = screen.getByText('Повідомлення успішно надіслано');
      expect(successMessage).toBeInTheDocument();
    });
  });

  test('форма контактів показує помилки валідації', async () => {
    render(<Contact title="Зв'яжіться з нами" email="contact@example.com" onSubmit={() => {}} />);

    // Намагаємося відправити порожню форму
    const submitButton = screen.getByRole('button', { name: 'Надіслати' });
    fireEvent.click(submitButton);

    // Перевіряємо, що з'явилися повідомлення про помилки
    await waitFor(() => {
      expect(screen.getByText("Ім'я є обов'язковим")).toBeInTheDocument();
      expect(screen.getByText("Email є обов'язковим")).toBeInTheDocument();
      expect(screen.getByText("Повідомлення є обов'язковим")).toBeInTheDocument();
    });

    // Заповнюємо email некоректно
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    // Перевіряємо, що з'явилося повідомлення про некоректний email
    await waitFor(() => {
      expect(screen.getByText('Некоректний формат email')).toBeInTheDocument();
    });
  });
});
```

## Тестування взаємодії компонентів

### Тестування взаємодії Hero та Features компонентів

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../pages/index';

describe('Hero and Features Integration', () => {
  test('клік на кнопку CTA в Hero секції прокручує до секції Features', () => {
    // Мокуємо функцію прокрутки
    const scrollIntoViewMock = jest.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Знаходимо та клікаємо на кнопку CTA в Hero секції
    const ctaButton = screen.getByText('Дізнатися більше');
    fireEvent.click(ctaButton);

    // Перевіряємо, що була викликана функція прокрутки
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
```

## End-to-End тестування з Cypress

Для повного тестування взаємодії користувача з додатком використовується Cypress. Приклад тесту:

```javascript
// cypress/integration/landing-page.spec.js
describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('відображає всі основні секції', () => {
    cy.get('header').should('be.visible');
    cy.get('section[data-testid="hero"]').should('be.visible');
    cy.get('section[data-testid="features"]').should('be.visible');
    cy.get('section[data-testid="testimonials"]').should('be.visible');
    cy.get('section[data-testid="contact"]').should('be.visible');
    cy.get('footer').should('be.visible');
  });

  it('дозволяє заповнити та відправити контактну форму', () => {
    // Прокручуємо до контактної форми
    cy.get('section[data-testid="contact"]').scrollIntoView();

    // Заповнюємо форму
    cy.get('input[name="name"]').type('Тест Тестович');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('textarea[name="message"]').type('Тестове повідомлення через Cypress');

    // Відправляємо форму
    cy.get('button[type="submit"]').click();

    // Перевіряємо, що з'явилося повідомлення про успіх
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('дозволяє перейти на сторінку входу та авторизуватися', () => {
    // Клікаємо на кнопку входу в хедері
    cy.get('header').contains('Увійти').click();

    // Перевіряємо, що ми на сторінці входу
    cy.url().should('include', '/sign-in');

    // Заповнюємо форму входу
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');

    // Відправляємо форму
    cy.get('button[type="submit"]').click();

    // Перевіряємо, що ми перенаправлені на дашборд
    cy.url().should('include', '/dashboard');

    // Перевіряємо, що в хедері відображається ім'я користувача
    cy.get('header').contains('Тестовий Користувач').should('be.visible');
  });
});
```

## Найкращі практики

1. **Ізоляція тестів**: Кожен тест повинен бути незалежним від інших тестів.

2. **Мокування зовнішніх залежностей**: Використовуйте MSW або інші інструменти для мокування API запитів.

3. **Тестування користувацьких сценаріїв**: Фокусуйтеся на тестуванні реальних сценаріїв використання, а не на внутрішній реалізації.

4. **Використання data-testid**: Додавайте атрибути `data-testid` до елементів, які потрібно протестувати, щоб зробити тести більш стабільними.

5. **Перевірка доступності**: Включайте перевірки доступності в інтеграційні тести.

## Запуск тестів

### Запуск інтеграційних тестів з Jest

```bash
npm test -- --testPathPattern=integration
```

### Запуск end-to-end тестів з Cypress

```bash
# Запуск в інтерактивному режимі
npm run cypress:open

# Запуск в headless режимі
npm run cypress:run
```

## Налаштування CI/CD

Інтеграційні тести автоматично запускаються в CI/CD пайплайні при кожному пуші в репозиторій. Конфігурація знаходиться в файлі `.github/workflows/ci.yml`.

```yaml
# Приклад конфігурації для GitHub Actions
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16.x'
      - name: Install dependencies
        run: npm ci
      - name: Run integration tests
        run: npm test -- --testPathPattern=integration
      - name: Run E2E tests
        run: npm run cypress:run
```

## Висновок

Інтеграційне тестування є важливою частиною процесу розробки, яка допомагає виявити проблеми взаємодії між компонентами до того, як вони потраплять до користувачів. Дотримуючись описаних у цьому документі підходів та практик, ви забезпечите високу якість та надійність проекту AI Agency Landing Page.
