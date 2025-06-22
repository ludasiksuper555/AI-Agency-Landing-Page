#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Встановлення критичних залежностей...');

// Функція для виконання команд з обробкою помилок
function runCommand(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} - успішно`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} - помилка:`, error.message);
    return false;
  }
}

// Функція для перевірки існування package.json
function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('📝 Створення package.json...');
    const packageContent = {
      name: 'meat-industry-dashboard',
      version: '2.0.0',
      description: "M'ясна промисловість України - Dashboard",
      main: 'index.js',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'lint:fix': 'next lint --fix',
        'type-check': 'tsc --noEmit',
        format: 'prettier --write .',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:e2e': 'cypress run',
        'quality-check': 'npm run type-check && npm run lint && npm run test',
        storybook: 'start-storybook -p 6006',
        'build-storybook': 'build-storybook',
      },
      dependencies: {},
      devDependencies: {},
      keywords: ['meat-industry', 'ukraine', 'dashboard', 'analytics'],
      author: 'Development Team',
      license: 'MIT',
    };
    fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));
    console.log('✅ package.json створено');
  }
}

// Основні залежності
const mainDependencies = [
  // React та Next.js
  'react@^18.0.0',
  'react-dom@^18.0.0',
  'next@^13.0.0',

  // Chakra UI та стилізація
  '@chakra-ui/react@^2.8.0',
  '@chakra-ui/icons@^2.1.0',
  '@chakra-ui/system@^2.6.0',
  '@emotion/react@^11.11.0',
  '@emotion/styled@^11.11.0',

  // Анімації
  'framer-motion@^10.16.0',

  // Утиліти
  'lodash@^4.17.21',
  'date-fns@^2.30.0',
  'uuid@^9.0.0',

  // Іконки
  'react-icons@^4.11.0',

  // Форми
  'react-hook-form@^7.45.0',
  '@hookform/resolvers@^3.3.0',
  'yup@^1.3.0',
];

// Dev залежності
const devDependencies = [
  // TypeScript
  'typescript@^5.0.0',
  '@types/react@^18.0.0',
  '@types/react-dom@^18.0.0',
  '@types/node@^20.0.0',
  '@types/lodash@^4.14.0',
  '@types/uuid@^9.0.0',

  // Linting та форматування
  'eslint@^8.0.0',
  'eslint-config-next@^13.0.0',
  '@typescript-eslint/eslint-plugin@^6.0.0',
  '@typescript-eslint/parser@^6.0.0',
  'prettier@^3.0.0',
  'eslint-config-prettier@^9.0.0',
  'eslint-plugin-prettier@^5.0.0',

  // Тестування
  'jest@^29.0.0',
  '@testing-library/react@^13.0.0',
  '@testing-library/jest-dom@^6.0.0',
  'jest-environment-jsdom@^29.0.0',

  // Storybook
  '@storybook/react@^7.0.0',
  '@storybook/addon-essentials@^7.0.0',
  '@storybook/addon-interactions@^7.0.0',
  '@storybook/testing-library@^0.2.0',

  // E2E тестування
  'cypress@^13.0.0',
];

// Функція для створення конфігураційних файлів
function createConfigFiles() {
  console.log('\n📝 Створення конфігураційних файлів...');

  // tsconfig.json
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    const tsconfig = {
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'es6'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [
          {
            name: 'next',
          },
        ],
        baseUrl: '.',
        paths: {
          '@/*': ['./*'],
        },
        jsxImportSource: '@emotion/react',
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log('✅ tsconfig.json створено');
  }

  // .eslintrc.json
  const eslintPath = path.join(process.cwd(), '.eslintrc.json');
  if (!fs.existsSync(eslintPath)) {
    const eslintConfig = {
      extends: ['next/core-web-vitals', '@typescript-eslint/recommended', 'prettier'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'prettier'],
      rules: {
        'prettier/prettier': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
      },
      ignorePatterns: ['node_modules/', '.next/', 'out/'],
    };
    fs.writeFileSync(eslintPath, JSON.stringify(eslintConfig, null, 2));
    console.log('✅ .eslintrc.json створено');
  }

  // prettier.config.js
  const prettierPath = path.join(process.cwd(), 'prettier.config.js');
  if (!fs.existsSync(prettierPath)) {
    const prettierConfig = `module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
};
`;
    fs.writeFileSync(prettierPath, prettierConfig);
    console.log('✅ prettier.config.js створено');
  }

  // next.config.js
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    emotion: true,
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
`;
    fs.writeFileSync(nextConfigPath, nextConfig);
    console.log('✅ next.config.js створено');
  }
}

// Основна функція
async function main() {
  try {
    console.log('🚀 Початок встановлення критичних залежностей');

    // Перевірка та створення package.json
    checkPackageJson();

    // Ініціалізація npm якщо потрібно
    if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
      runCommand('npm init -y', 'Ініціалізація npm');
    }

    // Встановлення основних залежностей
    console.log('\n📦 Встановлення основних залежностей...');
    const mainDepsCommand = `npm install ${mainDependencies.join(' ')}`;
    const mainSuccess = runCommand(mainDepsCommand, 'Основні залежності');

    // Встановлення dev залежностей
    console.log('\n🛠️ Встановлення dev залежностей...');
    const devDepsCommand = `npm install --save-dev ${devDependencies.join(' ')}`;
    const devSuccess = runCommand(devDepsCommand, 'Dev залежності');

    // Створення конфігураційних файлів
    createConfigFiles();

    // Перевірка встановлення
    console.log('\n🔍 Перевірка встановлення...');
    runCommand('npm list --depth=0', 'Перевірка залежностей');

    // Запуск type-check
    console.log('\n✅ Запуск перевірки типів...');
    const typeCheckSuccess = runCommand('npm run type-check', 'Перевірка TypeScript');

    // Підсумок
    console.log('\n📊 Підсумок встановлення:');
    console.log(`✅ Основні залежності: ${mainSuccess ? 'встановлено' : 'помилка'}`);
    console.log(`✅ Dev залежності: ${devSuccess ? 'встановлено' : 'помилка'}`);
    console.log(`✅ TypeScript перевірка: ${typeCheckSuccess ? 'пройдено' : 'є помилки'}`);

    if (mainSuccess && devSuccess) {
      console.log('\n🎉 Всі критичні залежності успішно встановлено!');
      console.log('\n📋 Наступні кроки:');
      console.log('1. Запустіть: npm run lint:fix');
      console.log('2. Запустіть: npm run format');
      console.log('3. Запустіть: node fix-motion-errors.js');
      console.log('4. Запустіть: npm run type-check');
    } else {
      console.log('\n⚠️ Деякі залежності не вдалося встановити. Перевірте помилки вище.');
    }
  } catch (error) {
    console.error('❌ Критична помилка:', error.message);
    process.exit(1);
  }
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = { main };
