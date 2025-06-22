const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Enhanced Jest configuration
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
  ],

  // Module name mapping with enhanced aliases
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/data/(.*)$': '<rootDir>/data/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/(.*)$': '<rootDir>/$1',
    // Style mocks
    '^.+\.module\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // File mocks
    '^.+\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Test patterns - Windows compatible
  testMatch: [
    '**/tests/**/*.{js,jsx,ts,tsx}',
    '**/components/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.(test|spec).{js,jsx,ts,tsx}',
  ],

  // Enhanced coverage configuration
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'pages/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'data/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/build/**',
    '!pages/_app.tsx',
    '!pages/_document.tsx',
    '!pages/api/**',
    '!**/*.config.{js,ts}',
    '!**/jest.setup.js',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Component-specific thresholds
    './components/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary', 'clover'],
  coverageDirectory: 'coverage',

  // Transform ignore patterns for better performance
  transformIgnorePatterns: ['/node_modules/(?!(framer-motion|@chakra-ui|@contentful)/)'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Performance optimizations
  testTimeout: 5000,
  maxWorkers: '50%',

  // Output configuration
  verbose: true,
  clearMocks: true,
  restoreMocks: true,

  // Watch plugins for better development experience
  // watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  // Error handling
  errorOnDeprecated: true,

  // Globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};

// Export with Next.js Jest configuration
module.exports = createJestConfig(customJestConfig);
