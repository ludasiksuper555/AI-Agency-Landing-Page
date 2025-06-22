const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

class ProjectBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupName = `project-backup-${this.timestamp}`;
    this.results = [];
  }

  async createBackupDirectory() {
    console.log('📁 Создание директории для резервных копий...');

    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      const backupPath = path.join(this.backupDir, this.backupName);
      fs.mkdirSync(backupPath, { recursive: true });

      console.log(`   ✅ Директория создана: ${backupPath}`);
      return { success: true, path: backupPath };
    } catch (error) {
      console.error(`   ❌ Ошибка создания директории: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async backupGitRepository() {
    console.log('🔄 Резервное копирование Git репозитория...');

    try {
      // Проверяем статус Git
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const lastCommit = execSync('git log -1 --format="%H %s"', { encoding: 'utf8' }).trim();

      const gitInfo = {
        branch,
        lastCommit,
        hasUncommittedChanges: status.length > 0,
        uncommittedFiles: status.split('\n').filter(line => line.trim()).length,
      };

      // Создаем bundle
      const bundlePath = path.join(this.backupDir, this.backupName, 'git-repository.bundle');
      execSync(`git bundle create "${bundlePath}" --all`, { stdio: 'inherit' });

      // Сохраняем информацию о Git
      const gitInfoPath = path.join(this.backupDir, this.backupName, 'git-info.json');
      fs.writeFileSync(gitInfoPath, JSON.stringify(gitInfo, null, 2));

      if (gitInfo.hasUncommittedChanges) {
        console.log(
          `   ⚠️  Обнаружены несохраненные изменения (${gitInfo.uncommittedFiles} файлов)`
        );

        // Создаем diff для несохраненных изменений
        const diffPath = path.join(this.backupDir, this.backupName, 'uncommitted-changes.diff');
        const diff = execSync('git diff HEAD', { encoding: 'utf8' });
        fs.writeFileSync(diffPath, diff);

        console.log(`   📄 Diff сохранен: uncommitted-changes.diff`);
      }

      console.log(`   ✅ Git репозиторий сохранен (ветка: ${branch})`);
      return { success: true, gitInfo, bundlePath };
    } catch (error) {
      console.error(`   ❌ Ошибка резервного копирования Git: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async backupDatabase() {
    console.log('🗄️  Резервное копирование базы данных...');

    if (!process.env.DATABASE_URL) {
      console.log('   ⚠️  DATABASE_URL не настроен, пропускаем');
      return { success: false, reason: 'DATABASE_URL не настроен' };
    }

    try {
      const dumpPath = path.join(this.backupDir, this.backupName, 'database-dump.sql');

      // Используем pg_dump для создания дампа
      const command = `pg_dump "${process.env.DATABASE_URL}" > "${dumpPath}"`;
      execSync(command, { stdio: 'inherit' });

      const stats = fs.statSync(dumpPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      console.log(`   ✅ Дамп базы данных создан (${sizeInMB} MB)`);
      return { success: true, dumpPath, size: sizeInMB };
    } catch (error) {
      console.error(`   ❌ Ошибка создания дампа БД: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async backupEnvironmentFiles() {
    console.log('🔐 Резервное копирование файлов окружения...');

    const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.example'];

    const backedUpFiles = [];
    const envBackupDir = path.join(this.backupDir, this.backupName, 'environment');

    try {
      fs.mkdirSync(envBackupDir, { recursive: true });

      for (const envFile of envFiles) {
        if (fs.existsSync(envFile)) {
          const content = fs.readFileSync(envFile, 'utf8');

          // Маскируем секретные значения
          const maskedContent = content.replace(
            /(PASSWORD|SECRET|KEY|TOKEN)=.*/gi,
            '$1=***MASKED***'
          );

          const backupPath = path.join(envBackupDir, envFile);
          fs.writeFileSync(backupPath, maskedContent);

          backedUpFiles.push(envFile);
          console.log(`   📄 ${envFile} сохранен (секреты замаскированы)`);
        }
      }

      if (backedUpFiles.length === 0) {
        console.log('   ⚠️  Файлы окружения не найдены');
        return { success: false, reason: 'Файлы не найдены' };
      }

      console.log(`   ✅ Сохранено ${backedUpFiles.length} файлов окружения`);
      return { success: true, files: backedUpFiles };
    } catch (error) {
      console.error(`   ❌ Ошибка копирования файлов окружения: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async backupPackageFiles() {
    console.log('📦 Резервное копирование файлов пакетов...');

    const packageFiles = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];

    const backedUpFiles = [];
    const packageBackupDir = path.join(this.backupDir, this.backupName, 'packages');

    try {
      fs.mkdirSync(packageBackupDir, { recursive: true });

      for (const packageFile of packageFiles) {
        if (fs.existsSync(packageFile)) {
          const sourcePath = packageFile;
          const backupPath = path.join(packageBackupDir, packageFile);

          fs.copyFileSync(sourcePath, backupPath);
          backedUpFiles.push(packageFile);

          console.log(`   📄 ${packageFile} сохранен`);
        }
      }

      if (backedUpFiles.length === 0) {
        console.log('   ⚠️  Файлы пакетов не найдены');
        return { success: false, reason: 'Файлы не найдены' };
      }

      console.log(`   ✅ Сохранено ${backedUpFiles.length} файлов пакетов`);
      return { success: true, files: backedUpFiles };
    } catch (error) {
      console.error(`   ❌ Ошибка копирования файлов пакетов: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async createArchive() {
    console.log('🗜️  Создание архива резервной копии...');

    const archivePath = path.join(this.backupDir, `${this.backupName}.zip`);
    const sourcePath = path.join(this.backupDir, this.backupName);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(archivePath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Максимальное сжатие
      });

      output.on('close', () => {
        const sizeInMB = (archive.pointer() / (1024 * 1024)).toFixed(2);
        console.log(`   ✅ Архив создан: ${archivePath} (${sizeInMB} MB)`);

        // Удаляем временную директорию
        fs.rmSync(sourcePath, { recursive: true, force: true });

        resolve({ success: true, archivePath, size: sizeInMB });
      });

      archive.on('error', error => {
        console.error(`   ❌ Ошибка создания архива: ${error.message}`);
        reject({ success: false, error: error.message });
      });

      archive.pipe(output);
      archive.directory(sourcePath, false);
      archive.finalize();
    });
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      backupName: this.backupName,
      results: this.results,
      summary: {
        total: this.results.length,
        successful: this.results.filter(r => r.success).length,
        failed: this.results.filter(r => !r.success).length,
      },
    };

    const reportPath = path.join(this.backupDir, `${this.backupName}-report.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Отчет о резервном копировании:');
    console.log('='.repeat(50));
    console.log(`Имя резервной копии: ${this.backupName}`);
    console.log(`Всего операций: ${report.summary.total}`);
    console.log(`Успешных: ${report.summary.successful}`);
    console.log(`Неудачных: ${report.summary.failed}`);
    console.log('='.repeat(50));

    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(
        `${icon} ${result.operation}: ${result.success ? 'Успешно' : result.error || result.reason}`
      );
    });

    console.log(`\n📄 Отчет сохранен: ${reportPath}`);

    return report;
  }

  async runFullBackup() {
    console.log('🚀 Запуск полного резервного копирования проекта...\n');

    const startTime = Date.now();

    // Создание директории
    const dirResult = await this.createBackupDirectory();
    this.results.push({ operation: 'create_directory', ...dirResult });

    if (!dirResult.success) {
      console.error('💥 Не удалось создать директорию для резервных копий');
      return;
    }

    // Резервное копирование Git
    const gitResult = await this.backupGitRepository();
    this.results.push({ operation: 'git_backup', ...gitResult });

    // Резервное копирование базы данных
    const dbResult = await this.backupDatabase();
    this.results.push({ operation: 'database_backup', ...dbResult });

    // Резервное копирование файлов окружения
    const envResult = await this.backupEnvironmentFiles();
    this.results.push({ operation: 'environment_backup', ...envResult });

    // Резервное копирование файлов пакетов
    const packageResult = await this.backupPackageFiles();
    this.results.push({ operation: 'package_backup', ...packageResult });

    // Создание архива
    const archiveResult = await this.createArchive();
    this.results.push({ operation: 'create_archive', ...archiveResult });

    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Общее время резервного копирования: ${totalTime}ms`);

    // Генерация отчета
    const report = await this.generateReport();

    const successful = this.results.filter(r => r.success).length;
    if (successful === this.results.length) {
      console.log('\n🎉 Резервное копирование завершено успешно!');
    } else {
      console.log('\n⚠️  Резервное копирование завершено с предупреждениями');
    }

    return report;
  }
}

async function main() {
  const backup = new ProjectBackup();

  try {
    await backup.runFullBackup();
  } catch (error) {
    console.error('💥 Критическая ошибка при резервном копировании:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ProjectBackup, main };
