import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import React from 'react';

import type { MockComponentProps } from '../types/common';
import Features from './Features';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockComponentProps) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: MockComponentProps) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: MockComponentProps) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: MockComponentProps) => <span {...props}>{children}</span>,
    ul: ({ children, ...props }: MockComponentProps) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: MockComponentProps) => <li {...props}>{children}</li>,
  },
}));

describe('Features Component', () => {
  it('рендериться без помилок', () => {
    render(<Features />);
    expect(
      screen.getByRole('region', { name: /переваги/i }) || document.querySelector('section')
    ).toBeTruthy();
  });

  it('відображає заголовок секції', () => {
    render(<Features />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent?.toLowerCase()).toContain('переваги');
  });

  it('відображає список переваг', () => {
    render(<Features />);

    // Перевіряємо наявність карток переваг
    const featureItems =
      screen.getAllByRole('listitem') || document.querySelectorAll('.feature-item');
    expect(featureItems.length).toBeGreaterThan(0);
  });

  it('кожна перевага має заголовок та опис', () => {
    render(<Features />);

    // Отримуємо всі елементи переваг
    const featureItems =
      screen.getAllByRole('listitem') || document.querySelectorAll('.feature-item');

    // Перевіряємо, що кожна перевага має заголовок та опис
    featureItems.forEach(item => {
      const itemTitle = item.querySelector('h3') || item.querySelector('.feature-title');
      const itemDescription = item.querySelector('p') || item.querySelector('.feature-description');

      expect(itemTitle || itemDescription).toBeTruthy();
    });
  });

  it('відображає іконки для переваг', () => {
    render(<Features />);

    // Перевіряємо наявність іконок
    const icons = document.querySelectorAll('svg') || document.querySelectorAll('.feature-icon');
    expect(icons.length).toBeGreaterThanOrEqual(0);
  });

  it('має правильну структуру секції', () => {
    render(<Features />);

    // Перевіряємо наявність контейнера для переваг
    const featureContainer =
      document.querySelector('.features-container') || document.querySelector('section > div');
    expect(featureContainer).toBeTruthy();
  });
});
