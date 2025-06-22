describe('API Інтеграція', () => {
  beforeEach(() => {
    // Очищаємо куки та локальне сховище перед кожним тестом
    cy.clearCookies();
    cy.clearLocalStorage();

    // Завантажуємо фікстури для тестів
    cy.fixture('api-responses.json').as('apiResponses');
    cy.fixture('users.json').as('users');
  });

  it('повинна успішно аутентифікуватися та отримати токен', () => {
    // Перехоплюємо запит на аутентифікацію
    cy.intercept('POST', '/auth/login', req => {
      // Перевіряємо, що запит містить правильні дані
      expect(req.body).to.have.property('email');
      expect(req.body).to.have.property('password');

      // Повертаємо успішну відповідь з токеном
      req.reply({
        statusCode: 200,
        body: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expires_at: '2023-12-31T23:59:59Z',
        },
      });
    }).as('loginRequest');

    // Відвідуємо сторінку входу
    cy.visit('/sign-in');

    // Заповнюємо форму входу
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Перевіряємо, що запит був відправлений
    cy.wait('@loginRequest');

    // Перевіряємо, що токен був збережений
    cy.window().then(win => {
      // Перевіряємо, що токен збережений у безпечному місці (не в localStorage)
      // Наприклад, у HttpOnly cookie або в пам'яті додатку
      const authState = win.eval('window.__AUTH_STATE__');
      expect(authState).to.have.property('isAuthenticated', true);
    });

    // Перевіряємо, що відбулося перенаправлення на захищену сторінку
    cy.url().should('include', '/dashboard');
  });

  it('повинна обробляти помилки аутентифікації', () => {
    // Перехоплюємо запит на аутентифікацію з помилкою
    cy.intercept('POST', '/auth/login', {
      statusCode: 401,
      body: {
        error: {
          code: 'invalid_credentials',
          message: 'Невірний email або пароль',
        },
      },
    }).as('loginFailedRequest');

    // Відвідуємо сторінку входу
    cy.visit('/sign-in');

    // Заповнюємо форму входу
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Перевіряємо, що запит був відправлений
    cy.wait('@loginFailedRequest');

    // Перевіряємо, що відображається повідомлення про помилку
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Невірний email або пароль');

    // Перевіряємо, що користувач залишається на сторінці входу
    cy.url().should('include', '/sign-in');
  });

  it('повинна отримувати дані користувача після аутентифікації', () => {
    // Імітуємо успішну аутентифікацію
    cy.intercept('POST', '/auth/login', {
      statusCode: 200,
      body: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expires_at: '2023-12-31T23:59:59Z',
      },
    }).as('loginRequest');

    // Імітуємо запит на отримання даних користувача
    cy.intercept('GET', '/users/me', {
      statusCode: 200,
      body: {
        id: '123456',
        email: 'user@example.com',
        firstName: 'Тестовий',
        lastName: 'Користувач',
        role: 'user',
        createdAt: '2023-01-15T10:30:00Z',
        lastLogin: '2023-06-20T14:25:30Z',
      },
    }).as('getUserRequest');

    // Відвідуємо сторінку входу та виконуємо вхід
    cy.visit('/sign-in');
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Перевіряємо, що запит на отримання даних користувача був відправлений
    cy.wait('@getUserRequest');

    // Перевіряємо, що дані користувача відображаються на сторінці
    cy.get('[data-testid="user-profile"]').should('be.visible');
    cy.get('[data-testid="user-name"]').should('contain', 'Тестовий Користувач');
    cy.get('[data-testid="user-email"]').should('contain', 'user@example.com');
    cy.get('[data-testid="user-role"]').should('contain', 'user');
  });

  it('повинна оновлювати токен при закінченні терміну дії', () => {
    // Імітуємо запит з помилкою про закінчення терміну дії токену
    cy.intercept('GET', '/api/protected-resource', {
      statusCode: 401,
      body: {
        error: {
          code: 'token_expired',
          message: 'Термін дії токену закінчився',
        },
      },
    }).as('expiredTokenRequest');

    // Імітуємо успішне оновлення токену
    cy.intercept('POST', '/auth/refresh', {
      statusCode: 200,
      body: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...new',
        expires_at: '2023-12-31T23:59:59Z',
      },
    }).as('refreshTokenRequest');

    // Імітуємо повторний запит з новим токеном
    cy.intercept('GET', '/api/protected-resource', {
      statusCode: 200,
      body: {
        data: 'Захищені дані',
      },
    }).as('protectedResourceRequest');

    // Встановлюємо токен в localStorage для тестування
    // (в реальному додатку токен повинен зберігатися в більш безпечному місці)
    cy.window().then(win => {
      win.localStorage.setItem('auth_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
      win.localStorage.setItem('refresh_token', 'refresh_token_value');
    });

    // Відвідуємо захищену сторінку
    cy.visit('/dashboard');

    // Імітуємо клік на кнопку, яка викликає запит до захищеного ресурсу
    cy.get('[data-testid="fetch-protected-data"]').click();

    // Перевіряємо, що запит з закінченим токеном був відправлений
    cy.wait('@expiredTokenRequest');

    // Перевіряємо, що запит на оновлення токену був відправлений
    cy.wait('@refreshTokenRequest');

    // Перевіряємо, що повторний запит з новим токеном був відправлений
    cy.wait('@protectedResourceRequest');

    // Перевіряємо, що захищені дані відображаються на сторінці
    cy.get('[data-testid="protected-data"]').should('contain', 'Захищені дані');

    // Перевіряємо, що новий токен був збережений
    cy.window().then(win => {
      const authToken = win.localStorage.getItem('auth_token');
      expect(authToken).to.include('new');
    });
  });

  it('повинна обробляти обмеження кількості запитів', () => {
    // Імітуємо помилку перевищення ліміту запитів
    cy.intercept('GET', '/api/data', {
      statusCode: 429,
      body: {
        error: {
          code: 'rate_limit_exceeded',
          message: 'Перевищено ліміт запитів. Спробуйте знову через 60 секунд.',
          details: {
            retry_after: 60,
          },
        },
      },
      headers: {
        'Retry-After': '60',
      },
    }).as('rateLimitedRequest');

    // Відвідуємо сторінку, яка робить запити до API
    cy.visit('/dashboard');

    // Імітуємо багато кліків на кнопку, яка викликає запити до API
    for (let i = 0; i < 5; i++) {
      cy.get('[data-testid="fetch-data"]').click();
    }

    // Перевіряємо, що запит з обмеженням був отриманий
    cy.wait('@rateLimitedRequest');

    // Перевіряємо, що відображається повідомлення про обмеження
    cy.get('[data-testid="rate-limit-message"]').should('be.visible');
    cy.get('[data-testid="rate-limit-message"]').should('contain', 'Перевищено ліміт запитів');
    cy.get('[data-testid="retry-countdown"]').should('be.visible');
  });
});
