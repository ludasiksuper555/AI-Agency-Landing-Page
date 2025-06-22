const Joi = require('joi');
const logger = require('./logger');

// Common validation schemas
const schemas = {
  // User validation
  userId: Joi.number().integer().positive().required(),
  username: Joi.string().alphanum().min(3).max(30),

  // Search parameters
  searchQuery: Joi.string().min(3).max(200).required(),
  platform: Joi.string().valid('upwork', 'freelancer', 'fiverr').required(),
  budget: Joi.object({
    min: Joi.number().min(0),
    max: Joi.number().min(0),
    currency: Joi.string().length(3).uppercase().default('USD')
  }),

  // Project data
  project: Joi.object({
    id: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    budget: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number().min(0),
      currency: Joi.string().length(3).uppercase().default('USD')
    }),
    skills: Joi.array().items(Joi.string()),
    platform: Joi.string().valid('upwork', 'freelancer', 'fiverr').required(),
    url: Joi.string().uri(),
    postedDate: Joi.date(),
    deadline: Joi.date(),
    clientInfo: Joi.object({
      name: Joi.string(),
      rating: Joi.number().min(0).max(5),
      reviewsCount: Joi.number().min(0),
      location: Joi.string(),
      verified: Joi.boolean()
    })
  }),

  // Proposal data
  proposal: Joi.object({
    projectId: Joi.string().required(),
    platform: Joi.string().valid('upwork', 'freelancer', 'fiverr').required(),
    content: Joi.string().min(50).max(5000).required(),
    budget: Joi.number().min(0),
    timeline: Joi.string(),
    attachments: Joi.array().items(Joi.string().uri())
  }),

  // Settings validation
  userSettings: Joi.object({
    searchKeywords: Joi.array().items(Joi.string().min(2).max(50)).max(20),
    excludeKeywords: Joi.array().items(Joi.string().min(2).max(50)).max(10),
    budgetRange: Joi.object({
      min: Joi.number().min(0),
      max: Joi.number().min(0),
      currency: Joi.string().length(3).uppercase().default('USD')
    }),
    platforms: Joi.array()
      .items(Joi.string().valid('upwork', 'freelancer', 'fiverr'))
      .min(1),
    autoApply: Joi.boolean().default(false),
    maxApplicationsPerDay: Joi.number().integer().min(1).max(50).default(10),
    workingHours: Joi.object({
      start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      timezone: Joi.string().default('UTC')
    }),
    notifications: Joi.object({
      newProjects: Joi.boolean().default(true),
      proposalSent: Joi.boolean().default(true),
      clientResponse: Joi.boolean().default(true),
      dailyReport: Joi.boolean().default(true)
    }),
    language: Joi.string().valid('en', 'uk', 'ru').default('en')
  }),

  // API configuration
  apiConfig: Joi.object({
    platform: Joi.string().valid('upwork', 'freelancer', 'fiverr', 'openai').required(),
    apiKey: Joi.string().required(),
    baseUrl: Joi.string().uri(),
    rateLimit: Joi.object({
      requests: Joi.number().integer().min(1),
      window: Joi.number().integer().min(1000) // milliseconds
    }),
    timeout: Joi.number().integer().min(1000).max(60000).default(30000)
  }),

  // Cron job configuration
  cronConfig: Joi.object({
    schedule: Joi.string().required(),
    enabled: Joi.boolean().default(true),
    timezone: Joi.string().default('UTC'),
    maxRetries: Joi.number().integer().min(0).max(5).default(3)
  })
};

// Validation functions
class ValidationService {
  static validate(data, schemaName, options = {}) {
    try {
      const schema = schemas[schemaName];
      if (!schema) {
        throw new Error(`Schema '${schemaName}' not found`);
      }

      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        ...options
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Validation failed', {
          schema: schemaName,
          errors: errorDetails,
          data: JSON.stringify(data).substring(0, 500)
        });

