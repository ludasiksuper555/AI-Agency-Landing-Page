#!/usr/bin/env node
/**
 * Швидкий тест для Етапу 6 - PWA та Security
 * Мінімальна версія без timeout проблем
 */

const fs = require('fs');
const path = require('path');

// Кольори для консолі
const c = {
  r: '\x1b[0m', // reset
  g: '\x1b[32m', // green
  y: '\x1b[33m', // yellow
  b: '\x1b[34m', // blue
  red: '\x1b[31m', // red
};

const log = (msg, color = 'b') => console.log(`${c[color]}${msg}${c.r}`);

// Результати тестів
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Функція тестування
function test(name, testFn) {
  try {
    const result = testFn();
    if (result) {
      log(`✅ ${name}`, 'g');
      results.passed++;
      results.tests.push({ name, status: 'PASS', details: result });
    } else {
      log(`❌ ${name}`, 'red');
      results.failed++;
      results.tests.push({ name, status: 'FAIL', details: 'Test returned false' });
    }
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name, status: 'ERROR', details: error.message });
  }
}

// Перевірка файлів
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    const stats = fs.statSync(filePath);
    return `File exists (${stats.size} bytes)`;
  }
  return false;
}

// Перевірка JSON файлу
function checkJsonFile(filePath, requiredFields = []) {
  if (!fs.existsSync(filePath)) return false;

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const missingFields = requiredFields.filter(field => !content[field]);

    if (missingFields.length > 0) {
      return `Missing fields: ${missingFields.join(', ')}`;
    }

    return `Valid JSON with ${Object.keys(content).length} fields`;
  } catch (error) {
    return false;
  }
}

// Перевірка package.json
function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) return false;

  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const pwaScripts = ['build', 'start', 'dev'];
    const hasScripts = pwaScripts.some(script => pkg.scripts && pkg.scripts[script]);

    return hasScripts ? `Package.json valid with scripts` : false;
  } catch (error) {
    return false;
  }
}

// Основні тести
log('🚀 Запуск швидких тестів Етапу 6', 'b');
log('=' * 50, 'y');

// Security Tests
log('\n🔒 SECURITY TESTS', 'b');
test('TC-SEC-001: Package.json exists', () => checkPackageJson());
test('TC-SEC-002: .env.example exists', () => checkFile('.env.example', 'Environment template'));
test('TC-SEC-003: Security config exists', () =>
  checkFile('security.config.js', 'Security configuration'));
test('TC-SEC-004: Middleware exists', () => checkFile('middleware.ts', 'Next.js middleware'));

// PWA Tests
log('\n📱 PWA TESTS', 'b');
test('TC-PWA-001: PWA Manifest exists', () =>
  checkJsonFile('public/manifest.json', ['name', 'short_name', 'start_url']));
test('TC-PWA-002: Service Worker exists', () => checkFile('public/sw.js', 'Service Worker'));
test('TC-PWA-003: PWA Install Component', () =>
  checkFile('components/PWAInstallPrompt.tsx', 'PWA Install Component'));
test('TC-PWA-004: PWA Icons directory', () => checkFile('public/icons', 'PWA Icons'));
test('TC-PWA-005: Offline page exists', () =>
  checkFile('pages/offline.tsx', 'Offline page') || checkFile('pages/offline.js', 'Offline page'));

// Configuration Tests
log('\n⚙️ CONFIGURATION TESTS', 'b');
test('TC-CFG-001: Next.js config', () => checkFile('next.config.js', 'Next.js configuration'));
test('TC-CFG-002: TypeScript config', () => checkFile('tsconfig.json', 'TypeScript configuration'));
test('TC-CFG-003: Tailwind config', () =>
  checkFile('tailwind.config.js', 'Tailwind configuration'));
test('TC-CFG-004: ESLint config', () =>
  checkFile('.eslintrc.js', 'ESLint configuration') ||
  checkFile('.eslintrc.json', 'ESLint configuration'));

// Documentation Tests
log('\n📚 DOCUMENTATION TESTS', 'b');
test('TC-DOC-001: README exists', () => checkFile('README.md', 'Main README'));
test('TC-DOC-002: PWA Setup Guide', () => checkFile('PWA_SECURITY_SETUP.md', 'PWA Setup Guide'));
test('TC-DOC-003: Testing Plan', () => checkFile('STAGE_6_TESTING_PLAN.md', 'Testing Plan'));
test('TC-DOC-004: Manual Testing Guide', () =>
  checkFile('manual-pwa-testing-guide.md', 'Manual Testing Guide'));

// Результати
log('\n📊 РЕЗУЛЬТАТИ ТЕСТУВАННЯ', 'b');
log('=' * 50, 'y');
log(`Всього тестів: ${results.passed + results.failed}`, 'b');
log(`Пройдено: ${results.passed}`, 'g');
log(`Провалено: ${results.failed}`, results.failed > 0 ? 'red' : 'g');

const successRate = Math.round((results.passed / (results.passed + results.failed)) * 100);
log(`Відсоток успіху: ${successRate}%`, successRate >= 80 ? 'g' : 'y');

// Збереження результатів
const reportData = {
  timestamp: new Date().toISOString(),
  summary: {
    total: results.passed + results.failed,
    passed: results.passed,
    failed: results.failed,
    successRate: successRate,
  },
  tests: results.tests,
};

// Збереження JSON звіту
fs.writeFileSync('quick-test-results.json', JSON.stringify(reportData, null, 2));
log('\n💾 Звіт збережено: quick-test-results.json', 'b');

// Збереження Markdown звіту
const mdReport = `# Швидкий Тест Етапу 6 - Результати

**Дата:** ${new Date().toLocaleString('uk-UA')}

## Підсумок
- **Всього тестів:** ${reportData.summary.total}
- **Пройдено:** ${reportData.summary.passed} ✅
- **Провалено:** ${reportData.summary.failed} ❌
- **Відсоток успіху:** ${reportData.summary.successRate}%

## Детальні Результати

${results.tests
  .map(
    test =>
      `### ${test.status === 'PASS' ? '✅' : '❌'} ${test.name}
**Статус:** ${test.status}
**Деталі:** ${test.details}
`
  )
  .join('\n')}

## Рекомендації

${
  results.failed > 0
    ? '⚠️ **Є провалені тести!** Перевірте відсутні файли та конфігурації.'
    : '🎉 **Всі базові тести пройдені!** Можна переходити до ручного тестування.'
}

---
*Згенеровано автоматично: ${new Date().toISOString()}*
`;

fs.writeFileSync('quick-test-report.md', mdReport);
log('💾 Markdown звіт збережено: quick-test-report.md', 'b');

// Фінальний статус
if (results.failed === 0) {
  log('\n🎉 ВСІ ТЕСТИ ПРОЙДЕНІ!', 'g');
  process.exit(0);
} else {
  log('\n⚠️ Є провалені тести. Перевірте конфігурацію.', 'y');
  process.exit(1);
}
