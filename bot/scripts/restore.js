#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const extract = require('extract-zip');
const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utils/logger');
const readline = require('readline');

const execAsync = promisify(exec);

class RestoreManager {
  constructor(backupPath) {
    this.backupPath = backupPath;
    this.tempDir = path.join(__dirname, '..', 'temp', `restore-${Date.now()}`);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async initialize() {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      logger.info(`Restore initialized: ${this.tempDir}`);
    } catch (error) {
      logger.error('Failed to initialize restore:', error);
      throw error;
    }
  }

  async extractBackup() {
    try {
      logger.info('Extracting backup archive...');

      if (this.backupPath.endsWith('.zip')) {
        await extract(this.backupPath, { dir: this.tempDir });
      } else {
        // Assume it's already extracted directory
        await this.copyDirectory(this.backupPath, this.tempDir);
      }

      logger.info('Backup extracted successfully');
    } catch (error) {
      logger.error('Failed to extract backup:', error);
      throw error;
    }
  }

  async copyDirectory(source, destination) {
    await fs.mkdir(destination, { recursive: true });

    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, destPath);
      } else {
        await fs.copyFile(sourcePath, destPath);
      }
    }
  }

  async loadMetadata() {
    try {
      const metadataPath = path.join(this.tempDir, 'metadata.json');
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      const metadata = JSON.parse(metadataContent);

      logger.info('Backup metadata loaded:', {
        timestamp: metadata.timestamp,
        version: metadata.version,
        environment: metadata.environment,
        components: metadata.components
      });

      return metadata;
    } catch (error) {
      logger.warn('Failed to load metadata:', error.message);
      return null;
    }
  }

  async confirmRestore(metadata) {
    return new Promise(resolve => {
      console.log('\n🔄 RESTORE CONFIRMATION');
      console.log('========================');

      if (metadata) {
        console.log(`📅 Backup Date: ${new Date(metadata.timestamp).toLocaleString()}`);
        console.log(`📦 Version: ${metadata.version}`);
        console.log(`🌍 Environment: ${metadata.environment}`);
        console.log(
          `🔧 Components: ${Object.keys(metadata.components)
            .filter(k => metadata.components[k])
            .join(', ')}`
        );
      }

      console.log('\n⚠️  WARNING: This will overwrite existing data!');
      console.log('Make sure you have a current backup before proceeding.');

      this.rl.question('\nDo you want to continue? (yes/no): ', answer => {
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  async restoreMongoDB() {
    try {
      logger.info('Starting MongoDB restore...');

      const mongoBackupPath = path.join(this.tempDir, 'mongodb');
      const mongoManualPath = path.join(this.tempDir, 'mongodb-manual');

      // Check which backup format exists
      const hasMongoBackup = await this.pathExists(mongoBackupPath);
      const hasManualBackup = await this.pathExists(mongoManualPath);

      if (hasMongoBackup) {
        await this.restoreMongoDBDump(mongoBackupPath);
      } else if (hasManualBackup) {
        await this.restoreMongoDBManual(mongoManualPath);
      } else {
        logger.warn('No MongoDB backup found to restore');
        return;
      }

      logger.info('MongoDB restore completed');
    } catch (error) {
      logger.error('MongoDB restore failed:', error);
      throw error;
    }
  }

  async restoreMongoDBDump(backupPath) {
    try {
      const mongoUri = process.env.MONGODB_URI;
      const dbName = mongoUri.split('/').pop().split('?')[0];

      // Drop existing database
      logger.info(`Dropping existing database: ${dbName}`);
      await mongoose.connect(mongoUri);
      await mongoose.connection.db.dropDatabase();
      await mongoose.connection.close();

      // Restore from dump
      const mongorestore = `mongorestore --uri="${mongoUri}" --dir="${path.join(backupPath, dbName)}"`;
      await execAsync(mongorestore);

      logger.info('MongoDB dump restore completed');
    } catch (error) {
      logger.error('MongoDB dump restore failed:', error);
      throw error;
    }
  }

  async restoreMongoDBManual(backupPath) {
    try {
      logger.info('Starting manual MongoDB restore...');

      await mongoose.connect(process.env.MONGODB_URI);

      // Drop existing database
      await mongoose.connection.db.dropDatabase();

      const files = await fs.readdir(backupPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const collectionName = path.basename(file, '.json');
        logger.info(`Restoring collection: ${collectionName}`);

        const filePath = path.join(backupPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const documents = JSON.parse(content);

        if (documents.length > 0) {
          await mongoose.connection.db.collection(collectionName).insertMany(documents);
        }
      }

      await mongoose.connection.close();
      logger.info('Manual MongoDB restore completed');
    } catch (error) {
      logger.error('Manual MongoDB restore failed:', error);
      throw error;
    }
  }

  async restoreRedis() {
    try {
      logger.info('Starting Redis restore...');

      const redisBackupPath = path.join(this.tempDir, 'redis.json');

      if (!(await this.pathExists(redisBackupPath))) {
        logger.warn('No Redis backup found to restore');
        return;
      }

      const redisClient = redis.createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();

      // Clear existing data
      logger.info('Clearing existing Redis data...');
      await redisClient.flushAll();

      // Load backup data
      const content = await fs.readFile(redisBackupPath, 'utf8');
      const redisData = JSON.parse(content);

      // Restore data
      for (const [key, value] of Object.entries(redisData)) {
        try {
          if (typeof value === 'string') {
            await redisClient.set(key, value);
          } else if (Array.isArray(value)) {
            if (value.length > 0) {
              await redisClient.lPush(key, ...value.reverse());
            }
          } else if (typeof value === 'object' && value !== null) {
            if (value.score !== undefined) {
              // Sorted set
              const members = Array.isArray(value) ? value : [value];
              for (const member of members) {
                await redisClient.zAdd(key, { score: member.score, value: member.value });
              }
            } else {
              // Hash or set
              const entries = Object.entries(value);
              if (entries.length > 0) {
                await redisClient.hSet(key, value);
              }
            }
          }
        } catch (error) {
          logger.warn(`Failed to restore Redis key ${key}:`, error.message);
        }
      }

      await redisClient.quit();
      logger.info('Redis restore completed');
    } catch (error) {
      logger.error('Redis restore failed:', error);
      throw error;
    }
  }

  async restoreFiles() {
    try {
      logger.info('Starting files restore...');

      const filesBackupPath = path.join(this.tempDir, 'files');

      if (!(await this.pathExists(filesBackupPath))) {
        logger.warn('No files backup found to restore');
        return;
      }

      const projectRoot = path.join(__dirname, '..');

      // Restore configuration files
      const configFiles = ['.env.example', 'ecosystem.config.js'];

      for (const file of configFiles) {
        const sourcePath = path.join(filesBackupPath, file);
        const destPath = path.join(projectRoot, file);

        if (await this.pathExists(sourcePath)) {
          await fs.copyFile(sourcePath, destPath);
          logger.info(`Restored file: ${file}`);
        }
      }

      // Restore logs directory
      const logsBackupPath = path.join(filesBackupPath, 'logs');
      const logsDestPath = path.join(projectRoot, 'logs');

      if (await this.pathExists(logsBackupPath)) {
        // Remove existing logs
        try {
          await fs.rmdir(logsDestPath, { recursive: true });
        } catch (error) {
          // Directory might not exist
        }

        await this.copyDirectory(logsBackupPath, logsDestPath);
        logger.info('Logs directory restored');
      }

      logger.info('Files restore completed');
    } catch (error) {
      logger.error('Files restore failed:', error);
      throw error;
    }
  }

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async cleanup() {
    try {
      await fs.rmdir(this.tempDir, { recursive: true });
      logger.info('Cleanup completed');
    } catch (error) {
      logger.warn('Failed to cleanup temp directory:', error.message);
    }
  }

  async run() {
    const startTime = Date.now();

    try {
      logger.info('Starting restore process...');

      await this.initialize();
      await this.extractBackup();

      const metadata = await this.loadMetadata();

      // Confirm restore
      const confirmed = await this.confirmRestore(metadata);
      this.rl.close();

      if (!confirmed) {
        logger.info('Restore cancelled by user');
        await this.cleanup();
        return { success: false, cancelled: true };
      }

      // Run restore operations
      const restorePromises = [this.restoreMongoDB(), this.restoreRedis(), this.restoreFiles()];

      const results = await Promise.allSettled(restorePromises);

      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        logger.warn(`${failures.length} restore operations failed`);
        failures.forEach((failure, index) => {
          logger.error(`Restore operation ${index + 1} failed:`, failure.reason);
        });
      }

      await this.cleanup();

      const duration = Date.now() - startTime;

      logger.info(`Restore completed in ${duration}ms`);

      return {
        success: true,
        duration,
        failures: failures.length,
        metadata
      };
    } catch (error) {
      logger.error('Restore process failed:', error);

      await this.cleanup();
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const backupPath = process.argv[2];

  if (!backupPath) {
    console.error('❌ Usage: node restore.js <backup-path>');
    console.error('   backup-path: Path to backup archive (.zip) or extracted directory');
    process.exit(1);
  }

  const restore = new RestoreManager(backupPath);

  restore
    .run()
    .then(result => {
      if (result.cancelled) {
        console.log('🚫 Restore cancelled');
        process.exit(0);
      }

      console.log('✅ Restore completed successfully!');
      console.log(`⏱️  Duration: ${result.duration}ms`);

      if (result.failures > 0) {
        console.log(`⚠️  ${result.failures} operations failed (check logs)`);
        process.exit(1);
      }

      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Restore failed:', error.message);
      process.exit(1);
    });
}

module.exports = RestoreManager;
