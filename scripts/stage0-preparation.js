const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Импортируем наши модули
const { main: validateEnv } = require('./health-checks/validate-env');
const { main: checkServices } = require('./health-checks/check-services');
const { main: projectBackup } = require('./backup/project-backup');
const { main: gitStatusCheck } = require('./git/git-status-check');

class Stage0Preparation {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.errors = [];
    this.warnings = [];
  }

  async runStep(stepName, stepFunction, required = true) {
    console.log(`\n🔄 Выполнение: ${stepName}`);
    console.log('-'.repeat(60));

    const start = Date.now();

    try {
      const result = await stepFunction();
      const duration = Date.now() - start;

      const stepResult = {
        step: stepName,
        success: true,
        duration,
        result,
        timestamp: new Date().toISOString(),
      };

      this.results.push(stepResult);
      console.log(`✅ ${stepName} завершен успешно (${duration}ms)`);

      return stepResult;
    } catch (error) {
      const duration = Date.now() - start;

      const stepResult = {
        step: stepName,
        success: false,
        duration,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      this.results.push(stepResult);

      if (required) {
        console.error(`❌ ${stepName} завершен с ошибкой: ${error.message}`);
        this.errors.push(`${stepName}: ${error.message}`);
      } else {
        console.warn(`⚠️  ${stepName} завершен с предупреждением: ${error.message}`);
        this.warnings.push(`${stepName}: ${error.message}`);
      }

      return stepResult;
    }
  }

  async validateEnvironment() {
    return await validateEnv();
  }

  async checkServiceHealth() {
    return await checkServices();
  }

  async createProjectBackup() {
    return await projectBackup();
  }

  async checkGitStatus() {
    return await gitStatusCheck();
  }

  async checkDependencies() {
    console.log('📦 Проверка зависимостей проекта...');

    const packageJsonPath = 'package.json';

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json не найден');
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Проверяем наличие lock файла
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    const existingLockFile = lockFiles.find(file => fs.existsSync(file));

    if (!existingLockFile) {
      console.warn('   ⚠️  Lock файл не найден');
      this.warnings.push('Lock файл отсутствует');
    } else {
      console.log(`   ✅ Найден lock файл: ${existingLockFile}`);
    }

    // Проверяем node_modules
    if (!fs.existsSync('node_modules')) {
      console.warn('   ⚠️  Директория node_modules не найдена');
      this.warnings.push('node_modules отсутствует');
    } else {
      console.log('   ✅ Директория node_modules найдена');
    }

    // Проверяем критические зависимости
    const criticalDeps = ['react', 'next'];
    const missingDeps = criticalDeps.filter(
      dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );

    if (missingDeps.length > 0) {
      console.warn(`   ⚠️  Отсутствуют критические зависимости: ${missingDeps.join(', ')}`);
      this.warnings.push(`Отсутствуют зависимости: ${missingDeps.join(', ')}`);
    }

    return {
      packageJson: packageJson.name || 'unknown',
      version: packageJson.version || 'unknown',
      lockFile: existingLockFile,
      nodeModulesExists: fs.existsSync('node_modules'),
      dependenciesCount: Object.keys(packageJson.dependencies || {}).length,
      devDependenciesCount: Object.keys(packageJson.devDependencies || {}).length,
      missingCriticalDeps: missingDeps,
    };
  }

  async checkSystemRequirements() {
    console.log('💻 Проверка системных требований...');

    const requirements = {
      node: null,
      npm: null,
      git: null,
      diskSpace: null,
    };

    try {
      // Проверяем Node.js
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      requirements.node = nodeVersion;
      console.log(`   ✅ Node.js: ${nodeVersion}`);

      // Проверяем минимальную версию Node.js
      const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
      if (majorVersion < 16) {
        this.warnings.push(
          `Node.js версия ${nodeVersion} может быть устаревшей (рекомендуется >= 16)`
        );
      }
    } catch (error) {
      console.error('   ❌ Node.js не найден');
      this.errors.push('Node.js не установлен');
    }

    try {
      // Проверяем npm
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      requirements.npm = npmVersion;
      console.log(`   ✅ npm: ${npmVersion}`);
    } catch (error) {
      console.error('   ❌ npm не найден');
      this.errors.push('npm не установлен');
    }

    try {
      // Проверяем Git
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      requirements.git = gitVersion;
      console.log(`   ✅ ${gitVersion}`);
    } catch (error) {
      console.error('   ❌ Git не найден');
      this.errors.push('Git не установлен');
    }

    try {
      // Проверяем свободное место на диске (Windows)
      const diskInfo = execSync('dir /-c', { encoding: 'utf8' });
      const freeSpaceMatch = diskInfo.match(/([0-9,]+)\s+bytes free/);
      if (freeSpaceMatch) {
        const freeBytes = parseInt(freeSpaceMatch[1].replace(/,/g, ''));
        const freeGB = (freeBytes / (1024 * 1024 * 1024)).toFixed(2);
        requirements.diskSpace = `${freeGB} GB`;
        console.log(`   ✅ Свободное место: ${freeGB} GB`);

        if (freeBytes < 1024 * 1024 * 1024) {
          // Меньше 1 GB
          this.warnings.push(`Мало свободного места на диске: ${freeGB} GB`);
        }
      }
    } catch (error) {
      console.warn('   ⚠️  Не удалось проверить свободное место на диске');
    }

    return requirements;
  }

  async generatePreparationReport() {
    const totalTime = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;

    const report = {
      timestamp: new Date().toISOString(),
      stage: 'Stage 0 - Preparation',
      duration: totalTime,
      summary: {
        total: this.results.length,
        successful,
        failed,
        errors: this.errors.length,
        warnings: this.warnings.length,
        status:
          this.errors.length === 0
            ? this.warnings.length === 0
              ? 'ready'
              : 'ready_with_warnings'
            : 'not_ready',
      },
      results: this.results,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations(),
    };

    // Сохраняем отчет
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `stage0-preparation-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Отчет Stage 0 - Подготовка:');
    console.log('='.repeat(60));
    console.log(`Статус: ${report.summary.status.toUpperCase()}`);
    console.log(`Общее время: ${totalTime}ms`);
    console.log(`Всего шагов: ${report.summary.total}`);
    console.log(`Успешных: ${successful}`);
    console.log(`Неудачных: ${failed}`);
    console.log(`Ошибок: ${report.summary.errors}`);
    console.log(`Предупреждений: ${report.summary.warnings}`);
    console.log('='.repeat(60));

    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.step} (${result.duration}ms)`);
    });

    if (this.errors.length > 0) {
      console.log('\n❌ Критические ошибки:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Предупреждения:');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Рекомендации:');
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log(`\n📄 Отчет сохранен: ${reportPath}`);

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.errors.length > 0) {
      recommendations.push('Устраните все критические ошибки перед продолжением');
    }

    if (this.warnings.some(w => w.includes('node_modules'))) {
      recommendations.push('Выполните npm install для установки зависимостей');
    }

    if (this.warnings.some(w => w.includes('Lock файл'))) {
      recommendations.push('Создайте lock файл для фиксации версий зависимостей');
    }

    if (this.warnings.some(w => w.includes('Git'))) {
      recommendations.push('Зафиксируйте все изменения в Git перед продолжением');
    }

    if (this.warnings.some(w => w.includes('свободного места'))) {
      recommendations.push('Освободите место на диске для корректной работы');
    }

    if (this.warnings.some(w => w.includes('Node.js версия'))) {
      recommendations.push('Обновите Node.js до актуальной версии');
    }

    return recommendations;
  }

  async runFullPreparation() {
    console.log('🚀 Запуск Stage 0 - Подготовка к разработке');
    console.log('='.repeat(60));
    console.log('Этот этап проверит готовность проекта к разработке\n');

    // Выполняем все шаги подготовки
    await this.runStep('Проверка системных требований', () => this.checkSystemRequirements(), true);
    await this.runStep('Проверка зависимостей', () => this.checkDependencies(), true);
    await this.runStep('Валидация переменных окружения', () => this.validateEnvironment(), true);
    await this.runStep('Проверка статуса Git', () => this.checkGitStatus(), false);
    await this.runStep('Проверка сервисов', () => this.checkServiceHealth(), false);
    await this.runStep('Создание резервной копии', () => this.createProjectBackup(), false);

    // Генерируем итоговый отчет
    const report = await this.generatePreparationReport();

    // Определяем результат
    if (report.summary.status === 'ready') {
      console.log('\n🎉 Проект готов к разработке!');
      console.log('Можно переходить к Stage 1');
    } else if (report.summary.status === 'ready_with_warnings') {
      console.log('\n⚠️  Проект готов к разработке с предупреждениями');
      console.log('Рекомендуется устранить предупреждения, но можно продолжать');
    } else {
      console.log('\n❌ Проект НЕ готов к разработке');
      console.log('Необходимо устранить критические ошибки');
      process.exit(1);
    }

    return report;
  }
}

async function main() {
  const preparation = new Stage0Preparation();

  try {
    await preparation.runFullPreparation();
  } catch (error) {
    console.error('💥 Критическая ошибка Stage 0:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { Stage0Preparation, main };
