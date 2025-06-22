const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitStatusChecker {
  constructor() {
    this.results = [];
    this.warnings = [];
    this.errors = [];
  }

  checkGitRepository() {
    console.log('🔍 Проверка Git репозитория...');

    try {
      // Проверяем, что мы в Git репозитории
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
      console.log('   ✅ Git репозиторий обнаружен');
      return true;
    } catch (error) {
      console.error('   ❌ Не является Git репозиторием');
      this.errors.push('Директория не является Git репозиторием');
      return false;
    }
  }

  getCurrentBranch() {
    console.log('🌿 Проверка текущей ветки...');

    try {
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

      if (!branch) {
        console.warn('   ⚠️  Находимся в состоянии detached HEAD');
        this.warnings.push('Находимся в состоянии detached HEAD');

        const commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        return { branch: null, commit: commit.substring(0, 8), detached: true };
      }

      console.log(`   ✅ Текущая ветка: ${branch}`);

      // Проверяем, является ли это основной веткой
      const mainBranches = ['main', 'master', 'develop'];
      if (!mainBranches.includes(branch)) {
        console.warn(`   ⚠️  Работаем не в основной ветке (${branch})`);
        this.warnings.push(`Работаем в ветке ${branch}, не в основной`);
      }

      return { branch, detached: false };
    } catch (error) {
      console.error(`   ❌ Ошибка получения ветки: ${error.message}`);
      this.errors.push(`Ошибка получения ветки: ${error.message}`);
      return null;
    }
  }

  checkWorkingDirectory() {
    console.log('📝 Проверка рабочей директории...');

    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });

      if (!status.trim()) {
        console.log('   ✅ Рабочая директория чистая');
        return { clean: true, files: [] };
      }

      const files = status
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const statusCode = line.substring(0, 2);
          const fileName = line.substring(3);

          let statusText = 'unknown';
          if (statusCode.includes('M')) statusText = 'modified';
          else if (statusCode.includes('A')) statusText = 'added';
          else if (statusCode.includes('D')) statusText = 'deleted';
          else if (statusCode.includes('R')) statusText = 'renamed';
          else if (statusCode.includes('C')) statusText = 'copied';
          else if (statusCode.includes('U')) statusText = 'unmerged';
          else if (statusCode.includes('?')) statusText = 'untracked';

          return { file: fileName, status: statusText, code: statusCode };
        });

      console.log(`   ⚠️  Обнаружены изменения (${files.length} файлов):`);
      files.forEach(file => {
        console.log(`      ${file.status}: ${file.file}`);
      });

      this.warnings.push(`Рабочая директория содержит ${files.length} измененных файлов`);

      return { clean: false, files };
    } catch (error) {
      console.error(`   ❌ Ошибка проверки статуса: ${error.message}`);
      this.errors.push(`Ошибка проверки статуса: ${error.message}`);
      return null;
    }
  }

  checkStagingArea() {
    console.log('📋 Проверка области индексации...');

    try {
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });

      if (!staged.trim()) {
        console.log('   ✅ Область индексации пуста');
        return { hasStaged: false, files: [] };
      }

      const stagedFiles = staged.split('\n').filter(line => line.trim());

      console.log(`   📝 Файлы в области индексации (${stagedFiles.length}):`);
      stagedFiles.forEach(file => {
        console.log(`      ${file}`);
      });

      return { hasStaged: true, files: stagedFiles };
    } catch (error) {
      console.error(`   ❌ Ошибка проверки области индексации: ${error.message}`);
      this.errors.push(`Ошибка проверки области индексации: ${error.message}`);
      return null;
    }
  }

  checkRemoteStatus() {
    console.log('🌐 Проверка статуса удаленного репозитория...');

    try {
      // Получаем информацию о remote
      const remotes = execSync('git remote -v', { encoding: 'utf8' });

      if (!remotes.trim()) {
        console.warn('   ⚠️  Удаленные репозитории не настроены');
        this.warnings.push('Удаленные репозитории не настроены');
        return { hasRemote: false };
      }

      console.log('   🔗 Удаленные репозитории:');
      remotes
        .split('\n')
        .filter(line => line.trim())
        .forEach(line => {
          console.log(`      ${line}`);
        });

      try {
        // Проверяем статус относительно origin
        const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

        if (branch) {
          try {
            const ahead = execSync(`git rev-list --count origin/${branch}..HEAD`, {
              encoding: 'utf8',
            }).trim();
            const behind = execSync(`git rev-list --count HEAD..origin/${branch}`, {
              encoding: 'utf8',
            }).trim();

            const aheadCount = parseInt(ahead) || 0;
            const behindCount = parseInt(behind) || 0;

            if (aheadCount === 0 && behindCount === 0) {
              console.log('   ✅ Синхронизировано с удаленным репозиторием');
            } else {
              if (aheadCount > 0) {
                console.warn(`   ⚠️  Впереди на ${aheadCount} коммитов`);
                this.warnings.push(`Локальная ветка впереди на ${aheadCount} коммитов`);
              }
              if (behindCount > 0) {
                console.warn(`   ⚠️  Отстает на ${behindCount} коммитов`);
                this.warnings.push(`Локальная ветка отстает на ${behindCount} коммитов`);
              }
            }

            return {
              hasRemote: true,
              ahead: aheadCount,
              behind: behindCount,
              synced: aheadCount === 0 && behindCount === 0,
            };
          } catch (error) {
            console.warn('   ⚠️  Не удалось сравнить с удаленной веткой');
            this.warnings.push('Не удалось сравнить с удаленной веткой');
            return { hasRemote: true, trackingError: true };
          }
        }
      } catch (error) {
        console.warn(`   ⚠️  Ошибка проверки статуса удаленного репозитория: ${error.message}`);
        this.warnings.push(`Ошибка проверки удаленного репозитория: ${error.message}`);
      }

      return { hasRemote: true };
    } catch (error) {
      console.error(`   ❌ Ошибка проверки удаленного репозитория: ${error.message}`);
      this.errors.push(`Ошибка проверки удаленного репозитория: ${error.message}`);
      return null;
    }
  }

  checkLastCommit() {
    console.log('📅 Проверка последнего коммита...');

    try {
      const lastCommit = execSync('git log -1 --format="%H|%an|%ae|%ad|%s"', {
        encoding: 'utf8',
      }).trim();
      const [hash, author, email, date, message] = lastCommit.split('|');

      console.log(`   📝 Последний коммит:`);
      console.log(`      Hash: ${hash.substring(0, 8)}`);
      console.log(`      Автор: ${author} <${email}>`);
      console.log(`      Дата: ${date}`);
      console.log(`      Сообщение: ${message}`);

      // Проверяем возраст последнего коммита
      const commitDate = new Date(date);
      const now = new Date();
      const daysSinceCommit = Math.floor((now - commitDate) / (1000 * 60 * 60 * 24));

      if (daysSinceCommit > 7) {
        console.warn(`   ⚠️  Последний коммит был ${daysSinceCommit} дней назад`);
        this.warnings.push(`Последний коммит был ${daysSinceCommit} дней назад`);
      }

      return {
        hash: hash.substring(0, 8),
        fullHash: hash,
        author,
        email,
        date,
        message,
        daysSince: daysSinceCommit,
      };
    } catch (error) {
      console.error(`   ❌ Ошибка получения информации о коммите: ${error.message}`);
      this.errors.push(`Ошибка получения информации о коммите: ${error.message}`);
      return null;
    }
  }

  checkGitIgnore() {
    console.log('🚫 Проверка .gitignore...');

    const gitignorePath = '.gitignore';

    if (!fs.existsSync(gitignorePath)) {
      console.warn('   ⚠️  Файл .gitignore не найден');
      this.warnings.push('Файл .gitignore отсутствует');
      return { exists: false };
    }

    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

      console.log(`   ✅ .gitignore найден (${lines.length} правил)`);

      // Проверяем наличие важных правил
      const importantRules = ['node_modules', '.env', '.env.local', 'dist', 'build', '.next'];

      const missingRules = importantRules.filter(rule => !lines.some(line => line.includes(rule)));

      if (missingRules.length > 0) {
        console.warn(`   ⚠️  Отсутствуют важные правила: ${missingRules.join(', ')}`);
        this.warnings.push(`Отсутствуют правила в .gitignore: ${missingRules.join(', ')}`);
      }

      return {
        exists: true,
        rulesCount: lines.length,
        missingRules,
      };
    } catch (error) {
      console.error(`   ❌ Ошибка чтения .gitignore: ${error.message}`);
      this.errors.push(`Ошибка чтения .gitignore: ${error.message}`);
      return null;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        status:
          this.errors.length === 0 ? (this.warnings.length === 0 ? 'clean' : 'warnings') : 'errors',
      },
      errors: this.errors,
      warnings: this.warnings,
      results: this.results,
    };

    console.log('\n📊 Отчет о статусе Git:');
    console.log('='.repeat(50));
    console.log(`Статус: ${report.summary.status.toUpperCase()}`);
    console.log(`Ошибок: ${report.summary.errors}`);
    console.log(`Предупреждений: ${report.summary.warnings}`);
    console.log('='.repeat(50));

    if (this.errors.length > 0) {
      console.log('\n❌ Ошибки:');
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

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n🎉 Git репозиторий в отличном состоянии!');
    }

    return report;
  }

  async runFullCheck() {
    console.log('🚀 Запуск полной проверки Git статуса...\n');

    // Проверяем, что это Git репозиторий
    if (!this.checkGitRepository()) {
      return this.generateReport();
    }

    // Выполняем все проверки
    const checks = [
      () => this.getCurrentBranch(),
      () => this.checkWorkingDirectory(),
      () => this.checkStagingArea(),
      () => this.checkRemoteStatus(),
      () => this.checkLastCommit(),
      () => this.checkGitIgnore(),
    ];

    for (const check of checks) {
      try {
        const result = check();
        if (result) {
          this.results.push(result);
        }
      } catch (error) {
        console.error(`Ошибка при выполнении проверки: ${error.message}`);
        this.errors.push(`Ошибка проверки: ${error.message}`);
      }
    }

    return this.generateReport();
  }
}

async function main() {
  const checker = new GitStatusChecker();

  try {
    const report = await checker.runFullCheck();

    // Сохранение отчета
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `git-status-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Отчет сохранен: ${reportPath}`);

    // Возвращаем код выхода в зависимости от результата
    if (report.summary.errors > 0) {
      process.exit(1);
    } else if (report.summary.warnings > 0) {
      process.exit(2);
    }

    return report;
  } catch (error) {
    console.error('💥 Критическая ошибка при проверке Git статуса:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { GitStatusChecker, main };
