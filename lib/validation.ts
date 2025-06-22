/**
 * Advanced validation system with schema validation, sanitization, and custom rules
 */

type ValidationRule<T = any> = {
  validate: (value: T, context?: ValidationContext) => boolean | Promise<boolean>;
  message: string | ((value: T, context?: ValidationContext) => string);
  code?: string;
};

type ValidationContext = {
  field?: string;
  data?: Record<string, any>;
  path?: string[];
  [key: string]: any;
};

type ValidationError = {
  field: string;
  message: string;
  code?: string;
  value?: any;
  path?: string[];
};

type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
};

type SchemaField = {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url' | 'date';
  required?: boolean;
  rules?: ValidationRule[];
  sanitize?: (value: any) => any;
  default?: any;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any, context?: ValidationContext) => boolean | Promise<boolean>;
  nested?: Schema;
  arrayOf?: SchemaField;
};

type Schema = Record<string, SchemaField>;

/**
 * Built-in validation rules
 */
export const rules = {
  required: (): ValidationRule => ({
    validate: value => value !== null && value !== undefined && value !== '',
    message: 'This field is required',
    code: 'REQUIRED',
  }),

  minLength: (min: number): ValidationRule<string> => ({
    validate: value => typeof value === 'string' && value.length >= min,
    message: `Must be at least ${min} characters long`,
    code: 'MIN_LENGTH',
  }),

  maxLength: (max: number): ValidationRule<string> => ({
    validate: value => typeof value === 'string' && value.length <= max,
    message: `Must be no more than ${max} characters long`,
    code: 'MAX_LENGTH',
  }),

  min: (min: number): ValidationRule<number> => ({
    validate: value => typeof value === 'number' && value >= min,
    message: `Must be at least ${min}`,
    code: 'MIN_VALUE',
  }),

  max: (max: number): ValidationRule<number> => ({
    validate: value => typeof value === 'number' && value <= max,
    message: `Must be no more than ${max}`,
    code: 'MAX_VALUE',
  }),

  pattern: (regex: RegExp, message?: string): ValidationRule<string> => ({
    validate: value => typeof value === 'string' && regex.test(value),
    message: message || 'Invalid format',
    code: 'PATTERN',
  }),

  email: (): ValidationRule<string> => ({
    validate: value => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === 'string' && emailRegex.test(value);
    },
    message: 'Must be a valid email address',
    code: 'INVALID_EMAIL',
  }),

  url: (): ValidationRule<string> => ({
    validate: value => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Must be a valid URL',
    code: 'INVALID_URL',
  }),

  phone: (): ValidationRule<string> => ({
    validate: value => {
      const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/;
      return typeof value === 'string' && phoneRegex.test(value.replace(/[\s()-]/g, ''));
    },
    message: 'Must be a valid phone number',
    code: 'INVALID_PHONE',
  }),

  strongPassword: (): ValidationRule<string> => ({
    validate: value => {
      if (typeof value !== 'string') return false;
      const hasLower = /[a-z]/.test(value);
      const hasUpper = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const isLongEnough = value.length >= 8;
      return hasLower && hasUpper && hasNumber && hasSpecial && isLongEnough;
    },
    message:
      'Password must contain at least 8 characters with uppercase, lowercase, number, and special character',
    code: 'WEAK_PASSWORD',
  }),

  alphanumeric: (): ValidationRule<string> => ({
    validate: value => typeof value === 'string' && /^[a-zA-Z0-9]+$/.test(value),
    message: 'Must contain only letters and numbers',
    code: 'NOT_ALPHANUMERIC',
  }),

  numeric: (): ValidationRule<string> => ({
    validate: value => typeof value === 'string' && /^\d+$/.test(value),
    message: 'Must contain only numbers',
    code: 'NOT_NUMERIC',
  }),

  oneOf: (values: any[]): ValidationRule => ({
    validate: value => values.includes(value),
    message: `Must be one of: ${values.join(', ')}`,
    code: 'INVALID_OPTION',
  }),

  unique: (array: any[]): ValidationRule => ({
    validate: value => !array.includes(value),
    message: 'Value must be unique',
    code: 'NOT_UNIQUE',
  }),

  date: (): ValidationRule<string> => ({
    validate: value => {
      if (typeof value !== 'string') return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message: 'Must be a valid date',
    code: 'INVALID_DATE',
  }),

  futureDate: (): ValidationRule<string> => ({
    validate: value => {
      if (typeof value !== 'string') return false;
      const date = new Date(value);
      return !isNaN(date.getTime()) && date > new Date();
    },
    message: 'Date must be in the future',
    code: 'DATE_NOT_FUTURE',
  }),

  pastDate: (): ValidationRule<string> => ({
    validate: value => {
      if (typeof value !== 'string') return false;
      const date = new Date(value);
      return !isNaN(date.getTime()) && date < new Date();
    },
    message: 'Date must be in the past',
    code: 'DATE_NOT_PAST',
  }),

  creditCard: (): ValidationRule<string> => ({
    validate: value => {
      if (typeof value !== 'string') return false;
      const cleaned = value.replace(/\s/g, '');
      if (!/^\d+$/.test(cleaned)) return false;

      // Luhn algorithm
      let sum = 0;
      let isEven = false;
      for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i]);
        if (isEven) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
        isEven = !isEven;
      }
      return sum % 10 === 0;
    },
    message: 'Must be a valid credit card number',
    code: 'INVALID_CREDIT_CARD',
  }),

  ipAddress: (): ValidationRule<string> => ({
    validate: value => {
      if (typeof value !== 'string') return false;
      const ipv4Regex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
      return ipv4Regex.test(value) || ipv6Regex.test(value);
    },
    message: 'Must be a valid IP address',
    code: 'INVALID_IP',
  }),

  json: (): ValidationRule<string> => ({
    validate: value => {
      if (typeof value !== 'string') return false;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Must be valid JSON',
    code: 'INVALID_JSON',
  }),
};

