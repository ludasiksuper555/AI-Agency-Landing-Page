/**
 * Enhanced Jest Setup Configuration
 * Global test setup, mocks, and utilities for the enhanced team portfolio project
 */

import '@testing-library/jest-dom';
import 'jest-canvas-mock';

import { configure } from '@testing-library/react';

import { server } from './src/mocks/server';

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  computedStyleSupportsPseudoElements: true,
});

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(callback => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Mock window.scroll
Object.defineProperty(window, 'scroll', {
  value: jest.fn(),
  writable: true,
});

// Mock HTMLElement.scrollIntoView
HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock HTMLElement.focus
HTMLElement.prototype.focus = jest.fn();

// Mock HTMLElement.blur
HTMLElement.prototype.blur = jest.fn();

// Mock HTMLElement.click
HTMLElement.prototype.click = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'mocked-url'),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
});

// Mock fetch
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Start MSW server
  server.listen({ onUnhandledRequest: 'error' });

  // Suppress specific console warnings/errors during tests
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: React.createFactory() is deprecated') ||
        args[0].includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: React.createFactory() is deprecated') ||
        args[0].includes('Warning: componentWillReceiveProps has been renamed'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  // Reset all mocks after each test
  jest.clearAllMocks();

  // Reset MSW handlers
  server.resetHandlers();

  // Clear localStorage and sessionStorage
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset fetch mock
  if (global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

afterAll(() => {
  // Restore console methods
  console.error = originalError;
  console.warn = originalWarn;

  // Stop MSW server
  server.close();
});

// Custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    if (pass) {
      return {
        message: () => `expected element not to be in the document`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be in the document`,
        pass: false,
      };
    }
  },

  toHaveAccessibleName(received, expectedName) {
    const accessibleName =
      received.getAttribute('aria-label') ||
      received.getAttribute('aria-labelledby') ||
      received.textContent;
    const pass = accessibleName === expectedName;

    if (pass) {
      return {
        message: () => `expected element not to have accessible name "${expectedName}"`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected element to have accessible name "${expectedName}" but got "${accessibleName}"`,
        pass: false,
      };
    }
  },

  toBeVisible(received) {
    const style = window.getComputedStyle(received);
    const pass = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';

    if (pass) {
      return {
        message: () => `expected element not to be visible`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected element to be visible`,
        pass: false,
      };
    }
  },
});

// Global test helpers
global.testHelpers = {
  // Helper to create mock team member data
  createMockTeamMember: (overrides = {}) => ({
    id: '1',
    name: 'John Doe',
    position: 'Frontend Developer',
    department: 'Engineering',
    bio: 'Experienced frontend developer',
    imageUrl: '/images/john.jpg',
    socialLinks: {
      twitter: 'https://twitter.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      email: 'john@example.com',
    },
    skills: ['React', 'TypeScript', 'Next.js'],
    projects: ['Project A', 'Project B'],
    startDate: '2022-01-15',
    ...overrides,
  }),

  // Helper to create mock translation function
  createMockTranslation: (translations = {}) => {
    const defaultTranslations = {
      'team.title': 'Our Team',
      'team.filters.search': 'Search team members...',
      'team.filters.position': 'Filter by position',
      'team.filters.department': 'Filter by department',
      'team.filters.allPositions': 'All positions',
      'team.filters.allDepartments': 'All departments',
      'team.sorting.name': 'Name',
      'team.sorting.position': 'Position',
      'team.sorting.department': 'Department',
      'team.stats.totalMembers': 'Total Members',
      'team.stats.positionsCount': '{{count}} Positions',
      'team.stats.departmentsCount': '{{count}} Departments',
    };

    const allTranslations = { ...defaultTranslations, ...translations };

    return (key, options = {}) => {
      const translation = allTranslations[key];
      if (options.count !== undefined && translation) {
        return translation.replace('{{count}}', options.count.toString());
      }
      return translation || key;
    };
  },

  // Helper to wait for async operations
  waitForAsync: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to trigger window resize
  triggerResize: (width = 1024, height = 768) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },

  // Helper to mock API responses
  mockApiResponse: (data, status = 200) => {
    global.fetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
    });
  },

  // Helper to mock API error
  mockApiError: (error = 'Network error', status = 500) => {
    global.fetch.mockRejectedValueOnce(new Error(error));
  },

  // Helper to create mock router
  createMockRouter: (overrides = {}) => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/',
    basePath: '',
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    isFallback: false,
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    ...overrides,
  }),
};

// Performance monitoring for tests
if (process.env.NODE_ENV === 'test') {
  const originalSetTimeout = global.setTimeout;
  const originalSetInterval = global.setInterval;

  global.setTimeout = (callback, delay, ...args) => {
    if (delay > 1000) {
      console.warn(`Long timeout detected: ${delay}ms`);
    }
    return originalSetTimeout(callback, delay, ...args);
  };

  global.setInterval = (callback, delay, ...args) => {
    if (delay > 1000) {
      console.warn(`Long interval detected: ${delay}ms`);
    }
    return originalSetInterval(callback, delay, ...args);
  };
}

// Memory leak detection
if (process.env.NODE_ENV === 'test') {
  let initialMemory;

  beforeEach(() => {
    if (global.gc) {
      global.gc();
    }
    initialMemory = process.memoryUsage();
  });

  afterEach(() => {
    if (global.gc) {
      global.gc();
    }
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Warn if memory usage increased significantly (more than 10MB)
    if (memoryIncrease > 10 * 1024 * 1024) {
      console.warn(
        `Potential memory leak detected: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase`
      );
    }
  });
}
