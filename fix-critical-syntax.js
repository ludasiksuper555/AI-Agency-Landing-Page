const fs = require('fs');
const path = require('path');

/**
 * Скрипт для виправлення критичних синтаксичних помилок
 * Виправляє неправильні onClick handlers та JSX структуру
 */

const targetFiles = ['./components/ContactForm.tsx', './components/ExportOpportunitiesMap.tsx'];

function fixContactForm(content) {
  let fixed = content;

  // Виправляємо неправильну структуру JSX в ContactForm
  // Проблема: form onSubmit={handleSubmit}><motion.div
  // Рішення: обгортаємо motion.div в form правильно
  fixed = fixed.replace(
    /<form onSubmit={handleSubmit}><motion\.div([^>]*)>/g,
    '<form onSubmit={handleSubmit}>\n      <motion.div$1>'
  );

  // Виправляємо закриваючі теги
  fixed = fixed.replace(/<\/motion\.div>\s*<\/form>/g, '      </motion.div>\n    </form>');

  return fixed;
}

function fixExportMap(content) {
  let fixed = content;

  // Виправляємо неправильний onClick handler
  // Від: onClick={() = className="absolute cursor-pointer"> setSelectedCountry(market.countryCode)}
  // До: onClick={() => setSelectedCountry(market.countryCode)} className="absolute cursor-pointer"
  fixed = fixed.replace(
    /onClick\(\(\)\s*=\s*className="([^"]*)">\s*([^}]+)\}/g,
    'onClick={() => $2} className="$1"'
  );

  // Виправляємо інші варіанти неправильного onClick
  fixed = fixed.replace(/onClick\(\(\)\s*=\s*([^>]+)>\s*([^}]+)\}/g, 'onClick={() => $2}');

  return fixed;
}

function fixJSXStructure(content) {
  let fixed = content;

  // Виправляємо неправильні закриваючі дужки
  fixed = fixed.replace(/\}\s*;\s*$/gm, '}');

  // Виправляємо порожні рядки що можуть спричиняти помилки
  fixed = fixed.replace(/^\s*$/gm, '');

  // Виправляємо подвійні крапки з комою
  fixed = fixed.replace(/;;/g, ';');

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

    let fixedContent = content;

    // Застосовуємо специфічні виправлення для кожного файлу
    if (filePath.includes('ContactForm.tsx')) {
      fixedContent = fixContactForm(fixedContent);
    }

    if (filePath.includes('ExportOpportunitiesMap.tsx')) {
      fixedContent = fixExportMap(fixedContent);
    }

    // Загальні виправлення JSX структури
    fixedContent = fixJSXStructure(fixedContent);

    // Перевіряємо чи були зміни
    if (fixedContent !== originalContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✅ Виправлено: ${filePath}`);

      // Показуємо що саме було виправлено
      const lines = originalContent.split('\n');
      const fixedLines = fixedContent.split('\n');

      for (let i = 0; i < Math.max(lines.length, fixedLines.length); i++) {
        if (lines[i] !== fixedLines[i]) {
          console.log(
            `   Рядок ${i + 1}: ${lines[i]?.substring(0, 50) || '(видалено)'} → ${fixedLines[i]?.substring(0, 50) || '(додано)'}`
          );
          break; // Показуємо тільки першу зміну
        }
      }

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
  console.log('🔧 Початок виправлення критичних синтаксичних помилок...');

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
    console.log('\n✅ Критичні помилки виправлено!');
    console.log('\n📝 Наступні кроки:');
    console.log('1. Запустіть: npm run type-check');
    console.log('2. Перевірте компіляцію');
    console.log('3. Протестуйте компоненти');
  } else {
    console.log('\nℹ️  Критичні помилки не знайдено');
  }
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = {
  fixContactForm,
  fixExportMap,
  fixJSXStructure,
  processFile,
};