/**
 * Built-in sanitizers
 */
export const sanitizers = {
  trim: (value: any) => (typeof value === 'string' ? value.trim() : value),

  toLowerCase: (value: any) => (typeof value === 'string' ? value.toLowerCase() : value),

  toUpperCase: (value: any) => (typeof value === 'string' ? value.toUpperCase() : value),

  removeSpaces: (value: any) => (typeof value === 'string' ? value.replace(/\s/g, '') : value),

  normalizeEmail: (value: any) => {
    if (typeof value !== 'string') return value;
    return value.toLowerCase().trim();
  },

  normalizePhone: (value: any) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[^\d+]/g, '');
  },

  escape: (value: any) => {
    if (typeof value !== 'string') return value;
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  stripTags: (value: any) => {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '');
  },

  toNumber: (value: any) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  },

  toBoolean: (value: any) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    return value;
  },
};

/**
 * Main Validator class
 */
class Validator {
  private schema: Schema;
  private context: ValidationContext;

  constructor(schema: Schema, context: ValidationContext = {}) {
    this.schema = schema;
    this.context = context;
  }

  /**
   * Validate data against schema
   */
  async validate(data: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const sanitizedData: any = {};

    for (const [fieldName, fieldSchema] of Object.entries(this.schema)) {
      const fieldValue = data?.[fieldName];
      const fieldContext: ValidationContext = {
        ...this.context,
        field: fieldName,
        data,
        path: [...(this.context.path || []), fieldName],
      };

      try {
        const result = await this.validateField(fieldName, fieldValue, fieldSchema, fieldContext);

        if (result.errors.length > 0) {
          errors.push(...result.errors);
        }

        if (result.value !== undefined) {
          sanitizedData[fieldName] = result.value;
        }
      } catch (error) {
        errors.push({
          field: fieldName,
          message: 'Validation error occurred',
          code: 'VALIDATION_ERROR',
          value: fieldValue,
          path: fieldContext.path,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    };
  }

  /**
   * Validate a single field
   */
  private async validateField(
    fieldName: string,
    value: any,
    schema: SchemaField,
    context: ValidationContext
  ): Promise<{ errors: ValidationError[]; value?: any }> {
    const errors: ValidationError[] = [];
    let processedValue = value;

    // Handle undefined/null values
    if (value === undefined || value === null) {
      if (schema.required) {
        errors.push({
          field: fieldName,
          message: 'This field is required',
          code: 'REQUIRED',
          value,
          path: context.path || [],
        });
        return { errors };
      }

      if (schema.default !== undefined) {
        processedValue = schema.default;
      } else {
        return { errors, value: processedValue };
      }
    }

    // Sanitize value
    if (schema.sanitize) {
      processedValue = schema.sanitize(processedValue);
    }

    // Type validation
    if (schema.type) {
      const typeError = this.validateType(fieldName, processedValue, schema.type, context);
      if (typeError) {
        errors.push(typeError);
        return { errors };
      }
    }

    // Built-in validations
    if (schema.min !== undefined) {
      if (typeof processedValue === 'number' && processedValue < schema.min) {
        errors.push({
          field: fieldName,
          message: `Must be at least ${schema.min}`,
          code: 'MIN_VALUE',
          value: processedValue,
          path: context.path || [],
        });
      } else if (typeof processedValue === 'string' && processedValue.length < schema.min) {
        errors.push({
          field: fieldName,
          message: `Must be at least ${schema.min} characters long`,
          code: 'MIN_LENGTH',
          value: processedValue,
          path: context.path || [],
        });
      }
    }

    if (schema.max !== undefined) {
      if (typeof processedValue === 'number' && processedValue > schema.max) {
        errors.push({
          field: fieldName,
          message: `Must be no more than ${schema.max}`,
          code: 'MAX_VALUE',
          value: processedValue,
          path: context.path || [],
        });
      } else if (typeof processedValue === 'string' && processedValue.length > schema.max) {
        errors.push({
          field: fieldName,
          message: `Must be no more than ${schema.max} characters long`,
          code: 'MAX_LENGTH',
          value: processedValue,
          path: context.path || [],
        });
      }
    }

    if (schema.pattern && typeof processedValue === 'string') {
      if (!schema.pattern.test(processedValue)) {
        errors.push({
          field: fieldName,
          message: 'Invalid format',
          code: 'PATTERN',
          value: processedValue,
          path: context.path || [],
        });
      }
    }

    if (schema.enum && !schema.enum.includes(processedValue)) {
      errors.push({
        field: fieldName,
        message: `Must be one of: ${schema.enum.join(', ')}`,
        code: 'INVALID_OPTION',
        value: processedValue,
        path: context.path || [],
      });
    }

    // Custom validation rules
    if (schema.rules) {
      for (const rule of schema.rules) {
        const isValid = await rule.validate(processedValue, context);
        if (!isValid) {
          const message =
            typeof rule.message === 'function'
              ? rule.message(processedValue, context)
              : rule.message;

          errors.push({
            field: fieldName,
            message,
            code: rule.code,
            value: processedValue,
            path: context.path || [],
          });
        }
      }
    }

    // Custom validation function
    if (schema.custom) {
      const isValid = await schema.custom(processedValue, context);
      if (!isValid) {
        errors.push({
          field: fieldName,
          message: 'Custom validation failed',
          code: 'CUSTOM_VALIDATION',
          value: processedValue,
          path: context.path || [],
        });
      }
    }

    // Nested object validation
    if (schema.nested && typeof processedValue === 'object' && processedValue !== null) {
      const nestedValidator = new Validator(schema.nested, context);
      const nestedResult = await nestedValidator.validate(processedValue);

      if (!nestedResult.isValid) {
        errors.push(...nestedResult.errors);
      } else if (nestedResult.sanitizedData) {
        processedValue = nestedResult.sanitizedData;
      }
    }

    // Array validation
    if (schema.arrayOf && Array.isArray(processedValue)) {
      const arrayErrors: ValidationError[] = [];
      const sanitizedArray: any[] = [];

      for (let i = 0; i < processedValue.length; i++) {
        const itemContext: ValidationContext = {
          ...context,
          path: [...(context.path || []), i.toString()],
        };

        const itemResult = await this.validateField(
          `${fieldName}[${i}]`,
          processedValue[i],
          schema.arrayOf,
          itemContext
        );

        if (itemResult.errors.length > 0) {
          arrayErrors.push(...itemResult.errors);
        } else {
          sanitizedArray.push(itemResult.value);
        }
      }

      if (arrayErrors.length > 0) {
        errors.push(...arrayErrors);
      } else {
        processedValue = sanitizedArray;
      }
    }

    return { errors, value: processedValue };
  }

  /**
   * Validate type
   */
  private validateType(
    fieldName: string,
    value: any,
    expectedType: string,
    context: ValidationContext
  ): ValidationError | null {
    let isValid = false;

    switch (expectedType) {
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'number':
        isValid = typeof value === 'number' && !isNaN(value);
        break;
      case 'boolean':
        isValid = typeof value === 'boolean';
        break;
      case 'array':
        isValid = Array.isArray(value);
        break;
      case 'object':
        isValid = typeof value === 'object' && value !== null && !Array.isArray(value);
        break;
      case 'email':
        isValid = typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'url':
        try {
          new URL(value);
          isValid = true;
        } catch {
          isValid = false;
        }
        break;
      case 'date':
        isValid = !isNaN(new Date(value).getTime());
        break;
      default:
        isValid = true;
    }

    if (!isValid) {
      return {
        field: fieldName,
        message: `Must be a valid ${expectedType}`,
        code: 'INVALID_TYPE',
        value,
        path: context.path || [],
      };
    }

    return null;
  }
}

/**
 * Create validator instance
 */
export function createValidator(schema: Schema, context?: ValidationContext): Validator {
  return new Validator(schema, context);
}

/**
 * Quick validation function
 */
export async function validate(
  data: any,
  schema: Schema,
  context?: ValidationContext
): Promise<ValidationResult> {
  const validator = createValidator(schema, context);
  return validator.validate(data);
}

/**
 * Validation middleware for forms
 */
export function validateForm(schema: Schema) {
  return async (data: any): Promise<ValidationResult> => {
    return validate(data, schema, { source: 'form' });
  };
}

/**
 * Validation middleware for API requests
 */
export function validateRequest(schema: Schema) {
  return async (data: any): Promise<ValidationResult> => {
    return validate(data, schema, { source: 'api' });
  };
}

// Export types
export type {
  Schema,
  SchemaField,
  ValidationContext,
  ValidationError,
  ValidationResult,
  ValidationRule,
};

export { Validator };
