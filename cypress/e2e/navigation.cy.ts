describe('Навигация по сайту', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('должна отображать главную страницу', () => {
    cy.get('h1').should('be.visible');
    cy.get('nav').should('be.visible');
    cy.get('footer').should('be.visible');
  });

  it('должна переходить на страницу услуг', () => {
    cy.get('nav').contains('Послуги').click();
    cy.url().should('include', '#services');
    cy.get('[data-testid="services-section"]').should('be.visible');
  });

  it('должна переходить на страницу команды', () => {
    cy.get('nav').contains('Команда').click();
    cy.url().should('include', '#team');
    cy.get('[data-testid="team-section"]').should('be.visible');
  });

  it('должна переключать язык', () => {
    // Проверяем переключение на английский
    cy.get('[data-testid="language-switcher"]').click();
    cy.get('[data-testid="language-en"]').click();
    cy.get('html').should('have.attr', 'lang', 'en');

    // Проверяем, что контент изменился на английский
    cy.get('nav').contains('Services').should('be.visible');

    // Возвращаемся на украинский
    cy.get('[data-testid="language-switcher"]').click();
    cy.get('[data-testid="language-uk"]').click();
    cy.get('html').should('have.attr', 'lang', 'uk');
    cy.get('nav').contains('Послуги').should('be.visible');
  });
});
