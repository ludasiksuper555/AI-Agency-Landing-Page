// Общие типы для замены any

// Базовые типы
export type UnknownRecord = Record<string, unknown>;
export type StringRecord = Record<string, string>;
export type AnyFunction = (...args: unknown[]) => unknown;
export type VoidFunction = (...args: unknown[]) => void;
export type AsyncFunction<T = unknown> = (...args: unknown[]) => Promise<T>;

// Типы для API
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: UnknownRecord;
}

// Типы для форм
export interface FormData {
  [key: string]: string | number | boolean | File | null | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: UnknownRecord;
}

// Типы для компонентов
export interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

export interface MockComponentProps {
  children?: React.ReactNode;
  [key: string]: unknown;
}

// Типы для событий
export type EventHandler<T = Event> = (event: T) => void;
export type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

// Типы для данных
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  details?: UnknownRecord;
}

export interface DatabaseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
}

// Типы для конфигурации
export interface Config {
  [key: string]: string | number | boolean | Config | Config[];
}

export interface FeatureConfig {
  enabled: boolean;
  settings?: UnknownRecord;
}

// Типы для метрик и мониторинга
export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  tags?: StringRecord;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: UnknownRecord;
}

// Типы для экспорта данных
export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  fields?: string[];
  filters?: UnknownRecord;
}

export interface ExportResult {
  data: unknown[];
  filename: string;
  mimeType: string;
}

// Типы для уведомлений
export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  metadata?: UnknownRecord;
}

// Типы для кэширования
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number;
  keyGenerator?: (...args: unknown[]) => string;
}

// Типы для валидации
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | Promise<boolean>;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

// Типы для безопасности
export interface SecurityEvent {
  type: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  details: UnknownRecord;
}

export interface Permission {
  resource: string;
  action: string;
  conditions?: UnknownRecord;
}

// Типы для планировщика задач
export interface JobData {
  [key: string]: unknown;
}

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

export interface Job {
  id: string;
  name: string;
  data: JobData;
  status: 'pending' | 'active' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  result?: unknown;
  error?: string;
}

// Типы для базы данных
export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  insertId?: string | number;
  affectedRows?: number;
}

export interface DatabaseConnection {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  close(): Promise<void>;
}

// Типы для хранилища
export interface StorageFile {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  url?: string;
}

export interface StorageOptions {
  bucket?: string;
  path?: string;
  metadata?: UnknownRecord;
}

// Типы для интеграций
export interface IntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  settings?: UnknownRecord;
}

export interface WebhookPayload {
  event: string;
  data: UnknownRecord;
  timestamp: Date;
  signature?: string;
}

// Утилитарные типы
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type NonEmptyArray<T> = [T, ...T[]];

// Типы для React компонентов
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export type PropsWithChildren<P = {}> = P & {
  children?: React.ReactNode;
};

export type ComponentWithProps<P = {}> = React.ComponentType<P & BaseComponentProps>;

// Типы для тестирования
export interface MockFunction<T extends AnyFunction = AnyFunction> {
  (...args: Parameters<T>): ReturnType<T>;
  mockImplementation: (fn: T) => MockFunction<T>;
  mockReturnValue: (value: ReturnType<T>) => MockFunction<T>;
  mockResolvedValue: (value: Awaited<ReturnType<T>>) => MockFunction<T>;
  mockRejectedValue: (error: unknown) => MockFunction<T>;
}

export interface TestContext {
  [key: string]: unknown;
}

// Типы для i18n
export interface TranslationFunction {
  (key: string, options?: UnknownRecord): string;
}

export interface I18nConfig {
  defaultLocale: string;
  locales: string[];
  fallbackLocale?: string;
}

// Типы для аналитики
export interface AnalyticsEvent {
  name: string;
  properties?: UnknownRecord;
  userId?: string;
  timestamp?: Date;
}

export interface AnalyticsConfig {
  trackingId: string;
  enabled: boolean;
  debug?: boolean;
  customDimensions?: StringRecord;
}
