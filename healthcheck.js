#!/usr/bin/env node

/**
 * =============================================================================
 * AI Agency Landing Page - Health Check Script
 * =============================================================================
 * Health check script for Docker container and application monitoring
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOSTNAME || 'localhost',
  timeout: 5000,
  retries: 3,
  protocol: process.env.HTTPS === 'true' ? 'https' : 'http',
};

// Health check endpoints
const endpoints = [
  { path: '/api/health', critical: true },
  { path: '/api/status', critical: false },
  { path: '/', critical: true },
];

/**
 * Logger utility
 */
const logger = {
  info: message => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: message => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
  warn: message => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
};

/**
 * Make HTTP request with timeout
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;

    const req = client.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(config.timeout, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${config.timeout}ms`));
    });

    req.end();
  });
}

/**
 * Check application endpoint
 */
async function checkEndpoint(endpoint, attempt = 1) {
  const options = {
    hostname: config.host,
    port: config.port,
    path: endpoint.path,
    method: 'GET',
    protocol: `${config.protocol}:`,
    headers: {
      'User-Agent': 'HealthCheck/1.0',
    },
  };

  try {
    const response = await makeRequest(options);

    if (response.statusCode >= 200 && response.statusCode < 400) {
      logger.info(`✓ ${endpoint.path} - Status: ${response.statusCode}`);
      return { success: true, statusCode: response.statusCode };
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    logger.error(`✗ ${endpoint.path} - ${error.message}`);

    if (attempt < config.retries) {
      logger.info(`Retrying ${endpoint.path} (${attempt}/${config.retries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return checkEndpoint(endpoint, attempt + 1);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  try {
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };

    logger.info(
      `Memory Usage - RSS: ${memUsageMB.rss}MB, Heap: ${memUsageMB.heapUsed}/${memUsageMB.heapTotal}MB`
    );

    // Check if memory usage is too high (> 1GB)
    if (memUsageMB.rss > 1024) {
      logger.warn(`High memory usage detected: ${memUsageMB.rss}MB`);
    }

    // Check CPU usage (basic)
    const cpuUsage = process.cpuUsage();
    logger.info(`CPU Usage - User: ${cpuUsage.user}μs, System: ${cpuUsage.system}μs`);

    return true;
  } catch (error) {
    logger.error(`System resource check failed: ${error.message}`);
    return false;
  }
}

/**
 * Check disk space (if available)
 */
function checkDiskSpace() {
  try {
    if (process.platform !== 'win32') {
      const output = execSync('df -h /', { encoding: 'utf8', timeout: 2000 });
      const lines = output.trim().split('\n');
      if (lines.length > 1) {
        const diskInfo = lines[1].split(/\s+/);
        const usage = diskInfo[4];
        logger.info(`Disk Usage: ${usage}`);

        // Warning if disk usage > 90%
        const usagePercent = parseInt(usage.replace('%', ''));
        if (usagePercent > 90) {
          logger.warn(`High disk usage: ${usage}`);
        }
      }
    }
    return true;
  } catch (error) {
    logger.warn(`Disk space check skipped: ${error.message}`);
    return true; // Non-critical
  }
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  const requiredEnvVars = ['NODE_ENV', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.error(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }

  logger.info(`Environment: ${process.env.NODE_ENV}`);
  return true;
}

/**
 * Main health check function
 */
async function healthCheck() {
  logger.info('Starting health check...');

  const results = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
  };

  try {
    // Check environment
    results.checks.environment = checkEnvironment();

    // Check system resources
    results.checks.system = checkSystemResources();

    // Check disk space
    results.checks.disk = checkDiskSpace();

    // Check application endpoints
    for (const endpoint of endpoints) {
      const result = await checkEndpoint(endpoint);
      results.checks[`endpoint_${endpoint.path.replace(/\//g, '_')}`] = result.success;

      if (!result.success && endpoint.critical) {
        results.status = 'unhealthy';
        logger.error(`Critical endpoint ${endpoint.path} failed`);
      }
    }

    // Overall health status
    const criticalChecks = [
      results.checks.environment,
      results.checks.endpoint___, // root endpoint
      results.checks.endpoint__api_health, // health API endpoint
    ];

    if (criticalChecks.some(check => !check)) {
      results.status = 'unhealthy';
    }

    logger.info(`Health check completed - Status: ${results.status}`);

    // Exit with appropriate code
    if (results.status === 'healthy') {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle process signals
 */
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, exiting health check...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, exiting health check...');
  process.exit(0);
});

// Run health check if this script is executed directly
if (require.main === module) {
  healthCheck();
}

module.exports = { healthCheck, checkEndpoint, checkSystemResources };
