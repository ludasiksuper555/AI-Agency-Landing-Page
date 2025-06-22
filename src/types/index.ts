/**
 * Централизованные типы для всего приложения
 */

// Базовые типы
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Типы пользователя
export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
}

export type UserRole = 'admin' | 'user' | 'moderator';

// Типы API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Типы форм
export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  company?: string;
  subject?: string;
}

// Типы компонентов
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Типы навигации
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType;
  children?: NavigationItem[];
}

// Типы уведомлений
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Типы для MGX интеграции
export interface MGXConfig {
  apiKey: string;
  endpoint: string;
  industry: 'meat' | 'agriculture' | 'general';
  dataTypes: string[];
  refreshInterval: number;
}

export interface MGXAnalyticsData {
  timestamp: Date;
  metrics: Record<string, number>;
  trends: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

// Типы для производительности
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  cacheHitRate: number;
}

// Типы для валидации
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Типы для темы
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
  borderRadius: number;
}

// Экспорт всех типов
export * from './api';
export * from './components';
export * from './forms';
export * from './navigation';
