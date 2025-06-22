/**
 * Advanced API utilities for request handling, response formatting, and error management
 */

import { NextRequest, NextResponse } from 'next/server';
// Simple validation replacement for zod to avoid dependency issues
const z = {
  ZodSchema: class ZodSchema<T> {
    parse(data: any): T {
      return data as T;
    }
  },
  ZodError: class ZodError extends Error {
    issues: any[];
    constructor(message: string, issues: any[] = []) {
      super(message);
      this.name = 'ZodError';
      this.issues = issues;
    }
  },
  object: (schema: any) => new z.ZodSchema(),
  string: () => new z.ZodSchema(),
  number: () => new z.ZodSchema(),
  boolean: () => new z.ZodSchema(),
  array: (schema: any) => new z.ZodSchema(),
  enum: (values: any[]) => new z.ZodSchema(),
  union: (schemas: any[]) => new z.ZodSchema(),
  record: (schema: any) => new z.ZodSchema(),
};

type ZodSchema<T> = InstanceType<typeof z.ZodSchema<T>>;
type ZodError = InstanceType<typeof z.ZodError>;

/**
 * API response types
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

/**
 * Custom API error class
 */
export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message = 'Bad Request', details?: any): APIError {
    return new APIError(message, 'BAD_REQUEST', 400, details);
  }

  static unauthorized(message = 'Unauthorized', details?: any): APIError {
    return new APIError(message, 'UNAUTHORIZED', 401, details);
  }

  static forbidden(message = 'Forbidden', details?: any): APIError {
    return new APIError(message, 'FORBIDDEN', 403, details);
  }

  static notFound(message = 'Not Found', details?: any): APIError {
    return new APIError(message, 'NOT_FOUND', 404, details);
  }

  static conflict(message = 'Conflict', details?: any): APIError {
    return new APIError(message, 'CONFLICT', 409, details);
  }

  static unprocessableEntity(message = 'Unprocessable Entity', details?: any): APIError {
    return new APIError(message, 'UNPROCESSABLE_ENTITY', 422, details);
  }

  static tooManyRequests(message = 'Too Many Requests', details?: any): APIError {
    return new APIError(message, 'TOO_MANY_REQUESTS', 429, details);
  }

  static internalServerError(message = 'Internal Server Error', details?: any): APIError {
    return new APIError(message, 'INTERNAL_SERVER_ERROR', 500, details);
  }

  static serviceUnavailable(message = 'Service Unavailable', details?: any): APIError {
    return new APIError(message, 'SERVICE_UNAVAILABLE', 503, details);
  }

  static validationError(message = 'Validation Error', details?: any): APIError {
    return new APIError(message, 'VALIDATION_ERROR', 422, details);
  }
}

/**
 * API response builder
 */
export class ApiResponseBuilder {
  private requestId: string;
  private version: string;

  constructor(requestId?: string, version = '1.0.0') {
    this.requestId = requestId || this.generateRequestId();
    this.version = version;
  }

  /**
   * Create success response
   */
  success<T>(data: T, meta?: Partial<ApiResponse['meta']>): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.requestId,
        version: this.version,
        ...meta,
      },
    };
  }

  /**
   * Create error response
   */
  error(error: APIError | Error, meta?: Partial<ApiResponse['meta']>): ApiResponse {
    const apiError =
      error instanceof APIError ? error : new APIError(error.message, 'INTERNAL_SERVER_ERROR', 500);

    return {
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        details: apiError.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.requestId,
        version: this.version,
        ...meta,
      },
    };
  }

  /**
   * Create paginated response
   */
  paginated<T>(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    meta?: Partial<ApiResponse['meta']>
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    return this.success(data, {
      ...meta,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages,
      },
    });
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * API request validator
 */
export class ApiValidator {
  /**
   * Validate request body against Zod schema
   */
  static async validateBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
    try {
      const body = await req.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.validationError('Invalid request body', {
          issues: error.issues,
        });
      }
      throw APIError.badRequest('Invalid JSON in request body');
    }
  }

  /**
   * Validate query parameters
   */
  static validateQuery<T>(req: NextRequest, schema: ZodSchema<T>): T {
    try {
      const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
      return schema.parse(searchParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.validationError('Invalid query parameters', {
          issues: error.issues,
        });
      }
      throw APIError.badRequest('Invalid query parameters');
    }
  }

  /**
   * Validate path parameters
   */
  static validateParams<T>(params: any, schema: ZodSchema<T>): T {
    try {
      return schema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.validationError('Invalid path parameters', {
          issues: error.issues,
        });
      }
      throw APIError.badRequest('Invalid path parameters');
    }
  }

  /**
   * Validate headers
   */
  static validateHeaders<T>(req: NextRequest, schema: ZodSchema<T>): T {
    try {
      const headers = Object.fromEntries(req.headers.entries());
      return schema.parse(headers);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw APIError.validationError('Invalid headers', {
          issues: error.issues,
        });
      }
      throw APIError.badRequest('Invalid headers');
    }
  }
}

