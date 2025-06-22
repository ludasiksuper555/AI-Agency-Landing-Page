/**
 * Типы для API интерфейсов
 */

// Базовые типы запросов
export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Типы для аутентификации
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

// Типы для контактной формы API
export interface ContactSubmissionRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
  company?: string;
  subject?: string;
  source?: string;
}

export interface ContactSubmissionResponse {
  id: string;
  status: 'pending' | 'processed' | 'replied';
  submittedAt: Date;
  estimatedResponseTime?: string;
}

// Типы для MGX API
export interface MGXApiConfig {
  baseUrl: string;
  apiKey: string;
  version: string;
  timeout: number;
}

export interface MGXDataRequest {
  industry: string;
  dataTypes: string[];
  dateRange: {
    from: Date;
    to: Date;
  };
  filters?: Record<string, any>;
}

export interface MGXDataResponse {
  data: any[];
  metadata: {
    total: number;
    processed: number;
    lastUpdated: Date;
  };
  analytics: {
    trends: Record<string, number>;
    predictions: Record<string, any>;
  };
}

// Типы для файлового API
export interface FileUploadRequest {
  file: File;
  category: string;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

// Типы для поиска
export interface SearchRequest {
  query: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResponse<T> {
  results: T[];
  total: number;
  facets?: Record<string, any>;
  suggestions?: string[];
  searchTime: number;
}

// Типы для аналитики
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface AnalyticsResponse {
  events: AnalyticsEvent[];
  metrics: Record<string, number>;
  insights: {
    topEvents: string[];
    userBehavior: Record<string, any>;
    performance: Record<string, number>;
  };
}
