const fs = require('fs');
const path = require('path');

// Функція для читання файлу
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.log(`Помилка читання файлу ${filePath}:`, error.message);
    return null;
  }
}

// Функція для запису файлу
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Оновлено: ${filePath}`);
    return true;
  } catch (error) {
    console.log(`❌ Помилка запису ${filePath}:`, error.message);
    return false;
  }
}

// Виправлення для lib файлів
function fixLibFiles() {
  const libFiles = [
    'lib/auth.ts',
    'lib/database.ts',
    'lib/monitoring.ts',
    'lib/notifications.ts',
    'lib/scheduler.ts',
    'lib/security.ts',
    'lib/storage.ts',
    'lib/upload.ts',
    'lib/utils.ts',
  ];

  libFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = readFile(filePath);
    if (!content) return;

    // Додаємо базові імпорти
    if (!content.includes('import { NextApiRequest, NextApiResponse }')) {
      content = `import { NextApiRequest, NextApiResponse } from 'next';
${content}`;
    }

    // Виправляємо типи для req та res
    content = content.replace(
      /function\s+(\w+)\s*\(\s*req\s*,\s*res\s*\)/g,
      'function $1(req: NextApiRequest, res: NextApiResponse)'
    );

    // Виправляємо async функції
    content = content.replace(
      /async\s+function\s+(\w+)\s*\(\s*req\s*,\s*res\s*\)/g,
      'async function $1(req: NextApiRequest, res: NextApiResponse)'
    );

    // Додаємо типи для параметрів
    content = content.replace(/function\s+(\w+)\s*\(\s*(\w+)\s*\)/g, 'function $1($2: any)');

    // Виправляємо експорти
    content = content.replace(/export\s+{\s*([^}]+)\s*}/g, (match, exports) => {
      const cleanExports = exports
        .split(',')
        .map(e => e.trim())
        .join(', ');
      return `export { ${cleanExports} }`;
    });

    writeFile(filePath, content);
  });
}

// Виправлення middleware файлів
function fixMiddlewareFiles() {
  const middlewareFiles = ['middleware.ts', 'middleware/twoFactorAuth.ts'];

  middlewareFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = readFile(filePath);
    if (!content) return;

    // Додаємо необхідні імпорти
    if (!content.includes('import { NextRequest, NextResponse }')) {
      content = `import { NextRequest, NextResponse } from 'next/server';
${content}`;
    }

    // Виправляємо типи middleware
    content = content.replace(
      /export\s+function\s+middleware\s*\(\s*request\s*\)/g,
      'export function middleware(request: NextRequest)'
    );

    writeFile(filePath, content);
  });
}

// Виправлення API файлів
function fixApiFiles() {
  const apiFiles = [
    'pages/api/security/two-factor/generate.ts',
    'pages/api/security/two-factor/verify.ts',
  ];

  apiFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = readFile(filePath);
    if (!content) return;

    // Додаємо базові імпорти
    if (!content.includes('import { NextApiRequest, NextApiResponse }')) {
      content = `import { NextApiRequest, NextApiResponse } from 'next';
${content}`;
    }

    // Виправляємо handler функції
    content = content.replace(
      /export\s+default\s+function\s+handler\s*\(\s*req\s*,\s*res\s*\)/g,
      'export default function handler(req: NextApiRequest, res: NextApiResponse)'
    );

    writeFile(filePath, content);
  });
}

// Виправлення React компонентів
function fixReactFiles() {
  const reactFiles = [
    'pages/recommendations/index.tsx',
    'stories/Button.stories.tsx',
    'stories/Team.enhanced.stories.tsx',
  ];

  reactFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    let content = readFile(filePath);
    if (!content) return;

    // Додаємо React імпорт якщо відсутній
    if (!content.includes('import React') && !content.includes('import * as React')) {
      content = `import React from 'react';
${content}`;
    }

    // Виправляємо типи компонентів
    content = content.replace(/const\s+(\w+)\s*=\s*\(\s*\)\s*=>/g, 'const $1: React.FC = () =>');

    content = content.replace(/function\s+(\w+)\s*\(\s*\)/g, 'function $1(): JSX.Element');

    writeFile(filePath, content);
  });
}

// Виправлення scripts файлів
function fixScriptFiles() {
  const scriptFile = 'scripts/initialize-project.ts';
  const filePath = path.join(__dirname, scriptFile);
  let content = readFile(filePath);
  if (!content) return;

  // Додаємо типи для Node.js
  if (!content.includes('import * as fs')) {
    content = `import * as fs from 'fs';
import * as path from 'path';
${content}`;
  }

  // Виправляємо типи функцій
  content = content.replace(/function\s+(\w+)\s*\(\s*\)/g, 'function $1(): void');

  writeFile(filePath, content);
}

// Основна функція
function main() {
  console.log('🔧 Починаємо виправлення TypeScript помилок...');

  fixLibFiles();
  fixMiddlewareFiles();
  fixApiFiles();
  fixReactFiles();
  fixScriptFiles();

  console.log('\n✅ Виправлення завершено!');
  console.log('🔍 Запустіть npm run type-check для перевірки результатів.');
}

main();
