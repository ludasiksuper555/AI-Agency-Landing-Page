describe('Аутентификация', () => {
  beforeEach(() => {
    // Перед каждым тестом очищаем куки и локальное хранилище
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('должна отображать страницу входа', () => {
    cy.visit('/sign-in');
    cy.get('h1').should('contain', 'Вхід');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('должна отображать ошибку при неверных учетных данных', () => {
    cy.visit('/sign-in');
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Проверяем, что появилось сообщение об ошибке
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Невірний email або пароль');
  });

  it('должна перенаправлять на защищенную страницу после успешного входа', () => {
    // Здесь мы используем моки для имитации успешной аутентификации
    // В реальном сценарии вы бы использовали тестовую учетную запись
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        },
      },
    }).as('loginRequest');

    cy.visit('/sign-in');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');

    // Проверяем, что произошло перенаправление на панель управления
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-greeting"]').should('contain', 'Test');
  });

  it('должна перенаправлять на страницу входа при попытке доступа к защищенной странице', () => {
    // Пытаемся получить доступ к защищенной странице без аутентификации
    cy.visit('/dashboard');

    // Проверяем, что произошло перенаправление на страницу входа
    cy.url().should('include', '/sign-in');
  });

  it('должна позволять пользователю выйти из системы', () => {
    // Имитируем вход в систему
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: {
          id: '123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        },
      },
    }).as('loginRequest');

    cy.visit('/sign-in');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');

    // Выходим из системы
    cy.get('[data-testid="logout-button"]').click();

    // Проверяем, что произошло перенаправление на главную страницу
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // Проверяем, что при попытке доступа к защищенной странице происходит перенаправление
    cy.visit('/dashboard');
    cy.url().should('include', '/sign-in');
  });
});
