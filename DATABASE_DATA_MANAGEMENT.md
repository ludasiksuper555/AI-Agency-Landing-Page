# 🗄️ Database и Data Management

**Приоритет**: ⚡ Высокий
**Время выполнения**: 2 часа
**Статус**: Критично для production

---

## 📋 Цели компонента

1. Настройка миграций базы данных
2. Реализация backup стратегии
3. Проверка целостности данных
4. Мониторинг производительности БД

---

## 🔄 Миграции базы данных

### Структура миграций

```bash
# Создание директории для миграций
mkdir -p database/migrations
mkdir -p database/seeds
mkdir -p database/schemas
```

### Файлы миграций

**database/migrations/001_initial_schema.sql**:

```sql
-- Создание основных таблиц
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);
```

### Скрипт миграций

**database/migrate.js**:

```javascript
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

class DatabaseMigrator {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString });
  }

  async createMigrationsTable() {
    const query = `
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
    await this.pool.query(query);
  }

  async getAppliedMigrations() {
    const result = await this.pool.query('SELECT version FROM schema_migrations ORDER BY version');
    return result.rows.map(row => row.version);
  }

  async applyMigration(version, sql) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await client.query('COMMIT');
      console.log(`✅ Migration ${version} applied successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration ${version} failed:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async runMigrations() {
    await this.createMigrationsTable();
    const appliedMigrations = await this.getAppliedMigrations();

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const version = path.basename(file, '.sql');

      if (!appliedMigrations.includes(version)) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await this.applyMigration(version, sql);
      } else {
        console.log(`⏭️ Migration ${version} already applied`);
      }
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = DatabaseMigrator;
```

---

## 💾 Backup стратегия

### Автоматические backup'ы

**scripts/backup-database.js**:

```javascript
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class DatabaseBackup {
  constructor(config) {
    this.config = config;
    this.backupDir = path.join(process.cwd(), 'backups', 'database');
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);

    const command = `pg_dump ${this.config.connectionString} > "${backupFile}"`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Backup failed:', error.message);
          reject(error);
        } else {
          console.log(`✅ Backup created: ${backupFile}`);
          resolve(backupFile);
        }
      });
    });
  }

  async cleanOldBackups(retentionDays = 7) {
    const files = fs.readdirSync(this.backupDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removed old backup: ${file}`);
      }
    }
  }

  async restoreBackup(backupFile) {
    const command = `psql ${this.config.connectionString} < "${backupFile}"`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Restore failed:', error.message);
          reject(error);
        } else {
          console.log(`✅ Database restored from: ${backupFile}`);
          resolve();
        }
      });
    });
  }
}

module.exports = DatabaseBackup;
```

### Cron задача для backup'ов

**scripts/setup-backup-cron.js**:

```javascript
const cron = require('node-cron');
const DatabaseBackup = require('./backup-database');

const config = {
  connectionString: process.env.DATABASE_URL,
};

const backup = new DatabaseBackup(config);

// Ежедневный backup в 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🔄 Starting scheduled database backup...');
  try {
    await backup.createBackup();
    await backup.cleanOldBackups(7); // Хранить 7 дней
    console.log('✅ Scheduled backup completed');
  } catch (error) {
    console.error('❌ Scheduled backup failed:', error);
  }
});

console.log('📅 Database backup scheduler started');
```

---

## 🔍 Проверка целостности данных

### Валидация данных

**lib/database/dataIntegrity.js**:

```javascript
class DataIntegrityChecker {
  constructor(pool) {
    this.pool = pool;
  }

  async checkUserDataIntegrity() {
    const checks = [];

    // Проверка дублирующихся email'ов
    const duplicateEmails = await this.pool.query(`
            SELECT email, COUNT(*) as count
            FROM users
            GROUP BY email
            HAVING COUNT(*) > 1
        `);

    if (duplicateEmails.rows.length > 0) {
      checks.push({
        type: 'DUPLICATE_EMAILS',
        severity: 'HIGH',
        count: duplicateEmails.rows.length,
        data: duplicateEmails.rows,
      });
    }

    // Проверка orphaned sessions
    const orphanedSessions = await this.pool.query(`
            SELECT COUNT(*) as count
            FROM user_sessions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE u.id IS NULL
        `);

    if (orphanedSessions.rows[0].count > 0) {
      checks.push({
        type: 'ORPHANED_SESSIONS',
        severity: 'MEDIUM',
        count: orphanedSessions.rows[0].count,
      });
    }

    // Проверка истекших сессий
    const expiredSessions = await this.pool.query(`
            SELECT COUNT(*) as count
            FROM user_sessions
            WHERE expires_at < NOW()
        `);

    if (expiredSessions.rows[0].count > 0) {
      checks.push({
        type: 'EXPIRED_SESSIONS',
        severity: 'LOW',
        count: expiredSessions.rows[0].count,
      });
    }

    return checks;
  }

