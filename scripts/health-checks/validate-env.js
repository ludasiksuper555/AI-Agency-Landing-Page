const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'API_BASE_URL',
  'SENTRY_DSN',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
];

const optionalEnvVars = ['GOOGLE_ANALYTICS_ID', 'VERCEL_URL', 'NODE_ENV', 'PORT'];

function validateEnvironmentVariables() {
  console.log('🔍 Проверка переменных окружения...');

  const missingRequired = requiredEnvVars.filter(varName => !process.env[varName]);
  const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);

  // Проверка обязательных переменных
  if (missingRequired.length > 0) {
    console.error('❌ Отсутствуют обязательные переменные окружения:');
    missingRequired.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 Создайте .env файл на основе .env.example');
    process.exit(1);
  }

  // Предупреждения о необязательных переменных
  if (missingOptional.length > 0) {
    console.warn('⚠️  Отсутствуют необязательные переменные:');
    missingOptional.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
  }

  // Проверка формата URL
  const urlVars = ['DATABASE_URL', 'REDIS_URL', 'API_BASE_URL', 'NEXTAUTH_URL'];
  const invalidUrls = [];

  urlVars.forEach(varName => {
    const value = process.env[varName];
    if (value && !isValidUrl(value)) {
      invalidUrls.push(varName);
    }
  });

  if (invalidUrls.length > 0) {
    console.error('❌ Неверный формат URL:');
    invalidUrls.forEach(varName => {
      console.error(`   - ${varName}: ${process.env[varName]}`);
    });
    process.exit(1);
  }

  // Проверка длины секретов
  const secretVars = ['JWT_SECRET', 'NEXTAUTH_SECRET'];
  const weakSecrets = [];

  secretVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value.length < 32) {
      weakSecrets.push(varName);
    }
  });

  if (weakSecrets.length > 0) {
    console.warn('⚠️  Слабые секреты (менее 32 символов):');
    weakSecrets.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
  }

  console.log('✅ Все обязательные переменные окружения настроены');
  console.log(
    `📊 Проверено: ${requiredEnvVars.length} обязательных, ${optionalEnvVars.length} необязательных`
  );

  return {
    required: requiredEnvVars.length,
    optional: optionalEnvVars.length - missingOptional.length,
    missing: missingRequired.length + missingOptional.length,
    valid: true,
  };
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

if (require.main === module) {
  try {
    validateEnvironmentVariables();
  } catch (error) {
    console.error('💥 Ошибка при проверке переменных окружения:', error.message);
    process.exit(1);
  }
}

module.exports = { validateEnvironmentVariables };
