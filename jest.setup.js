// Добавляем расширения для тестирования
import '@testing-library/jest-dom';

// Мок для Next.js роутера
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));

// Мок для Clerk аутентификации
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isLoaded: true,
    userId: 'user_123',
    sessionId: 'session_123',
    getToken: jest.fn().mockResolvedValue('token'),
  }),
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'user_123',
      fullName: 'Test User',
      primaryEmailAddress: {
        emailAddress: 'test@example.com',
      },
    },
  }),
  SignedIn: ({ children }) => children,
  SignedOut: ({ children }) => null,
  ClerkProvider: ({ children }) => children,
}));