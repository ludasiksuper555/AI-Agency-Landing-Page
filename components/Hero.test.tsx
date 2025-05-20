import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Hero from './Hero';

// Мокаємо модулі, які використовуються в компоненті
jest.mock('next/router', () => ({
  useRouter() {
    return {
      pathname: '/',
      push: jest.fn(),
    };
  },
}));

// Мок для framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    img: ({ ...props }: any) => <img {...props} alt="hero" />,
  },
}));

// Мокаємо Clerk аутентифікацію
jest.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode; mode: string }) => <div data-testid="sign-in-button">{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode; mode: string }) => <div data-testid="sign-up-button">{children}</div>,
}));

describe('Hero Component', () => {
  it('рендериться без помилок', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('відображає заголовок та підзаголовок', () => {
    render(<Hero />);
    // Перевіряємо наявність заголовка (може бути різний текст, тому перевіряємо наявність h1)
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    
    // Перевіряємо наявність підзаголовка (зазвичай це параграф під заголовком)
    const subheadings = screen.getAllByText(/./i, { selector: 'p' });
    expect(subheadings.length).toBeGreaterThan(0);
  });

  it('відображає кнопки дій', () => {
    render(<Hero />);
    
    // Перевіряємо наявність кнопок
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Перевіряємо наявність кнопок входу та реєстрації
    expect(screen.getByTestId('sign-up-button')).toBeInTheDocument();
  });

  it('відображає зображення героя', () => {
    render(<Hero />);
    
    // Перевіряємо наявність зображення
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('має правильну структуру секції', () => {
    render(<Hero />);
    
    // Перевіряємо наявність секції
    const section = screen.getByRole('region', { hidden: true }) || document.querySelector('section');
    expect(section).toBeTruthy();
  });
});