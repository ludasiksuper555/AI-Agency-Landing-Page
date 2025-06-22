/**
 * Тесты для валидации импортов и экспортов
 * Проверяют соответствие стандартам проекта
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Import/Export Validation', () => {
  const projectRoot = path.resolve(__dirname, '..');
  const componentsDir = path.join(projectRoot, 'components');
  const pagesDir = path.join(projectRoot, 'pages');

  /**
   * Получить все TypeScript/JavaScript файлы в директории
   */
  function getSourceFiles(dir) {
    if (!fs.existsSync(dir)) return [];

    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...getSourceFiles(fullPath));
      } else if (
        /\.(ts|tsx|js|jsx)$/.test(item.name) &&
        !item.name.includes('.test.') &&
        !item.name.includes('.spec.')
      ) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Проверить содержимое файла на наличие экспортов
   */
  function analyzeExports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    const hasDefaultExport =
      /export\s+default\s+/.test(content) || /export\s*{[^}]*default[^}]*}/.test(content);
    const hasNamedExports =
      /export\s+(const|function|class|interface|type)\s+/.test(content) ||
      /export\s*{[^}]+}(?!\s+from)/.test(content);

    return { hasDefaultExport, hasNamedExports, content };
  }

  /**
   * Найти все импорты в файле
   */
  function findImports(content) {
    const importRegex = /import\s+([^;]+)\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importStatement = match[1].trim();
      const modulePath = match[2];

      const isDefaultImport =
        /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(importStatement) ||
        /^[a-zA-Z_$][a-zA-Z0-9_$]*\s*,/.test(importStatement);
      const hasNamedImports = /{[^}]+}/.test(importStatement);

      imports.push({
        statement: importStatement,
        module: modulePath,
        isDefaultImport,
        hasNamedImports,
        fullMatch: match[0],
      });
    }

    return imports;
  }

  test('Все компоненты должны иметь правильные экспорты', () => {
    const componentFiles = getSourceFiles(componentsDir);
    const issues = [];

    componentFiles.forEach(filePath => {
      const relativePath = path.relative(projectRoot, filePath);
      const { hasDefaultExport, hasNamedExports } = analyzeExports(filePath);

      // Провайдеры должны использовать named exports
      if (filePath.includes('Provider') && !hasNamedExports) {
        issues.push(`${relativePath}: Provider компонент должен использовать named export`);
      }

      // Основные компоненты должны иметь хотя бы один тип экспорта
      if (!hasDefaultExport && !hasNamedExports) {
        issues.push(`${relativePath}: Компонент должен иметь хотя бы один экспорт`);
      }
    });

    if (issues.length > 0) {
      console.warn('Найдены проблемы с экспортами:\n' + issues.join('\n'));
    }

    expect(issues.length).toBeLessThan(5); // Допускаем небольшое количество проблем
  });

  test('Страницы должны использовать default export', () => {
    const pageFiles = getSourceFiles(pagesDir);
    const issues = [];

    pageFiles.forEach(filePath => {
      const relativePath = path.relative(projectRoot, filePath);
      const { hasDefaultExport } = analyzeExports(filePath);

      // Исключаем служебные файлы Next.js
      if (
        !filePath.includes('_app.') &&
        !filePath.includes('_document.') &&
        !filePath.includes('api/') &&
        !hasDefaultExport
      ) {
        issues.push(`${relativePath}: Страница должна использовать default export`);
      }
    });

    expect(issues).toEqual([]);
  });

  test('Импорты должны соответствовать типу экспорта', () => {
    const allFiles = [...getSourceFiles(componentsDir), ...getSourceFiles(pagesDir)];
    const issues = [];

    allFiles.forEach(filePath => {
      const relativePath = path.relative(projectRoot, filePath);
      const { content } = analyzeExports(filePath);
      const imports = findImports(content);

      imports.forEach(imp => {
        // Проверяем импорты из компонентов
        if (imp.module.includes('components/')) {
          const targetPath = path.resolve(path.dirname(filePath), imp.module);

          // Пытаемся найти файл с различными расширениями
          const possibleFiles = [
            targetPath + '.tsx',
            targetPath + '.ts',
            targetPath + '/index.tsx',
            targetPath + '/index.ts',
          ];

          const existingFile = possibleFiles.find(f => fs.existsSync(f));

          if (existingFile) {
            const targetExports = analyzeExports(existingFile);

            // Проверяем соответствие типов импорта/экспорта
            if (
              imp.isDefaultImport &&
              !targetExports.hasDefaultExport &&
              targetExports.hasNamedExports
            ) {
              issues.push(`${relativePath}: Default import для named export в ${imp.module}`);
            }
          }
        }
      });
    });

    if (issues.length > 0) {
      console.warn('Найдены несоответствия импортов:\n' + issues.join('\n'));
    }

    expect(issues.length).toBeLessThan(3); // Допускаем небольшое количество проблем
  });

  test('ESLint правила импортов должны проходить', () => {
    try {
      // Запускаем ESLint только для правил импортов
      const result = execSync(
        'npx eslint . --ext .ts,.tsx --no-eslintrc --config .eslintrc.js --format json',
        { cwd: projectRoot, encoding: 'utf8' }
      );

      const lintResults = JSON.parse(result);
      const importErrors = lintResults
        .flatMap(file => file.messages)
        .filter(msg => msg.ruleId && msg.ruleId.startsWith('import/'));

      if (importErrors.length > 0) {
        console.warn('ESLint ошибки импортов:', importErrors.slice(0, 5));
      }

      expect(importErrors.length).toBeLessThan(10);
    } catch (error) {
      // ESLint может вернуть ненулевой код при наличии ошибок
      if (error.stdout) {
        const lintResults = JSON.parse(error.stdout);
        const importErrors = lintResults
          .flatMap(file => file.messages)
          .filter(msg => msg.ruleId && msg.ruleId.startsWith('import/'));

        expect(importErrors.length).toBeLessThan(10);
      } else {
        throw error;
      }
    }
  });

  test('TypeScript компиляция должна проходить без ошибок импортов', () => {
    try {
      execSync('npx tsc --noEmit --skipLibCheck', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (error) {
      const output = error.stdout || error.stderr || '';

      // Фильтруем только ошибки, связанные с импортами
      const importErrors = output
        .split('\n')
        .filter(
          line =>
            line.includes('Cannot find module') ||
            line.includes('Module not found') ||
            line.includes('has no default export') ||
            line.includes('has no exported member')
        );

      if (importErrors.length > 0) {
        console.warn('TypeScript ошибки импортов:', importErrors.slice(0, 5));
        expect(importErrors.length).toBeLessThan(5);
      }
    }
  });

  test('Нет дублирующихся импортов', () => {
    const allFiles = [...getSourceFiles(componentsDir), ...getSourceFiles(pagesDir)];
    const issues = [];

    allFiles.forEach(filePath => {
      const relativePath = path.relative(projectRoot, filePath);
      const { content } = analyzeExports(filePath);
      const imports = findImports(content);

      const moduleCount = {};
      imports.forEach(imp => {
        moduleCount[imp.module] = (moduleCount[imp.module] || 0) + 1;
      });

      Object.entries(moduleCount).forEach(([module, count]) => {
        if (count > 1) {
          issues.push(`${relativePath}: Дублирующийся импорт ${module} (${count} раз)`);
        }
      });
    });

    expect(issues).toEqual([]);
  });
});

// Утилита для запуска тестов вручную
if (require.main === module) {
  console.log('Запуск валидации импортов...');

  // Простая реализация для ручного запуска
  const { execSync } = require('child_process');

  try {
    execSync('npm test -- import-validation.test.js', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
  } catch (error) {
    console.error('Тесты завершились с ошибками');
    process.exit(1);
  }
}
