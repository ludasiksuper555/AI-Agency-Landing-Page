const fs = require('fs');
const path = require('path');

/**
 * Автоматизований скрипт для виправлення Motion.div className помилок
 * Виправляє найкритичніші TypeScript помилки з Framer Motion
 */

const componentsDir = './components';

// Файли з Motion.div помилками
const targetFiles = [
  'Contact.tsx',
  'ContactForm.tsx',
  'FAQ.tsx',
  'Features.tsx',
  'Footer.tsx',
  'Hero.tsx',
  'Services.tsx',
  'ExportOpportunitiesMap.tsx',
  'MeatPriceMonitor.tsx',
  'Pricing.tsx',
  'Team.tsx',
];

/**
 * Виправляє Motion.div className конфлікти
 * Переміщує className після motion props
 */
function fixMotionClassNameIssues(content) {
  // Паттерн для motion.div з className перед motion props
  const motionDivPattern = /<motion\.div([^>]*?)className=["']([^"']*)["']([^>]*?)>/g;

  return content.replace(motionDivPattern, (match, beforeClassName, className, afterClassName) => {
    // Видаляємо className з поточної позиції
    const cleanedBefore = beforeClassName.replace(/\s*className=["'][^"']*["']\s*/, ' ');
    const cleanedAfter = afterClassName.replace(/\s*className=["'][^"']*["']\s*/, ' ');

    // Додаємо className в кінці
    return `<motion.div${cleanedBefore}${cleanedAfter} className="${className}">`;
  });
}

/**
 * Виправляє motion.form onSubmit конфлікти
 */
function fixMotionFormIssues(content) {
  const motionFormPattern = /<motion\.form([^>]*?)onSubmit=\{([^}]+)\}([^>]*?)>/g;

  return content.replace(
    motionFormPattern,
    (match, beforeOnSubmit, onSubmitValue, afterOnSubmit) => {
      // Видаляємо onSubmit з motion.form
      const cleanedBefore = beforeOnSubmit.replace(/\s*onSubmit=\{[^}]+\}\s*/, ' ');
      const cleanedAfter = afterOnSubmit.replace(/\s*onSubmit=\{[^}]+\}\s*/, ' ');

      // Обгортаємо в звичайну form з onSubmit
      return `<form onSubmit={${onSubmitValue}}><motion.div${cleanedBefore}${cleanedAfter}>`;
    }
  );
}

/**
 * Виправляє motion.button className конфлікти
 */
function fixMotionButtonIssues(content) {
  const motionButtonPattern = /<motion\.button([^>]*?)className=["']([^"']*)["']([^>]*?)>/g;

  return content.replace(
    motionButtonPattern,
    (match, beforeClassName, className, afterClassName) => {
      const cleanedBefore = beforeClassName.replace(/\s*className=["'][^"']*["']\s*/, ' ');
      const cleanedAfter = afterClassName.replace(/\s*className=["'][^"']*["']\s*/, ' ');

      return `<motion.button${cleanedBefore}${cleanedAfter} className="${className}">`;
    }
  );
}

/**
 * Додає відсутні return statements
 */
function fixMissingReturnStatements(content) {
  // Шукаємо функції без return в кінці
  const functionPattern =
    /(function\s+\w+\([^)]*\)\s*\{[^}]*if\s*\([^)]+\)\s*\{[^}]*return[^}]*\}[^}]*)(\})/g;

  return content.replace(functionPattern, (match, functionBody, closingBrace) => {
    if (!functionBody.includes('return null') && !functionBody.includes('return undefined')) {
      return functionBody + '\n  return null;' + closingBrace;
    }
    return match;
  });
}

/**
 * Видаляє невикористані імпорти
 */
