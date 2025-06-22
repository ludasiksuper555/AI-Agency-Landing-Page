#!/usr/bin/env node

/**
 * Auto-fix Script
 * Автоматическое исправление и форматирование кода
 */

const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class AutoFixer {
  constructor() {
    this.fixes = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;

    switch (type) {
      case 'success':
        console.log(chalk.green(`✅ ${prefix} ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`❌ ${prefix} ${message}`));
        break;
      case 'warning':
        console.log(chalk.yellow(`⚠️  ${prefix} ${message}`));
        break;
      case 'fix':
        console.log(chalk.cyan(`🔧 ${prefix} ${message}`));
        this.fixes.push(message);
        break;
      case 'info':
      default:
        console.log(chalk.blue(`ℹ️  ${prefix} ${message}`));
        break;
    }
  }

  async runCommand(command, description, options = {}) {
    const { silent = false } = options;

    try {
      if (!silent) {
        this.log(`Выполняется: ${description}`);
      }

      const result = execSync(command, {
        encoding: 'utf8',
        stdio: silent ? 'pipe' : 'inherit',
      });

      if (!silent) {
        this.log(`${description} - завершено`, 'success');
      }

      return { success: true, output: result };
    } catch (error) {
      this.log(`${description} - ошибка: ${error.message}`, 'error');
      return { success: false, output: error.stdout || error.message };
    }
  }

  async fixPrettier() {
    this.log('Автоматическое форматирование кода с Prettier', 'fix');
    return await this.runCommand('npx prettier --write .', 'Prettier форматирование');
  }

  async fixESLint() {
    this.log('Автоматическое исправление ESLint ошибок', 'fix');
    return await this.runCommand(
      'npx eslint . --ext .js,.jsx,.ts,.tsx --fix',
      'ESLint автоисправление'
    );
  }

  async sortImports() {
    this.log('Сортировка импортов', 'fix');
    return await this.runCommand(
      'npx eslint . --ext .js,.jsx,.ts,.tsx --fix --rule "simple-import-sort/imports: error"',
      'Сортировка импортов'
    );
  }

  async fixPackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      let modified = false;

      // Сортировка scripts
      if (packageJson.scripts) {
        const sortedScripts = {};
        Object.keys(packageJson.scripts)
          .sort()
          .forEach(key => {
            sortedScripts[key] = packageJson.scripts[key];
          });
        packageJson.scripts = sortedScripts;
        modified = true;
      }

      // Сортировка dependencies
      if (packageJson.dependencies) {
        const sortedDeps = {};
        Object.keys(packageJson.dependencies)
          .sort()
          .forEach(key => {
            sortedDeps[key] = packageJson.dependencies[key];
          });
        packageJson.dependencies = sortedDeps;
        modified = true;
      }

      // Сортировка devDependencies
      if (packageJson.devDependencies) {
        const sortedDevDeps = {};
        Object.keys(packageJson.devDependencies)
          .sort()
          .forEach(key => {
            sortedDevDeps[key] = packageJson.devDependencies[key];
          });
        packageJson.devDependencies = sortedDevDeps;
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
        this.log('package.json отсортирован', 'fix');
      }

      return { success: true };
    } catch (error) {
      this.log(`Ошибка при обработке package.json: ${error.message}`, 'error');
      return { success: false };
    }
  }

  async fixTSConfig() {
    try {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');

      if (!fs.existsSync(tsconfigPath)) {
        return { success: true };
      }

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      // Проверка и добавление рекомендуемых настроек
      const recommendedOptions = {
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
      };

      let modified = false;

      if (!tsconfig.compilerOptions) {
        tsconfig.compilerOptions = {};
      }

      Object.entries(recommendedOptions).forEach(([key, value]) => {
        if (tsconfig.compilerOptions[key] === undefined) {
          tsconfig.compilerOptions[key] = value;
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
        this.log('tsconfig.json обновлен с рекомендуемыми настройками', 'fix');
      }

      return { success: true };
    } catch (error) {
      this.log(`Ошибка при обработке tsconfig.json: ${error.message}`, 'error');
      return { success: false };
    }
  }

  async removeUnusedImports() {
    this.log('Удаление неиспользуемых импортов', 'fix');
    return await this.runCommand(
      'npx ts-unused-exports tsconfig.json --deleteUnusedFile',
      'Удаление неиспользуемых экспортов',
      { silent: true }
    );
  }

  async optimizeImages() {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
    const publicDir = path.join(process.cwd(), 'public');

    if (!fs.existsSync(publicDir)) {
      return { success: true };
    }

    try {
      const files = fs.readdirSync(publicDir, { recursive: true });
      const imageFiles = files.filter(file =>
        imageExtensions.some(ext => file.toString().toLowerCase().endsWith(ext))
      );

      if (imageFiles.length > 0) {
        this.log(`Найдено ${imageFiles.length} изображений для оптимизации`, 'info');
        // Здесь можно добавить логику оптимизации изображений
      }

      return { success: true };
    } catch (error) {
      this.log(`Ошибка при оптимизации изображений: ${error.message}`, 'error');
      return { success: false };
    }
  }

  async generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.cyan('🔧 ОТЧЕТ ОБ АВТОИСПРАВЛЕНИЯХ'));
    console.log('='.repeat(60));

    console.log(`⏱️  Время выполнения: ${duration}с`);
    console.log(`🔧 Выполнено исправлений: ${this.fixes.length}`);

    if (this.fixes.length > 0) {
      console.log('\n' + chalk.cyan.bold('✨ ВЫПОЛНЕННЫЕ ИСПРАВЛЕНИЯ:'));
      this.fixes.forEach((fix, index) => {
        console.log(chalk.cyan(`${index + 1}. ${fix}`));
      });
    }

    console.log('\n' + chalk.green.bold('✅ АВТОИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ'));
    console.log(chalk.green('💡 Рекомендуется проверить изменения перед коммитом'));
    console.log('='.repeat(60) + '\n');
  }

  async run() {
    console.log(chalk.bold.cyan('🔧 ЗАПУСК АВТОИСПРАВЛЕНИЙ\n'));

    // Последовательность исправлений
    const fixes = [
      () => this.fixPackageJson(),
      () => this.fixTSConfig(),
      () => this.sortImports(),
      () => this.fixESLint(),
      () => this.fixPrettier(),
      () => this.removeUnusedImports(),
      () => this.optimizeImages(),
    ];

    for (const fix of fixes) {
      await fix();
    }

    await this.generateReport();
  }
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  const fixer = new AutoFixer();
  fixer.run().catch(error => {
    console.error(chalk.red('💥 Критическая ошибка:'), error);
    process.exit(1);
  });
}

module.exports = AutoFixer;
