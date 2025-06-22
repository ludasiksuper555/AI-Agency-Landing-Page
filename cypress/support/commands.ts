// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Расширяем типы Cypress для пользовательских команд
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Пользовательская команда для входа в систему
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<Element>;

      /**
       * Пользовательская команда для проверки доступности
       * @example cy.checkA11y()
       */
      checkA11y(options?: any): Chainable<Element>;

      /**
       * Пользовательская команда для переключения языка
       * @example cy.switchLanguage('en')
       */
      switchLanguage(locale: string): Chainable<Element>;
    }
  }
}

// Команда для входа в систему
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/sign-in');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Команда для проверки доступности
Cypress.Commands.add('checkA11y', (options = {}) => {
  cy.injectAxe();
  cy.checkA11y(options);
});

// Команда для переключения языка
Cypress.Commands.add('switchLanguage', locale => {
  cy.get('[data-testid="language-switcher"]').click();
  cy.get(`[data-testid="language-${locale}"]`).click();
  cy.url().should('include', `/${locale}`);
});
