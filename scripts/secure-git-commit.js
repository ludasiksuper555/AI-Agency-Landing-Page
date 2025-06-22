/**
 * Скрипт для безпечного коміту та пушу згідно з вимогами ISO 27001
 *
 * Цей скрипт забезпечує:
 * - Перевірку на наявність чутливих даних у комітах
 * - Підписання комітів за допомогою GPG
 * - Логування дій для аудиту
 * - Перевірку на відповідність вимогам ISO 27001
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { logSecurityEvent } = require('../src/utils/audit-logger');
const { checkISO27001Compliance } = require('../src/utils/security-utils');

// Завантаження конфігурації
let CONFIG = {};
try {
  const configPath = path.join(__dirname, 'git-security-config.json');
  if (fs.existsSync(configPath)) {
    CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ Конфігурацію безпеки завантажено');
  } else {
    console.warn('⚠️ Файл конфігурації не знайдено. Використовуються значення за замовчуванням.');
  }
} catch (error) {
  console.error('❌ Помилка при завантаженні конфігурації:', error.message);
}

// Шаблони для пошуку чутливих даних
const SENSITIVE_PATTERNS = CONFIG.iso27001?.sensitiveDataPatterns?.map(
  item => new RegExp(item.pattern)
) || [
  /(password|passwd|pwd)\s*[:=]\s*['"](.*?)['"]/, // Паролі
  /(api[_-]?key|apikey|api[_-]?token)\s*[:=]\s*['"](.*?)['"]/, // API ключі
  /(access[_-]?token|accesstoken|refresh[_-]?token)\s*[:=]\s*['"](.*?)['"]/, // Токени доступу
  /-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY-----/, // Приватні ключі
  /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/, // AWS ключі
  /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36}/, // GitHub токени
];

/**
 * Перевіряє файли на наявність чутливих даних
 * @param {Array<string>} files - Список файлів для перевірки
 * @returns {Array<Object>} - Список знайдених проблем
 */
function checkForSensitiveData(files) {
  const issues = [];

  for (const file of files) {
    try {
      // Пропускаємо бінарні файли та файли, які не існують
      if (!fs.existsSync(file) || isBinaryFile(file)) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.test(line)) {
            issues.push({
              file,
              line: i + 1,
              pattern: pattern.toString(),
              snippet: line.trim(),
            });
          }
        }
      }
    } catch (error) {
      console.error(`Помилка при перевірці файлу ${file}:`, error.message);
    }
  }

  return issues;
}

/**
 * Перевіряє, чи є файл бінарним
 * @param {string} filePath - Шлях до файлу
 * @returns {boolean} - true, якщо файл бінарний
 */
