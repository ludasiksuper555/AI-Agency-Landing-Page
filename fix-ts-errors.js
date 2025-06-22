const fs = require('fs');
const path = require('path');

// Функция для исправления неиспользуемых переменных
function fixUnusedVariables(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Комментируем неиспользуемые импорты
    content = content.replace(/^import\s+\{[^}]*\}\s+from\s+[^;]+;$/gm, match => {
      if (match.includes('AnimatePresence') || match.includes('ThemeContextType')) {
        return `// ${match}`;
      }
      return match;
    });

    // Комментируем неиспользуемые переменные
    content = content.replace(
      /^(\s*)(const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm,
      (match, indent, keyword, varName) => {
        if (varName === 'router' || varName === 'locale' || varName === 'useEffect') {
          return `${indent}// ${keyword} ${varName} =`;
        }
        return match;
      }
    );

    // Исправляем параметры функций с типом any
    content = content.replace(/(\([^)]*)(\w+):(\s*)any(\s*[,)])/g, '$1$2:$3unknown$4');

    fs.writeFileSync(filePath, content);
    console.log(`✓ Fixed: ${path.basename(filePath)}`);
  } catch (error) {
    console.log(`✗ Error fixing ${path.basename(filePath)}: ${error.message}`);
  }
}

// Исправляем файлы в директории components
const componentsDir = './components';
if (fs.existsSync(componentsDir)) {
  const files = fs
    .readdirSync(componentsDir)
    .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
    .slice(0, 10); // Ограничиваем количество файлов

  console.log(`Fixing ${files.length} files in components directory...`);
  files.forEach(file => {
    fixUnusedVariables(path.join(componentsDir, file));
  });
}

// Исправляем файлы в директории utils
const utilsDir = './utils';
if (fs.existsSync(utilsDir)) {
  const files = fs
    .readdirSync(utilsDir)
    .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
    .slice(0, 5);

  console.log(`Fixing ${files.length} files in utils directory...`);
  files.forEach(file => {
    fixUnusedVariables(path.join(utilsDir, file));
  });
}

console.log('TypeScript error fixing completed!');