  async fixDataIntegrityIssues() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Удаление orphaned sessions
      const orphanedResult = await client.query(`
                DELETE FROM user_sessions s
                WHERE NOT EXISTS (
                    SELECT 1 FROM users u WHERE u.id = s.user_id
                )
            `);

      // Удаление истекших сессий
      const expiredResult = await client.query(`
                DELETE FROM user_sessions
                WHERE expires_at < NOW()
            `);

      await client.query('COMMIT');

      return {
        orphanedSessionsRemoved: orphanedResult.rowCount,
        expiredSessionsRemoved: expiredResult.rowCount,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async generateIntegrityReport() {
    const issues = await this.checkUserDataIntegrity();
    const timestamp = new Date().toISOString();

    const report = {
      timestamp,
      totalIssues: issues.length,
      highSeverityIssues: issues.filter(i => i.severity === 'HIGH').length,
      mediumSeverityIssues: issues.filter(i => i.severity === 'MEDIUM').length,
      lowSeverityIssues: issues.filter(i => i.severity === 'LOW').length,
      issues,
    };

    return report;
  }
}

module.exports = DataIntegrityChecker;
```

---

## 📊 Мониторинг производительности БД

### Метрики производительности

**lib/database/performanceMonitor.js**:

```javascript
class DatabasePerformanceMonitor {
  constructor(pool) {
    this.pool = pool;
    this.metrics = {
      queryTimes: [],
      connectionCount: 0,
      slowQueries: [],
    };
  }

  async getConnectionStats() {
    const result = await this.pool.query(`
            SELECT
                count(*) as total_connections,
                count(*) FILTER (WHERE state = 'active') as active_connections,
                count(*) FILTER (WHERE state = 'idle') as idle_connections
            FROM pg_stat_activity
            WHERE datname = current_database()
        `);

    return result.rows[0];
  }

  async getSlowQueries(threshold = 1000) {
    const result = await this.pool.query(
      `
            SELECT
                query,
                mean_exec_time,
                calls,
                total_exec_time
            FROM pg_stat_statements
            WHERE mean_exec_time > $1
            ORDER BY mean_exec_time DESC
            LIMIT 10
        `,
      [threshold]
    );

    return result.rows;
  }

  async getTableSizes() {
    const result = await this.pool.query(`
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        `);

    return result.rows;
  }

  async getIndexUsage() {
    const result = await this.pool.query(`
            SELECT
                schemaname,
                tablename,
                indexname,
                idx_tup_read,
                idx_tup_fetch
            FROM pg_stat_user_indexes
            ORDER BY idx_tup_read DESC
        `);

    return result.rows;
  }

  async generatePerformanceReport() {
    const [connectionStats, slowQueries, tableSizes, indexUsage] = await Promise.all([
      this.getConnectionStats(),
      this.getSlowQueries(),
      this.getTableSizes(),
      this.getIndexUsage(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      connectionStats,
      slowQueries,
      tableSizes,
      indexUsage,
      recommendations: this.generateRecommendations({
        connectionStats,
        slowQueries,
        tableSizes,
      }),
    };
  }

  generateRecommendations(data) {
    const recommendations = [];

    if (data.connectionStats.active_connections > 50) {
      recommendations.push({
        type: 'HIGH_CONNECTION_COUNT',
        message: 'Consider implementing connection pooling',
        priority: 'HIGH',
      });
    }

    if (data.slowQueries.length > 5) {
      recommendations.push({
        type: 'SLOW_QUERIES',
        message: 'Optimize slow queries or add indexes',
        priority: 'MEDIUM',
      });
    }

    const largeTables = data.tableSizes.filter(t => t.size_bytes > 100 * 1024 * 1024);
    if (largeTables.length > 0) {
      recommendations.push({
        type: 'LARGE_TABLES',
        message: 'Consider partitioning large tables',
        priority: 'LOW',
      });
    }

    return recommendations;
  }
}

module.exports = DatabasePerformanceMonitor;
```

---

## 🚀 Команды для выполнения

```bash
# Установка зависимостей
npm install pg node-cron

# Запуск миграций
node database/migrate.js

# Создание backup'а
node scripts/backup-database.js

# Проверка целостности данных
node scripts/check-data-integrity.js

# Мониторинг производительности
node scripts/monitor-database-performance.js
```

---

## ✅ Критерии успеха

- [ ] Миграции настроены и работают
- [ ] Автоматические backup'ы настроены
- [ ] Проверка целостности данных реализована
- [ ] Мониторинг производительности активен
- [ ] Все скрипты протестированы
- [ ] Документация создана

---

## 📈 Метрики

- **Время восстановления**: < 15 минут
- **Частота backup'ов**: Ежедневно
- **Retention period**: 7 дней
- **Максимальное время запроса**: < 1 секунда
- **Доступность БД**: 99.9%
