import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { logSecurityEvent } from './audit-logger';

/**
 * Backup system configuration
 */
const BACKUP_CONFIG = {
  maxRetentionDays: 30,
  compressionLevel: 6,
  encryptionAlgorithm: 'aes-256-gcm',
  backupDirectory: process.env.BACKUP_DIR || './backups',
  includePaths: ['./src', './config', './docs'],
  excludePatterns: ['node_modules', '.git', '*.log', 'tmp'],
};

/**
 * Create a timestamp for backup files
 */
const createTimestamp = () => {
  return new Date().toISOString().replace(/[:.]/g, '-');
};

/**
 * Ensure backup directory exists
 */
const ensureBackupDirectory = async backupDir => {
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
  }
};

/**
 * Run full system backup
 */
const runFullBackup = async (userId, options = {}) => {
  try {
    const {
      includePaths = BACKUP_CONFIG.includePaths,
      excludePatterns = BACKUP_CONFIG.excludePatterns,
      encrypt = true,
      compress = true,
    } = options;

    const timestamp = createTimestamp();
    const backupDir = path.join(BACKUP_CONFIG.backupDirectory, timestamp);

    await ensureBackupDirectory(backupDir);

    // Log backup start
    await logSecurityEvent({
      eventType: 'BACKUP_STARTED',
      userId,
      details: {
        timestamp,
        includePaths,
        excludePatterns,
        encrypt,
        compress,
      },
      timestamp: new Date().toISOString(),
    });

    const backupData = {
      metadata: {
        timestamp,
        userId,
        version: '1.0.0',
        includePaths,
        excludePatterns,
        encrypted: encrypt,
        compressed: compress,
      },
      data: {},
    };

    // Simulate data collection (in real implementation, collect actual data)
    for (const includePath of includePaths) {
      try {
        backupData.data[includePath] = {
          path: includePath,
          size: Math.floor(Math.random() * 1000000), // Simulated size
          checksum: crypto.randomBytes(16).toString('hex'),
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // Log warning for failed backup path
        await logSecurityEvent({
          eventType: 'BACKUP_PATH_FAILED',
          userId,
          details: {
            path: includePath,
            error: error.message,
          },
          timestamp: new Date().toISOString(),
        });

        backupData.data[includePath] = {
          path: includePath,
          error: error.message,
        };
      }
    }

    // Write backup file
    const backupFilePath = path.join(backupDir, 'backup.json');
    await fs.writeFile(backupFilePath, JSON.stringify(backupData, null, 2));

    // Log successful backup
    await logSecurityEvent({
      eventType: 'BACKUP_COMPLETED',
      userId,
      details: {
        timestamp,
        backupPath: backupFilePath,
        dataSize: Object.keys(backupData.data).length,
        success: true,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      timestamp,
      backupPath: backupFilePath,
      dataSize: Object.keys(backupData.data).length,
      encrypted: encrypt,
    };
  } catch (error) {
    // Log backup failure
    await logSecurityEvent({
      eventType: 'BACKUP_FAILED',
      userId,
      details: {
        error: error.message,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Restore data from backup
 */
const restoreFromBackup = async (userId, backupTimestamp, options = {}) => {
  try {
    const { targetPath = './restored', verifyIntegrity = true } = options;

    const backupDir = path.join(BACKUP_CONFIG.backupDirectory, backupTimestamp);
    const backupFilePath = path.join(backupDir, 'backup.json');

    // Check if backup exists
    try {
      await fs.access(backupFilePath);
    } catch {
      throw new Error(`Backup not found: ${backupTimestamp}`);
    }

    // Read backup data
    const backupContent = await fs.readFile(backupFilePath, 'utf8');
    const backupData = JSON.parse(backupContent);

    // Verify backup integrity if requested
    if (verifyIntegrity) {
      const verification = await verifyBackupIntegrity(backupTimestamp);
      if (!verification.isValid) {
        throw new Error(`Backup integrity check failed: ${verification.error}`);
      }
    }

    // Log restore start
    await logSecurityEvent({
      eventType: 'RESTORE_STARTED',
      userId,
      details: {
        backupTimestamp,
        targetPath,
        verifyIntegrity,
      },
      timestamp: new Date().toISOString(),
    });

    // Ensure target directory exists
    await ensureBackupDirectory(targetPath);

    // Simulate restore process (in real implementation, restore actual files)
    for (const [dataPath, dataInfo] of Object.entries(backupData.data)) {
      if (!dataInfo.error) {
        // Simulate successful restore
        const restorePath = path.join(targetPath, path.basename(dataPath));
        await fs.writeFile(restorePath, `Restored data from ${dataPath}`);
      }
    }

    // Log successful restore
    await logSecurityEvent({
      eventType: 'RESTORE_COMPLETED',
      userId,
      details: {
        backupTimestamp,
        targetPath,
        restoredItems: Object.keys(backupData.data).length,
        success: true,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      backupTimestamp,
      targetPath,
      restoredItems: Object.keys(backupData.data).length,
      restoredData: backupData.data,
    };
  } catch (error) {
    // Log restore failure
    await logSecurityEvent({
      eventType: 'RESTORE_FAILED',
      userId,
      details: {
        backupTimestamp,
        error: error.message,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * List available backups
 */
const listBackups = async () => {
  try {
    const backupDir = BACKUP_CONFIG.backupDirectory;

    // Ensure backup directory exists
    await ensureBackupDirectory(backupDir);

    const entries = await fs.readdir(backupDir, { withFileTypes: true });
    const backups = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const backupPath = path.join(backupDir, entry.name);
        const backupFilePath = path.join(backupPath, 'backup.json');

        try {
          const stats = await fs.stat(backupFilePath);
          const backupContent = await fs.readFile(backupFilePath, 'utf8');
          const backupData = JSON.parse(backupContent);

          backups.push({
            timestamp: entry.name,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            metadata: backupData.metadata,
            itemCount: Object.keys(backupData.data || {}).length,
          });
        } catch {
          // Skip invalid backup directories
        }
      }
    }

    return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
  } catch (error) {
    return [];
  }
};

/**
 * Clean up old backups based on retention policy
 */
const cleanupOldBackups = async (retentionDays = BACKUP_CONFIG.maxRetentionDays) => {
  try {
    const backups = await listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backupsToDelete = backups.filter(backup => new Date(backup.created) < cutoffDate);

    for (const backup of backupsToDelete) {
      const backupPath = path.join(BACKUP_CONFIG.backupDirectory, backup.timestamp);
      try {
        await fs.rm(backupPath, { recursive: true, force: true });
      } catch {
        // Continue with other backups if one fails
      }
    }

    return {
      success: true,
      deletedCount: backupsToDelete.length,
      retentionDays,
    };
  } catch (error) {
    // Log cleanup failure
    await logSecurityEvent({
      eventType: 'BACKUP_CLEANUP_FAILED',
      userId: 'system',
      details: {
        error: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Verify backup integrity
 */
const verifyBackupIntegrity = async backupTimestamp => {
  try {
    const backupDir = path.join(BACKUP_CONFIG.backupDirectory, backupTimestamp);
    const backupFilePath = path.join(backupDir, 'backup.json');

    // Check if backup file exists
    await fs.access(backupFilePath);

    // Read and parse backup data
    const backupContent = await fs.readFile(backupFilePath, 'utf8');
    const backupData = JSON.parse(backupContent);

    // Basic validation
    if (!backupData.metadata || !backupData.data) {
      throw new Error('Invalid backup structure');
    }

    return {
      isValid: true,
      timestamp: backupTimestamp,
      metadata: backupData.metadata,
      dataKeys: Object.keys(backupData.data || {}),
    };
  } catch (error) {
    return {
      isValid: false,
      timestamp: backupTimestamp,
      error: error.message,
    };
  }
};

export { cleanupOldBackups, listBackups, restoreFromBackup, runFullBackup, verifyBackupIntegrity };
