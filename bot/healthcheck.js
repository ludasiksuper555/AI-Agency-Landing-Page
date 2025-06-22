const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('./utils/logger');

// Health check script for Docker
class HealthChecker {
  constructor() {
    this.checks = {
      database: false,
      redis: false,
      memory: false,
      disk: false
    };
    this.timeout = 10000; // 10 seconds
  }

  async checkDatabase() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/techmoneybot';

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });

      // Simple ping to check connection
      await mongoose.connection.db.admin().ping();

      this.checks.database = true;
      logger.info('Database health check: PASSED');
    } catch (error) {
      this.checks.database = false;
      logger.error('Database health check: FAILED', error.message);
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    }
  }

  async checkRedis() {
    let client;
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      client = redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          commandTimeout: 5000
        }
      });

      await client.connect();

      // Simple ping to check connection
      const pong = await client.ping();

      if (pong === 'PONG') {
        this.checks.redis = true;
        logger.info('Redis health check: PASSED');
      } else {
        throw new Error('Invalid ping response');
      }
    } catch (error) {
      this.checks.redis = false;
      logger.error('Redis health check: FAILED', error.message);
    } finally {
      if (client && client.isOpen) {
        await client.quit();
      }
    }
  }

  checkMemory() {
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memoryUsagePercent = (usedMem / totalMem) * 100;

      // Consider healthy if memory usage is below 90%
      this.checks.memory = memoryUsagePercent < 90;

      logger.info(
        `Memory health check: ${this.checks.memory ? 'PASSED' : 'FAILED'} (${memoryUsagePercent.toFixed(2)}% used)`
      );
    } catch (error) {
      this.checks.memory = false;
      logger.error('Memory health check: FAILED', error.message);
    }
  }

  checkDisk() {
    try {
      const fs = require('fs');
      const path = require('path');

      // Check if we can write to the logs directory
      const testFile = path.join(__dirname, 'logs', '.healthcheck');

      fs.writeFileSync(testFile, 'healthcheck', 'utf8');
      const content = fs.readFileSync(testFile, 'utf8');

      if (content === 'healthcheck') {
        this.checks.disk = true;
        fs.unlinkSync(testFile); // Clean up
        logger.info('Disk health check: PASSED');
      } else {
        throw new Error('File content mismatch');
      }
    } catch (error) {
      this.checks.disk = false;
      logger.error('Disk health check: FAILED', error.message);
    }
  }

  async checkAPIs() {
    const apiChecks = {
      openai: false,
      upwork: false,
      freelancer: false
    };

    // Check OpenAI API
    try {
      if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });

        if (response.ok) {
          apiChecks.openai = true;
          logger.info('OpenAI API health check: PASSED');
        }
      }
    } catch (error) {
      logger.error('OpenAI API health check: FAILED', error.message);
    }

    // Check Upwork API (basic connectivity)
    try {
      if (process.env.UPWORK_CLIENT_ID) {
        const response = await fetch('https://www.upwork.com/api/v3/organization/users/me', {
          method: 'GET',
          timeout: 5000
        });

        // Even if unauthorized, if we get a response, the API is reachable
        if (response.status === 401 || response.status === 200) {
          apiChecks.upwork = true;
          logger.info('Upwork API health check: PASSED');
        }
      }
    } catch (error) {
      logger.error('Upwork API health check: FAILED', error.message);
    }

    // Check Freelancer API (basic connectivity)
    try {
      if (process.env.FREELANCER_CLIENT_ID) {
        const response = await fetch('https://www.freelancer.com/api/users/0.1/self/', {
          method: 'GET',
          timeout: 5000
        });

        // Even if unauthorized, if we get a response, the API is reachable
        if (response.status === 401 || response.status === 200) {
          apiChecks.freelancer = true;
          logger.info('Freelancer API health check: PASSED');
        }
      }
    } catch (error) {
      logger.error('Freelancer API health check: FAILED', error.message);
    }

    return apiChecks;
  }

  async runAllChecks() {
    logger.info('Starting health checks...');

    const startTime = Date.now();

    try {
      // Run checks in parallel for faster execution
      await Promise.all([
        this.checkDatabase(),
        this.checkRedis(),
        Promise.resolve(this.checkMemory()),
        Promise.resolve(this.checkDisk())
      ]);

      // Check APIs (optional, don't fail health check if APIs are down)
      const apiChecks = await this.checkAPIs();

      const duration = Date.now() - startTime;

      // Determine overall health
      const criticalChecks = [
        this.checks.database,
        this.checks.redis,
        this.checks.memory,
        this.checks.disk
      ];

      const isHealthy = criticalChecks.every(check => check === true);

      const healthReport = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        checks: {
          ...this.checks,
          apis: apiChecks
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform
        }
      };

      if (isHealthy) {
        logger.info('Health check completed: HEALTHY', healthReport);
        console.log(JSON.stringify(healthReport, null, 2));
        process.exit(0);
      } else {
        logger.error('Health check completed: UNHEALTHY', healthReport);
        console.error(JSON.stringify(healthReport, null, 2));
        process.exit(1);
      }
    } catch (error) {
      logger.error('Health check failed with error:', error);
      console.error('Health check error:', error.message);
      process.exit(1);
    }
  }
}

// Handle timeout
const timeoutId = setTimeout(() => {
  logger.error('Health check timed out');
  console.error('Health check timed out');
  process.exit(1);
}, 15000); // 15 seconds timeout

// Run health check
const healthChecker = new HealthChecker();
healthChecker.runAllChecks().finally(() => {
  clearTimeout(timeoutId);
});

// Handle process signals
process.on('SIGTERM', () => {
  logger.info('Health check received SIGTERM');
  clearTimeout(timeoutId);
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('Health check received SIGINT');
  clearTimeout(timeoutId);
  process.exit(1);
});

process.on('uncaughtException', error => {
  logger.error('Health check uncaught exception:', error);
  clearTimeout(timeoutId);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Health check unhandled rejection:', reason);
  clearTimeout(timeoutId);
  process.exit(1);
});
