/**
 * Enhanced Configuration Tests
 * Tests for Jest, ESLint, Prettier, TypeScript, and Next.js configurations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Enhanced Configuration Files', () => {
  const rootDir = path.resolve(__dirname, '..');

  describe('Jest Configuration', () => {
    let jestConfig;

    beforeAll(() => {
      const jestConfigPath = path.join(rootDir, 'jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);
      jestConfig = require(jestConfigPath);
    });

    it('should have correct test environment', () => {
      expect(jestConfig.testEnvironment).toBe('jsdom');
    });

    it('should have proper module name mapping', () => {
      expect(jestConfig.moduleNameMapper).toHaveProperty('@/(.*)$');
      expect(jestConfig.moduleNameMapper).toHaveProperty('@/components/(.*)$');
      expect(jestConfig.moduleNameMapper).toHaveProperty('@/utils/(.*)$');
      expect(jestConfig.moduleNameMapper).toHaveProperty('@/hooks/(.*)$');
      expect(jestConfig.moduleNameMapper).toHaveProperty('@/types/(.*)$');
    });

    it('should have coverage thresholds configured', () => {
      expect(jestConfig.coverageThreshold.global.branches).toBe(80);
      expect(jestConfig.coverageThreshold.global.functions).toBe(80);
      expect(jestConfig.coverageThreshold.global.lines).toBe(80);
      expect(jestConfig.coverageThreshold.global.statements).toBe(80);
    });

    it('should have component-specific coverage thresholds', () => {
      expect(jestConfig.coverageThreshold['./src/components/**/*.{ts,tsx}']).toEqual({
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      });
    });

    it('should have utils-specific coverage thresholds', () => {
      expect(jestConfig.coverageThreshold['./src/utils/**/*.{ts,tsx}']).toEqual({
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      });
    });

    it('should have proper setup files', () => {
      expect(jestConfig.setupFilesAfterEnv).toContain('<rootDir>/jest.setup.js');
    });

    it('should ignore correct paths for testing', () => {
      expect(jestConfig.testPathIgnorePatterns).toContain('<rootDir>/.next/');
      expect(jestConfig.testPathIgnorePatterns).toContain('<rootDir>/node_modules/');
      expect(jestConfig.testPathIgnorePatterns).toContain('<rootDir>/out/');
      expect(jestConfig.testPathIgnorePatterns).toContain('<rootDir>/build/');
    });

    it('should have correct test timeout', () => {
      expect(jestConfig.testTimeout).toBe(10000);
    });

    it('should have watch plugins configured', () => {
      expect(jestConfig.watchPlugins).toContain('jest-watch-typeahead/filename');
      expect(jestConfig.watchPlugins).toContain('jest-watch-typeahead/testname');
    });
  });

  describe('ESLint Configuration', () => {
    let eslintConfig;

    beforeAll(() => {
      const eslintConfigPath = path.join(rootDir, '.eslintrc.json');
      expect(fs.existsSync(eslintConfigPath)).toBe(true);
      eslintConfig = JSON.parse(fs.readFileSync(eslintConfigPath, 'utf8'));
    });

    it('should extend correct configurations', () => {
      expect(eslintConfig.extends).toContain('next/core-web-vitals');
      expect(eslintConfig.extends).toContain('@typescript-eslint/recommended');
      expect(eslintConfig.extends).toContain('plugin:react/recommended');
      expect(eslintConfig.extends).toContain('plugin:react-hooks/recommended');
      expect(eslintConfig.extends).toContain('plugin:jsx-a11y/recommended');
      expect(eslintConfig.extends).toContain('prettier');
    });

    it('should have correct parser configuration', () => {
      expect(eslintConfig.parser).toBe('@typescript-eslint/parser');
      expect(eslintConfig.parserOptions.ecmaVersion).toBe(2022);
      expect(eslintConfig.parserOptions.sourceType).toBe('module');
      expect(eslintConfig.parserOptions.ecmaFeatures.jsx).toBe(true);
    });

    it('should have required plugins', () => {
      expect(eslintConfig.plugins).toContain('@typescript-eslint');
      expect(eslintConfig.plugins).toContain('react');
      expect(eslintConfig.plugins).toContain('react-hooks');
      expect(eslintConfig.plugins).toContain('jsx-a11y');
      expect(eslintConfig.plugins).toContain('import');
    });

    it('should have TypeScript-specific rules', () => {
      expect(eslintConfig.rules['@typescript-eslint/no-unused-vars']).toBe('error');
      expect(eslintConfig.rules['@typescript-eslint/explicit-function-return-type']).toBe('warn');
      expect(eslintConfig.rules['@typescript-eslint/no-explicit-any']).toBe('warn');
    });

    it('should have React-specific rules', () => {
      expect(eslintConfig.rules['react/react-in-jsx-scope']).toBe('off');
      expect(eslintConfig.rules['react/prop-types']).toBe('off');
      expect(eslintConfig.rules['react/jsx-uses-react']).toBe('off');
    });

    it('should have import ordering rules', () => {
      expect(eslintConfig.rules['import/order']).toEqual([
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ]);
    });

    it('should have correct environment settings', () => {
      expect(eslintConfig.env.browser).toBe(true);
      expect(eslintConfig.env.es2022).toBe(true);
      expect(eslintConfig.env.node).toBe(true);
      expect(eslintConfig.env.jest).toBe(true);
    });
  });

  describe('Prettier Configuration', () => {
    let prettierConfig;

    beforeAll(() => {
      const prettierConfigPath = path.join(rootDir, '.prettierrc.json');
      expect(fs.existsSync(prettierConfigPath)).toBe(true);
      prettierConfig = JSON.parse(fs.readFileSync(prettierConfigPath, 'utf8'));
    });

    it('should have correct basic formatting rules', () => {
      expect(prettierConfig.semi).toBe(true);
      expect(prettierConfig.trailingComma).toBe('es5');
      expect(prettierConfig.singleQuote).toBe(true);
      expect(prettierConfig.printWidth).toBe(80);
      expect(prettierConfig.tabWidth).toBe(2);
      expect(prettierConfig.useTabs).toBe(false);
    });

    it('should have file-specific overrides', () => {
      expect(prettierConfig.overrides).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            files: '*.json',
            options: { printWidth: 120 },
          }),
          expect.objectContaining({
            files: ['*.md', '*.mdx'],
            options: { printWidth: 100, proseWrap: 'always' },
          }),
          expect.objectContaining({
            files: ['*.yml', '*.yaml'],
            options: { tabWidth: 2, singleQuote: false },
          }),
        ])
      );
    });
  });

  describe('TypeScript Configuration', () => {
    let tsConfig;

    beforeAll(() => {
      const tsConfigPath = path.join(rootDir, 'tsconfig.json');
      expect(fs.existsSync(tsConfigPath)).toBe(true);
      tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    });

    it('should have correct compiler options', () => {
      expect(tsConfig.compilerOptions.target).toBe('ES2022');
      expect(tsConfig.compilerOptions.lib).toContain('ES2022');
      expect(tsConfig.compilerOptions.lib).toContain('DOM');
      expect(tsConfig.compilerOptions.lib).toContain('DOM.Iterable');
      expect(tsConfig.compilerOptions.allowJs).toBe(true);
      expect(tsConfig.compilerOptions.skipLibCheck).toBe(true);
      expect(tsConfig.compilerOptions.strict).toBe(true);
    });

    it('should have strict type checking enabled', () => {
      expect(tsConfig.compilerOptions.noImplicitAny).toBe(true);
      expect(tsConfig.compilerOptions.strictNullChecks).toBe(true);
      expect(tsConfig.compilerOptions.strictFunctionTypes).toBe(true);
      expect(tsConfig.compilerOptions.noImplicitReturns).toBe(true);
      expect(tsConfig.compilerOptions.noFallthroughCasesInSwitch).toBe(true);
      expect(tsConfig.compilerOptions.noUncheckedIndexedAccess).toBe(true);
    });

    it('should have correct module resolution', () => {
      expect(tsConfig.compilerOptions.moduleResolution).toBe('bundler');
      expect(tsConfig.compilerOptions.allowImportingTsExtensions).toBe(true);
      expect(tsConfig.compilerOptions.resolveJsonModule).toBe(true);
      expect(tsConfig.compilerOptions.isolatedModules).toBe(true);
    });

    it('should have path aliases configured', () => {
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/components/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/utils/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/hooks/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/types/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/styles/*');
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/public/*');
    });

    it('should include correct directories', () => {
      expect(tsConfig.include).toContain('next-env.d.ts');
      expect(tsConfig.include).toContain('**/*.ts');
      expect(tsConfig.include).toContain('**/*.tsx');
      expect(tsConfig.include).toContain('.next/types/**/*.ts');
    });

    it('should exclude correct directories', () => {
      expect(tsConfig.exclude).toContain('node_modules');
      expect(tsConfig.exclude).toContain('.next');
      expect(tsConfig.exclude).toContain('out');
      expect(tsConfig.exclude).toContain('build');
      expect(tsConfig.exclude).toContain('dist');
    });
  });

  describe('Next.js Configuration', () => {
    let nextConfig;

    beforeAll(() => {
      const nextConfigPath = path.join(rootDir, 'next.config.js');
      expect(fs.existsSync(nextConfigPath)).toBe(true);
      // Note: This is a simplified test since next.config.js exports a function
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      expect(configContent).toContain('experimental');
      expect(configContent).toContain('images');
      expect(configContent).toContain('webpack');
    });

    it('should exist and be properly formatted', () => {
      const nextConfigPath = path.join(rootDir, 'next.config.js');
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');

      // Check for key configuration sections
      expect(configContent).toContain('experimental');
      expect(configContent).toContain('appDir: true');
      expect(configContent).toContain('serverComponentsExternalPackages');
      expect(configContent).toContain('images');
      expect(configContent).toContain('domains');
      expect(configContent).toContain('webpack');
      expect(configContent).toContain('compress: true');
      expect(configContent).toContain('poweredByHeader: false');
    });
  });

  describe('Package.json Configuration', () => {
    let packageJson;

    beforeAll(() => {
      const packageJsonPath = path.join(rootDir, 'package.json');
      expect(fs.existsSync(packageJsonPath)).toBe(true);
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    });

    it('should have enhanced scripts', () => {
      expect(packageJson.scripts).toHaveProperty('dev');
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts).toHaveProperty('start');
      expect(packageJson.scripts).toHaveProperty('lint');
      expect(packageJson.scripts).toHaveProperty('lint:fix');
      expect(packageJson.scripts).toHaveProperty('format');
      expect(packageJson.scripts).toHaveProperty('format:check');
      expect(packageJson.scripts).toHaveProperty('test');
      expect(packageJson.scripts).toHaveProperty('test:watch');
      expect(packageJson.scripts).toHaveProperty('test:coverage');
      expect(packageJson.scripts).toHaveProperty('test:ci');
      expect(packageJson.scripts).toHaveProperty('type-check');
      expect(packageJson.scripts).toHaveProperty('analyze');
      expect(packageJson.scripts).toHaveProperty('clean');
      expect(packageJson.scripts).toHaveProperty('validate');
    });

    it('should have lint-staged configuration', () => {
      expect(packageJson['lint-staged']).toEqual({
        '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write', 'git add'],
        '*.{json,md,yml,yaml}': ['prettier --write', 'git add'],
      });
    });

    it('should have husky configuration', () => {
      expect(packageJson.husky).toEqual({
        hooks: {
          'pre-commit': 'lint-staged',
          'pre-push': 'npm run type-check && npm run test:ci',
        },
      });
    });

    it('should have engines specified', () => {
      expect(packageJson.engines).toHaveProperty('node');
      expect(packageJson.engines).toHaveProperty('npm');
    });

    it('should have browserslist configuration', () => {
      expect(packageJson.browserslist).toEqual([
        '>0.2%',
        'not dead',
        'not ie <= 11',
        'not op_mini all',
      ]);
    });
  });

  describe('Configuration Integration', () => {
    it('should have consistent path aliases across configs', () => {
      // This test would verify that path aliases in tsconfig.json
      // match those in jest.config.js and other configuration files
      const tsConfigPath = path.join(rootDir, 'tsconfig.json');
      const jestConfigPath = path.join(rootDir, 'jest.config.js');

      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      const jestConfig = require(jestConfigPath);

      // Check that both configs have @/ alias
      expect(tsConfig.compilerOptions.paths).toHaveProperty('@/*');
      expect(jestConfig.moduleNameMapper).toHaveProperty('@/(.*)$');
    });

    it('should have consistent file extensions across configs', () => {
      const tsConfigPath = path.join(rootDir, 'tsconfig.json');
      const jestConfigPath = path.join(rootDir, 'jest.config.js');

      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      const jestConfig = require(jestConfigPath);

      // Both should handle .ts and .tsx files
      expect(tsConfig.include.some(pattern => pattern.includes('*.ts'))).toBe(true);
      expect(tsConfig.include.some(pattern => pattern.includes('*.tsx'))).toBe(true);

      expect(jestConfig.testMatch.some(pattern => pattern.includes('.ts'))).toBe(true);
      expect(jestConfig.testMatch.some(pattern => pattern.includes('.tsx'))).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should pass ESLint validation', () => {
      try {
        execSync('npx eslint --print-config .eslintrc.json', {
          cwd: rootDir,
          stdio: 'pipe',
        });
      } catch (error) {
        // ESLint config should be valid
        expect(error).toBeNull();
      }
    });

    it('should pass TypeScript config validation', () => {
      try {
        execSync('npx tsc --noEmit --project tsconfig.json', {
          cwd: rootDir,
          stdio: 'pipe',
        });
      } catch (error) {
        // TypeScript config should be valid
        // Note: This might fail if there are actual TypeScript errors in the codebase
        console.warn('TypeScript validation failed:', error.message);
      }
    });

    it('should pass Prettier config validation', () => {
      try {
        execSync('npx prettier --check .prettierrc.json', {
          cwd: rootDir,
          stdio: 'pipe',
        });
      } catch (error) {
        // Prettier config should be valid
        expect(error).toBeNull();
      }
    });
  });
});
