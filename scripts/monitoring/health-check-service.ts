import axios from 'axios';
import { Request, Response } from 'express';
import fs from 'fs';
import Redis from 'ioredis';
import path from 'path';
import { Pool } from 'pg';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: string;
  details?: any;
  error?: string;
}

interface HealthCheckConfig {
  database?: {
    enabled: boolean;
    connectionString?: string;
    timeout?: number;
  };
  redis?: {
    enabled: boolean;
    host?: string;
    port?: number;
    password?: string;
    timeout?: number;
  };
  externalApis?: Array<{
    name: string;
    url: string;
    timeout?: number;
    headers?: Record<string, string>;
    expectedStatus?: number;
  }>;
  fileSystem?: {
    enabled: boolean;
    paths?: string[];
    permissions?: string[];
  };
  memory?: {
    enabled: boolean;
    maxUsagePercent?: number;
  };
  disk?: {
    enabled: boolean;
    maxUsagePercent?: number;
    paths?: string[];
  };
}

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  loadAverage?: number[];
  nodeVersion: string;
  processId: number;
}

class HealthCheckService {
  private config: HealthCheckConfig;
  private dbPool?: Pool;
  private redisClient?: Redis;
  private lastResults: Map<string, HealthCheckResult> = new Map();
  private checkInterval?: NodeJS.Timeout;

  constructor(config: HealthCheckConfig = {}) {
    this.config = {
      database: { enabled: true, timeout: 5000, ...config.database },
      redis: { enabled: true, timeout: 5000, ...config.redis },
      externalApis: config.externalApis || [],
      fileSystem: {
        enabled: true,
        paths: ['.'],
        permissions: ['read', 'write'],
        ...config.fileSystem,
      },
      memory: { enabled: true, maxUsagePercent: 90, ...config.memory },
      disk: { enabled: true, maxUsagePercent: 90, paths: ['.'], ...config.disk },
    };

    this.initializeConnections();
  }

  private async initializeConnections(): Promise<void> {
    try {
      // Инициализация подключения к базе данных
      if (this.config.database?.enabled) {
        const connectionString =
          this.config.database.connectionString ||
          process.env.DATABASE_URL ||
          process.env.POSTGRES_URL;

        if (connectionString) {
          this.dbPool = new Pool({
            connectionString,
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: this.config.database.timeout,
          });
        }
      }

      // Инициализация подключения к Redis
      if (this.config.redis?.enabled) {
        const redisConfig = {
          host: this.config.redis.host || process.env.REDIS_HOST || 'localhost',
          port: this.config.redis.port || parseInt(process.env.REDIS_PORT || '6379'),
          password: this.config.redis.password || process.env.REDIS_PASSWORD,
          connectTimeout: this.config.redis.timeout,
          lazyConnect: true,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
        };

        this.redisClient = new Redis(redisConfig);
      }
    } catch (error) {
      console.error('Ошибка инициализации подключений:', error);
    }
  }

  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      service: 'database',
      status: 'unhealthy',
      responseTime: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      if (!this.dbPool) {
        throw new Error('База данных не настроена');
      }

      // Простой запрос для проверки подключения
      const queryResult = await this.dbPool.query(
        'SELECT NOW() as current_time, version() as version'
      );

      // Проверка пула подключений
      const poolInfo = {
        totalCount: this.dbPool.totalCount,
        idleCount: this.dbPool.idleCount,
        waitingCount: this.dbPool.waitingCount,
      };