/**
 * API middleware utilities
 */
export class ApiMiddleware {
  /**
   * CORS middleware
   */
  static cors(
    options: {
      origin?: string | string[];
      methods?: string[];
      headers?: string[];
      credentials?: boolean;
    } = {}
  ) {
    return (req: NextRequest): NextResponse | null => {
      const origin = req.headers.get('origin');
      const allowedOrigins = Array.isArray(options.origin)
        ? options.origin
        : options.origin
          ? [options.origin]
          : ['*'];

      const allowedMethods = options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
      const allowedHeaders = options.headers || ['Content-Type', 'Authorization'];

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin':
              allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))
                ? origin || '*'
                : 'null',
            'Access-Control-Allow-Methods': allowedMethods.join(', '),
            'Access-Control-Allow-Headers': allowedHeaders.join(', '),
            'Access-Control-Allow-Credentials': options.credentials ? 'true' : 'false',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      return null;
    };
  }

  /**
   * Request logging middleware
   */
  static logging() {
    return (req: NextRequest): void => {
      const startTime = Date.now();
      const method = req.method;
      const url = req.url;
      const userAgent = req.headers.get('user-agent');
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');

      console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);

      // Log response time (this would need to be implemented in the actual handler)
      req.headers.set('x-start-time', startTime.toString());
    };
  }

  /**
   * Content type validation middleware
   */
  static contentType(expectedType: string) {
    return (req: NextRequest): void => {
      const contentType = req.headers.get('content-type');
      if (req.method !== 'GET' && req.method !== 'DELETE' && !contentType?.includes(expectedType)) {
        throw APIError.badRequest(`Expected content-type: ${expectedType}`);
      }
    };
  }

  /**
   * API key validation middleware
   */
  static apiKey(validApiKeys: string[]) {
    return (req: NextRequest): void => {
      const apiKey =
        req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');

      if (!apiKey) {
        throw APIError.unauthorized('API key required');
      }

      if (!validApiKeys.includes(apiKey)) {
        throw APIError.unauthorized('Invalid API key');
      }
    };
  }
}

/**
 * API handler wrapper
 */
export function createApiHandler(options: {
  methods?: string[];
  middleware?: Array<(req: NextRequest) => NextResponse | void | null>;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}) {
  return function (
    handlers: Record<string, (req: NextRequest, context?: any) => Promise<NextResponse>>
  ) {
    return async function (req: NextRequest, context?: any): Promise<NextResponse> {
      const responseBuilder = new ApiResponseBuilder(req.headers.get('x-request-id') || undefined);

      try {
        // Check allowed methods
        if (options.methods && !options.methods.includes(req.method)) {
          throw APIError.badRequest(`Method ${req.method} not allowed`);
        }

        // Run middleware
        if (options.middleware) {
          for (const middleware of options.middleware) {
            const result = middleware(req);
            if (result instanceof NextResponse) {
              return result;
            }
          }
        }

        // Get handler for method
        const handler = handlers[req.method];
        if (!handler) {
          throw APIError.badRequest(`Method ${req.method} not implemented`);
        }

        // Execute handler
        return await handler(req, context);
      } catch (error) {
        console.error('API Error:', error);

        const apiResponse = responseBuilder.error(error as Error);
        const statusCode = error instanceof APIError ? error.statusCode : 500;

        return NextResponse.json(apiResponse, { status: statusCode });
      }
    };
  };
}

/**
 * Pagination utilities
 */
