#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Автоматическое исправление TypeScript ошибок...');

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

// Исправление authStore.ts
function fixAuthStore() {
  const filePath = path.join(process.cwd(), 'store', 'authStore.ts');
  let content = readFile(filePath);

  if (!content) return false;

  // Проверяем наличие импортов
  const hasCreateImport = content.includes('import { create }');
  const hasPersistImport = content.includes('import { persist }');

  if (!hasCreateImport || !hasPersistImport) {
    // Добавляем недостающие импорты в начало файла
    const imports = [];
    if (!hasCreateImport) {
      imports.push("import { create } from 'zustand';");
    }
    if (!hasPersistImport) {
      imports.push("import { persist } from 'zustand/middleware';");
    }

    // Находим первую строку с import и вставляем перед ней
    const lines = content.split('\n');
    const firstImportIndex = lines.findIndex(line => line.trim().startsWith('import'));

    if (firstImportIndex !== -1) {
      lines.splice(firstImportIndex, 0, ...imports);
      content = lines.join('\n');
    } else {
      // Если нет импортов, добавляем в начало
      content = imports.join('\n') + '\n\n' + content;
    }

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

  // Проверяем наличие интерфейса ProductAnalytics
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

    // Добавляем интерфейсы после импортов
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

  // Проверяем наличие интерфейса MGXAuthResponse
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

    // Добавляем интерфейсы после импортов
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
    console.log(output);
    return false;
  }
}

// Основная функция
async function main() {
  console.log('🚀 Начинаем исправление TypeScript ошибок...\n');

  const fixes = [
    { name: 'authStore.ts', fix: fixAuthStore },
    { name: 'meatIndustryAnalytics.ts', fix: fixMeatIndustryAnalytics },
    { name: 'mgxUtils.ts', fix: fixMgxUtils },
  ];

  let successCount = 0;

  for (const { name, fix } of fixes) {
    console.log(`🔧 Исправляем ${name}...`);
    if (fix()) {
      successCount++;
    }
    console.log('');
  }

  console.log(`📊 Результат: ${successCount}/${fixes.length} файлов исправлено\n`);

  // Проверяем результат
  if (checkTypeScriptErrors()) {
    console.log('🎉 Все TypeScript ошибки исправлены!');

    // Запускаем проверку качества
    try {
      console.log('\n🔍 Запускаем проверку качества кода...');
      execSync('npm run type-check', { stdio: 'inherit' });
      console.log('✅ Проверка качества прошла успешно!');
    } catch (error) {
      console.log('⚠️ Проверка качества выявила проблемы');
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
  checkTypeScriptErrors,
};
