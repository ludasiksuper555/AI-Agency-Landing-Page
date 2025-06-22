/**
 * Скрипт для встановлення Git hooks згідно з вимогами ISO 27001
 *
 * Цей скрипт встановлює pre-commit та pre-push хуки для забезпечення
 * безпеки при роботі з Git відповідно до вимог ISO 27001
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Шлях до директорії Git hooks
const gitRoot = execSync('git rev-parse --show-toplevel').toString().trim();
const hooksDir = path.join(gitRoot, '.git', 'hooks');

// Створення pre-commit хука
const preCommitHook = `#!/bin/sh

# Pre-commit хук для забезпечення безпеки згідно з ISO 27001
echo "Запуск перевірки безпеки згідно з ISO 27001..."

# Перевірка на чутливі дані
node "${path.join(gitRoot, 'scripts', 'secure-git-commit.js')}" --skip-push --message "Автоматичний коміт" || exit 1

# Успішне завершення
exit 0
`;

// Створення pre-push хука
const prePushHook = `#!/bin/sh

# Pre-push хук для забезпечення безпеки згідно з ISO 27001
echo "Запуск перевірки безпеки перед push згідно з ISO 27001..."

# Перевірка налаштування двофакторної автентифікації
if [ -z "$(git config --get user.signingkey)" ]; then
  echo "\033[1;33mПопередження: GPG підписання не налаштовано. Рекомендується налаштувати GPG для відповідності ISO 27001.\033[0m"
  echo "Для налаштування виконайте команди:"
  echo "  gpg --full-generate-key"
  echo "  gpg --list-secret-keys --keyid-format=long"
  echo "  git config --global user.signingkey YOUR_KEY_ID"
  echo "  git config --global commit.gpgsign true"
  
  read -p "Продовжити push без GPG підписання? (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    exit 1
  fi
fi

# Успішне завершення
exit 0
`;

/**
 * Встановлює Git hook
 * @param {string} hookName - Назва хука
 * @param {string} content - Вміст файлу хука
 */
function installHook(hookName, content) {
  const hookPath = path.join(hooksDir, hookName);

  try {
    fs.writeFileSync(hookPath, content, { mode: 0o755 });
    console.log(`✅ Хук ${hookName} успішно встановлено`);
  } catch (error) {
    console.error(`❌ Помилка при встановленні хука ${hookName}:`, error.message);
  }
}

// Перевірка наявності директорії hooks
if (!fs.existsSync(hooksDir)) {
  try {
    fs.mkdirSync(hooksDir, { recursive: true });
  } catch (error) {
    console.error(`❌ Помилка при створенні директорії ${hooksDir}:`, error.message);
    process.exit(1);
  }
}

// Встановлення хуків
installHook('pre-commit', preCommitHook);
installHook('pre-push', prePushHook);

console.log('\n🔒 Git hooks для забезпечення безпеки згідно з ISO 27001 успішно встановлено');
console.log('📝 Для отримання додаткової інформації перегляньте docs/ISO27001-GIT-SECURITY.md');
