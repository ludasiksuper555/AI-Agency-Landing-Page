// Jest setup file
import '@testing-library/jest-dom';

// React 18 support
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock console.error to suppress React warnings in tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') ||
      args[0].includes('createRoot') ||
      args[0].includes('act') ||
      args[0].includes('ReactDOM.render'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock console.warn to suppress React warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') ||
      args[0].includes('createRoot') ||
      args[0].includes('act') ||
      args[0].includes('ReactDOM.render'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Setup JSDOM environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

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
