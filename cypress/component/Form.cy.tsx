import React from 'react';

import ContactForm from '../../components/ContactForm';

describe('ContactForm Component', () => {
  beforeEach(() => {
    // Монтируем компонент перед каждым тестом
    cy.mount(<ContactForm onSubmit={cy.spy().as('onSubmitSpy')} />);
  });

  it('должна отображать все поля формы', () => {
    cy.get('input[name="name"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('textarea[name="message"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('должна показывать ошибки валидации при отправке пустой формы', () => {
    // Нажимаем кнопку отправки без заполнения полей
    cy.get('button[type="submit"]').click();

    // Проверяем, что появились сообщения об ошибках
    cy.get('[data-testid="name-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="message-error"]').should('be.visible');

    // Проверяем, что форма не была отправлена
    cy.get('@onSubmitSpy').should('not.have.been.called');
  });

  it('должна показывать ошибку при неверном формате email', () => {
    // Заполняем поля с неверным email
    cy.get('input[name="name"]').type('Тестовый Пользователь');
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('textarea[name="message"]').type('Тестовое сообщение');

    // Отправляем форму
    cy.get('button[type="submit"]').click();

    // Проверяем, что появилось сообщение об ошибке email
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="email-error"]').should(
      'contain',
      'Введіть коректну адресу електронної пошти'
    );

    // Проверяем, что форма не была отправлена
    cy.get('@onSubmitSpy').should('not.have.been.called');
  });

  it('должна успешно отправлять форму с правильными данными', () => {
    // Заполняем все поля корректными данными
    cy.get('input[name="name"]').type('Тестовый Пользователь');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('textarea[name="message"]').type(
      'Тестовое сообщение для проверки формы обратной связи.'
    );

    // Отправляем форму
    cy.get('button[type="submit"]').click();

    // Проверяем, что форма была отправлена с правильными данными
    cy.get('@onSubmitSpy').should('have.been.calledOnce');
    cy.get('@onSubmitSpy').should('have.been.calledWith', {
      name: 'Тестовый Пользователь',
      email: 'test@example.com',
      message: 'Тестовое сообщение для проверки формы обратной связи.',
    });

    // Проверяем, что форма была очищена после отправки
    cy.get('input[name="name"]').should('have.value', '');
    cy.get('input[name="email"]').should('have.value', '');
    cy.get('textarea[name="message"]').should('have.value', '');

    // Проверяем, что появилось сообщение об успешной отправке
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="success-message"]').should('contain', 'Дякуємо за ваше повідомлення!');
  });

  it('должна отображать индикатор загрузки во время отправки', () => {
    // Создаем промис, который не разрешается сразу
    const submitPromise = new Promise(resolve => {
      // Разрешаем промис через 1 секунду
      setTimeout(() => resolve({ success: true }), 1000);
    });

    // Монтируем компонент с функцией onSubmit, которая возвращает промис
    cy.mount(
      <ContactForm
        onSubmit={() => {
          cy.spy().as('onSubmitSpy')();
          return submitPromise;
        }}
      />
    );

    // Заполняем все поля
    cy.get('input[name="name"]').type('Тестовый Пользователь');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('textarea[name="message"]').type('Тестовое сообщение');

    // Отправляем форму
    cy.get('button[type="submit"]').click();

    // Проверяем, что появился индикатор загрузки
    cy.get('[data-testid="loading-indicator"]').should('be.visible');

    // Проверяем, что кнопка отправки отключена во время загрузки
    cy.get('button[type="submit"]').should('be.disabled');

    // Ждем завершения загрузки
    cy.get('[data-testid="loading-indicator"]', { timeout: 2000 }).should('not.exist');

    // Проверяем, что появилось сообщение об успешной отправке
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});
