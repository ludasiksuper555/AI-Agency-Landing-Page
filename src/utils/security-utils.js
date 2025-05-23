/**
 * Security Utilities Module
 * 
 * Цей модуль забезпечує функціональність безпеки для інтеграції з AWS AGI сервісами
 * відповідно до вимог ISO 27001.
 */

import crypto from 'crypto';

// Ключ шифрування, в реальному середовищі має зберігатися в безпечному місці
// відповідно до вимог ISO 27001
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development-only';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Шифрування даних відповідно до вимог ISO 27001
 * @param {Object|string} data - Дані для шифрування
 * @returns {Object} - Зашифровані дані
 */
export function encryptData(data) {
  try {
    // Перетворення даних в рядок JSON, якщо це об'єкт
    const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
    
    // Генерація випадкового вектора ініціалізації
    const iv = crypto.randomBytes(16);
    
    // Створення шифру
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    
    // Шифрування даних
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Отримання тегу автентифікації
    const authTag = cipher.getAuthTag();
    
    // Повернення зашифрованих даних з метаданими
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: ENCRYPTION_ALGORITHM,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Data encryption failed: ${error.message}`);
  }
}

/**
 * Розшифрування даних
 * @param {Object} encryptedPackage - Пакет зашифрованих даних
 * @returns {Object|string} - Розшифровані дані
 */
export function decryptData(encryptedPackage) {
  try {
    // Перевірка наявності необхідних полів
    if (!encryptedPackage || !encryptedPackage.encryptedData || !encryptedPackage.iv || !encryptedPackage.authTag) {
      throw new Error('Invalid encrypted package format');
    }
    
    // Перетворення IV та тегу автентифікації з hex в буфери
    const iv = Buffer.from(encryptedPackage.iv, 'hex');
    const authTag = Buffer.from(encryptedPackage.authTag, 'hex');
    
    // Створення дешифратора
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);
    
    // Розшифрування даних
    let decrypted = decipher.update(encryptedPackage.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Спроба розпарсити JSON, якщо це можливо
    try {
      return JSON.parse(decrypted);
    } catch {
      // Якщо не вдалося розпарсити як JSON, повертаємо як рядок
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(`Data decryption failed: ${error.message}`);
  }
}

/**
 * Генерація безпечного хешу для даних
 * @param {string} data - Дані для хешування
 * @returns {string} - Хеш даних
 */
export function generateSecureHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Перевірка цілісності даних за допомогою хешу
 * @param {string} data - Дані для перевірки
 * @param {string} hash - Хеш для порівняння
 * @returns {boolean} - Результат перевірки
 */
export function verifyDataIntegrity(data, hash) {
  const calculatedHash = generateSecureHash(data);
  return calculatedHash === hash;
}

/**
 * Генерація випадкового токену
 * @param {number} length - Довжина токену
 * @returns {string} - Випадковий токен
 */
export function generateRandomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Безпечне порівняння рядків (захист від атак за часом)
 * @param {string} a - Перший рядок
 * @param {string} b - Другий рядок
 * @returns {boolean} - Результат порівняння
 */
export function secureCompare(a, b) {
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Валідація сертифікату безпеки
 * @param {string} certificate - Сертифікат для перевірки
 * @returns {boolean} - Результат перевірки
 */
export function validateCertificate(certificate) {
  try {
    // Перевірка валідності сертифікату
    // В реальному середовищі тут має бути повноцінна перевірка
    return certificate && certificate.length > 0;
  } catch (error) {
    console.error('Certificate validation failed:', error);
    return false;
  }
}

/**
 * Перевірка відповідності вимогам ISO 27001
 * @param {Object} securityConfig - Конфігурація безпеки
 * @returns {Object} - Результат перевірки з рекомендаціями
 */
export function checkISO27001Compliance(securityConfig) {
  const complianceResults = {
    compliant: true,
    issues: [],
    recommendations: []
  };
  
  // Перевірка наявності необхідних політик безпеки
  if (!securityConfig.dataEncryption) {
    complianceResults.compliant = false;
    complianceResults.issues.push('Відсутнє шифрування даних');
    complianceResults.recommendations.push('Впровадити шифрування даних у спокої та під час передачі');
  }
  
  if (!securityConfig.accessControl) {
    complianceResults.compliant = false;
    complianceResults.issues.push('Відсутній контроль доступу');
    complianceResults.recommendations.push('Впровадити систему контролю доступу на основі ролей');
  }
  
  if (!securityConfig.auditLogging) {
    complianceResults.compliant = false;
    complianceResults.issues.push('Відсутній аудит безпеки');
    complianceResults.recommendations.push('Впровадити систему аудиту та моніторингу безпеки');
  }
  
  if (!securityConfig.incidentResponse) {
    complianceResults.compliant = false;
    complianceResults.issues.push('Відсутні процедури реагування на інциденти');
    complianceResults.recommendations.push('Розробити та впровадити процедури реагування на інциденти безпеки');
  }
  
  return complianceResults;
}

/**
 * Генерація звіту про безпеку
 * @param {Object} securityData - Дані про безпеку
 * @returns {Object} - Звіт про безпеку
 */
export function generateSecurityReport(securityData) {
  return {
    timestamp: new Date().toISOString(),
    securityStatus: securityData.status || 'unknown',
    complianceStatus: securityData.compliance || 'unknown',
    vulnerabilities: securityData.vulnerabilities || [],
    recommendations: securityData.recommendations || [],
    auditResults: securityData.auditResults || {}
  };
}

// Експорт додаткових утиліт безпеки
export default {
  encryptData,
  decryptData,
  generateSecureHash,
  verifyDataIntegrity,
  generateRandomToken,
  secureCompare,
  validateCertificate,
  checkISO27001Compliance,
  generateSecurityReport
};