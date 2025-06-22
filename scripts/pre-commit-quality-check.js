#!/usr/bin/env node

/**
 * Pre-commit Quality Check Script
 * Быстрая проверка качества кода перед коммитом
 */

const { execSync } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class QualityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
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
        this.errors.push(message);
        break;
      case 'warning':
        console.log(chalk.yellow(`⚠️  ${prefix} ${message}`));
        this.warnings.push(message);
        break;
      case 'info':
      default:
        console.log(chalk.blue(`ℹ️  ${prefix} ${message}`));
        break;
    }
  }

  async runCommand(command, description, options = {}) {
    const { allowFailure = false, timeout = 30000 } = options;

    try {
      this.log(`Выполняется: ${description}`);
      const result = execSync(command, {
        encoding: 'utf8',
        timeout,
        stdio: 'pipe',
      });

      this.log(`${description} - завершено успешно`, 'success');
      return { success: true, output: result };
    } catch (error) {
      const message = `${description} - ошибка: ${error.message}`;

      if (allowFailure) {
        this.log(message, 'warning');
        return { success: false, output: error.stdout || error.message };
      } else {
        this.log(message, 'error');
        return { success: false, output: error.stdout || error.message };
      }
    }
  }

  async checkTypeScript() {
    return await this.runCommand('npx tsc --noEmit --skipLibCheck', 'TypeScript проверка типов');
  }

  async checkESLint() {
    return await this.runCommand(
      'npx eslint . --ext .js,.jsx,.ts,.tsx --max-warnings=0',
      'ESLint проверка кода',
      { allowFailure: true }
    );
  }

  async checkPrettier() {
    return await this.runCommand('npx prettier --check .', 'Prettier проверка форматирования', {
      allowFailure: true,
    });
  }

  async runTests() {
    return await this.runCommand('npm run test:ci', 'Запуск тестов', { timeout: 60000 });
  }

  async checkSecurity() {
    return await this.runCommand(
      'npm audit --audit-level=moderate',
      'Проверка безопасности зависимостей',
      { allowFailure: true }
    );
  }

  async checkPackageJson() {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // Проверка обязательных полей
      const requiredFields = ['name', 'version', 'description', 'scripts'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);

      if (missingFields.length > 0) {
        this.log(`package.json: отсутствуют поля: ${missingFields.join(', ')}`, 'warning');
      } else {
        this.log('package.json - структура корректна', 'success');
      }

      return { success: true };
    } catch (error) {
      this.log(`package.json - ошибка чтения: ${error.message}`, 'error');
      return { success: false };
    }
  }

  async checkGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      const stagedFiles = status
        .split('\n')
        .filter(line => line.startsWith('M ') || line.startsWith('A '));

      if (stagedFiles.length === 0) {
        this.log('Нет файлов для коммита', 'warning');
        return { success: false };
      }

      this.log(`Готово к коммиту: ${stagedFiles.length} файлов`, 'success');
      return { success: true };
    } catch (error) {
      this.log(`Git статус - ошибка: ${error.message}`, 'error');
      return { success: false };
    }
  }

  generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log(chalk.bold.blue('📊 ОТЧЕТ О ПРОВЕРКЕ КАЧЕСТВА'));
    console.log('='.repeat(60));

    console.log(`⏱️  Время выполнения: ${duration}с`);
    console.log(`❌ Ошибки: ${this.errors.length}`);
    console.log(`⚠️  Предупреждения: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n' + chalk.red.bold('🚨 КРИТИЧЕСКИЕ ОШИБКИ:'));
      this.errors.forEach((error, index) => {
        console.log(chalk.red(`${index + 1}. ${error}`));
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n' + chalk.yellow.bold('⚠️  ПРЕДУПРЕЖДЕНИЯ:'));
      this.warnings.forEach((warning, index) => {
        console.log(chalk.yellow(`${index + 1}. ${warning}`));
      });
    }

    const success = this.errors.length === 0;

    if (success) {
      console.log('\n' + chalk.green.bold('✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО!'));
      console.log(chalk.green('🚀 Готово к коммиту и деплою'));
    } else {
      console.log('\n' + chalk.red.bold('❌ ОБНАРУЖЕНЫ КРИТИЧЕСКИЕ ОШИБКИ'));
      console.log(chalk.red('🛠️  Исправьте ошибки перед коммитом'));
    }

    console.log('='.repeat(60) + '\n');

    return success;
  }

  async run() {
    console.log(chalk.bold.blue('🔍 ЗАПУСК ПРОВЕРКИ КАЧЕСТВА КОДА\n'));

    // Последовательность проверок
    const checks = [
      () => this.checkGitStatus(),
      () => this.checkPackageJson(),
      () => this.checkTypeScript(),
      () => this.checkESLint(),
      () => this.checkPrettier(),
      () => this.runTests(),
      () => this.checkSecurity(),
    ];

    for (const check of checks) {
      await check();
    }

    const success = this.generateReport();
    process.exit(success ? 0 : 1);
  }
}

// Запуск если файл выполняется напрямую
if (require.main === module) {
  const checker = new QualityChecker();
  checker.run().catch(error => {
    console.error(chalk.red('💥 Критическая ошибка:'), error);
    process.exit(1);
  });
}

module.exports = QualityChecker;
