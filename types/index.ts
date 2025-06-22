/**
 * Централизованная система типов для проекта
 * Этот файл объединяет все типы для обеспечения консистентности и переиспользования
 */

// Экспорт существующих типов
export * from './contentfulTypes';
export * from './roles';
export * from './teamTypes';

// Базовые типы для API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Типы для пользовательской активности
export interface UserActivity {
  id: string;
  userId: string;
  actionType: 'view' | 'edit' | 'question' | 'login' | 'logout' | 'api_call' | 'change' | 'other';
  actionDetails: string;
  resourceType?: string;
  resourceId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserQuestion {
  id: string;
  userId: string;
  questionId: string;
  question: string;
  answer?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserChange {
  id: string;
  userId: string;
  changeType: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Типы для безопасности
export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  SECURITY_SETTING_CHANGE = 'SECURITY_SETTING_CHANGE',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
  TWO_FACTOR_AUTH = 'TWO_FACTOR_AUTH',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum SecurityEventSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  WARNING = 'warning',
  ERROR = 'error',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface SecurityEvent {
  id: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId?: string;
  timestamp: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Типы для рекомендаций
export type RecommendationPriority = 'high' | 'medium' | 'low';
export type RecommendationCategory =
  | 'performance'
  | 'monitoring'
  | 'testing'
  | 'security'
  | 'user-experience'
  | 'other';
export type RecommendationStatus = 'pending' | 'in-progress' | 'completed' | 'dismissed';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  resourceType: string;
  resourceId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  estimatedEffort?: string;
  expectedBenefit?: string;
  implementationSteps?: string[];
  relatedLinks?: string[];
}

// Типы для уведомлений
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  timestamp: string;
}

// Типы для экспорта данных
export type ExportFormat = 'csv' | 'json' | 'excel';
export type ExportDataType = 'activity' | 'changes' | 'questions';

export interface ExportParams {
  format: ExportFormat;
  dataType: ExportDataType;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  includeMetadata?: boolean;
}

// Типы для фильтрации
export interface FilterParams {
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  actionType?: string;
  resourceType?: string;
  userId?: string;
}

// Типы для темы и локализации
export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

// Типы для производительности
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage: number;
  bundleSize: number;
}

export interface CacheSettings {
  maxAge: number;
  staleWhileRevalidate: number;
  cacheControl: string;
}

// Типы для мясной индустрии (специфичные для проекта)
export interface MeatPriceData {
  id: string;
  productType: string;
  price: number;
  currency: string;
  date: string;
  region: string;
  supplier?: string;
}

export interface MeatMarketAnalysis {
  productType: string;
  currentPrice: number;
  priceChange: number;
  trend: 'up' | 'down' | 'stable';
  forecast: Array<{
    month: string;
    predictedPrice: number;
  }>;
}

// Типы для интеграций
export interface MGXIntegration {
  isConnected: boolean;
  token?: string;
  lastSync?: string;
  features: {
    codeAnalysis: boolean;
    marketAnalysis: boolean;
    priceForecasting: boolean;
  };
}

export interface GitHubIntegration {
  isConnected: boolean;
  token?: string;
  repositories: Array<{
    id: string;
    name: string;
    fullName: string;
    private: boolean;
  }>;
}

// Типы для схемы данных (Schema.org)
export interface SchemaOrgData {
  '@context': string;
  '@type': string;
  name: string;
  description?: string;
  url?: string;
  image?: string;
  address?: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

// Утилитарные типы
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Типы для валидации
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Типы для конфигурации
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    analytics: boolean;
    twoFactorAuth: boolean;
    mgxIntegration: boolean;
    githubIntegration: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
  };
}
