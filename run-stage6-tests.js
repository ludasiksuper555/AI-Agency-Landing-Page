#!/usr/bin/env node
/**
 * Автоматизований запуск тест-кейсів для Етапу 6: PWA та Безпека
 *
 * Використання:
 * node run-stage6-tests.js
 *
 * або
 *
 * npm run test:stage6
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Кольори для консолі
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Логування з кольорами
const log = {
  info: msg => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  header: msg => console.log(`${colors.magenta}🚀 ${msg}${colors.reset}`),
};

// Результати тестів
const testResults = {
  security: {},
  pwa: {},
  integration: {},
  metrics: {},
};

// Функція для виконання команд
function runCommand(command, description) {
  log.info(`Виконання: ${description}`);
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    log.success(`${description} - ПРОЙДЕНО`);
    return { success: true, output: result };
  } catch (error) {
    log.error(`${description} - ПРОВАЛЕНО: ${error.message}`);
    return { success: false, error: error.message, output: error.stdout };
  }
}

// Перевірка наявності файлів
function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log.success(`${description} - файл існує`);
    return true;
  } else {
    log.error(`${description} - файл не знайдено: ${filePath}`);
    return false;
  }
}

// TC-SEC-001: Аудит безпеки залежностей
function testSecurityAudit() {
  log.header('TC-SEC-001: Аудит Безпеки Залежностей');

  // Перевірка package.json
  if (!checkFileExists('package.json', 'package.json')) {
    testResults.security['TC-SEC-001'] = { success: false, reason: 'package.json не знайдено' };
    return;
  }

  // Запуск npm audit
  const auditResult = runCommand('npm audit --audit-level=high', 'npm audit (high level)');

  if (auditResult.success) {
    // Перевірка на критичні уязвимості
    const criticalVulns =
      auditResult.output.includes('critical') || auditResult.output.includes('high');
    if (!criticalVulns) {
      testResults.security['TC-SEC-001'] = {
        success: true,
        details: 'Немає критичних уязвимостей',
      };
    } else {
      testResults.security['TC-SEC-001'] = {
        success: false,
        reason: 'Знайдено критичні уязвимості',
      };
    }
  } else {
    testResults.security['TC-SEC-001'] = { success: false, reason: auditResult.error };
  }
}

// TC-SEC-002: Перевірка CSP файлів
function testCSPConfiguration() {
  log.header('TC-SEC-002: Перевірка CSP Конфігурації');

  const securityFiles = ['middleware.ts', 'middleware/security.ts', 'next.config.js'];

  let cspConfigFound = false;

  securityFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('Content-Security-Policy') || content.includes('CSP')) {
        log.success(`CSP конфігурація знайдена в ${file}`);
        cspConfigFound = true;
      }
    }
  });

  // Перевірка .env файлу на CSP змінні
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const cspVars = ['CSP_SCRIPT_SRC', 'CSP_STYLE_SRC', 'CSP_FONT_SRC', 'CSP_IMG_SRC'];

    const foundVars = cspVars.filter(varName => envContent.includes(varName));
    if (foundVars.length > 0) {
      log.success(`CSP змінні знайдені в .env: ${foundVars.join(', ')}`);
      cspConfigFound = true;
    }
  }

  testResults.security['TC-SEC-002'] = {
    success: cspConfigFound,
    details: cspConfigFound ? 'CSP конфігурація присутня' : 'CSP конфігурація не знайдена',
  };
}

// TC-SEC-003: Rate Limiting
function testRateLimiting() {
  log.header('TC-SEC-003: Rate Limiting Конфігурація');

  const rateLimitFiles = [
    'middleware/rateLimiting.ts',
    'lib/rateLimiting.ts',
    'pages/api/middleware.ts',
  ];

  let rateLimitFound = false;

  rateLimitFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('rate') && (content.includes('limit') || content.includes('throttle'))) {
        log.success(`Rate limiting знайдено в ${file}`);
        rateLimitFound = true;
      }
    }
  });

  // Перевірка package.json на rate limiting залежності
  if (fs.existsSync('package.json')) {
    const packageContent = fs.readFileSync('package.json', 'utf8');
    const rateLimitDeps = ['express-rate-limit', 'rate-limiter-flexible', 'bottleneck'];

    const foundDeps = rateLimitDeps.filter(dep => packageContent.includes(dep));
    if (foundDeps.length > 0) {
      log.success(`Rate limiting залежності: ${foundDeps.join(', ')}`);
      rateLimitFound = true;
    }
  }

  testResults.security['TC-SEC-003'] = {
    success: rateLimitFound,
    details: rateLimitFound ? 'Rate limiting налаштовано' : 'Rate limiting не знайдено',
  };
}

// TC-PWA-001: Service Worker
function testServiceWorker() {
  log.header('TC-PWA-001: Service Worker Перевірка');

  const swFiles = ['public/sw.js', 'public/service-worker.js', 'sw.js'];

  let swFound = false;

  swFiles.forEach(file => {
    if (checkFileExists(file, `Service Worker (${file})`)) {
      swFound = true;

      // Перевірка вмісту Service Worker
      const swContent = fs.readFileSync(file, 'utf8');
      const features = {
        caching: swContent.includes('cache') || swContent.includes('Cache'),
        offline: swContent.includes('offline') || swContent.includes('fetch'),
        backgroundSync: swContent.includes('sync') || swContent.includes('background'),
        pushNotifications: swContent.includes('push') || swContent.includes('notification'),
      };

      Object.entries(features).forEach(([feature, found]) => {
        if (found) {
          log.success(`Service Worker підтримує: ${feature}`);
        } else {
          log.warning(`Service Worker не підтримує: ${feature}`);
        }
      });
    }
  });

  testResults.pwa['TC-PWA-001'] = {
    success: swFound,
    details: swFound ? 'Service Worker знайдено' : 'Service Worker не знайдено',
  };
}

// TC-PWA-002: Web App Manifest
function testWebAppManifest() {
  log.header('TC-PWA-002: Web App Manifest Перевірка');

  const manifestFiles = ['public/manifest.json', 'public/site.webmanifest', 'manifest.json'];

  let manifestFound = false;

  manifestFiles.forEach(file => {
    if (checkFileExists(file, `Manifest (${file})`)) {
      manifestFound = true;

      try {
        const manifestContent = JSON.parse(fs.readFileSync(file, 'utf8'));

        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = requiredFields.filter(field => !manifestContent[field]);

        if (missingFields.length === 0) {
          log.success("Всі обов'язкові поля manifest присутні");

          // Перевірка іконок
          if (manifestContent.icons && manifestContent.icons.length > 0) {
            log.success(`Знайдено ${manifestContent.icons.length} іконок`);

            const iconSizes = manifestContent.icons.map(icon => icon.sizes).join(', ');
            log.info(`Розміри іконок: ${iconSizes}`);
          }
        } else {
          log.error(`Відсутні поля в manifest: ${missingFields.join(', ')}`);
        }
      } catch (error) {
        log.error(`Помилка парсингу manifest: ${error.message}`);
        manifestFound = false;
      }
    }
  });

  testResults.pwa['TC-PWA-002'] = {
    success: manifestFound,
    details: manifestFound
      ? 'Web App Manifest валідний'
      : 'Web App Manifest не знайдено або невалідний',
  };
}

// TC-PWA-003: PWA Компоненти
function testPWAComponents() {
  log.header('TC-PWA-003: PWA Компоненти Перевірка');

  const pwaComponents = [
    'components/PWAInstallPrompt.tsx',
    'hooks/usePWA.ts',
    'hooks/usePWA.tsx',
    'pages/offline.tsx',
    'pages/share.tsx',
  ];

  let componentsFound = 0;

  pwaComponents.forEach(component => {
    if (checkFileExists(component, `PWA компонент (${component})`)) {
      componentsFound++;
    }
  });

  // Перевірка _app.tsx на інтеграцію PWA
  if (fs.existsSync('pages/_app.tsx')) {
    const appContent = fs.readFileSync('pages/_app.tsx', 'utf8');
    if (appContent.includes('PWA') || appContent.includes('usePWA')) {
      log.success('PWA інтегровано в _app.tsx');
      componentsFound++;
    }
  }

  const success = componentsFound >= 3; // Мінімум 3 компоненти

  testResults.pwa['TC-PWA-003'] = {
    success,
    details: `Знайдено ${componentsFound} PWA компонентів`,
  };
}

// TC-PWA-004: Офлайн сторінки
function testOfflinePages() {
  log.header('TC-PWA-004: Офлайн Сторінки Перевірка');

  const offlineFiles = ['pages/offline.tsx', 'pages/offline.js', 'public/offline.html'];

  let offlineFound = false;

  offlineFiles.forEach(file => {
    if (checkFileExists(file, `Офлайн сторінка (${file})`)) {
      offlineFound = true;
    }
  });

  testResults.pwa['TC-PWA-004'] = {
    success: offlineFound,
    details: offlineFound ? 'Офлайн сторінка знайдена' : 'Офлайн сторінка не знайдена',
  };
}

// Генерація звіту
function generateReport() {
  log.header('📊 ГЕНЕРАЦІЯ ЗВІТУ ТЕСТУВАННЯ');

  const report = {
    timestamp: new Date().toISOString(),
    stage: 'Stage 6: PWA та Безпека',
    results: testResults,
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
    },
  };

  // Підрахунок статистики
  Object.values(testResults).forEach(category => {
    Object.values(category).forEach(test => {
      report.summary.total++;
      if (test.success) {
        report.summary.passed++;
      } else {
        report.summary.failed++;
      }
    });
  });

  report.summary.passRate = Math.round((report.summary.passed / report.summary.total) * 100);

  // Збереження звіту
  const reportPath = 'STAGE_6_TEST_REPORT.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Генерація Markdown звіту
  const markdownReport = generateMarkdownReport(report);
  fs.writeFileSync('STAGE_6_TEST_REPORT.md', markdownReport);

  // Виведення результатів
  console.log('\n' + '='.repeat(60));
  log.header('РЕЗУЛЬТАТИ ТЕСТУВАННЯ ЕТАПУ 6');
  console.log('='.repeat(60));

  console.log(`\n📊 Загальна статистика:`);
  console.log(`   Всього тестів: ${report.summary.total}`);
  console.log(`   Пройдено: ${colors.green}${report.summary.passed}${colors.reset}`);
  console.log(`   Провалено: ${colors.red}${report.summary.failed}${colors.reset}`);
  console.log(
    `   Відсоток успіху: ${report.summary.passRate >= 80 ? colors.green : colors.red}${report.summary.passRate}%${colors.reset}`
  );

  console.log(`\n🔒 Безпека:`);
  Object.entries(testResults.security).forEach(([testId, result]) => {
    const status = result.success
      ? `${colors.green}✅ ПРОЙДЕНО${colors.reset}`
      : `${colors.red}❌ ПРОВАЛЕНО${colors.reset}`;
    console.log(`   ${testId}: ${status} - ${result.details || result.reason}`);
  });

  console.log(`\n📱 PWA:`);
  Object.entries(testResults.pwa).forEach(([testId, result]) => {
    const status = result.success
      ? `${colors.green}✅ ПРОЙДЕНО${colors.reset}`
      : `${colors.red}❌ ПРОВАЛЕНО${colors.reset}`;
    console.log(`   ${testId}: ${status} - ${result.details || result.reason}`);
  });

  console.log(`\n📄 Звіти збережено:`);
  console.log(`   JSON: ${reportPath}`);
  console.log(`   Markdown: STAGE_6_TEST_REPORT.md`);

  // Рекомендації
  if (report.summary.passRate < 100) {
    console.log(`\n💡 Рекомендації:`);
    Object.entries(testResults).forEach(([category, tests]) => {
      Object.entries(tests).forEach(([testId, result]) => {
        if (!result.success) {
          console.log(`   ${colors.yellow}⚠️${colors.reset} ${testId}: ${result.reason}`);
        }
      });
    });
  }

  console.log('\n' + '='.repeat(60));

  return report;
}

// Генерація Markdown звіту
function generateMarkdownReport(report) {
  return `# Звіт Тестування - Етап 6: PWA та Безпека

**Дата:** ${new Date(report.timestamp).toLocaleString('uk-UA')}
**Етап:** ${report.stage}

## 📊 Загальна Статистика

- **Всього тестів:** ${report.summary.total}
- **Пройдено:** ${report.summary.passed}
- **Провалено:** ${report.summary.failed}
- **Відсоток успіху:** ${report.summary.passRate}%

## 🔒 Результати Security Тестів

${Object.entries(report.results.security)
  .map(
    ([testId, result]) =>
      `### ${testId}
- **Статус:** ${result.success ? '✅ ПРОЙДЕНО' : '❌ ПРОВАЛЕНО'}
- **Деталі:** ${result.details || result.reason}
`
  )
  .join('\n')}

## 📱 Результати PWA Тестів

${Object.entries(report.results.pwa)
  .map(
    ([testId, result]) =>
      `### ${testId}
- **Статус:** ${result.success ? '✅ ПРОЙДЕНО' : '❌ ПРОВАЛЕНО'}
- **Деталі:** ${result.details || result.reason}
`
  )
  .join('\n')}

## 💡 Рекомендації

${Object.entries(report.results)
  .map(([category, tests]) =>
    Object.entries(tests)
      .filter(([, result]) => !result.success)
      .map(([testId, result]) => `- **${testId}:** ${result.reason}`)
      .join('\n')
  )
  .filter(rec => rec)
  .join('\n')}

## 🎯 Наступні Кроки

1. Виправити провалені тести
2. Запустити повторне тестування
3. Перевірити інтеграцію з production
4. Провести manual тестування в браузері

---

*Звіт згенеровано автоматично*
`;
}

// Головна функція
function main() {
  console.log(`${colors.magenta}🚀 ЗАПУСК ТЕСТУВАННЯ ЕТАПУ 6: PWA ТА БЕЗПЕКА${colors.reset}`);
  console.log('='.repeat(60));

  try {
    // Блок 1: Security тести
    log.header('🔒 БЛОК 1: ТЕСТИ БЕЗПЕКИ');
    testSecurityAudit();
    testCSPConfiguration();
    testRateLimiting();

    // Блок 2: PWA тести
    log.header('📱 БЛОК 2: PWA ТЕСТИ');
    testServiceWorker();
    testWebAppManifest();
    testPWAComponents();
    testOfflinePages();

    // Генерація звіту
    const report = generateReport();

    // Визначення exit code
    const exitCode = report.summary.passRate >= 80 ? 0 : 1;

    if (exitCode === 0) {
      log.success('🎉 ТЕСТУВАННЯ ЗАВЕРШЕНО УСПІШНО!');
    } else {
      log.error('❌ ТЕСТУВАННЯ ЗАВЕРШЕНО З ПОМИЛКАМИ!');
    }

    process.exit(exitCode);
  } catch (error) {
    log.error(`Критична помилка: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск якщо файл викликається напряму
if (require.main === module) {
  main();
}

module.exports = {
  main,
  testResults,
  generateReport,
};
