import {
  ContactFormData,
  ValidationResult,
  ValidationRule,
  ValidationSchema,
} from '@/src/types/forms';

// Базовые валидаторы
export const validators = {
  required:
    (message: string = 'Поле обязательно') =>
    (value: any) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return message;
      }
      return true;
    },

  minLength: (min: number, message?: string) => (value: string) => {
    if (value && value.length < min) {
      return message || `Минимальная длина ${min} символов`;
    }
    return true;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (value && value.length > max) {
      return message || `Максимальная длина ${max} символов`;
    }
    return true;
  },

  email:
    (message: string = 'Неверный формат email') =>
    (value: string) => {
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return message;
        }
      }
      return true;
    },

  phone:
    (message: string = 'Неверный формат телефона') =>
    (value: string) => {
      if (value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return message;
        }
      }
      return true;
    },

  custom: (validator: (value: any) => boolean | string) => validator,
};

// Комбинированные валидаторы
export const combineValidators = (...rules: any[]) => {
  return (value: any) => {
    for (const rule of rules) {
      const result = rule(value);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
};

// Схема валидации для контактной формы
export const contactFormSchema: ValidationSchema<ContactFormData> = {
  name: {
    required: true,
    minLength: { value: 2, message: "Ім'я повинно містити мінімум 2 символи" },
    maxLength: { value: 50, message: "Ім'я не може перевищувати 50 символів" },
  },

  email: {
    required: true,
    email: 'Введіть коректний email',
  },

  phone: {
    pattern: { value: /^[\+]?[1-9][\d]{0,15}$/, message: 'Введіть коректний номер телефону' },
  },

  message: {
    required: true,
    minLength: { value: 10, message: 'Повідомлення повинно містити мінімум 10 символів' },
    maxLength: { value: 1000, message: 'Повідомлення не може перевищувати 1000 символів' },
  },

  company: {
    maxLength: { value: 100, message: 'Назва компанії не може перевищувати 100 символів' },
  },

  subject: {
    maxLength: { value: 200, message: 'Тема не може перевищувати 200 символів' },
  },

  consent: {
    required: 'Необхідно дати згоду на обробку даних',
    custom: (value: any) => {
      if (!value) {
        return 'Необхідно дати згоду на обробку персональних даних';
      }
      return true;
    },
  },
};

// Validation rules compatible with useForm hook
export const contactFormValidation: Partial<Record<keyof ContactFormData, ValidationRule<any>>> = {
  name: {
    required: "Ім'я обов'язкове",
    minLength: { value: 2, message: "Ім'я повинно містити мінімум 2 символи" },
    maxLength: { value: 50, message: "Ім'я не може перевищувати 50 символів" },
  },
  email: {
    required: "Email обов'язковий",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Введіть коректний email',
    },
  },
  phone: {
    pattern: {
      value: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Введіть коректний номер телефону',
    },
  },
  message: {
    required: "Повідомлення обов'язкове",
    minLength: { value: 10, message: 'Повідомлення повинно містити мінімум 10 символів' },
    maxLength: { value: 1000, message: 'Повідомлення не може перевищувати 1000 символів' },
  },
  company: {
    maxLength: { value: 100, message: 'Назва компанії не може перевищувати 100 символів' },
  },
  subject: {
    maxLength: { value: 200, message: 'Тема не може перевищувати 200 символів' },
  },
  consent: {
    required: 'Необхідно дати згоду на обробку персональних даних',
  },
};

// Function to validate contact form data
export const validateContactForm = (data: ContactFormData): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  // Validate each field using the schema
  Object.keys(contactFormValidation).forEach(key => {
    const fieldKey = key as keyof ContactFormData;
    const value = data[fieldKey];
    const error = validateField(value, contactFormValidation[fieldKey]!);

    if (error) {
      errors[fieldKey] = error;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Утилиты для валидации
export const validateField = (value: any, rules: ValidationRule<any>): string | null => {
  // Проверка required
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return typeof rules.required === 'string' ? rules.required : 'Поле обязательно';
  }

  // Если поле пустое и не обязательное, пропускаем остальные проверки
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  // Проверка pattern
  if (rules.pattern && typeof value === 'string') {
    const regex = rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.value;
    const patternMessage =
      rules.pattern instanceof RegExp ? 'Неверный формат' : rules.pattern.message;
    if (!regex.test(value)) {
      return patternMessage;
    }
  }

  // Проверка minLength
  if (rules.minLength && typeof value === 'string') {
    const minLength = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
    if (value.length < minLength) {
      return typeof rules.minLength === 'object'
        ? rules.minLength.message
        : `Минимальная длина ${minLength} символов`;
    }
  }

  // Проверка maxLength
  if (rules.maxLength && typeof value === 'string') {
    const maxLength = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
    if (value.length > maxLength) {
      return typeof rules.maxLength === 'object'
        ? rules.maxLength.message
        : `Максимальная длина ${maxLength} символов`;
    }
  }

  // Проверка min
  if (rules.min && typeof value === 'number') {
    const min = typeof rules.min === 'number' ? rules.min : rules.min.value;
    if (value < min) {
      return typeof rules.min === 'object' ? rules.min.message : `Минимальное значение ${min}`;
    }
  }

  // Проверка max
  if (rules.max && typeof value === 'number') {
    const max = typeof rules.max === 'number' ? rules.max : rules.max.value;
    if (value > max) {
      return typeof rules.max === 'object' ? rules.max.message : `Максимальное значение ${max}`;
    }
  }

  // Проверка email
  if (rules.email && typeof value === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return typeof rules.email === 'string' ? rules.email : 'Неверный формат email';
    }
  }

  // Проверка URL
  if (rules.url && typeof value === 'string') {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(value)) {
      return typeof rules.url === 'string' ? rules.url : 'Неверный формат URL';
    }
  }

  // Проверка pattern
  if (rules.pattern && typeof value === 'string') {
    const regex = rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.value;
    const patternMessage =
      rules.pattern instanceof RegExp ? 'Неверный формат' : rules.pattern.message;
    if (!regex.test(value)) {
      return patternMessage;
    }
  }

  // Проверка custom
  if (rules.custom && typeof rules.custom === 'function') {
    const result = rules.custom(value, {});
    if (result !== true) {
      return typeof result === 'string' ? result : 'Ошибка валидации';
    }
  }

  return null;
};

// Валидация всей формы
export const validateForm = async <T extends Record<string, any>>(
  data: T,
  schema: Partial<Record<keyof T, ValidationRule<any>>>
): Promise<{ isValid: boolean; errors: Partial<Record<keyof T, string>> }> => {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const key in schema) {
    const value = data[key];
    const rules = schema[key];
    if (rules) {
      const error = validateField(value, rules);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
};

// Утилиты для форматирования
export const formatters = {
  phone: (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  },

  currency: (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  },

  date: (value: Date | string, format: string = 'MM/DD/YYYY') => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString();
  },

  capitalize: (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  },

  truncate: (value: string, length: number = 50) => {
    if (value.length <= length) return value;
    return value.substring(0, length) + '...';
  },
};

// Утилиты для очистки данных
export const sanitizers = {
  trim: (value: string) => value.trim(),

  removeSpaces: (value: string) => value.replace(/\s/g, ''),

  toLowerCase: (value: string) => value.toLowerCase(),

  toUpperCase: (value: string) => value.toUpperCase(),

  removeSpecialChars: (value: string) => value.replace(/[^a-zA-Z0-9\s]/g, ''),

  normalizePhone: (value: string) => value.replace(/[^\d+]/g, ''),
};

// Экспорт всех утилит
export default {
  validators,
  validateField,
  validateForm,
  formatters,
  sanitizers,
};
