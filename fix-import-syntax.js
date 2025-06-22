const fs = require('fs');
const path = require('path');

/**
 * Скрипт для виправлення синтаксичних помилок в імпортах React
 * Виправляє подвійні фігурні дужки та інші синтаксичні проблеми
 */

const targetFiles = [
  './components/Contact.tsx',
  './components/ContactForm.tsx',
  './components/ExportOpportunitiesMap.tsx',
  './components/Team.tsx',
];

function fixImportSyntax(content) {
  let fixed = content;

  // Виправляємо подвійні фігурні дужки в імпортах React
  // Від: import React, { ChangeEvent }, { useCallback, useEffect } from 'react';
  // До: import React, { ChangeEvent, useCallback, useEffect } from 'react';
  fixed = fixed.replace(
    /import\s+React,\s*\{([^}]+)\},\s*\{([^}]+)\}\s+from\s+['"]react['"]/g,
    (match, group1, group2) => {
      const combined = `${group1.trim()}, ${group2.trim()}`;
      return `import React, { ${combined} } from 'react'`;
    }
  );

  // Виправляємо потрійні фігурні дужки
  fixed = fixed.replace(
    /import\s+React,\s*\{([^}]+)\},\s*\{([^}]+)\},\s*\{([^}]+)\}\s+from\s+['"]react['"]/g,
    (match, group1, group2, group3) => {
      const combined = `${group1.trim()}, ${group2.trim()}, ${group3.trim()}`;
      return `import React, { ${combined} } from 'react'`;
    }
  );

  // Виправляємо дублікати в імпортах
  fixed = fixed.replace(
    /import\s+React,\s*\{([^}]+)\}\s+from\s+['"]react['"]/g,
    (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const uniqueImports = [...new Set(importList)].filter(imp => imp.length > 0);
      return `import React, { ${uniqueImports.join(', ')} } from 'react'`;
    }
  );

  // Виправляємо порожні імпорти
  fixed = fixed.replace(
    /import\s+React,\s*\{\s*\}\s+from\s+['"]react['"]/g,
    "import React from 'react'"
  );

  // Виправляємо зайві коми
  fixed = fixed.replace(
    /import\s+React,\s*\{([^}]+)\}\s+from\s+['"]react['"]/g,
    (match, imports) => {
      const cleanImports = imports.replace(/,\s*,/g, ',').replace(/^,\s*|\s*,$/g, '');
      return `import React, { ${cleanImports} } from 'react'`;
    }
  );

  return fixed;
}

function fixTypeErrors(content) {
  let fixed = content;

  // Додаємо відсутні return statements
  fixed = fixed.replace(
    /(function\s+\w+\([^)]*\)\s*:\s*JSX\.Element\s*\{[^}]*)(\})/g,
    (match, funcBody, closingBrace) => {
      if (!funcBody.includes('return')) {
        return funcBody + '\n  return null;\n' + closingBrace;
      }
      return match;
    }
  );

  // Виправляємо arrow functions без return
  fixed = fixed.replace(
    /(const\s+\w+\s*=\s*\([^)]*\)\s*:\s*JSX\.Element\s*=>\s*\{[^}]*)(\})/g,
    (match, funcBody, closingBrace) => {
      if (!funcBody.includes('return')) {
        return funcBody + '\n  return null;\n' + closingBrace;
      }
      return match;
    }
  );

  return fixed;
}

function processFile(filePath) {
  try {
    console.log(`Обробка файлу: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Файл не знайдено: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Застосовуємо виправлення
    let fixedContent = fixImportSyntax(content);
    fixedContent = fixTypeErrors(fixedContent);

    // Перевіряємо чи були зміни
    if (fixedContent !== originalContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
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

function main() {
  console.log('🔧 Початок виправлення синтаксичних помилок імпортів...');

  let processedFiles = 0;
  let fixedFiles = 0;

  for (const filePath of targetFiles) {
    processedFiles++;
    if (processFile(filePath)) {
      fixedFiles++;
    }
  }

  console.log('\n📊 Результати:');
  console.log(`Оброблено файлів: ${processedFiles}`);
  console.log(`Виправлено файлів: ${fixedFiles}`);

  if (fixedFiles > 0) {
    console.log('\n✅ Виправлення завершено!');
    console.log('\n📝 Наступні кроки:');
    console.log('1. Запустіть: npm run type-check');
    console.log('2. Перевірте результати компіляції');
  } else {
    console.log('\nℹ️  Виправлення не потрібні');
  }
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = {
  fixImportSyntax,
  fixTypeErrors,
  processFile,
};
