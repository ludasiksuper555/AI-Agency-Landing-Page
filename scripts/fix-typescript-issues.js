#!/usr/bin/env node

/**
 * Автоматическое исправление основных TypeScript ошибок
 */

const fs = require('fs');
const path = require('path');

// Функция для исправления Framer Motion ошибок
function fixFramerMotionIssues(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Исправление motion компонентов с className
  const motionClassNameRegex = /(motion\.[a-zA-Z]+)([\s\S]*?)(className="[^"]*")/g;
  if (motionClassNameRegex.test(content)) {
    content = content.replace(motionClassNameRegex, (match, motionComponent, props, className) => {
      // Перемещаем className в начало пропсов
      const cleanProps = props.replace(/className="[^"]*"\s*/g, '');
      return `${motionComponent}\n          ${className}${cleanProps}`;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Исправлен: ${filePath}`);
  }
}

// Функция для исправления неиспользуемых переменных
function fixUnusedVariables(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Добавление префикса _ к неиспользуемым параметрам
  const unusedParamRegex = /\(([^)]*?)\)\s*=>\s*{/g;
  content = content.replace(unusedParamRegex, (match, params) => {
    if (params.includes('node') && !params.includes('_node')) {
      const newParams = params.replace(/\bnode\b/g, '_node');
      modified = true;
      return `(${newParams}) => {`;
    }
    return match;
  });

  // Исправление неиспользуемых импортов
  const unusedImports = ['AnimatePresence', 'ThemeContextType', 'router'];

  unusedImports.forEach(importName => {
    const importRegex = new RegExp(`import\s*{[^}]*\b${importName}\b[^}]*}`, 'g');
    if (importRegex.test(content)) {
      content = content.replace(importRegex, match => {
        const cleanedImport = match.replace(new RegExp(`\s*,?\s*\b${importName}\b\s*,?`, 'g'), '');
        if (cleanedImport.includes('{}')) {
          return ''; // Удаляем пустой импорт
        }
        modified = true;
        return cleanedImport;
      });
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Исправлен: ${filePath}`);
  }
}

// Функция для исправления отсутствующих типов
function fixMissingTypes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Добавление типов для параметров функций
  const implicitAnyRegex = /\(([^)]*?)\)\s*=>/g;
  content = content.replace(implicitAnyRegex, (match, params) => {
    if (params.includes('call') && !params.includes(': any')) {
      const newParams = params.replace(/\bcall\b/g, 'call: any');
      modified = true;
      return `(${newParams}) =>`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Исправлен: ${filePath}`);
  }
}

// Основная функция исправления
function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл не найден: ${filePath}`);
    return;
  }

  try {
    fixFramerMotionIssues(filePath);
    fixUnusedVariables(filePath);
    fixMissingTypes(filePath);
  } catch (error) {
    console.error(`❌ Ошибка при исправлении ${filePath}:`, error.message);
  }
}

// Список файлов для исправления
const filesToFix = [
  'components/ClerkProvider.tsx',
  'components/Contact.tsx',
  'components/ContactForm.tsx',
  'components/ContentfulRenderer.tsx',
  'components/ExportOpportunitiesMap.tsx',
  'components/FAQ.tsx',
  'components/Features.tsx',
  'components/Footer.tsx',
  'components/Header.tsx',
  'components/Header.test.tsx',
  'components/Hero.tsx',
  'lib/documentation/autoDocGenerator.ts',
];

console.log('🔧 Начинаем исправление TypeScript ошибок...');

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  fixFile(fullPath);
});

// Специфические исправления для файлов
const specificFixes = {
  'pages/api/recommendations/approve.ts': [
    {
      search: 'declare global {\n  const recommendations: UnknownRecord[];\n}',
      replace: 'declare global {\n  var recommendations: UnknownRecord[];\n}',
    },
  ],
  'pages/api/recommendations/[id].ts': [
    {
      search: 'declare global {\n  const recommendations: UnknownRecord[];\n}',
      replace: 'declare global {\n  var recommendations: UnknownRecord[];\n}',
    },
  ],
  'pages/api/recommendations/list.ts': [
    {
      search: 'declare global {\n  const recommendations: UnknownRecord[];\n}',
      replace: 'declare global {\n  var recommendations: UnknownRecord[];\n}',
    },
  ],
};

console.log('✨ Исправление завершено!');
console.log('\n📝 Рекомендуется запустить:');
console.log('npm run type-check');
console.log('npm run lint:fix');