function isBinaryFile(filePath) {
  try {
    const buffer = Buffer.alloc(4096);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);

    // Перевіряємо наявність нульових байтів, що є ознакою бінарного файлу
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Помилка при перевірці бінарності файлу ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Отримує список змінених файлів
 * @returns {Array<string>} - Список змінених файлів
 */
function getChangedFiles() {
  try {
    const output = execSync('git diff --cached --name-only').toString();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Помилка при отриманні списку змінених файлів:', error.message);
    return [];
  }
}

/**
 * Перевіряє, чи налаштовано GPG для підписання комітів
 * @returns {boolean} - true, якщо GPG налаштовано
 */
function isGpgConfigured() {
  try {
    const output = execSync('git config --get user.signingkey').toString().trim();
    return !!output;
  } catch (error) {
    return false;
  }
}

/**
 * Виконує коміт з підписанням GPG, якщо налаштовано
 * @param {string} message - Повідомлення коміту
 * @returns {boolean} - true, якщо коміт успішний
 */
function commitChanges(message) {
  try {
    // Перевірка довжини повідомлення коміту
    const minLength = CONFIG.git?.minCommitMessageLength || 10;
    if (CONFIG.git?.requireCommitMessage && message.length < minLength) {
      console.error(
        `❌ Повідомлення коміту занадто коротке. Мінімальна довжина: ${minLength} символів`
      );
      return false;
    }

    // Перевірка на відповідність шаблону
    if (CONFIG.git?.commitMessageTemplate && CONFIG.git?.requireCommitMessage) {
      const templatePattern = /^\[\w+\]:.+/;
      if (!templatePattern.test(message)) {
        console.warn(
          `⚠️ Повідомлення коміту не відповідає рекомендованому шаблону: ${CONFIG.git.commitMessageTemplate}`
        );
        // Тут можна додати запит на підтвердження, якщо потрібно блокувати коміти з неправильним форматом
      }
    }

    const useGpg = isGpgConfigured();
    const forceGpg = CONFIG.git?.requireGpgSign || false;

    if (forceGpg && !useGpg) {
      console.error(
        '❌ Налаштування вимагають підписання комітів за допомогою GPG, але GPG не налаштовано'
      );
      console.log('Для налаштування GPG виконайте команди:');
      console.log('  gpg --full-generate-key');
      console.log('  gpg --list-secret-keys --keyid-format=long');
      console.log('  git config --global user.signingkey YOUR_KEY_ID');
      console.log('  git config --global commit.gpgsign true');
      return false;
    }

    const commitCommand = useGpg ? `git commit -S -m "${message}"` : `git commit -m "${message}"`;

    execSync(commitCommand);

    logSecurityEvent({
      eventType: 'GIT_COMMIT',
      status: 'SUCCESS',
      service: 'secure-git-commit',
      details: `Commit created${useGpg ? ' with GPG signature' : ''}: ${message}`,
    });

    return true;
  } catch (error) {
    logSecurityEvent({
      eventType: 'GIT_COMMIT',
      status: 'ERROR',
      service: 'secure-git-commit',
      details: `Failed to commit: ${error.message}`,
    });

    console.error('Помилка при створенні коміту:', error.message);
    return false;
  }
}

/**
 * Виконує push до віддаленого репозиторію
 * @param {string} branch - Гілка для push
 * @returns {boolean} - true, якщо push успішний
 */
function pushChanges(branch = '') {
  try {
    const pushCommand = branch ? `git push origin ${branch}` : 'git push';
    execSync(pushCommand);

    logSecurityEvent({
      eventType: 'GIT_PUSH',
      status: 'SUCCESS',
      service: 'secure-git-commit',
      details: `Successfully pushed to ${branch || 'current branch'}`,
    });

    return true;
  } catch (error) {
    logSecurityEvent({
      eventType: 'GIT_PUSH',
      status: 'ERROR',
      service: 'secure-git-commit',
      details: `Failed to push: ${error.message}`,
    });

    console.error('Помилка при виконанні push:', error.message);
    return false;
  }
}

/**
 * Перевіряє відповідність процесу коміту вимогам ISO 27001
 * @returns {Object} - Результат перевірки
 */
function checkIso27001Compliance() {
  return checkISO27001Compliance(
    CONFIG.iso27001?.requirements || {
      dataEncryption: true,
      accessControl: true,
      auditLogging: true,
      incidentResponse: true,
    }
  );
}

/**
 * Головна функція для безпечного коміту та пушу
 * @param {Object} options - Опції
 * @param {string} options.message - Повідомлення коміту
 * @param {string} options.branch - Гілка для push
 * @param {boolean} options.skipSensitiveDataCheck - Пропустити перевірку на чутливі дані
 * @param {boolean} options.skipPush - Пропустити push
 */
async function secureCommitAndPush(options = {}) {
  const { message = '', branch = '', skipSensitiveDataCheck = false, skipPush = false } = options;

  if (!message) {
    console.error('Помилка: Необхідно вказати повідомлення коміту');
    process.exit(1);
  }

  // Перевірка відповідності ISO 27001
  const complianceCheck = checkIso27001Compliance();
  if (!complianceCheck.compliant) {
    console.warn('Попередження: Не всі вимоги ISO 27001 виконані:');
    complianceCheck.issues.forEach(issue => console.warn(`- ${issue}`));
    console.warn('Рекомендації:');
    complianceCheck.recommendations.forEach(rec => console.warn(`- ${rec}`));
  }

  // Отримання змінених файлів
  const changedFiles = getChangedFiles();
  if (changedFiles.length === 0) {
    console.error('Помилка: Немає змін для коміту');
    process.exit(1);
  }

  // Перевірка на чутливі дані
  if (!skipSensitiveDataCheck) {
    const issues = checkForSensitiveData(changedFiles);
    if (issues.length > 0) {
      console.error('❌ Помилка: Знайдено потенційно чутливі дані:');
      issues.forEach(issue => {
        console.error(`Файл: ${issue.file}, Рядок: ${issue.line}`);
        console.error(`Фрагмент: ${issue.snippet}`);
        console.error('---');
      });

      logSecurityEvent({
        eventType: 'SENSITIVE_DATA_DETECTED',
        status: 'WARNING',
        service: 'secure-git-commit',
        details: `Sensitive data detected in ${issues.length} places`,
      });

      // Перевірка налаштувань блокування при виявленні чутливих даних
      const blockOnSensitiveData = CONFIG.security?.blockPushOnSensitiveData || false;

      if (blockOnSensitiveData) {
        console.error(
          '❌ Коміт скасовано через виявлення чутливих даних (згідно з налаштуваннями безпеки)'
        );
        console.log('Будь ласка, видаліть чутливі дані перед повторною спробою коміту');
        process.exit(1);
      } else {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise(resolve => {
          readline.question(
            'Продовжити коміт, незважаючи на знайдені чутливі дані? (y/N): ',
            resolve
          );
        });

        readline.close();

        if (answer.toLowerCase() !== 'y') {
          console.log('Коміт скасовано');
          process.exit(1);
        }
      }
    }
  }

  // Виконання коміту
  const commitSuccess = commitChanges(message);
  if (!commitSuccess) {
    process.exit(1);
  }

  // Виконання push, якщо потрібно
  if (!skipPush) {
    const pushSuccess = pushChanges(branch);
    if (!pushSuccess) {
      process.exit(1);
    }
  }

  console.log('Операція успішно завершена');
}

// Якщо скрипт запущено напряму
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    message: '',
    branch: '',
    skipSensitiveDataCheck: false,
    skipPush: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-m' || arg === '--message') {
      options.message = args[++i];
    } else if (arg === '-b' || arg === '--branch') {
      options.branch = args[++i];
    } else if (arg === '--skip-sensitive-check') {
      options.skipSensitiveDataCheck = true;
    } else if (arg === '--skip-push') {
      options.skipPush = true;
    } else if (arg === '-h' || arg === '--help') {
      console.log(`
Використання: node secure-git-commit.js [опції]

Опції:
  -m, --message <повідомлення>    Повідомлення коміту (обов'язково)
  -b, --branch <гілка>            Гілка для push
  --skip-sensitive-check          Пропустити перевірку на чутливі дані
  --skip-push                     Пропустити push
  -h, --help                      Показати цю довідку
`);
      process.exit(0);
    }
  }

  secureCommitAndPush(options).catch(error => {
    console.error('Помилка при виконанні скрипту:', error.message);
    process.exit(1);
  });
}

module.exports = {
  secureCommitAndPush,
  checkForSensitiveData,
  commitChanges,
  pushChanges,
  checkIso27001Compliance,
};
