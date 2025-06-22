#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');
const readline = require('readline');

const execAsync = promisify(exec);

class DeployManager {
  constructor(environment = 'production') {
    this.environment = environment;
    this.projectRoot = path.join(__dirname, '..');
    this.deployConfig = this.getDeployConfig();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  getDeployConfig() {
    const configs = {
      development: {
        name: 'Development',
        dockerCompose: 'docker-compose.yml',
        envFile: '.env.development',
        healthCheck: true,
        backup: false,
        migrate: true
      },
      staging: {
        name: 'Staging',
        dockerCompose: 'docker-compose.staging.yml',
        envFile: '.env.staging',
        healthCheck: true,
        backup: true,
        migrate: true
      },
      production: {
        name: 'Production',
        dockerCompose: 'docker-compose.prod.yml',
        envFile: '.env.production',
        healthCheck: true,
        backup: true,
        migrate: true,
        rollback: true
      }
    };

    return configs[this.environment] || configs.production;
  }

  async checkPrerequisites() {
    logger.info('Checking deployment prerequisites...');

    const checks = [
      { name: 'Docker', command: 'docker --version' },
      { name: 'Docker Compose', command: 'docker-compose --version' },
      { name: 'Node.js', command: 'node --version' },
      { name: 'npm', command: 'npm --version' }
    ];

    for (const check of checks) {
      try {
        await execAsync(check.command);
        logger.info(`✅ ${check.name} is available`);
      } catch (error) {
        logger.error(`❌ ${check.name} is not available:`, error.message);
        throw new Error(`Missing prerequisite: ${check.name}`);
      }
    }

    // Check if required files exist
    const requiredFiles = ['package.json', 'Dockerfile', this.deployConfig.dockerCompose];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      try {
        await fs.access(filePath);
        logger.info(`✅ ${file} exists`);
      } catch (error) {
        logger.error(`❌ Required file missing: ${file}`);
        throw new Error(`Missing required file: ${file}`);
      }
    }

    logger.info('Prerequisites check completed');
  }

