/**
 * AWS Integration Index
 * 
 * Цей файл експортує всі утиліти для інтеграції з AWS AGI сервісами
 * з дотриманням вимог ISO 27001.
 */

// Імпорт та експорт основних модулів
import awsIntegration, { AWSIntegration } from './aws-integration';
import securityUtils from './security-utils';
import auditLogger from './audit-logger';

// Експорт всіх компонентів для зручного імпорту
export {
  awsIntegration as default,
  AWSIntegration,
  securityUtils,
  auditLogger
};

// Експорт окремих функцій з модулів для прямого використання
export const {
  encryptData,
  decryptData,
  generateSecureHash,
  verifyDataIntegrity,
  checkISO27001Compliance
} = securityUtils;

export const {
  logSecurityEvent,
  getSecurityLogs,
  generateAuditReport
} = auditLogger;