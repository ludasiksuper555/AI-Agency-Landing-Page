const axios = require('axios');
const { Pool } = require('pg');
const Redis = require('redis');
const fs = require('fs');
const path = require('path');

class ServiceHealthChecker {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async checkDatabase() {
    console.log('🗄️  Проверка подключения к базе данных...');
    const start = Date.now();

    if (!process.env.DATABASE_URL) {
      return this.addResult('database', false, 'DATABASE_URL не настроен', 0);
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 5000,
    });

    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      const responseTime = Date.now() - start;

      await client.release();
      await pool.end();

      const details = {
        version: result.rows[0].pg_version.split(' ')[0],
        currentTime: result.rows[0].current_time,
        responseTime: `${responseTime}ms`,
      };

      console.log(`   ✅ PostgreSQL подключен (${responseTime}ms)`);
      return this.addResult('database', true, 'Подключение успешно', responseTime, details);
    } catch (error) {
      const responseTime = Date.now() - start;
      console.error(`   ❌ Ошибка подключения к БД: ${error.message}`);
      return this.addResult('database', false, error.message, responseTime);
    }
  }

  async checkRedis() {
    console.log('🔴 Проверка подключения к Redis...');
    const start = Date.now();

    if (!process.env.REDIS_URL) {
      return this.addResult('redis', false, 'REDIS_URL не настроен', 0);
    }

    const client = Redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        commandTimeout: 5000,
      },
    });

    try {
      await client.connect();

      const testKey = `health_check_${Date.now()}`;
      await client.set(testKey, 'test_value', { EX: 10 });
      const value = await client.get(testKey);
      await client.del(testKey);

      const info = await client.info('server');
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';

      const responseTime = Date.now() - start;

      await client.quit();

      const details = {
        version,
        operation: 'SET/GET/DEL',
        testResult: value === 'test_value' ? 'success' : 'failed',
        responseTime: `${responseTime}ms`,
      };

      console.log(`   ✅ Redis подключен (${responseTime}ms)`);
      return this.addResult('redis', true, 'Подключение успешно', responseTime, details);
    } catch (error) {
      const responseTime = Date.now() - start;
      console.error(`   ❌ Ошибка подключения к Redis: ${error.message}`);

      if (client.isOpen) {
        await client.quit().catch(() => {});
      }

      return this.addResult('redis', false, error.message, responseTime);
    }
  }

  async checkExternalAPI(name, url, timeout = 5000) {
    console.log(`🌐 Проверка внешнего API: ${name}...`);
    const start = Date.now();

    if (!url) {
      return this.addResult(name, false, 'URL не настроен', 0);
    }

    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'HealthCheck/1.0',
          Accept: 'application/json',
        },
        validateStatus: status => status < 500, // Принимаем 4xx как успех
      });

      const responseTime = Date.now() - start;

      const details = {
        statusCode: response.status,
        statusText: response.statusText,
        url,
        responseTime: `${responseTime}ms`,
        contentType: response.headers['content-type'],
      };

      if (response.status >= 200 && response.status < 400) {
        console.log(`   ✅ ${name} доступен (${response.status}, ${responseTime}ms)`);
        return this.addResult(name, true, `HTTP ${response.status}`, responseTime, details);
      } else {
        console.warn(`   ⚠️  ${name} вернул ${response.status} (${responseTime}ms)`);
        return this.addResult(name, false, `HTTP ${response.status}`, responseTime, details);
      }
    } catch (error) {
      const responseTime = Date.now() - start;
      let errorMessage = error.message;

      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Соединение отклонено';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Хост не найден';
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = 'Превышено время ожидания';
      }

      console.error(`   ❌ ${name} недоступен: ${errorMessage}`);
      return this.addResult(name, false, errorMessage, responseTime);
    }
  }

  async checkFileSystem() {
    console.log('📁 Проверка файловой системы...');
    const start = Date.now();

    try {
      const criticalPaths = ['package.json', 'next.config.js', '.env', 'pages', 'components'];

      const missing = [];
      const existing = [];

      for (const filePath of criticalPaths) {
        if (fs.existsSync(filePath)) {
          existing.push(filePath);
        } else {
          missing.push(filePath);
        }
      }

      const responseTime = Date.now() - start;

      const details = {
        existing: existing.length,
        missing: missing.length,
        missingFiles: missing,
        responseTime: `${responseTime}ms`,
      };

      if (missing.length === 0) {
        console.log(`   ✅ Все критические файлы найдены (${responseTime}ms)`);
        return this.addResult('filesystem', true, 'Все файлы на месте', responseTime, details);
      } else {
        console.warn(`   ⚠️  Отсутствуют файлы: ${missing.join(', ')}`);
        return this.addResult(
          'filesystem',
          false,
          `Отсутствуют: ${missing.join(', ')}`,
          responseTime,
          details
        );
      }
    } catch (error) {
      const responseTime = Date.now() - start;
      console.error(`   ❌ Ошибка проверки файловой системы: ${error.message}`);
      return this.addResult('filesystem', false, error.message, responseTime);
    }
  }

  addResult(service, success, message, responseTime, details = null) {
    const result = {
      service,
      success,
      message,
      responseTime,
      details,
      timestamp: new Date().toISOString(),
    };

    this.results.push(result);
    return result;
  }

  async runAllChecks() {
    console.log('🚀 Запуск проверки всех сервисов...\n');

    const checks = [
      () => this.checkFileSystem(),
      () => this.checkDatabase(),
      () => this.checkRedis(),
      () => this.checkExternalAPI('meat-api', process.env.MEAT_API_URL),
      () => this.checkExternalAPI('analytics-api', process.env.ANALYTICS_API_URL),
    ];

    for (const check of checks) {
      try {
        await check();
      } catch (error) {
        console.error(`Ошибка при выполнении проверки: ${error.message}`);
      }
    }

    return this.generateReport();
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.length - successful;

    console.log('\n📊 Отчет о проверке сервисов:');
    console.log('='.repeat(50));
    console.log(`Всего проверок: ${this.results.length}`);
    console.log(`Успешных: ${successful}`);
    console.log(`Неудачных: ${failed}`);
    console.log(`Общее время: ${totalTime}ms`);
    console.log('='.repeat(50));

    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.service}: ${result.message} (${result.responseTime}ms)`);
    });

    const report = {
      timestamp: new Date().toISOString(),
      totalTime,
      summary: {
        total: this.results.length,
        successful,
        failed,
        successRate: Math.round((successful / this.results.length) * 100),
      },
      results: this.results,
    };

    if (failed > 0) {
      console.log('\n💥 Обнаружены проблемы с сервисами!');
      console.log('Проверьте конфигурацию и доступность сервисов.');
      process.exit(1);
    } else {
      console.log('\n🎉 Все сервисы работают корректно!');
    }

    return report;
  }
}

async function main() {
  const checker = new ServiceHealthChecker();

  try {
    const report = await checker.runAllChecks();

    // Сохранение отчета
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, `health-check-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Отчет сохранен: ${reportPath}`);

    return report;
  } catch (error) {
    console.error('💥 Критическая ошибка при проверке сервисов:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ServiceHealthChecker, main };
