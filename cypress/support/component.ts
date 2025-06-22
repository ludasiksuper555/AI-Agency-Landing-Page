// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';
// Импортируем глобальные стили
import '../../styles/globals.css';

// Alternatively you can use CommonJS syntax:
// require('./commands')
import { MountOptions, MountReturn } from 'cypress/react';
import { mount } from 'cypress/react18';
// Импортируем React для JSX
import React from 'react';

// Расширяем типы Cypress для компонентного тестирования
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Монтирует React компонент
       * @param component Компонент для монтирования
       * @param options Опции монтирования
       */
      mount: typeof mount;

      /**
       * Монтирует React компонент с провайдерами темы
       * @param component Компонент для монтирования
       * @param options Опции монтирования
       */
      mountWithTheme: (
        component: React.ReactNode,
        options?: MountOptions
      ) => Cypress.Chainable<MountReturn>;
    }
  }
}

// Добавляем команду mount
Cypress.Commands.add('mount', mount);

// Добавляем команду для монтирования с провайдером темы
Cypress.Commands.add('mountWithTheme', (component, options = {}) => {
  return cy.mount(React.createElement(React.Fragment, null, component), options);
});

// Accessibility testing commands
Cypress.Commands.add('checkA11y', () => {
  // TODO: Implement accessibility testing when cypress-axe is available
  cy.log('Accessibility check placeholder');
});
