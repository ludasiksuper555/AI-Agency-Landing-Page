import '@testing-library/jest-dom';

import { fireEvent, render, screen } from '@testing-library/react';

import Header from './Header';

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
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

// Мокаємо Clerk аутентифікацію
const mockUserSignedIn = {
  isLoaded: true,
  isSignedIn: true,
  user: {
    firstName: 'Тест',
    fullName: 'Тест Юзер',
  },
};

const mockUserSignedOut = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
};

let mockIsSignedIn = false;

jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    userId: mockIsSignedIn ? 'user_123' : null,
  }),
  useUser: () => (mockIsSignedIn ? mockUserSignedIn : mockUserSignedOut),
  SignedIn: ({ children }: { children: React.ReactNode }) =>
    mockIsSignedIn ? <>{children}</> : null,
  SignedOut: ({ children }: { children: React.ReactNode }) =>
    !mockIsSignedIn ? <>{children}</> : null,
  UserButton: () => <button data-testid="user-button">Профіль користувача</button>,
  SignInButton: ({ children }: { children: React.ReactNode; mode: string }) => (
    <div data-testid="sign-in-button">{children}</div>
  ),
  SignUpButton: ({ children }: { children: React.ReactNode; mode: string }) => (
    <div data-testid="sign-up-button">{children}</div>
  ),
}));

describe('Header Component', () => {
  beforeEach(() => {
    // Очищаємо моки перед кожним тестом
    jest.clearAllMocks();
    // Скидаємо стан авторизації
    mockIsSignedIn = false;
    // Мокуємо window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    // Мокуємо addEventListener та removeEventListener
    window.addEventListener = jest.fn() as jest.MockedFunction<typeof window.addEventListener>;
    window.removeEventListener = jest.fn() as jest.MockedFunction<
      typeof window.removeEventListener
    >;
  });

  it('рендериться без помилок', () => {
    render(<Header />);
    // Перевіряємо, що компонент відрендерився
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('відображає правильний логотип', () => {
    render(<Header />);
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Agency')).toBeInTheDocument();
  });

  it('відображає кнопки входу та реєстрації для неавторизованих користувачів', () => {
    render(<Header />);
    expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
    expect(screen.getByTestId('sign-up-button')).toBeInTheDocument();
    expect(screen.getByText('Увійти')).toBeInTheDocument();
    expect(screen.getByText('Зареєструватися')).toBeInTheDocument();
  });

  it('відображає кнопку мобільного меню на малих екранах', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Відкрити меню');
    expect(menuButton).toBeInTheDocument();
  });

  it('відкриває мобільне меню при натисканні на кнопку', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Відкрити меню');

    // Спочатку меню закрите
    expect(screen.queryByText('Головна')).not.toBeVisible();

    // Відкриваємо меню
    fireEvent.click(menuButton);

    // Тепер меню має бути відкритим
    expect(screen.getByText('Головна')).toBeVisible();
  });

  it('змінює стиль при прокрутці сторінки', () => {
    render(<Header />);

    // Імітуємо прокрутку сторінки
    Object.defineProperty(window, 'scrollY', { value: 100 });
    // Викликаємо обробник прокрутки
    const mockAddEventListener = window.addEventListener as jest.MockedFunction<
      typeof window.addEventListener
    >;
    const scrollCallback = mockAddEventListener.mock.calls.find(call => call[0] === 'scroll')?.[1];
    if (scrollCallback && typeof scrollCallback === 'function') {
      scrollCallback(new Event('scroll'));
    }

    // Перевіряємо, що стиль змінився
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white');
    expect(header).toHaveClass('shadow-md');
  });

  it('відображає інтерфейс для авторизованого користувача', () => {
    // Встановлюємо стан авторизації
    mockIsSignedIn = true;

    render(<Header />);

    // Перевіряємо наявність кнопки профілю користувача
    expect(screen.getByTestId('user-button')).toBeInTheDocument();

    // Перевіряємо відсутність кнопок входу та реєстрації
    expect(screen.queryByText('Увійти')).not.toBeInTheDocument();
    expect(screen.queryByText('Зареєструватися')).not.toBeInTheDocument();
  });
});
