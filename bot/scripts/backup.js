#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const archiver = require('archiver');
const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

class BackupManager {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.backupName = `techmoneybot-backup-${this.timestamp}`;
    this.backupPath = path.join(this.backupDir, this.backupName);
  }

  async initialize() {
    try {
      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });
      await fs.mkdir(this.backupPath, { recursive: true });

      logger.info(`Backup initialized: ${this.backupPath}`);
    } catch (error) {
      logger.error('Failed to initialize backup:', error);
      throw error;
    }
  }

  async backupMongoDB() {
    try {
      logger.info('Starting MongoDB backup...');

      const mongoUri = process.env.MONGODB_URI;
      const dbName = mongoUri.split('/').pop().split('?')[0];
      const mongoBackupPath = path.join(this.backupPath, 'mongodb');

      await fs.mkdir(mongoBackupPath, { recursive: true });

      // Use mongodump to create backup
      const mongodumpCmd = `mongodump --uri="${mongoUri}" --out="${mongoBackupPath}"`;

      await execAsync(mongodumpCmd);

      logger.info('MongoDB backup completed');
      return mongoBackupPath;
    } catch (error) {
      logger.error('MongoDB backup failed:', error);

      // Fallback: Export collections manually
      try {
        await this.backupMongoDBManual();
      } catch (fallbackError) {
        logger.error('Manual MongoDB backup also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  async backupMongoDBManual() {
    try {
      logger.info('Starting manual MongoDB backup...');

      await mongoose.connect(process.env.MONGODB_URI);

      const collections = await mongoose.connection.db.listCollections().toArray();
      const mongoBackupPath = path.join(this.backupPath, 'mongodb-manual');

      await fs.mkdir(mongoBackupPath, { recursive: true });

      for (const collection of collections) {
        const collectionName = collection.name;
        logger.info(`Backing up collection: ${collectionName}`);

        const documents = await mongoose.connection.db
          .collection(collectionName)
          .find({})
          .toArray();

        const filePath = path.join(mongoBackupPath, `${collectionName}.json`);
        await fs.writeFile(filePath, JSON.stringify(documents, null, 2));
      }

      await mongoose.connection.close();
      logger.info('Manual MongoDB backup completed');
    } catch (error) {
      logger.error('Manual MongoDB backup failed:', error);
      throw error;
    }
  }

  async backupRedis() {
    try {
      logger.info('Starting Redis backup...');

      const redisClient = redis.createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();

      const keys = await redisClient.keys('*');
      const redisData = {};

      for (const key of keys) {
        const type = await redisClient.type(key);

        switch (type) {
          case 'string':
            redisData[key] = await redisClient.get(key);
            break;
          case 'hash':
            redisData[key] = await redisClient.hGetAll(key);
            break;
          case 'list':
            redisData[key] = await redisClient.lRange(key, 0, -1);
            break;
          case 'set':
            redisData[key] = await redisClient.sMembers(key);
            break;
          case 'zset':
            redisData[key] = await redisClient.zRangeWithScores(key, 0, -1);
            break;
          default:
            logger.warn(`Unknown Redis type for key ${key}: ${type}`);
        }
      }

      await redisClient.quit();

      const redisBackupPath = path.join(this.backupPath, 'redis.json');
      await fs.writeFile(redisBackupPath, JSON.stringify(redisData, null, 2));

      logger.info('Redis backup completed');
      return redisBackupPath;
    } catch (error) {
      logger.error('Redis backup failed:', error);
      throw error;
    }
  }

  async backupFiles() {
    try {
      logger.info('Starting files backup...');

      const filesToBackup = ['.env.example', 'package.json', 'README.md', 'ecosystem.config.js'];

      const filesBackupPath = path.join(this.backupPath, 'files');
      await fs.mkdir(filesBackupPath, { recursive: true });

      for (const file of filesToBackup) {
        const sourcePath = path.join(__dirname, '..', file);
        const destPath = path.join(filesBackupPath, file);

        try {
          await fs.copyFile(sourcePath, destPath);
          logger.info(`Backed up file: ${file}`);
        } catch (error) {
          logger.warn(`Failed to backup file ${file}:`, error.message);
        }
      }

      // Backup logs directory
      const logsDir = path.join(__dirname, '..', 'logs');
      const logsBackupPath = path.join(filesBackupPath, 'logs');

      try {
        await this.copyDirectory(logsDir, logsBackupPath);
        logger.info('Logs directory backed up');
      } catch (error) {
        logger.warn('Failed to backup logs directory:', error.message);
      }

      logger.info('Files backup completed');
      return filesBackupPath;
    } catch (error) {
      logger.error('Files backup failed:', error);
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

  async createMetadata() {
    try {
      const metadata = {
        timestamp: new Date().toISOString(),
        version: require('../package.json').version,
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development',
        backupType: 'full',
        components: {
          mongodb: true,
          redis: true,
          files: true
        },
        size: await this.getDirectorySize(this.backupPath)
      };

      const metadataPath = path.join(this.backupPath, 'metadata.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      logger.info('Backup metadata created');
      return metadata;
    } catch (error) {
      logger.error('Failed to create metadata:', error);
      throw error;
    }
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(entryPath);
        } else {
          const stats = await fs.stat(entryPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      logger.warn(`Failed to get size for ${dirPath}:`, error.message);
    }

    return totalSize;
  }

  async compressBackup() {
    try {
      logger.info('Compressing backup...');

      const archivePath = `${this.backupPath}.zip`;
      const output = require('fs').createWriteStream(archivePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          logger.info(`Backup compressed: ${archivePath} (${archive.pointer()} bytes)`);
          resolve(archivePath);
        });

        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(this.backupPath, false);
        archive.finalize();
      });
    } catch (error) {
      logger.error('Failed to compress backup:', error);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const maxBackups = parseInt(process.env.MAX_BACKUPS, 10) || 7;
      const backups = await fs.readdir(this.backupDir);

      const backupFiles = backups
        .filter(file => file.startsWith('techmoneybot-backup-'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.stat(path.join(this.backupDir, file)).then(stats => stats.mtime)
        }));

      // Wait for all stat operations to complete
      for (const backup of backupFiles) {
        backup.time = await backup.time;
      }

      // Sort by modification time (newest first)
      backupFiles.sort((a, b) => b.time - a.time);

      // Remove old backups
      const backupsToRemove = backupFiles.slice(maxBackups);

      for (const backup of backupsToRemove) {
        try {
          const stats = await fs.stat(backup.path);

          if (stats.isDirectory()) {
            await fs.rmdir(backup.path, { recursive: true });
          } else {
            await fs.unlink(backup.path);
          }

          logger.info(`Removed old backup: ${backup.name}`);
        } catch (error) {
          logger.warn(`Failed to remove backup ${backup.name}:`, error.message);
        }
      }

      logger.info(`Cleanup completed. Kept ${Math.min(backupFiles.length, maxBackups)} backups.`);
    } catch (error) {
      logger.error('Failed to cleanup old backups:', error);
    }
  }

  async run() {
    const startTime = Date.now();

    try {
      logger.info('Starting backup process...');

      await this.initialize();

      // Run backups in parallel
      const backupPromises = [this.backupMongoDB(), this.backupRedis(), this.backupFiles()];

      await Promise.allSettled(backupPromises);

      // Create metadata
      const metadata = await this.createMetadata();

      // Compress backup
      const archivePath = await this.compressBackup();

      // Cleanup old backups
      await this.cleanupOldBackups();

      // Remove uncompressed backup directory
      await fs.rmdir(this.backupPath, { recursive: true });

      const duration = Date.now() - startTime;

      logger.info(`Backup completed successfully in ${duration}ms`);
      logger.info(`Archive: ${archivePath}`);
      logger.info(`Size: ${Math.round((metadata.size / 1024 / 1024) * 100) / 100} MB`);

      return {
        success: true,
        archivePath,
        metadata,
        duration
      };
    } catch (error) {
      logger.error('Backup process failed:', error);

      // Cleanup on failure
      try {
        await fs.rmdir(this.backupPath, { recursive: true });
      } catch (cleanupError) {
        logger.warn('Failed to cleanup after backup failure:', cleanupError.message);
      }

      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const backup = new BackupManager();

  backup
    .run()
    .then(result => {
      console.log('✅ Backup completed successfully!');
      console.log(`📁 Archive: ${result.archivePath}`);
      console.log(`⏱️  Duration: ${result.duration}ms`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    });
}

module.exports = BackupManager;
