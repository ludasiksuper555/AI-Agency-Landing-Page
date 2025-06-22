import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import Services from './Services';

// Мок для framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

describe('Services Component', () => {
  it('рендериться без помилок', () => {
    render(<Services />);
    expect(
      screen.getByRole('region', { name: /послуги/i }) || document.querySelector('section')
    ).toBeTruthy();
  });

  it('відображає заголовок секції', () => {
    render(<Services />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent?.toLowerCase()).toContain('послуги');
  });

  it('відображає список послуг', () => {
    render(<Services />);

    // Перевіряємо наявність карток послуг
    const serviceCards =
      screen.getAllByRole('article') || document.querySelectorAll('.service-card');
    expect(serviceCards.length).toBeGreaterThan(0);
  });

  it('кожна послуга має заголовок та опис', () => {
    render(<Services />);

    // Отримуємо всі картки послуг
    const serviceCards =
      screen.getAllByRole('article') || document.querySelectorAll('.service-card');

    // Перевіряємо, що кожна картка має заголовок та опис
    serviceCards.forEach(card => {
      const cardTitle = card.querySelector('h3') || card.querySelector('.service-title');
      const cardDescription = card.querySelector('p') || card.querySelector('.service-description');

      expect(cardTitle).toBeTruthy();
      expect(cardDescription).toBeTruthy();
    });
  });

  it('відображає іконки для послуг', () => {
    render(<Services />);

    // Перевіряємо наявність іконок
    const icons = document.querySelectorAll('svg') || document.querySelectorAll('.service-icon');
    expect(icons.length).toBeGreaterThan(0);
  });
});
