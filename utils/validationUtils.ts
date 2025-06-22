/**
 * Validation utility functions
 * Утиліти для валідації даних
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Валідує email адресу
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push("Email є обов'язковим");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Невірний формат email');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Валідує номер телефону
 */
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];

  if (!phone) {
    errors.push("Номер телефону є обов'язковим");
  } else {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 12) {
      errors.push('Невірний формат номера телефону');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Валідує пароль
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push("Пароль є обов'язковим");
  } else {
    if (password.length < 8) {
      errors.push('Пароль повинен містити принаймні 8 символів');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Пароль повинен містити принаймні одну велику літеру');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Пароль повинен містити принаймні одну малу літеру');
    }
    if (!/\d/.test(password)) {
      errors.push('Пароль повинен містити принаймні одну цифру');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Пароль повинен містити принаймні один спеціальний символ');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Валідує URL
 */
export const validateUrl = (url: string): ValidationResult => {
  const errors: string[] = [];

  if (!url) {
    errors.push("URL є обов'язковим");
  } else {
    try {
      new URL(url);
    } catch {
      errors.push('Невірний формат URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Валідує обов'язкове поле
 */
export const validateRequired = (value: unknown, fieldName: string): ValidationResult => {
  const errors: string[] = [];

  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} є обов\'язковим`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Валідує довжину рядка
 */
export const validateLength = (
  value: string,
  min: number,
  max: number,
  fieldName: string
): ValidationResult => {
  const errors: string[] = [];

  if (value.length < min) {
    errors.push(`${fieldName} повинно містити принаймні ${min} символів`);
  }

  if (value.length > max) {
    errors.push(`${fieldName} не повинно перевищувати ${max} символів`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Валідує числове значення
 */
export const validateNumber = (
  value: unknown,
  min?: number,
  max?: number,
  fieldName = 'Значення'
): ValidationResult => {
  const errors: string[] = [];

  const num = Number(value);
  if (isNaN(num)) {
    errors.push(`${fieldName} повинно бути числом`);
  } else {
    if (min !== undefined && num < min) {
      errors.push(`${fieldName} повинно бути не менше ${min}`);
    }
    if (max !== undefined && num > max) {
      errors.push(`${fieldName} повинно бути не більше ${max}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Валідує дату
 */
export const validateDate = (date: unknown, fieldName = 'Дата'): ValidationResult => {
  const errors: string[] = [];

  if (typeof date !== 'string' && typeof date !== 'number' && !(date instanceof Date)) {
    errors.push(`${fieldName} має невірний тип`);
    return { isValid: false, errors };
  }

  const dateObj = new Date(date as string | number | Date);
  if (isNaN(dateObj.getTime())) {
    errors.push(`${fieldName} має невірний формат`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Валідує файл
 */
export const validateFile = (
  file: File,
  allowedTypes: string[],
  maxSize: number
): ValidationResult => {
  const errors: string[] = [];

  if (!allowedTypes.includes(file.type)) {
    errors.push(`Дозволені типи файлів: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    errors.push(`Розмір файлу не повинен перевищувати ${maxSizeMB}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Комбінує результати валідації
 */
export const combineValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap(result => result.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * Валідує об'єкт за схемою
 */
export const validateObject = (
  obj: Record<string, unknown>,
  schema: Record<string, (value: unknown) => ValidationResult>
): ValidationResult => {
  const results = Object.entries(schema).map(([key, validator]) => {
    return validator(obj[key]);
  });

  return combineValidationResults(...results);
};