      result.status = 'healthy';
      result.details = {
        currentTime: queryResult.rows[0]?.current_time,
        version: queryResult.rows[0]?.version?.split(' ').slice(0, 2).join(' '),
        pool: poolInfo,
      };
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
      result.details = {
        connectionString: this.config.database?.connectionString ? 'настроена' : 'не настроена',
      };
    } finally {
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      service: 'redis',
      status: 'unhealthy',
      responseTime: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      if (!this.redisClient) {
        throw new Error('Redis не настроен');
      }

      // Проверка подключения
      await this.redisClient.ping();

      // Тест записи/чтения
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'test_value';

      await this.redisClient.set(testKey, testValue, 'EX', 10);
      const retrievedValue = await this.redisClient.get(testKey);

      if (retrievedValue !== testValue) {
        throw new Error('Ошибка записи/чтения данных');
      }

      await this.redisClient.del(testKey);

      // Получение информации о Redis
      const info = await this.redisClient.info('server');
      const redisVersion = info.match(/redis_version:([^\r\n]+)/)?.[1];
      const uptimeSeconds = info.match(/uptime_in_seconds:([^\r\n]+)/)?.[1];

      result.status = 'healthy';
      result.details = {
        version: redisVersion,
        uptime: uptimeSeconds ? parseInt(uptimeSeconds) : undefined,
        connection: this.redisClient.status,
      };
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
      result.details = {
        status: this.redisClient?.status || 'not_initialized',
        host: this.config.redis?.host,
        port: this.config.redis?.port,
      };
    } finally {
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  async checkExternalApi(
    apiConfig: NonNullable<HealthCheckConfig['externalApis']>[0]
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      service: `external_api_${apiConfig.name}`,
      status: 'unhealthy',
      responseTime: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await axios.get(apiConfig.url, {
        timeout: apiConfig.timeout || 5000,
        headers: apiConfig.headers || {},
        validateStatus: status => {
          const expectedStatus = apiConfig.expectedStatus || 200;
          return status === expectedStatus;
        },
      });

      result.status = 'healthy';
      result.details = {
        url: apiConfig.url,
        statusCode: response.status,
        statusText: response.statusText,
        headers: {
          'content-type': response.headers['content-type'],
          'content-length': response.headers['content-length'],
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        result.error = `HTTP ${error.response?.status || 'timeout'}: ${error.message}`;
        result.details = {
          url: apiConfig.url,
          statusCode: error.response?.status,
          statusText: error.response?.statusText,
        };
      } else {
        result.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
      }
    } finally {
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  async checkFileSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      service: 'filesystem',
      status: 'healthy',
      responseTime: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      const paths = this.config.fileSystem?.paths || ['.'];
      const permissions = this.config.fileSystem?.permissions || ['read'];
      const checks: any[] = [];

      for (const checkPath of paths) {
        const pathCheck: any = {
          path: checkPath,
          exists: false,
          readable: false,
          writable: false,
        };

        try {
          // Проверка существования
          const stats = await fs.promises.stat(checkPath);
          pathCheck.exists = true;
          pathCheck.isDirectory = stats.isDirectory();
          pathCheck.size = stats.size;
          pathCheck.modified = stats.mtime;

          // Проверка прав на чтение
          if (permissions.includes('read')) {
            await fs.promises.access(checkPath, fs.constants.R_OK);
            pathCheck.readable = true;
          }

          // Проверка прав на запись
          if (permissions.includes('write')) {
            await fs.promises.access(checkPath, fs.constants.W_OK);
            pathCheck.writable = true;

            // Тест записи (если это директория)
            if (stats.isDirectory()) {
              const testFile = path.join(checkPath, `health_check_${Date.now()}.tmp`);
              await fs.promises.writeFile(testFile, 'test');
              await fs.promises.unlink(testFile);
              pathCheck.writeTest = 'success';
            }
          }
        } catch (error) {
          pathCheck.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
          if (!pathCheck.exists) {
            result.status = 'unhealthy';
          }
        }

        checks.push(pathCheck);
      }

      result.details = { checks };

      // Если есть критические ошибки, помечаем как unhealthy
      const hasErrors = checks.some(check => check.error && !check.exists);
      if (hasErrors) {
        result.status = 'unhealthy';
        result.error = 'Некоторые пути недоступны';
      }
    } catch (error) {
      result.status = 'unhealthy';
      result.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
    } finally {
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;

    return {
      memory: {
        used: usedMem,
        total: totalMem,
        percentage: Math.round((usedMem / totalMem) * 100),
      },
      uptime: process.uptime(),
      loadAverage: require('os').loadavg(),
      nodeVersion: process.version,
      processId: process.pid,
    };
  }

  async checkMemory(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      service: 'memory',
      status: 'healthy',
      responseTime: 0,
      timestamp: new Date().toISOString(),
    };

    try {
      const metrics = this.getSystemMetrics();
      const maxUsagePercent = this.config.memory?.maxUsagePercent || 90;

      result.details = {
        usage: metrics.memory,
        threshold: maxUsagePercent,
        process: process.memoryUsage(),
      };

      if (metrics.memory.percentage > maxUsagePercent) {
        result.status = 'degraded';
        result.error = `Использование памяти превышает ${maxUsagePercent}%`;
      }
    } catch (error) {
      result.status = 'unhealthy';
      result.error = error instanceof Error ? error.message : 'Неизвестная ошибка';
    } finally {
      result.responseTime = Date.now() - startTime;
    }

    return result;
  }

  async performAllChecks(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    checks: HealthCheckResult[];
    metrics: SystemMetrics;
    summary: {
      total: number;
      healthy: number;
      unhealthy: number;
      degraded: number;
    };
    timestamp: string;
  }> {
    console.log('🔍 Выполнение проверок здоровья системы...');

    const checks: HealthCheckResult[] = [];
    const startTime = Date.now();

    // Проверка базы данных
    if (this.config.database?.enabled) {
      console.log('   📊 Проверка базы данных...');
      const dbCheck = await this.checkDatabase();
      checks.push(dbCheck);
      this.lastResults.set('database', dbCheck);
    }

    // Проверка Redis
    if (this.config.redis?.enabled) {
      console.log('   🔴 Проверка Redis...');
      const redisCheck = await this.checkRedis();
      checks.push(redisCheck);
      this.lastResults.set('redis', redisCheck);
    }

    // Проверка внешних API
    if (this.config.externalApis && this.config.externalApis.length > 0) {
      console.log('   🌐 Проверка внешних API...');
      for (const apiConfig of this.config.externalApis) {
        const apiCheck = await this.checkExternalApi(apiConfig);
        checks.push(apiCheck);
        this.lastResults.set(`external_api_${apiConfig.name}`, apiCheck);
      }
    }

    // Проверка файловой системы
    if (this.config.fileSystem?.enabled) {
      console.log('   📁 Проверка файловой системы...');
      const fsCheck = await this.checkFileSystem();
      checks.push(fsCheck);
      this.lastResults.set('filesystem', fsCheck);
    }

    // Проверка памяти
    if (this.config.memory?.enabled) {
      console.log('   💾 Проверка памяти...');
      const memoryCheck = await this.checkMemory();
      checks.push(memoryCheck);
      this.lastResults.set('memory', memoryCheck);
    }

    // Получение системных метрик
    const metrics = this.getSystemMetrics();

    // Подсчет статистики
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
    };

    // Определение общего статуса
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }

    const totalTime = Date.now() - startTime;
    console.log(`   ✅ Проверки завершены за ${totalTime}мс`);
    console.log(`   📈 Статус: ${overallStatus} (${summary.healthy}/${summary.total} здоровых)`);

    return {
      status: overallStatus,
      checks,
      metrics,
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  // Express middleware для health check endpoint
  getHealthCheckMiddleware() {
    return async (req: Request, res: Response) => {
      try {
        const result = await this.performAllChecks();

        const statusCode =
          result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(result);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  // Простой endpoint для быстрой проверки
  getSimpleHealthCheckMiddleware() {
    return async (req: Request, res: Response) => {
      try {
        const metrics = this.getSystemMetrics();
        res.status(200).json({
          status: 'healthy',
          uptime: metrics.uptime,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Неизвестная ошибка',
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  // Запуск периодических проверок
  startPeriodicChecks(intervalMs: number = 60000): void {
    console.log(`🔄 Запуск периодических проверок каждые ${intervalMs / 1000}с`);

    this.checkInterval = setInterval(async () => {
      try {
        await this.performAllChecks();
      } catch (error) {
        console.error('Ошибка при периодической проверке:', error);
      }
    }, intervalMs);
  }

  // Остановка периодических проверок
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      console.log('⏹️ Периодические проверки остановлены');
    }
  }

  // Получение последних результатов
  getLastResults(): Map<string, HealthCheckResult> {
    return new Map(this.lastResults);
  }

  // Закрытие подключений
  async close(): Promise<void> {
    console.log('🔌 Закрытие подключений...');

    this.stopPeriodicChecks();

    if (this.dbPool) {
      await this.dbPool.end();
    }

    if (this.redisClient) {
      this.redisClient.disconnect();
    }

    console.log('✅ Подключения закрыты');
  }
}

export { HealthCheckConfig, HealthCheckResult, HealthCheckService, SystemMetrics };

// Пример использования
if (require.main === module) {
  async function main() {
    const healthCheck = new HealthCheckService({
      database: {
        enabled: true,
        connectionString: process.env.DATABASE_URL,
      },
      redis: {
        enabled: true,
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      externalApis: [
        {
          name: 'meat-api',
          url: 'https://meat-api.example.com/health',
          timeout: 5000,
        },
        {
          name: 'analytics-api',
          url: 'https://analytics.example.com/status',
          timeout: 3000,
        },
      ],
      fileSystem: {
        enabled: true,
        paths: ['.', './uploads', './logs'],
        permissions: ['read', 'write'],
      },
      memory: {
        enabled: true,
        maxUsagePercent: 85,
      },
    });

    try {
      console.log('🚀 Запуск проверки здоровья системы...\n');

      const result = await healthCheck.performAllChecks();

      console.log('\n📊 Результаты проверки:');
      console.log(`   Общий статус: ${result.status}`);
      console.log(`   Здоровых сервисов: ${result.summary.healthy}/${result.summary.total}`);

      if (result.summary.unhealthy > 0) {
        console.log('\n❌ Проблемные сервисы:');
        result.checks
          .filter(check => check.status === 'unhealthy')
          .forEach(check => {
            console.log(`   ${check.service}: ${check.error}`);
          });
      }

      if (result.summary.degraded > 0) {
        console.log('\n⚠️ Деградированные сервисы:');
        result.checks
          .filter(check => check.status === 'degraded')
          .forEach(check => {
            console.log(`   ${check.service}: ${check.error}`);
          });
      }

      console.log('\n🎉 Проверка завершена!');
    } catch (error) {
      console.error('💥 Ошибка при проверке:', error);
      process.exit(1);
    } finally {
      await healthCheck.close();
    }
  }

  main();
}
