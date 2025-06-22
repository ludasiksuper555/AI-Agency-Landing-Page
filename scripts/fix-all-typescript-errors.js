import React from 'react';
;
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Комплексное исправление всех TypeScript ошибок...');

// Функция для чтения файла
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Ошибка чтения файла ${filePath}:`, error.message);
    return null;
  }
}

// Функция для записи файла
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Исправлен файл: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка записи файла ${filePath}:`, error.message);
    return false;
  }
}

// Исправление React импортов в performanceOptimization.ts
function fixPerformanceOptimization() {
  const filePath = path.join(process.cwd(), 'utils', 'performanceOptimization.ts');
  let content = readFile(filePath);

  if (!content) return false;

  // Проверяем наличие React импорта
  if (!content.includes('import React') && !content.includes('import * as React')) {
    // Добавляем импорт React в начало файла
    const lines = content.split('\n');
    const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import'));

    if (firstImportIndex !== -1) {
      lines.splice(firstImportIndex, 0, ";");
    } else {
      lines.unshift(";", '');
    }

    content = lines.join('\n');
    return writeFile(filePath, content);
  }

  console.log(`✅ performanceOptimization.ts уже содержит React импорт`);
  return true;
}

// Исправление teamUtils.ts для работы с Set
function fixTeamUtils() {
  const filePath = path.join(process.cwd(), 'utils', 'teamUtils.ts');
  const content = readFile(filePath);

  if (!content) return false;

  // Заменяем итерацию Set на Array.from для совместимости
  let updatedContent = content.replace(
    /for\s*\(\s*const\s+(\w+)\s+of\s+(\w+)\s*\)/g,
    'for (const $1 of Array.from($2))'
  );

  // Также заменяем spread оператор для Set
  updatedContent = updatedContent.replace(/\.\.\.([\w.]+)(?=\s*[,\]])/g, (match, setVar) => {
    // Проверяем, является ли переменная Set
    if (content.includes(`${setVar}: Set<`) || content.includes(`new Set(`)) {
      return `...Array.from(${setVar})`;
    }
    return match;
  });

  if (updatedContent !== content) {
    return writeFile(filePath, updatedContent);
  }

  console.log(`✅ teamUtils.ts не требует изменений`);
  return true;
}

// Исправление authStore.ts
function fixAuthStore() {
  const filePath = path.join(process.cwd(), 'store', 'authStore.ts');
  let content = readFile(filePath);

  if (!content) return false;

  // Проверяем наличие импортов
  const hasCreateImport = content.includes('import { create }');
  const hasPersistImport = content.includes('import { persist }');

  if (!hasCreateImport || !hasPersistImport) {
    const imports = [];
    if (!hasCreateImport) {
      imports.push("import { create } from 'zustand';");
    }
    if (!hasPersistImport) {
      imports.push("import { persist } from 'zustand/middleware';");
    }

    const lines = content.split('\n');
    const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import'));

    if (firstImportIndex !== -1) {
      lines.splice(firstImportIndex, 0, ...imports);
    } else {
      lines.unshift(...imports, '');
    }

    content = lines.join('\n');
    return writeFile(filePath, content);
  }

  console.log(`✅ authStore.ts уже содержит необходимые импорты`);
  return true;
}

// Исправление meatIndustryAnalytics.ts
function fixMeatIndustryAnalytics() {
  const filePath = path.join(process.cwd(), 'utils', 'meatIndustryAnalytics.ts');
  let content = readFile(filePath);

  if (!content) return false;

  if (!content.includes('interface ProductAnalytics')) {
    const interfaceDefinition = `
// Интерфейсы для аналитики мясной промышленности
interface ProductAnalytics {
  id: string;
  name: string;
  price: number;
  category: string;
  supplier: string;
  quantity: number;
  unit: string;
  lastUpdated: Date;
  trends: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

interface MarketData {
  region: string;
  products: ProductAnalytics[];
  marketTrends: {
    priceIndex: number;
    demandLevel: 'low' | 'medium' | 'high';
    seasonalFactor: number;
  };
}

interface AnalyticsResponse {
  success: boolean;
  data: MarketData[];
  timestamp: string;
  error?: string;
}
`;

    const lines = content.split('\n');
    const lastImportIndex = lines.findLastIndex(line => line.trim().startsWith('import'));

    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, interfaceDefinition);
    } else {
      lines.unshift(interfaceDefinition);
    }

    content = lines.join('\n');
    return writeFile(filePath, content);
  }

  console.log(`✅ meatIndustryAnalytics.ts уже содержит необходимые интерфейсы`);
  return true;
}

// Исправление mgxUtils.ts
function fixMgxUtils() {
  const filePath = path.join(process.cwd(), 'utils', 'mgxUtils.ts');
  let content = readFile(filePath);

  if (!content) return false;

  if (!content.includes('interface MGXAuthResponse')) {
    const interfaceDefinition = `
// Интерфейсы для MGX API
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

interface MGXAuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
  error?: string;
}

interface MGXApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface MGXConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
}
`;

    const lines = content.split('\n');
    const lastImportIndex = lines.findLastIndex(line => line.trim().startsWith('import'));

    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, interfaceDefinition);
    } else {
      lines.unshift(interfaceDefinition);
    }

    content = lines.join('\n');
    return writeFile(filePath, content);
  }

  console.log(`✅ mgxUtils.ts уже содержит необходимые интерфейсы`);
  return true;
}

// Проверка TypeScript ошибок
function checkTypeScriptErrors() {
  try {
    console.log('🔍 Проверка TypeScript ошибок...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript ошибок не найдено!');
    return true;
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : error.message;
    console.log('❌ Найдены TypeScript ошибки:');
    console.log(output.slice(-2000)); // Показываем последние 2000 символов
    return false;
  }
}

// Основная функция
async function main() {
  console.log('🚀 Начинаем комплексное исправление TypeScript ошибок...\n');

  const fixes = [
    { name: 'authStore.ts', fix: fixAuthStore },
    { name: 'meatIndustryAnalytics.ts', fix: fixMeatIndustryAnalytics },
    { name: 'mgxUtils.ts', fix: fixMgxUtils },
    { name: 'performanceOptimization.ts', fix: fixPerformanceOptimization },
    { name: 'teamUtils.ts', fix: fixTeamUtils },
  ];

  let successCount = 0;

  for (const { name, fix } of fixes) {
    console.log(`🔧 Исправляем ${name}...`);
    if (fix()) {
      successCount++;
    }
    console.log('');
  }

  console.log(`📊 Результат: ${successCount}/${fixes.length} файлов обработано\n`);

  // Проверяем результат
  if (checkTypeScriptErrors()) {
    console.log('🎉 Все TypeScript ошибки исправлены!');

    // Запускаем сборку проекта
    try {
      console.log('\n🏗️ Запускаем сборку проекта...');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Сборка прошла успешно!');
    } catch (error) {
      console.log('⚠️ Сборка выявила проблемы');
    }
  } else {
    console.log('⚠️ Остались нерешенные TypeScript ошибки');
    console.log('💡 Рекомендуется ручная проверка проблемных файлов');
  }
}

// Запуск скрипта
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Ошибка выполнения скрипта:', error.message);
    process.exit(1);
  });
}

module.exports = {
  fixAuthStore,
  fixMeatIndustryAnalytics,
  fixMgxUtils,
  fixPerformanceOptimization,
  fixTeamUtils,
  checkTypeScriptErrors,
};
