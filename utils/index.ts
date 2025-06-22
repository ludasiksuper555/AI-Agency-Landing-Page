/**
 * Utils exports
 * Централизованный экспорт всех утилит
 */

export * from './browserUtils';
export * from './dateUtils';
export * from './formatUtils';
export * from './mgxUtils';
export * from './securityUtils';
export * from './validationUtils';

// Common utility types
export interface UtilityResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
