import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClerkProvider } from '@clerk/clerk-react';
import { useRouter } from 'next/router';
import Dashboard from '../../pages/dashboard';

// Мокуємо Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Мокуємо Clerk провайдер
jest.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useUser: jest.fn().mockReturnValue({
    isSignedIn: true,
    user: {
      id: 'user_123',
      fullName: 'Тестовий Користувач',
      primaryEmailAddress: 'test@example.com',
    },
  }),
  useAuth: jest.fn().mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    signOut: jest.fn(),
  }),
}));

describe('Інтеграційний тест потоку аутентифікації', () => {
  beforeEach(() => {
    // Налаштовуємо мок для useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      pathname: '/dashboard',
    });
  });

  test('користувач може успішно увійти та отримати доступ до захищеної сторінки', async () => {
    render(
      <ClerkProvider publishableKey="test_key">
        <Dashboard />
      </ClerkProvider>
    );

    // Перевіряємо, що компонент Dashboard відображається для авторизованого користувача
    await waitFor(() => {
      expect(screen.getByText(/Панель керування/i)).toBeInTheDocument();
    });

    // Перевіряємо, що інформація користувача відображається
    expect(screen.getByText(/Тестовий Користувач/i)).toBeInTheDocument();
  });

  test('користувач може вийти з системи', async () => {
    const signOutMock = jest.fn();
    
    // Перевизначаємо мок для useAuth
    (require('@clerk/clerk-react') as any).useAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      signOut: signOutMock,
    });

    render(
      <ClerkProvider publishableKey="test_key">
        <Dashboard />
      </ClerkProvider>
    );

    // Знаходимо кнопку виходу та клікаємо на неї
    const logoutButton = screen.getByText(/Вийти/i);
    fireEvent.click(logoutButton);

    // Перевіряємо, що функція виходу була викликана
    expect(signOutMock).toHaveBeenCalled();
  });
});