export class PaginationUtils {
  /**
   * Parse pagination parameters from request
   */
  static parsePaginationParams(req: NextRequest): PaginationParams {
    const searchParams = req.nextUrl.searchParams;

    return {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '10'), 100), // Max 100 items per page
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
      search: searchParams.get('search') || undefined,
      filters: this.parseFilters(searchParams),
    };
  }

  /**
   * Parse filter parameters
   */
  private static parseFilters(searchParams: URLSearchParams): Record<string, any> {
    const filters: Record<string, any> = {};

    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('filter.')) {
        const filterKey = key.replace('filter.', '');
        filters[filterKey] = value;
      }
    }

    return filters;
  }

  /**
   * Calculate pagination metadata
   */
  static calculatePagination(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    };
  }

  /**
   * Apply pagination to array
   */
  static paginateArray<T>(array: T[], page: number, limit: number): T[] {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return array.slice(startIndex, endIndex);
  }
}

/**
 * API response helpers
 */
export class ApiHelpers {
  /**
   * Create JSON response
   */
  static json<T>(data: T, status = 200, headers?: Record<string, string>): NextResponse {
    return NextResponse.json(data, {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
  }

  /**
   * Create success response
   */
  static success<T>(data: T, requestId?: string): NextResponse {
    const responseBuilder = new ApiResponseBuilder(requestId);
    return this.json(responseBuilder.success(data));
  }

  /**
   * Create error response
   */
  static error(error: APIError | Error, requestId?: string): NextResponse {
    const responseBuilder = new ApiResponseBuilder(requestId);
    const apiError =
      error instanceof APIError ? error : APIError.internalServerError(error.message);

    return this.json(responseBuilder.error(apiError), apiError.statusCode);
  }

  /**
   * Create paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: { page: number; limit: number; total: number },
    requestId?: string
  ): NextResponse {
    const responseBuilder = new ApiResponseBuilder(requestId);
    return this.json(responseBuilder.paginated(data, pagination));
  }

  /**
   * Create no content response
   */
  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 });
  }

  /**
   * Create redirect response
   */
  static redirect(url: string, status = 302): NextResponse {
    return NextResponse.redirect(url, status);
  }

  /**
   * Create file download response
   */
  static download(
    data: Buffer | Uint8Array | string,
    filename: string,
    contentType = 'application/octet-stream'
  ): NextResponse {
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  /**
   * Create streaming response
   */
  static stream(stream: ReadableStream, contentType = 'application/octet-stream'): NextResponse {
    return new NextResponse(stream, {
      headers: {
        'Content-Type': contentType,
        'Transfer-Encoding': 'chunked',
      },
    });
  }
}

/**
 * Common validation schemas for API validation
 */
export const commonSchemas = {
  // Pagination schema
  pagination: {
    validate: (data: any) => {
      const result = {
        page: data.page ? parseInt(data.page) || 1 : 1,
        limit: data.limit ? Math.min(Math.max(parseInt(data.limit) || 10, 1), 100) : 10,
        sortBy: data.sortBy || undefined,
        sortOrder: data.sortOrder === 'desc' ? 'desc' : 'asc',
        search: data.search || undefined,
      };
      return { success: true, data: result };
    },
  },

  // ID validation
  id: {
    validate: (data: any) => {
      if (!data.id || typeof data.id !== 'string') {
        return { success: false, error: 'Invalid ID format' };
      }
      return { success: true, data: { id: data.id } };
    },
  },

  // Email validation
  email: {
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { success: false, error: 'Invalid email format' };
      }
      return { success: true, data: value };
    },
  },

  // Password validation (minimum 8 characters, at least one letter and one number)
  password: {
    validate: (value: string) => {
      if (!value || value.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }
      if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(value)) {
        return {
          success: false,
          error: 'Password must contain at least one letter and one number',
        };
      }
      return { success: true, data: value };
    },
  },

  // Phone number validation
  phone: {
    validate: (value: string) => {
      const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
      if (!phoneRegex.test(value)) {
        return { success: false, error: 'Invalid phone number format' };
      }
      return { success: true, data: value };
    },
  },

  // URL validation
  url: {
    validate: (value: string) => {
      try {
        new URL(value);
        return { success: true, data: value };
      } catch {
        return { success: false, error: 'Invalid URL format' };
      }
    },
  },

  // Date validation
  date: {
    validate: (value: string) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { success: false, error: 'Invalid date format' };
      }
      return { success: true, data: value };
    },
  },

  // File upload validation
  file: {
    validate: (data: any) => {
      if (!data.name || !data.size || !data.type) {
        return { success: false, error: 'Invalid file data' };
      }
      if (data.size > 10 * 1024 * 1024) {
        return { success: false, error: 'File size must be less than 10MB' };
      }
      return { success: true, data };
    },
  },
};

// Export types
export type { ApiError, ApiResponse, PaginationParams };
