#!/usr/bin/env node

/**
 * Restore Script for AI Agency Landing Page
 * Restores project files from backup archives
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const extract = require('extract-zip');
const chalk = require('chalk');
const readline = require('readline');

class RestoreManager {
  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.tempDir = path.join(process.cwd(), '.restore-temp');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * List available backups
   */
  listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      console.log(chalk.red('❌ No backup directory found'));
      return [];
    }

    const backupFiles = fs
      .readdirSync(this.backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          sizeFormatted: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
        };
      })
      .sort((a, b) => b.created - a.created);

    return backupFiles;
  }

  /**
   * Display available backups
   */
  displayBackups(backups) {
    console.log(chalk.blue('\n📦 Available Backups:\n'));

    if (backups.length === 0) {
      console.log(chalk.yellow('⚠️  No backups found'));
      return;
    }

    backups.forEach((backup, index) => {
      const date = backup.created.toLocaleString();
      console.log(chalk.white(`${index + 1}. ${backup.name}`));
      console.log(chalk.gray(`   Created: ${date}`));
      console.log(chalk.gray(`   Size: ${backup.sizeFormatted}`));
      console.log('');
    });
  }

  /**
   * Prompt user for backup selection
   */
  async selectBackup(backups) {
    return new Promise(resolve => {
      this.rl.question(chalk.yellow('Select backup number (or 0 to cancel): '), answer => {
        const selection = parseInt(answer);

        if (selection === 0) {
          console.log(chalk.blue('Operation cancelled'));
          resolve(null);
        } else if (selection > 0 && selection <= backups.length) {
          resolve(backups[selection - 1]);
        } else {
          console.log(chalk.red('❌ Invalid selection'));
          this.selectBackup(backups).then(resolve);
        }
      });
    });
  }

  /**
   * Confirm restore operation
   */
  async confirmRestore(backup) {
    return new Promise(resolve => {
      console.log(chalk.yellow(`\n⚠️  This will restore from: ${backup.name}`));
      console.log(chalk.yellow('⚠️  Current files may be overwritten!'));

      this.rl.question(chalk.red('Are you sure you want to continue? (yes/no): '), answer => {
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  /**
   * Create temporary directory
   */
  createTempDir() {
    if (fs.existsSync(this.tempDir)) {
      this.cleanupTempDir();
    }

    fs.mkdirSync(this.tempDir, { recursive: true });
    console.log(chalk.blue(`📁 Created temporary directory: ${this.tempDir}`));
  }

  /**
   * Clean up temporary directory
   */
  cleanupTempDir() {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
      console.log(chalk.gray('🧹 Cleaned up temporary directory'));
    }
  }

  /**
   * Extract backup archive
   */
  async extractBackup(backupPath) {
    try {
      console.log(chalk.blue('📦 Extracting backup...'));

      await extract(backupPath, { dir: this.tempDir });

      console.log(chalk.green('✅ Backup extracted successfully'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to extract backup:'), error.message);
      return false;
    }
  }

  /**
   * Read backup metadata
   */
  readMetadata() {
    const metadataPath = path.join(this.tempDir, 'backup-metadata.json');

    if (!fs.existsSync(metadataPath)) {
      console.log(chalk.yellow('⚠️  No metadata found in backup'));
      return null;
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      console.log(chalk.blue('\n📋 Backup Metadata:'));
      console.log(chalk.gray(`  Version: ${metadata.version}`));
      console.log(chalk.gray(`  Created: ${metadata.timestamp}`));
      console.log(chalk.gray(`  Environment: ${metadata.environment}`));
      console.log(chalk.gray(`  Git Branch: ${metadata.gitBranch}`));
      console.log(chalk.gray(`  Git Commit: ${metadata.gitCommit}`));
      console.log('');

      return metadata;
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not read metadata:'), error.message);
      return null;
    }
  }

  /**
   * Backup current files before restore
   */
  async backupCurrent() {
    try {
      console.log(chalk.blue('💾 Creating backup of current state...'));

      const BackupManager = require('./backup.js');
      const backup = new BackupManager();
      backup.backupName = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}`;

      await backup.createBackup();
      console.log(chalk.green('✅ Current state backed up'));

      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to backup current state:'), error.message);
      return false;
    }
  }

  /**
   * Restore files from extracted backup
   */
  restoreFiles() {
    console.log(chalk.blue('🔄 Restoring files...'));

    const items = fs.readdirSync(this.tempDir);
    let restoredCount = 0;

    for (const item of items) {
      if (item === 'backup-metadata.json') {
        continue; // Skip metadata file
      }

      const sourcePath = path.join(this.tempDir, item);
      const targetPath = path.join(process.cwd(), item);

      try {
        const stat = fs.statSync(sourcePath);

        if (stat.isDirectory()) {
          // Remove existing directory if it exists
          if (fs.existsSync(targetPath)) {
            fs.rmSync(targetPath, { recursive: true, force: true });
          }

          // Copy directory recursively
          this.copyDirectory(sourcePath, targetPath);
        } else {
          // Copy file
          fs.copyFileSync(sourcePath, targetPath);
        }

        console.log(chalk.green(`✅ Restored: ${item}`));
        restoredCount++;
      } catch (error) {
        console.error(chalk.red(`❌ Failed to restore ${item}:`), error.message);
      }
    }

    console.log(chalk.blue(`\n📊 Restored ${restoredCount} items`));
    return restoredCount;
  }

  /**
   * Copy directory recursively
   */
  copyDirectory(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);

    for (const item of items) {
      const sourcePath = path.join(source, item);
      const targetPath = path.join(target, item);
      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  /**
   * Reinstall dependencies
   */
  async reinstallDependencies() {
    try {
      console.log(chalk.blue('📦 Reinstalling dependencies...'));

      // Remove node_modules and package-lock.json
      if (fs.existsSync('node_modules')) {
        fs.rmSync('node_modules', { recursive: true, force: true });
      }

      if (fs.existsSync('package-lock.json')) {
        fs.unlinkSync('package-lock.json');
      }

      // Install dependencies
      execSync('npm install', { stdio: 'inherit' });

      console.log(chalk.green('✅ Dependencies reinstalled'));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to reinstall dependencies:'), error.message);
      return false;
    }
  }

  /**
   * Validate restored project
   */
  validateRestore() {
    console.log(chalk.blue('🔍 Validating restored project...'));

    const requiredFiles = ['package.json', 'next.config.js', 'tsconfig.json'];

    let valid = true;

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        console.error(chalk.red(`❌ Missing required file: ${file}`));
        valid = false;
      } else {
        console.log(chalk.green(`✅ Found: ${file}`));
      }
    }

    if (valid) {
      console.log(chalk.green('✅ Project validation passed'));
    } else {
      console.log(chalk.red('❌ Project validation failed'));
    }

    return valid;
  }

  /**
   * Run restore process
   */
  async run() {
    const startTime = Date.now();

    try {
      console.log(chalk.blue('🔄 Starting restore process...\n'));

      // List available backups
      const backups = this.listBackups();
      this.displayBackups(backups);

      if (backups.length === 0) {
        console.log(chalk.yellow('No backups available for restore'));
        this.rl.close();
        return;
      }

      // Select backup
      const selectedBackup = await this.selectBackup(backups);

      if (!selectedBackup) {
        this.rl.close();
        return;
      }

      // Confirm restore
      const confirmed = await this.confirmRestore(selectedBackup);

      if (!confirmed) {
        console.log(chalk.blue('Restore cancelled'));
        this.rl.close();
        return;
      }

      this.rl.close();

      // Create temporary directory
      this.createTempDir();

      // Extract backup
      if (!(await this.extractBackup(selectedBackup.path))) {
        throw new Error('Failed to extract backup');
      }

      // Read metadata
      this.readMetadata();

      // Backup current state
      if (!(await this.backupCurrent())) {
        console.log(chalk.yellow('⚠️  Continuing without backing up current state'));
      }

      // Restore files
      const restoredCount = this.restoreFiles();

      if (restoredCount === 0) {
        throw new Error('No files were restored');
      }

      // Reinstall dependencies
      if (!(await this.reinstallDependencies())) {
        console.log(chalk.yellow('⚠️  You may need to manually run: npm install'));
      }

      // Validate restore
      if (!this.validateRestore()) {
        console.log(chalk.yellow('⚠️  Project validation failed, please check manually'));
      }

      // Cleanup
      this.cleanupTempDir();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(chalk.green(`\n🎉 Restore completed successfully in ${duration}s`));
      console.log(chalk.blue('💡 You may need to restart your development server'));
    } catch (error) {
      console.error(chalk.red('❌ Restore failed:'), error.message);
      this.cleanupTempDir();
      this.rl.close();
      process.exit(1);
    }
  }
}

// Run restore if called directly
if (require.main === module) {
  // Install extract-zip if not available
  try {
    require('extract-zip');
  } catch (error) {
    console.log(chalk.yellow('Installing extract-zip...'));
    execSync('npm install extract-zip', { stdio: 'inherit' });
  }

  const restore = new RestoreManager();
  restore.run();
}

module.exports = RestoreManager;