  async confirmDeployment() {
    return new Promise(resolve => {
      console.log('\n🚀 DEPLOYMENT CONFIRMATION');
      console.log('===========================');
      console.log(`🌍 Environment: ${this.deployConfig.name}`);
      console.log(`📁 Docker Compose: ${this.deployConfig.dockerCompose}`);
      console.log(`⚙️  Environment File: ${this.deployConfig.envFile}`);
      console.log(`🔍 Health Check: ${this.deployConfig.healthCheck ? 'Yes' : 'No'}`);
      console.log(`💾 Backup: ${this.deployConfig.backup ? 'Yes' : 'No'}`);

      this.rl.question('\nDo you want to proceed with deployment? (yes/no): ', answer => {
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });
  }

  async createBackup() {
    if (!this.deployConfig.backup) {
      logger.info('Backup skipped for this environment');
      return;
    }

    try {
      logger.info('Creating pre-deployment backup...');

      const BackupManager = require('./backup');
      const backup = new BackupManager();

      const result = await backup.run();
      logger.info(`Backup created: ${result.archivePath}`);

      return result.archivePath;
    } catch (error) {
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  async buildImages() {
    try {
      logger.info('Building Docker images...');

      const buildCommand = `docker-compose -f ${this.deployConfig.dockerCompose} build --no-cache`;

      const { stdout, stderr } = await execAsync(buildCommand, {
        cwd: this.projectRoot,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stderr) {
        logger.warn('Build warnings:', stderr);
      }

      logger.info('Docker images built successfully');
    } catch (error) {
      logger.error('Failed to build Docker images:', error);
      throw error;
    }
  }

  async stopServices() {
    try {
      logger.info('Stopping existing services...');

      const stopCommand = `docker-compose -f ${this.deployConfig.dockerCompose} down`;

      await execAsync(stopCommand, { cwd: this.projectRoot });

      logger.info('Services stopped successfully');
    } catch (error) {
      logger.warn('Failed to stop services (they might not be running):', error.message);
    }
  }

  async startServices() {
    try {
      logger.info('Starting services...');

      const startCommand = `docker-compose -f ${this.deployConfig.dockerCompose} up -d`;

      const { stdout, stderr } = await execAsync(startCommand, {
        cwd: this.projectRoot,
        maxBuffer: 1024 * 1024 * 10
      });

      if (stderr) {
        logger.warn('Start warnings:', stderr);
      }

      logger.info('Services started successfully');
    } catch (error) {
      logger.error('Failed to start services:', error);
      throw error;
    }
  }

  async runMigrations() {
    if (!this.deployConfig.migrate) {
      logger.info('Migrations skipped for this environment');
      return;
    }

    try {
      logger.info('Running database migrations...');

      // Wait for database to be ready
      await this.waitForService('mongodb', 30000);

      const migrateCommand = `docker-compose -f ${this.deployConfig.dockerCompose} exec -T bot npm run migrate`;

      await execAsync(migrateCommand, { cwd: this.projectRoot });

      logger.info('Migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  async waitForService(serviceName, timeout = 30000) {
    logger.info(`Waiting for ${serviceName} to be ready...`);

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const healthCommand = `docker-compose -f ${this.deployConfig.dockerCompose} exec -T ${serviceName} echo "ready"`;
        await execAsync(healthCommand, { cwd: this.projectRoot });

        logger.info(`${serviceName} is ready`);
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error(`${serviceName} failed to become ready within ${timeout}ms`);
  }

  async performHealthCheck() {
    if (!this.deployConfig.healthCheck) {
      logger.info('Health check skipped for this environment');
      return;
    }

    try {
      logger.info('Performing health check...');

      // Wait for bot service to be ready
      await this.waitForService('bot', 60000);

      // Run health check
      const healthCommand = `docker-compose -f ${this.deployConfig.dockerCompose} exec -T bot node healthcheck.js`;

      const { stdout } = await execAsync(healthCommand, { cwd: this.projectRoot });

      logger.info('Health check passed');
      logger.info('Health check output:', stdout);
    } catch (error) {
      logger.error('Health check failed:', error);
      throw error;
    }
  }

  async showStatus() {
    try {
      logger.info('Checking deployment status...');

      const statusCommand = `docker-compose -f ${this.deployConfig.dockerCompose} ps`;

      const { stdout } = await execAsync(statusCommand, { cwd: this.projectRoot });

      console.log('\n📊 DEPLOYMENT STATUS');
      console.log('====================');
      console.log(stdout);

      // Show logs for failed services
      const lines = stdout.split('\n').slice(2); // Skip header lines

      for (const line of lines) {
        if (line.includes('Exit') || line.includes('Restarting')) {
          const serviceName = line.split(/\s+/)[0];
          if (serviceName) {
            console.log(`\n❌ Service ${serviceName} has issues. Recent logs:`);
            try {
              const logsCommand = `docker-compose -f ${this.deployConfig.dockerCompose} logs --tail=10 ${serviceName}`;
              const { stdout: logs } = await execAsync(logsCommand, { cwd: this.projectRoot });
              console.log(logs);
            } catch (error) {
              console.log('Failed to get logs:', error.message);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check status:', error);
    }
  }

  async rollback(backupPath) {
    if (!this.deployConfig.rollback || !backupPath) {
      logger.warn('Rollback not available or no backup path provided');
      return;
    }

    try {
      logger.info('Performing rollback...');

      // Stop current services
      await this.stopServices();

      // Restore from backup
      const RestoreManager = require('./restore');
      const restore = new RestoreManager(backupPath);

      await restore.run();

      // Start services again
      await this.startServices();

      logger.info('Rollback completed');
    } catch (error) {
      logger.error('Rollback failed:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      logger.info('Cleaning up unused Docker resources...');

      // Remove unused images
      await execAsync('docker image prune -f');

      // Remove unused volumes (be careful with this)
      if (this.environment === 'development') {
        await execAsync('docker volume prune -f');
      }

      logger.info('Cleanup completed');
    } catch (error) {
      logger.warn('Cleanup failed:', error.message);
    }
  }

  async run() {
    const startTime = Date.now();
    let backupPath = null;

    try {
      logger.info(`Starting deployment to ${this.deployConfig.name}...`);

      // Pre-deployment checks
      await this.checkPrerequisites();

      // Confirm deployment
      const confirmed = await this.confirmDeployment();
      this.rl.close();

      if (!confirmed) {
        logger.info('Deployment cancelled by user');
        return { success: false, cancelled: true };
      }

      // Create backup
      backupPath = await this.createBackup();

      // Build and deploy
      await this.buildImages();
      await this.stopServices();
      await this.startServices();

      // Post-deployment tasks
      await this.runMigrations();
      await this.performHealthCheck();

      // Show status
      await this.showStatus();

      // Cleanup
      await this.cleanup();

      const duration = Date.now() - startTime;

      logger.info(`Deployment completed successfully in ${duration}ms`);

      return {
        success: true,
        environment: this.environment,
        duration,
        backupPath
      };
    } catch (error) {
      logger.error('Deployment failed:', error);

      // Attempt rollback if backup exists
      if (backupPath && this.deployConfig.rollback) {
        logger.info('Attempting automatic rollback...');
        try {
          await this.rollback(backupPath);
          logger.info('Rollback completed successfully');
        } catch (rollbackError) {
          logger.error('Rollback also failed:', rollbackError);
        }
      }

      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const environment = process.argv[2] || 'production';

  const validEnvironments = ['development', 'staging', 'production'];

  if (!validEnvironments.includes(environment)) {
    console.error(`❌ Invalid environment: ${environment}`);
    console.error(`   Valid environments: ${validEnvironments.join(', ')}`);
    process.exit(1);
  }

  const deploy = new DeployManager(environment);

  deploy
    .run()
    .then(result => {
      if (result.cancelled) {
        console.log('🚫 Deployment cancelled');
        process.exit(0);
      }

      console.log('\n✅ Deployment completed successfully!');
      console.log(`🌍 Environment: ${result.environment}`);
      console.log(`⏱️  Duration: ${result.duration}ms`);

      if (result.backupPath) {
        console.log(`💾 Backup: ${result.backupPath}`);
      }

      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = DeployManager;
