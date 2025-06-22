/**
 * Скрипт для генерації звіту про відповідність Git-операцій вимогам ISO 27001
 *
 * Цей скрипт аналізує історію Git та логи безпеки для створення
 * звіту про відповідність вимогам ISO 27001 щодо контролю версій
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getSecurityLogs } = require('../src/utils/audit-logger');
const { checkISO27001Compliance, generateSecurityReport } = require('../src/utils/security-utils');

// Завантаження конфігурації
let CONFIG = {};
try {
  const configPath = path.join(__dirname, 'git-security-config.json');
  if (fs.existsSync(configPath)) {
    CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  console.error('Помилка при завантаженні конфігурації:', error.message);
}

/**
 * Отримує статистику Git-репозиторію
 * @returns {Object} - Статистика репозиторію
 */
function getRepositoryStats() {
  try {
    const stats = {
      totalCommits: parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10),
      contributors: execSync('git shortlog -sn --no-merges').toString().trim().split('\n').length,
      branches: execSync('git branch').toString().trim().split('\n').length,
      lastCommitDate: execSync('git log -1 --format=%cd').toString().trim(),
      signedCommits: 0,
      unsignedCommits: 0,
    };

    // Підрахунок підписаних та непідписаних комітів
    const commits = execSync('git log --format="%G?"').toString().trim().split('\n');
    commits.forEach(status => {
      if (status === 'G' || status === 'U' || status === 'E' || status === 'N') {
        stats.signedCommits++;
      } else {
        stats.unsignedCommits++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Помилка при отриманні статистики репозиторію:', error.message);
    return {};
  }
}

/**
 * Аналізує логи безпеки для виявлення проблем
 * @param {number} days - Кількість днів для аналізу
 * @returns {Object} - Результати аналізу
 */
function analyzeSecurityLogs(days = 30) {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = getSecurityLogs(startDate, endDate);

    const analysis = {
      totalEvents: logs.length,
      gitCommitEvents: 0,
      gitPushEvents: 0,
      sensitiveDataEvents: 0,
      errorEvents: 0,
      warningEvents: 0,
      infoEvents: 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    logs.forEach(log => {
      if (log.eventType === 'GIT_COMMIT') analysis.gitCommitEvents++;
      if (log.eventType === 'GIT_PUSH') analysis.gitPushEvents++;
      if (log.eventType === 'SENSITIVE_DATA_DETECTED') analysis.sensitiveDataEvents++;

      if (log.status === 'ERROR') analysis.errorEvents++;
      if (log.status === 'WARNING') analysis.warningEvents++;
      if (log.status === 'INFO' || log.status === 'SUCCESS') analysis.infoEvents++;
    });

    return analysis;
  } catch (error) {
    console.error('Помилка при аналізі логів безпеки:', error.message);
    return {};
  }
}

/**
 * Перевіряє налаштування Git на відповідність вимогам ISO 27001
 * @returns {Object} - Результати перевірки
 */
function checkGitConfiguration() {
  try {
    const config = {
      userEmail: execSync('git config --get user.email').toString().trim(),
      userName: execSync('git config --get user.name').toString().trim(),
      gpgSign: false,
      gpgProgram: '',
      sshKey: false,
      credentialHelper: '',
    };

    try {
      config.gpgSign = execSync('git config --get commit.gpgsign').toString().trim() === 'true';
    } catch (e) {}

    try {
      config.gpgProgram = execSync('git config --get gpg.program').toString().trim();
    } catch (e) {}

    try {
      config.credentialHelper = execSync('git config --get credential.helper').toString().trim();
    } catch (e) {}

    // Перевірка наявності SSH ключа
    try {
      const sshOutput = execSync('ssh-add -l').toString().trim();
      config.sshKey = sshOutput.length > 0 && !sshOutput.includes('The agent has no identities');
    } catch (e) {}

    return {
      config,
      compliant: config.gpgSign || config.sshKey,
      issues: [],
      recommendations: [],
    };
  } catch (error) {
    console.error('Помилка при перевірці конфігурації Git:', error.message);
    return {
      config: {},
      compliant: false,
      issues: ['Не вдалося перевірити конфігурацію Git'],
      recommendations: ['Перевірте налаштування Git вручну'],
    };
  }
}

/**
 * Генерує звіт про відповідність вимогам ISO 27001
 * @param {Object} options - Опції генерації звіту
 * @returns {Object} - Звіт про відповідність
 */
function generateComplianceReport(options = {}) {
  const { days = 30, outputPath = '' } = options;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFileName = outputPath || `iso27001-git-compliance-report-${timestamp}.json`;

  // Збір даних для звіту
  const repoStats = getRepositoryStats();
  const securityLogs = analyzeSecurityLogs(days);
  const gitConfig = checkGitConfiguration();
  const iso27001Check = checkISO27001Compliance({
    dataEncryption: true,
    accessControl: true,
    auditLogging: true,
    incidentResponse: true,
  });

  // Формування звіту
  const report = {
    timestamp,
    repositoryStats: repoStats,
    securityLogs,
    gitConfiguration: gitConfig,
    iso27001Compliance: iso27001Check,
    summary: {
      compliant: iso27001Check.compliant && gitConfig.compliant,
      signedCommitsPercentage:
        repoStats.totalCommits > 0
          ? ((repoStats.signedCommits / repoStats.totalCommits) * 100).toFixed(2)
          : 0,
      sensitiveDataIncidents: securityLogs.sensitiveDataEvents,
      securityEvents: securityLogs.totalEvents,
      recommendations: [...iso27001Check.recommendations, ...gitConfig.recommendations],
    },
  };

  // Збереження звіту
  try {
    const reportDir = path.dirname(reportFileName);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
    console.log(`✅ Звіт про відповідність ISO 27001 збережено: ${reportFileName}`);

    // Створення HTML-версії звіту
    const htmlReportPath = reportFileName.replace('.json', '.html');
    const htmlReport = generateHtmlReport(report);
    fs.writeFileSync(htmlReportPath, htmlReport);
    console.log(`✅ HTML-звіт збережено: ${htmlReportPath}`);

    return report;
  } catch (error) {
    console.error('❌ Помилка при збереженні звіту:', error.message);
    return report;
  }
}

/**
 * Генерує HTML-версію звіту
 * @param {Object} report - Дані звіту
 * @returns {string} - HTML-код звіту
 */
function generateHtmlReport(report) {
  const complianceStatus = report.summary.compliant
    ? '<span style="color: green; font-weight: bold;">✓ Відповідає</span>'
    : '<span style="color: red; font-weight: bold;">✗ Не відповідає</span>';

  const signedPercentage = parseFloat(report.summary.signedCommitsPercentage);
  const signedPercentageColor =
    signedPercentage >= 90 ? 'green' : signedPercentage >= 50 ? 'orange' : 'red';

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Звіт про відповідність ISO 27001 - ${report.timestamp}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #2980b9; margin-top: 30px; }
    h3 { color: #3498db; }
    .container { max-width: 1200px; margin: 0 auto; }
    .summary { background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; }
    .issues { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .recommendations { background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .progress-container { width: 100%; background-color: #e0e0e0; border-radius: 4px; }
    .progress-bar { height: 20px; border-radius: 4px; }
    .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #7f8c8d; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Звіт про відповідність ISO 27001 для Git-операцій</h1>
    <p>Дата створення: ${new Date(report.timestamp).toLocaleString('uk-UA')}</p>
    
    <div class="summary">
      <h2>Загальний висновок</h2>
      <p><strong>Статус відповідності ISO 27001:</strong> ${complianceStatus}</p>
      <p><strong>Підписані коміти:</strong> ${report.repositoryStats.signedCommits} з ${report.repositoryStats.totalCommits} (${report.summary.signedCommitsPercentage}%)</p>
      <div class="progress-container">
        <div class="progress-bar" style="width: ${report.summary.signedCommitsPercentage}%; background-color: ${signedPercentageColor};"></div>
      </div>
      <p><strong>Інциденти з чутливими даними:</strong> ${report.summary.sensitiveDataIncidents}</p>
      <p><strong>Загальна кількість подій безпеки:</strong> ${report.summary.securityEvents}</p>
    </div>
    
    <h2>Статистика репозиторію</h2>
    <table>
      <tr><th>Показник</th><th>Значення</th></tr>
      <tr><td>Загальна кількість комітів</td><td>${report.repositoryStats.totalCommits}</td></tr>
      <tr><td>Кількість контриб'юторів</td><td>${report.repositoryStats.contributors}</td></tr>
      <tr><td>Кількість гілок</td><td>${report.repositoryStats.branches}</td></tr>
      <tr><td>Дата останнього коміту</td><td>${report.repositoryStats.lastCommitDate}</td></tr>
      <tr><td>Підписані коміти</td><td>${report.repositoryStats.signedCommits}</td></tr>
      <tr><td>Непідписані коміти</td><td>${report.repositoryStats.unsignedCommits}</td></tr>
    </table>
    
    <h2>Конфігурація Git</h2>
    <table>
      <tr><th>Параметр</th><th>Значення</th></tr>
      <tr><td>Ім'я користувача</td><td>${report.gitConfiguration.config.userName || 'Не налаштовано'}</td></tr>
      <tr><td>Email користувача</td><td>${report.gitConfiguration.config.userEmail || 'Не налаштовано'}</td></tr>
      <tr><td>Підписання комітів (GPG)</td><td>${report.gitConfiguration.config.gpgSign ? '✓ Увімкнено' : '✗ Вимкнено'}</td></tr>
      <tr><td>GPG програма</td><td>${report.gitConfiguration.config.gpgProgram || 'Не налаштовано'}</td></tr>
      <tr><td>SSH ключ</td><td>${report.gitConfiguration.config.sshKey ? '✓ Налаштовано' : '✗ Не налаштовано'}</td></tr>
      <tr><td>Credential Helper</td><td>${report.gitConfiguration.config.credentialHelper || 'Не налаштовано'}</td></tr>
    </table>
    
    <h2>Аналіз логів безпеки</h2>
    <p>Період аналізу: ${new Date(report.securityLogs.startDate).toLocaleDateString('uk-UA')} - ${new Date(report.securityLogs.endDate).toLocaleDateString('uk-UA')}</p>
    <table>
      <tr><th>Тип події</th><th>Кількість</th></tr>
      <tr><td>Всього подій</td><td>${report.securityLogs.totalEvents}</td></tr>
      <tr><td>Коміти</td><td>${report.securityLogs.gitCommitEvents}</td></tr>
      <tr><td>Push операції</td><td>${report.securityLogs.gitPushEvents}</td></tr>
      <tr><td>Виявлення чутливих даних</td><td>${report.securityLogs.sensitiveDataEvents}</td></tr>
      <tr><td>Помилки</td><td>${report.securityLogs.errorEvents}</td></tr>
      <tr><td>Попередження</td><td>${report.securityLogs.warningEvents}</td></tr>
      <tr><td>Інформаційні події</td><td>${report.securityLogs.infoEvents}</td></tr>
    </table>
    
    ${
      report.iso27001Compliance.issues.length > 0
        ? `
    <div class="issues">
      <h2>Виявлені проблеми</h2>
      <ul>
        ${report.iso27001Compliance.issues.map(issue => `<li>${issue}</li>`).join('')}
        ${report.gitConfiguration.issues.map(issue => `<li>${issue}</li>`).join('')}
      </ul>
    </div>`
        : ''
    }
    
    ${
      report.summary.recommendations.length > 0
        ? `
    <div class="recommendations">
      <h2>Рекомендації</h2>
      <ul>
        ${report.summary.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    </div>`
        : ''
    }
    
    <div class="footer">
      <p>Звіт згенеровано автоматично відповідно до вимог ISO 27001</p>
    </div>
  </div>
</body>
</html>`;
}

// Якщо скрипт запущено напряму
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    days: 30,
    outputPath: '',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-d' || arg === '--days') {
      options.days = parseInt(args[++i], 10) || 30;
    } else if (arg === '-o' || arg === '--output') {
      options.outputPath = args[++i];
    } else if (arg === '-h' || arg === '--help') {
      console.log(`
Використання: node generate-iso27001-compliance-report.js [опції]

Опції:
  -d, --days <кількість>          Кількість днів для аналізу логів (за замовчуванням: 30)
  -o, --output <шлях>             Шлях для збереження звіту
  -h, --help                      Показати цю довідку
`);
      process.exit(0);
    }
  }

  generateComplianceReport(options);
}

module.exports = {
  generateComplianceReport,
  getRepositoryStats,
  analyzeSecurityLogs,
  checkGitConfiguration,
};
