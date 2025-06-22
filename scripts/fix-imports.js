#!/usr/bin/env node
/**
 * Скрипт для автоматического исправления импортов
 * Исправляет распространенные проблемы с импортами/экспортами
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ImportFixer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.fixes = [];
    this.errors = [];
  }

  /**
   * Получить все TypeScript/JavaScript файлы
   */
  getSourceFiles(dir) {
    if (!fs.existsSync(dir)) return [];

    const files = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        files.push(...this.getSourceFiles(fullPath));
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
   * Анализ экспортов файла
   */
  analyzeExports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    const defaultExportMatch = content.match(/export\s+default\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    const namedExportMatches = content.match(
      /export\s+(const|function|class|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
    );

    const hasDefaultExport = /export\s+default\s+/.test(content);
    const hasNamedExports =
      /export\s+(const|function|class|interface|type)\s+/.test(content) ||
      /export\s*{[^}]+}(?!\s+from)/.test(content);

    const namedExports = [];
    if (namedExportMatches) {
      namedExportMatches.forEach(match => {
        const nameMatch = match.match(
          /export\s+(?:const|function|class|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/
        );
        if (nameMatch) {
          namedExports.push(nameMatch[1]);
        }
      });
    }

    // Поиск экспортов в фигурных скобках
    const exportBracesMatch = content.match(/export\s*{([^}]+)}(?!\s+from)/g);
    if (exportBracesMatch) {
      exportBracesMatch.forEach(match => {
        const names = match
          .match(/{([^}]+)}/)[1]
          .split(',')
          .map(name => name.trim().split(' as ')[0].trim())
          .filter(name => name && name !== 'default');
        namedExports.push(...names);
      });
    }

    return {
      hasDefaultExport,
      hasNamedExports,
      namedExports: [...new Set(namedExports)],
      content,
    };
  }

  /**
   * Найти импорты в файле
   */
  findImports(content) {
    const importRegex = /import\s+([^;]+)\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importStatement = match[1].trim();
      const modulePath = match[2];

      const defaultImportMatch = importStatement.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*,|$)/);
      const namedImportsMatch = importStatement.match(/{([^}]+)}/);

      const defaultImport = defaultImportMatch ? defaultImportMatch[1] : null;
      const namedImports = namedImportsMatch
        ? namedImportsMatch[1].split(',').map(name => name.trim().split(' as ')[0].trim())
        : [];

      imports.push({
        fullMatch: match[0],
        statement: importStatement,
        module: modulePath,
        defaultImport,
        namedImports,
        line: content.substring(0, match.index).split('\n').length,
      });
    }

    return imports;
  }

  /**
   * Исправить импорт в файле
   */
  fixImportInFile(filePath, oldImport, newImport) {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      fs.writeFileSync(filePath, content, 'utf8');

      const relativePath = path.relative(this.projectRoot, filePath);
      this.fixes.push(`${relativePath}: ${oldImport} → ${newImport}`);
      return true;
    }

    return false;
  }

  /**
   * Исправить конкретные проблемы с импортами
   */
  fixKnownIssues() {
    const allFiles = this.getSourceFiles(this.projectRoot);

    allFiles.forEach(filePath => {
      const { content } = this.analyzeExports(filePath);
      const imports = this.findImports(content);

      imports.forEach(imp => {
        // Исправляем известные проблемы

        // 1. NotificationProvider - должен быть named import
        if (imp.module.includes('NotificationProvider') && imp.defaultImport) {
          const oldImport = imp.fullMatch;
          const newImport = oldImport.replace(imp.defaultImport, `{ ${imp.defaultImport} }`);
          this.fixImportInFile(filePath, oldImport, newImport);
        }

        // 2. Провайдеры обычно должны быть named imports
        if (imp.module.includes('Provider') && imp.defaultImport && !imp.namedImports.length) {
          const targetPath = this.resolveModulePath(filePath, imp.module);
          if (targetPath) {
            const targetExports = this.analyzeExports(targetPath);
            if (
              targetExports.hasNamedExports &&
              targetExports.namedExports.includes(imp.defaultImport)
            ) {
              const oldImport = imp.fullMatch;
              const newImport = oldImport.replace(imp.defaultImport, `{ ${imp.defaultImport} }`);
              this.fixImportInFile(filePath, oldImport, newImport);
            }
          }
        }

        // 3. Удаляем дублирующиеся импорты
        const duplicates = imports.filter(other => other !== imp && other.module === imp.module);

        if (duplicates.length > 0) {
          // Объединяем импорты
          this.mergeDuplicateImports(filePath, imp, duplicates);
        }
      });
    });
  }

  /**
   * Разрешить путь модуля
   */
  resolveModulePath(fromFile, modulePath) {
    if (modulePath.startsWith('.')) {
      const basePath = path.resolve(path.dirname(fromFile), modulePath);

      // Пробуем различные расширения
      const extensions = ['.tsx', '.ts', '.jsx', '.js'];
      for (const ext of extensions) {
        const fullPath = basePath + ext;
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }

      // Пробуем index файлы
      for (const ext of extensions) {
        const indexPath = path.join(basePath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }

    return null;
  }

  /**
   * Объединить дублирующиеся импорты
   */
  mergeDuplicateImports(filePath, mainImport, duplicates) {
    let content = fs.readFileSync(filePath, 'utf8');

    const allDefaultImports = [mainImport, ...duplicates]
      .map(imp => imp.defaultImport)
      .filter(Boolean);

    const allNamedImports = [mainImport, ...duplicates]
      .flatMap(imp => imp.namedImports)
      .filter(Boolean);

    // Удаляем дублирующиеся named imports
    const uniqueNamedImports = [...new Set(allNamedImports)];

    // Создаем новый импорт
    let newImportParts = [];

    if (allDefaultImports.length > 0) {
      newImportParts.push(allDefaultImports[0]); // Берем первый default import
    }

    if (uniqueNamedImports.length > 0) {
      newImportParts.push(`{ ${uniqueNamedImports.join(', ')} }`);
    }

    const newImport = `import ${newImportParts.join(', ')} from '${mainImport.module}';`;

    // Удаляем все старые импорты
    [mainImport, ...duplicates].forEach(imp => {
      content = content.replace(imp.fullMatch, '');
    });

    // Добавляем новый импорт в начало файла (после других импортов)
    const lines = content.split('\n');
    let insertIndex = 0;

    // Находим место для вставки (после последнего импорта)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() && !lines[i].trim().startsWith('import ')) {
        break;
      }
    }

    lines.splice(insertIndex, 0, newImport);
    content = lines.join('\n');

    fs.writeFileSync(filePath, content, 'utf8');

    const relativePath = path.relative(this.projectRoot, filePath);
    this.fixes.push(`${relativePath}: Объединены дублирующиеся импорты для ${mainImport.module}`);
  }

  /**
   * Запустить ESLint для автоисправления
   */
  runESLintFix() {
    try {
      console.log('Запуск ESLint автоисправления...');
      execSync('npx eslint . --ext .ts,.tsx --fix', {
        cwd: this.projectRoot,
        stdio: 'inherit',
      });
      this.fixes.push('ESLint: Автоматические исправления применены');
    } catch (error) {
      this.errors.push('ESLint: ' + error.message);
    }
  }

  /**
   * Проверить TypeScript компиляцию
   */
  checkTypeScript() {
    try {
      console.log('Проверка TypeScript компиляции...');
      execSync('npx tsc --noEmit --skipLibCheck', {
        cwd: this.projectRoot,
        stdio: 'pipe',
      });
      console.log('✅ TypeScript компиляция прошла успешно');
    } catch (error) {
      const output = error.stdout || error.stderr || '';
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
        console.log('❌ Найдены ошибки импортов:');
        importErrors.slice(0, 10).forEach(error => console.log('  ', error));
        this.errors.push(...importErrors);
      }
    }
  }

  /**
   * Запустить все исправления
   */
  async run() {
    console.log('🔧 Запуск автоматического исправления импортов...');
    console.log('📁 Проект:', this.projectRoot);

    // 1. Исправляем известные проблемы
    console.log('\n1. Исправление известных проблем...');
    this.fixKnownIssues();

    // 2. Запускаем ESLint автоисправление
    console.log('\n2. ESLint автоисправление...');
    this.runESLintFix();

    // 3. Проверяем TypeScript
    console.log('\n3. Проверка TypeScript...');
    this.checkTypeScript();

    // 4. Выводим результаты
    console.log('\n📊 Результаты:');

    if (this.fixes.length > 0) {
      console.log('\n✅ Исправления:');
      this.fixes.forEach(fix => console.log('  ', fix));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Ошибки:');
      this.errors.slice(0, 10).forEach(error => console.log('  ', error));

      if (this.errors.length > 10) {
        console.log(`  ... и еще ${this.errors.length - 10} ошибок`);
      }
    }

    if (this.fixes.length === 0 && this.errors.length === 0) {
      console.log('✅ Проблем с импортами не найдено!');
    }

    console.log('\n🎉 Исправление завершено!');

    return {
      fixes: this.fixes.length,
      errors: this.errors.length,
    };
  }
}

// Запуск скрипта
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();

  if (!fs.existsSync(projectRoot)) {
    console.error('❌ Директория не найдена:', projectRoot);
    process.exit(1);
  }

  const fixer = new ImportFixer(projectRoot);

  fixer
    .run()
    .then(result => {
      if (result.errors > 0) {
        console.log('\n⚠️  Некоторые проблемы требуют ручного исправления');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Ошибка при исправлении:', error.message);
      process.exit(1);
    });
}

module.exports = ImportFixer;
