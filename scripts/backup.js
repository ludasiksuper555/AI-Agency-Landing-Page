#!/usr/bin/env node

/**
 * Backup Script for AI Agency Landing Page
 * Creates backups of important project files and data
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const chalk = require('chalk');

class BackupManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupName = `backup-${this.timestamp}`;
    this.backupPath = path.join(this.backupDir, `${this.backupName}.zip`);
  }

  /**
   * Initialize backup directory
   */
  initBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(chalk.blue(`📁 Created backup directory: ${this.backupDir}`));
    }
  }

  /**
   * Get list of files and directories to backup
   */
  getBackupItems() {
    return {
      // Configuration files
      config: [
        'package.json',
        'package-lock.json',
        'next.config.js',
        'tsconfig.json',
        '.eslintrc.js',
        '.prettierrc',
        'jest.config.js',
        'tailwind.config.js',
        'next-i18next.config.js',
        'lighthouserc.js',
        'sonar-project.properties',
        '.lintstagedrc.js',
        'docker-compose.yml',
        'Dockerfile',
      ],

      // Source code
      source: [
        'src/',
        'pages/',
        'components/',
        'hooks/',
        'lib/',
        'utils/',
        'types/',
        'styles/',
        'middleware.ts',
      ],

      // Documentation
      docs: [
        'README.md',
        'CHANGELOG.md',
        'CONTRIBUTING.md',
        'CODE_OF_CONDUCT.md',
        'SECURITY.md',
        'API_DOCUMENTATION.md',
        'PROJECT_RECOMMENDATIONS.md',
        'IMPROVEMENT_PLAN.md',
        'docs/',
      ],

      // CI/CD and automation
      automation: ['.github/', '.husky/', 'scripts/'],

      // Public assets
      assets: ['public/'],

      // Environment and configuration
      env: ['.env.example', '.env.local.example'],

      // Tests
      tests: ['tests/', '__tests__/', 'cypress/', 'stories/'],

      // Data and content
      data: ['data/', 'content/', 'locales/'],
    };
  }

  /**
   * Check if item exists before adding to backup
   */
  itemExists(itemPath) {
    const fullPath = path.join(process.cwd(), itemPath);
    return fs.existsSync(fullPath);
  }

  /**
   * Create backup metadata
   */
  createMetadata() {
    const metadata = {
      timestamp: new Date().toISOString(),
      version: this.getProjectVersion(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      gitCommit: this.getGitCommit(),
      gitBranch: this.getGitBranch(),
      backupType: 'full',
      creator: 'backup-script',
    };

    return metadata;
  }

  /**
   * Get project version from package.json
   */
  getProjectVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version || '0.0.0';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get current git commit hash
   */
  getGitCommit() {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get current git branch
   */
  getGitBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Create backup archive
   */
  async createBackup() {
    return new Promise((resolve, reject) => {
      console.log(chalk.blue(`🗜️  Creating backup: ${this.backupName}.zip`));

      const output = fs.createWriteStream(this.backupPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        console.log(chalk.green(`✅ Backup created: ${sizeInMB} MB`));
        resolve();
      });

      archive.on('error', err => {
        console.error(chalk.red('❌ Backup failed:'), err);
        reject(err);
      });

      archive.pipe(output);

      // Add metadata
      const metadata = this.createMetadata();
      archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });

      // Add backup items
      const backupItems = this.getBackupItems();
      let itemCount = 0;

      for (const [category, items] of Object.entries(backupItems)) {
        console.log(chalk.yellow(`📦 Adding ${category} files...`));

        for (const item of items) {
          if (this.itemExists(item)) {
            const fullPath = path.join(process.cwd(), item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
              archive.directory(fullPath, item);
            } else {
              archive.file(fullPath, { name: item });
            }

            itemCount++;
          } else {
            console.log(chalk.gray(`⏭️  Skipping missing item: ${item}`));
          }
        }
      }

      console.log(chalk.blue(`📊 Total items added: ${itemCount}`));
      archive.finalize();
    });
  }

  /**
   * Clean old backups (keep last 10)
   */
  cleanOldBackups() {
    try {
      const backupFiles = fs
        .readdirSync(this.backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.zip'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          mtime: fs.statSync(path.join(this.backupDir, file)).mtime,
        }))
        .sort((a, b) => b.mtime - a.mtime);

      if (backupFiles.length > 10) {
        const filesToDelete = backupFiles.slice(10);

        console.log(chalk.yellow(`🧹 Cleaning ${filesToDelete.length} old backups...`));

        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          console.log(chalk.gray(`🗑️  Deleted: ${file.name}`));
        }
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Could not clean old backups:'), error.message);
    }
  }

  /**
   * Verify backup integrity
   */
  verifyBackup() {
    try {
      const stats = fs.statSync(this.backupPath);

      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      console.log(chalk.green(`✅ Backup verified: ${this.backupPath}`));
      console.log(chalk.blue(`📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));

      return true;
    } catch (error) {
      console.error(chalk.red('❌ Backup verification failed:'), error.message);
      return false;
    }
  }

  /**
   * Generate backup report
   */
  generateReport() {
    const metadata = this.createMetadata();
    const reportPath = path.join(this.backupDir, `${this.backupName}-report.json`);

    const report = {
      ...metadata,
      backupPath: this.backupPath,
      backupSize: fs.statSync(this.backupPath).size,
      status: 'completed',
      duration: Date.now() - new Date(metadata.timestamp).getTime(),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.blue(`📋 Report saved: ${reportPath}`));
  }

  /**
   * Run backup process
   */
  async run() {
    const startTime = Date.now();

    try {
      console.log(chalk.blue('🚀 Starting backup process...\n'));

      // Initialize
      this.initBackupDir();

      // Create backup
      await this.createBackup();

      // Verify backup
      if (!this.verifyBackup()) {
        throw new Error('Backup verification failed');
      }

      // Generate report
      this.generateReport();

      // Clean old backups
      this.cleanOldBackups();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(chalk.green(`\n🎉 Backup completed successfully in ${duration}s`));
      console.log(chalk.blue(`📁 Backup location: ${this.backupPath}`));
    } catch (error) {
      console.error(chalk.red('❌ Backup failed:'), error.message);
      process.exit(1);
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  // Install archiver if not available
  try {
    require('archiver');
  } catch (error) {
    console.log(chalk.yellow('Installing archiver...'));
    execSync('npm install archiver', { stdio: 'inherit' });
  }

  const backup = new BackupManager();
  backup.run();
}

module.exports = BackupManager;