        return {
          isValid: false,
          errors: errorDetails,
          value: null
        };
      }

      return {
        isValid: true,
        errors: [],
        value
      };
    } catch (error) {
      logger.error('Validation error', {
        schema: schemaName,
        error: error.message,
        data: JSON.stringify(data).substring(0, 500)
      });

      return {
        isValid: false,
        errors: [{ field: 'general', message: error.message }],
        value: null
      };
    }
  }

  static validateSearchParams(params) {
    const searchSchema = Joi.object({
      query: schemas.searchQuery,
      platform: schemas.platform,
      budget: schemas.budget.optional(),
      skills: Joi.array().items(Joi.string()).max(10),
      location: Joi.string().max(100),
      experienceLevel: Joi.string().valid('entry', 'intermediate', 'expert'),
      projectType: Joi.string().valid('fixed', 'hourly'),
      sortBy: Joi.string().valid('relevance', 'date', 'budget').default('relevance'),
      limit: Joi.number().integer().min(1).max(100).default(20)
    });

    return this.validate(params, null, { schema: searchSchema });
  }

  static validateProposalData(data) {
    const proposalSchema = Joi.object({
      projectId: Joi.string().required(),
      platform: schemas.platform,
      content: Joi.string().min(50).max(5000).required(),
      budget: Joi.number().min(0),
      timeline: Joi.string().max(200),
      coverLetter: Joi.string().max(1000),
      attachments: Joi.array().items(Joi.string().uri()).max(5),
      questions: Joi.array()
        .items(
          Joi.object({
            question: Joi.string().required(),
            answer: Joi.string().required()
          })
        )
        .max(10)
    });

    return this.validate(data, null, { schema: proposalSchema });
  }

  static validateUserInput(input, type = 'general') {
    const inputSchemas = {
      general: Joi.string().min(1).max(1000).required(),
      command: Joi.string()
        .pattern(/^\/[a-zA-Z_]+/)
        .required(),
      callback: Joi.string()
        .pattern(/^[a-zA-Z0-9_:]+$/)
        .required(),
      url: Joi.string().uri().required(),
      email: Joi.string().email().required(),
      phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required()
    };

    const schema = inputSchemas[type] || inputSchemas.general;
    return this.validate(input, null, { schema });
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    // Remove potentially dangerous characters
    return input
      .replace(/[<>"'&]/g, '') // Remove HTML/XML characters
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
      .substring(0, 10000); // Limit length
  }

  static sanitizeObject(obj, maxDepth = 5, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      return '[Max depth reached]';
    }

    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeInput(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.slice(0, 100).map(item => this.sanitizeObject(item, maxDepth, currentDepth + 1));
    }

    if (typeof obj === 'object') {
      const sanitized = {};
      const keys = Object.keys(obj).slice(0, 50); // Limit number of keys

      for (const key of keys) {
        const sanitizedKey = this.sanitizeInput(key);
        sanitized[sanitizedKey] = this.sanitizeObject(obj[key], maxDepth, currentDepth + 1);
      }

      return sanitized;
    }

    return String(obj).substring(0, 1000);
  }

  static validateApiResponse(response, expectedFields = []) {
    if (!response || typeof response !== 'object') {
      return {
        isValid: false,
        errors: [{ field: 'response', message: 'Invalid response format' }]
      };
    }

    const errors = [];

    for (const field of expectedFields) {
      if (!(field in response)) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateEnvironmentVariables(requiredVars = []) {
    const missing = [];
    const invalid = [];

    for (const varName of requiredVars) {
      const value = process.env[varName];

      if (!value) {
        missing.push(varName);
        continue;
      }

      // Validate specific environment variables
      switch (varName) {
        case 'BOT_TOKEN':
          if (!value.match(/^\d+:[A-Za-z0-9_-]+$/)) {
            invalid.push({ var: varName, reason: 'Invalid bot token format' });
          }
          break;

        case 'ADMIN_ID':
          if (!value.match(/^\d+$/)) {
            invalid.push({ var: varName, reason: 'Admin ID must be numeric' });
          }
          break;

        case 'MONGODB_URI':
        case 'REDIS_URL':
          try {
            new URL(value);
          } catch {
            invalid.push({ var: varName, reason: 'Invalid URL format' });
          }
          break;

        case 'PORT':
          const port = parseInt(value);
          if (isNaN(port) || port < 1 || port > 65535) {
            invalid.push({ var: varName, reason: 'Port must be between 1 and 65535' });
          }
          break;
      }
    }

    return {
      isValid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid
    };
  }

  static createCustomSchema(definition) {
    try {
      return Joi.object(definition);
    } catch (error) {
      logger.error('Failed to create custom schema', {
        definition: JSON.stringify(definition),
        error: error.message
      });
      throw new Error('Invalid schema definition');
    }
  }

  static addSchema(name, schema) {
    if (schemas[name]) {
      logger.warn(`Schema '${name}' already exists, overwriting`);
    }

    schemas[name] = schema;
    logger.debug(`Schema '${name}' added successfully`);
  }

  static getSchema(name) {
    return schemas[name] || null;
  }

  static listSchemas() {
    return Object.keys(schemas);
  }
}

// Error handling utilities
class ErrorHandler {
  static handleValidationError(error, context = {}) {
    logger.warn('Validation error occurred', {
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    });

    return {
      type: 'validation_error',
      message: 'Invalid input data',
      details: error.details || [],
      context
    };
  }

  static handleApiError(error, service, endpoint) {
    logger.error('API error occurred', {
      service,
      endpoint,
      error: error.message,
      status: error.status || error.statusCode,
      timestamp: new Date().toISOString()
    });

    return {
      type: 'api_error',
      message: `${service} API error`,
      service,
      endpoint,
      status: error.status || error.statusCode || 500
    };
  }

  static handleDatabaseError(error, operation) {
    logger.error('Database error occurred', {
      operation,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    return {
      type: 'database_error',
      message: 'Database operation failed',
      operation,
      retryable: this.isRetryableError(error)
    };
  }

  static isRetryableError(error) {
    const retryableCodes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'NETWORK_ERROR'
    ];

    return retryableCodes.includes(error.code) || (error.status >= 500 && error.status < 600);
  }
}

module.exports = {
  ValidationService,
  ErrorHandler,
  schemas
};
