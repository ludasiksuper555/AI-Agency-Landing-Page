import React from 'react';

import Button from '../../components/ui/Button';

describe('Button Component', () => {
  it('должна отображаться с правильным текстом', () => {
    cy.mount(<Button>Нажми меня</Button>);
    cy.get('button').should('have.text', 'Нажми меня');
  });

  it('должна вызывать onClick при нажатии', () => {
    const onClickSpy = cy.spy().as('onClickSpy');
    cy.mount(<Button onClick={onClickSpy}>Нажми меня</Button>);
    cy.get('button').click();
    cy.get('@onClickSpy').should('have.been.calledOnce');
  });

  it('должна быть отключена при disabled=true', () => {
    cy.mount(<Button disabled>Отключено</Button>);
    cy.get('button').should('be.disabled');
    cy.get('button').should('have.class', 'opacity-50');
  });

  it('должна отображать разные варианты', () => {
    // Проверяем основной вариант
    cy.mount(<Button variant="primary">Основная</Button>);
    cy.get('button').should('have.class', 'bg-primary');

    // Проверяем вторичный вариант
    cy.mount(<Button variant="secondary">Вторичная</Button>);
    cy.get('button').should('have.class', 'bg-secondary');

    // Проверяем вариант outline
    cy.mount(<Button variant="outline">Контурная</Button>);
    cy.get('button').should('have.class', 'border-2');
    cy.get('button').should('not.have.class', 'bg-primary');
  });

  it('должна отображать разные размеры', () => {
    // Проверяем маленький размер
    cy.mount(<Button size="sm">Маленькая</Button>);
    cy.get('button').should('have.class', 'text-sm');
    cy.get('button').should('have.class', 'py-1');

    // Проверяем средний размер (по умолчанию)
    cy.mount(<Button size="md">Средняя</Button>);
    cy.get('button').should('have.class', 'text-base');
    cy.get('button').should('have.class', 'py-2');

    // Проверяем большой размер
    cy.mount(<Button size="lg">Большая</Button>);
    cy.get('button').should('have.class', 'text-lg');
    cy.get('button').should('have.class', 'py-3');
  });

  it('должна отображать иконку, если она предоставлена', () => {
    cy.mount(<Button icon={<span data-testid="test-icon">🔍</span>}>С иконкой</Button>);
    cy.get('[data-testid="test-icon"]').should('be.visible');
    cy.get('button').should('contain', 'С иконкой');
  });

  it('должна быть доступной', () => {
    cy.mount(<Button aria-label="Доступная кнопка">Нажми меня</Button>);
    cy.get('button').should('have.attr', 'aria-label', 'Доступная кнопка');
  });
});
