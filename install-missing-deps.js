const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Скрипт для встановлення відсутніх залежностей
 * Виправляє помилки "Cannot find module"
 */

const missingDependencies = [
  // Storybook залежності
  '@storybook/react',
  '@storybook/addon-essentials',
  '@storybook/addon-interactions',
  '@storybook/addon-links',
  '@storybook/blocks',
  '@storybook/testing-library',

  // Chakra UI залежності
  '@chakra-ui/react',
  '@chakra-ui/icons',
  '@chakra-ui/system',
  '@emotion/react',
  '@emotion/styled',

  // Додаткові залежності для типів
  '@types/react',
  '@types/react-dom',
  '@types/node',
];

const devDependencies = [
  '@storybook/react',
  '@storybook/addon-essentials',
  '@storybook/addon-interactions',
  '@storybook/addon-links',
  '@storybook/blocks',
  '@storybook/testing-library',
  '@types/react',
  '@types/react-dom',
  '@types/node',
];

function checkPackageJson() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    console.log('📦 Поточні залежності:');
    console.log('Dependencies:', Object.keys(packageJson.dependencies || {}).length);
    console.log('DevDependencies:', Object.keys(packageJson.devDependencies || {}).length);
    return packageJson;
  } catch (error) {
    console.error('❌ Помилка читання package.json:', error.message);
    return null;
  }
}

function installDependencies() {
  console.log('🚀 Встановлення відсутніх залежностей...');

  try {
    // Встановлюємо production залежності
    const prodDeps = missingDependencies.filter(dep => !devDependencies.includes(dep));
    if (prodDeps.length > 0) {
      console.log('📦 Встановлення production залежностей...');
      const prodCommand = `npm install ${prodDeps.join(' ')}`;
      console.log(`Виконання: ${prodCommand}`);
      execSync(prodCommand, { stdio: 'inherit' });
    }

    // Встановлюємо dev залежності
    if (devDependencies.length > 0) {
      console.log('🔧 Встановлення dev залежностей...');
      const devCommand = `npm install --save-dev ${devDependencies.join(' ')}`;
      console.log(`Виконання: ${devCommand}`);
      execSync(devCommand, { stdio: 'inherit' });
    }

    console.log('✅ Всі залежності встановлено успішно!');
    return true;
  } catch (error) {
    console.error('❌ Помилка встановлення залежностей:', error.message);
    return false;
  }
}

function updateTsConfig() {
  try {
    console.log('🔧 Оновлення tsconfig.json...');

    const tsConfigPath = './tsconfig.json';
    if (fs.existsSync(tsConfigPath)) {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

      // Додаємо необхідні налаштування для Chakra UI та Emotion
      if (!tsConfig.compilerOptions) {
        tsConfig.compilerOptions = {};
      }

      tsConfig.compilerOptions.jsx = 'preserve';
      tsConfig.compilerOptions.jsxImportSource = '@emotion/react';

      // Додаємо типи
      if (!tsConfig.compilerOptions.types) {
        tsConfig.compilerOptions.types = [];
      }

      const newTypes = ['node', 'react', 'react-dom'];
      newTypes.forEach(type => {
        if (!tsConfig.compilerOptions.types.includes(type)) {
          tsConfig.compilerOptions.types.push(type);
        }
      });

      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
      console.log('✅ tsconfig.json оновлено');
    }
  } catch (error) {
    console.error('⚠️  Помилка оновлення tsconfig.json:', error.message);
  }
}

function createChakraTheme() {
  const themeContent = `import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
});

export default theme;
`;

  try {
    const themePath = './styles/theme.ts';
    if (!fs.existsSync('./styles')) {
      fs.mkdirSync('./styles', { recursive: true });
    }

    if (!fs.existsSync(themePath)) {
      fs.writeFileSync(themePath, themeContent);
      console.log('✅ Створено Chakra UI theme');
    }
  } catch (error) {
    console.error('⚠️  Помилка створення theme:', error.message);
  }
}

function runTypeCheck() {
  try {
    console.log('🔍 Запуск перевірки типів...');
    execSync('npm run type-check', { stdio: 'inherit' });
    console.log('✅ Перевірка типів пройшла успішно!');
  } catch (error) {
    console.log('⚠️  Залишились помилки типів - потрібне ручне виправлення');
  }
}

function main() {
  console.log('🚀 Початок встановлення відсутніх залежностей...');

  // Перевіряємо поточний стан
  const packageJson = checkPackageJson();
  if (!packageJson) {
    return;
  }

  // Встановлюємо залежності
  const installSuccess = installDependencies();
  if (!installSuccess) {
    console.log('❌ Встановлення не вдалося');
    return;
  }

  // Оновлюємо конфігурацію
  updateTsConfig();
  createChakraTheme();

  // Перевіряємо результат
  console.log('\n📊 Результати встановлення:');
  console.log('✅ Storybook залежності встановлено');
  console.log('✅ Chakra UI залежності встановлено');
  console.log('✅ TypeScript типи оновлено');

  console.log('\n📝 Наступні кроки:');
  console.log('1. Запустіть: node fix-motion-errors.js');
  console.log('2. Запустіть: npm run type-check');
  console.log('3. Перевірте компоненти з Chakra UI');

  // Запускаємо перевірку типів
  runTypeCheck();
}

// Запуск скрипта
if (require.main === module) {
  main();
}

module.exports = {
  missingDependencies,
  devDependencies,
  installDependencies,
  updateTsConfig,
  createChakraTheme,
};
