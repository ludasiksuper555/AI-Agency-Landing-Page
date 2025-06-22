/**
 * Configuration management for the application
 */

// Custom validation functions to replace zod
function validateConfig(config: any): Config {
  // Basic validation - in a real app you'd want more thorough validation
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid configuration object');
  }
  return config as Config;
}

interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  connectionLimit?: number;
  acquireTimeout?: number;
  timeout?: number;
  reconnect?: boolean;
  pool?: {
    min: number;
    max: number;
    idle: number;
  };
}

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  keepAlive?: number;
  family?: number;
  connectTimeout?: number;
  commandTimeout?: number;
  retryDelayOnClusterDown?: number;
  enableOfflineQueue?: boolean;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
  algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
}

interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sendgrid?: {
    apiKey: string;
  };
  mailgun?: {
    apiKey: string;
    domain: string;
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  from: {
    name: string;
    email: string;
  };
  templates: {
    welcome: string;
    resetPassword: string;
    emailVerification: string;
  };
}

interface UploadConfig {
  maxFileSize: number;
  maxFiles: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  uploadPath: string;
  tempPath: string;
  provider: 'local' | 's3' | 'gcs' | 'azure';
  image: {
    maxWidth: number;
    maxHeight: number;
    quality: number;
    formats: string[];
    enableProcessing: boolean;
    preserveOriginal: boolean;
    generateThumbnails: boolean;
    thumbnailSizes: Array<{
      width: number;
      height: number;
      suffix: string;
    }>;
  };
}

interface StorageConfig {
  provider: 'local' | 's3' | 'gcs' | 'azure';
  local?: {
    uploadPath: string;
    allowedTypes: string[];
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
  gcs?: {
    bucket: string;
    projectId: string;
    keyFilename: string;
  };
  azure?: {
    connectionString: string;
    containerName: string;
  };
  cdn?: {
    baseUrl: string;
    enabled: boolean;
  };
  allowedTypes: string[];
  maxFileSize: number;
}

interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  cors: {
    enabled: boolean;
    origin: string | string[];
    credentials: boolean;
    allowedMethods: string[];
    allowedHeaders: string[];
  };
  helmet: {
    enabled: boolean;
    contentSecurityPolicy: boolean;
    hsts: boolean;
    xssFilter: boolean;
  };
  encryption: {
    algorithm: string;
    key: string;
    iv: string;
  };
}

interface MonitoringConfig {
  enabled: boolean;
  sentry?: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  };
  datadog?: {
    apiKey: string;
    appKey: string;
    env: string;
  };
  googleAnalytics?: {
    trackingId: string;
  };
  customWebhook?: {
    url: string;
    headers: Record<string, string>;
  };
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
  logFilePath: string;
  enableMetrics: boolean;
  metricsPort: number;
  enableHealthCheck: boolean;
  healthCheckPath: string;
}

interface AppConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  homepage: string;
  repository: {
    type: string;
    url: string;
  };
  bugs: {
    url: string;
    email: string;
  };
}

/**
 * Main configuration interface
 */
interface Config {
  env: 'development' | 'production' | 'test';
  port: number;
  host: string;
  apiPrefix: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  email: EmailConfig;
  upload: UploadConfig;
  storage: StorageConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
  app: AppConfig;
}

/**
 * Default configuration values
 */
const defaultConfig: Partial<Config> = {
  env: 'development',
  port: 3000,
  host: 'localhost',
  apiPrefix: '/api/v1',
  database: {
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'password',
    database: 'myapp',
    ssl: false,
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    pool: {
      min: 2,
      max: 10,
      idle: 10000,
    },
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 0,
    keyPrefix: 'myapp:',
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    connectTimeout: 10000,
    commandTimeout: 5000,
    enableOfflineQueue: false,
  },
  jwt: {
    secret: 'your-secret-key',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
    issuer: 'myapp',
    audience: 'myapp-users',
    algorithm: 'HS256',
  },
};

/**
 * Load and validate configuration
 */
export function loadConfig(): Config {
  const config = {
    ...defaultConfig,
    env: (process.env.NODE_ENV as Config['env']) || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    database: {
      ...defaultConfig.database!,
      host: process.env.DB_HOST || defaultConfig.database!.host,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || defaultConfig.database!.username,
      password: process.env.DB_PASSWORD || defaultConfig.database!.password,
      database: process.env.DB_NAME || defaultConfig.database!.database,
      ssl: process.env.DB_SSL === 'true',
    },
    redis: {
      ...defaultConfig.redis!,
      host: process.env.REDIS_HOST || defaultConfig.redis!.host,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    jwt: {
      ...defaultConfig.jwt!,
      secret: process.env.JWT_SECRET || defaultConfig.jwt!.secret,
      expiresIn: process.env.JWT_EXPIRES_IN || defaultConfig.jwt!.expiresIn,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || defaultConfig.jwt!.refreshExpiresIn,
    },
  };

  // Remove undefined values
  const cleanConfig = JSON.parse(JSON.stringify(config));

  return validateConfig(cleanConfig);
}

/**
 * Get configuration value by path
 */
export function getConfigValue<T>(path: string, defaultValue?: T): T {
  const config = loadConfig();
  const keys = path.split('.');
  let value: any = config;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue as T;
    }
  }

  return value as T;
}

/**
 * Utility function to flatten nested objects
 */
function flattenObject(obj: any, prefix = '', result: any = {}): any {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

export type {
  AppConfig,
  Config,
  DatabaseConfig,
  EmailConfig,
  JWTConfig,
  MonitoringConfig,
  RedisConfig,
  SecurityConfig,
  StorageConfig,
  UploadConfig,
};
export default loadConfig;
