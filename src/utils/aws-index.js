/**
 * AWS Integration Index
 *
 * Цей файл експортує всі утиліти для інтеграції з AWS AGI сервісами
 * з дотриманням вимог ISO 27001.
 */

// Імпорт та експорт основних модулів
import {
  cleanupOldLogs,
  generateAuditReport,
  getSecurityLogs,
  logSecurityEvent,
} from './audit-logger';
import { AWSIntegration, awsIntegration } from './aws-integration';
import {
  checkISO27001Compliance,
  decryptData,
  encryptData,
  generateSecureHash,
  verifyDataIntegrity,
} from './security-utils';

// Створення об'єктів для зворотної сумісності
const auditLogger = {
  logSecurityEvent,
  getSecurityLogs,
  generateAuditReport,
  cleanupOldLogs,
};

const securityUtils = {
  encryptData,
  decryptData,
  generateSecureHash,
  verifyDataIntegrity,
  checkISO27001Compliance,
};

// Експорт всіх компонентів та функцій
export {
  auditLogger,
  AWSIntegration,
  awsIntegration,
  checkISO27001Compliance,
  cleanupOldLogs,
  decryptData,
  encryptData,
  generateAuditReport,
  generateSecureHash,
  getSecurityLogs,
  logSecurityEvent,
  securityUtils,
  verifyDataIntegrity,
};