function removeUnusedImports(content) {
  const lines = content.split('\n');
  const usedImports = new Set();

  // Знаходимо всі використання в коді
  const codeContent = lines.slice(10).join('\n'); // Пропускаємо імпорти

  // Перевіряємо кожен рядок імпорту
  return lines
    .map(line => {
      if (line.includes('import') && line.includes('from')) {
        // Витягуємо імена імпортів
        const importMatch = line.match(/import\s*\{([^}]+)\}/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map(imp => imp.trim());
          const usedInCode = imports.filter(imp => {
            const regex = new RegExp(`\\b${imp}\\b`, 'g');
            return regex.test(codeContent);
          });

          if (usedInCode.length === 0) {
            return `// ${line} // Закоментовано: не використовується`;
          } else if (usedInCode.length < imports.length) {
            const fromMatch = line.match(/from\s+["']([^"']+)["']/);
            const fromPart = fromMatch ? fromMatch[0] : '';
            return `import { ${usedInCode.join(', ')} } ${fromPart};`;
          }
        }
      }
      return line;
    })
    .join('\n');
}

/**
 * Виправляє типи для event handlers
 */
function fixEventHandlerTypes(content) {
  // Виправляє (e) => на (e: FormEvent<HTMLFormElement>) =>
  content = content.replace(
    /(const\s+\w*[Ss]ubmit\w*\s*=\s*)\(e\)\s*=>/g,
    '$1(e: FormEvent<HTMLFormElement>) =>'
  );

  // Виправляє (e) => на (e: ChangeEvent<HTMLInputElement>) =>
  content = content.replace(
    /(const\s+\w*[Cc]hange\w*\s*=\s*)\(e\)\s*=>/g,
    '$1(e: ChangeEvent<HTMLInputElement>) =>'
  );

  // Виправляє (e) => на (e: MouseEvent<HTMLButtonElement>) =>
  content = content.replace(
    /(const\s+\w*[Cc]lick\w*\s*=\s*)\(e\)\s*=>/g,
    '$1(e: MouseEvent<HTMLButtonElement>) =>'
  );

  return content;
}

/**
 * Додає необхідні імпорти для типів
 */
function addMissingTypeImports(content) {
  const needsFormEvent = content.includes('FormEvent');
  const needsChangeEvent = content.includes('ChangeEvent');
  const needsMouseEvent = content.includes('MouseEvent');

  if (needsFormEvent || needsChangeEvent || needsMouseEvent) {
    const reactImportLine = content.match(/import React[^;]*;/);
    if (reactImportLine) {
      const newImports = [];
      if (needsFormEvent) newImports.push('FormEvent');
      if (needsChangeEvent) newImports.push('ChangeEvent');
      if (needsMouseEvent) newImports.push('MouseEvent');

      const newImportLine = reactImportLine[0].replace(
        /import React/,
        `import React, { ${newImports.join(', ')} }`
      );

      content = content.replace(reactImportLine[0], newImportLine);
    }
  }

  return content;
}

/**
 * Обробляє один файл
 */
function processFile(filePath) {
  try {
    console.log(`Обробка файлу: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Застосовуємо всі виправлення
    content = fixMotionClassNameIssues(content);
    content = fixMotionFormIssues(content);
    content = fixMotionButtonIssues(content);
    content = fixMissingReturnStatements(content);
    content = removeUnusedImports(content);
    content = fixEventHandlerTypes(content);
    content = addMissingTypeImports(content);

    // Записуємо тільки якщо є зміни
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Виправлено: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  Без змін: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Помилка обробки ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Головна функція
 */
function main() {
  console.log('🚀 Початок виправлення Motion.div помилок...');

  let processedCount = 0;
  let fixedCount = 0;

  targetFiles.forEach(fileName => {
    const filePath = path.join(componentsDir, fileName);

    if (fs.existsSync(filePath)) {
      processedCount++;
      if (processFile(filePath)) {
        fixedCount++;
      }
    } else {
      console.log(`⚠️  Файл не знайдено: ${filePath}`);
    }
  });

  console.log('\n📊 Результати:');
  console.log(`Оброблено файлів: ${processedCount}`);
  console.log(`Виправлено файлів: ${fixedCount}`);
  console.log('\n✅ Виправлення завершено!');
  console.log('\n📝 Наступні кроки:');
  console.log('1. Запустіть: npm run type-check');
  console.log('2. Перевірте результати компіляції');
  console.log('3. Протестуйте компоненти вручну');
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = {
  fixMotionClassNameIssues,
  fixMotionFormIssues,
  fixMotionButtonIssues,
  fixMissingReturnStatements,
  removeUnusedImports,
  fixEventHandlerTypes,
  addMissingTypeImports,
  processFile,
};
