import { useCallback, useEffect, useRef, useState } from 'react';

import { ValidationRule } from '@/src/types/forms';

import { useDebounce } from './useDebounce';

type FieldConfig<T = any> = {
  initialValue?: T;
  validation?: ValidationRule<T>;
  transform?: (value: any) => T;
  debounceMs?: number;
};

type FormConfig<T extends Record<string, any>> = {
  initialValues?: Partial<T>;
  validation?: Partial<Record<keyof T, ValidationRule<any>>>;
  onSubmit?: (values: T) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  resetOnSubmit?: boolean;
};

type FieldState = {
  value: any;
  error: string | null;
  touched: boolean;
  dirty: boolean;
};

type FormState<T extends Record<string, any>> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
};

type UseFormReturn<T extends Record<string, any>> = {
  // State
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;

  // Field helpers
  getFieldProps: (name: keyof T) => {
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<any>) => void;
    onBlur: (e: React.FocusEvent<any>) => void;
  };
  getFieldState: (name: keyof T) => FieldState;

  // Actions
  setValue: (name: keyof T, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (name: keyof T, error: string) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setTouched: (name: keyof T, touched?: boolean) => void;
  setFieldTouched: (touched: Partial<Record<keyof T, boolean>>) => void;

  // Validation
  validateField: (name: keyof T) => Promise<string | null>;
  validateForm: () => Promise<boolean>;

  // Form actions
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: (values?: Partial<T>) => void;
  resetField: (name: keyof T) => void;

  // Utilities
  getChangedValues: () => Partial<T>;
  hasChanges: () => boolean;
};

/**
 * Comprehensive form management hook
 * @param config - Form configuration
 * @returns Form state and utilities
 */
export function useForm<T extends Record<string, any>>(
  config: FormConfig<T> = {}
): UseFormReturn<T> {
  const {
    initialValues = {} as T,
    validation = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
    resetOnSubmit = false,
  } = config;

  const [state, setState] = useState<FormState<T>>(() => ({
    values: { ...initialValues } as T,
    errors: {},
    touched: {},
    dirty: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
    submitCount: 0,
  }));

  const initialValuesRef = useRef(initialValues);

  // Validate a single field
  const validateField = useCallback(
    async (name: keyof T): Promise<string | null> => {
      const value = state.values[name];
      const rules = (validation as Partial<Record<keyof T, ValidationRule<any>>>)?.[name];

      if (!rules) return null;

      // Required validation
      if (rules.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          return typeof rules.required === 'string' ? rules.required : 'This field is required';
        }
      }

      // Skip other validations if empty and not required
      if (value === undefined || value === null || value === '') {
        return null;
      }

      // String/Array length validations
      if (typeof value === 'string' || Array.isArray(value)) {
        const valueWithLength = value as string | any[];
        if (rules.minLength) {
          const minLength =
            typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
          const minLengthMessage =
            typeof rules.minLength === 'number'
              ? `Minimum length is ${rules.minLength}`
              : rules.minLength.message;
          if (valueWithLength.length < minLength) {
            return minLengthMessage;
          }
        }
        if (rules.maxLength) {
          const maxLength =
            typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
          const maxLengthMessage =
            typeof rules.maxLength === 'number'
              ? `Maximum length is ${rules.maxLength}`
              : rules.maxLength.message;
          if (valueWithLength.length > maxLength) {
            return maxLengthMessage;
          }
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rules.min) {
          const minValue = typeof rules.min === 'number' ? rules.min : rules.min.value;
          const minMessage =
            typeof rules.min === 'number' ? `Minimum value is ${rules.min}` : rules.min.message;
          if (value < minValue) {
            return minMessage;
          }
        }
        if (rules.max) {
          const maxValue = typeof rules.max === 'number' ? rules.max : rules.max.value;
          const maxMessage =
            typeof rules.max === 'number' ? `Maximum value is ${rules.max}` : rules.max.message;
          if (value > maxValue) {
            return maxMessage;
          }
        }
      }

      // Pattern validation
      if (rules.pattern && typeof value === 'string') {
        const regex = rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.value;
        const patternMessage =
          rules.pattern instanceof RegExp ? 'Invalid format' : rules.pattern.message;
        if (!regex.test(value)) {
          return patternMessage;
        }
      }

      // Email validation
      if (rules.email && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return typeof rules.email === 'string' ? rules.email : 'Invalid email address';
        }
      }

      // URL validation
      if (rules.url && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          return typeof rules.url === 'string' ? rules.url : 'Invalid URL';
        }
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value, state.values);
        if (typeof result === 'string') {
          return result;
        }
        if (result === false) {
          return 'Invalid value';
        }
      }

      return null;
    },
    [state.values, validation]
  );

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    const newErrors: Partial<Record<keyof T, string>> = {};

    for (const name of Object.keys(validation) as (keyof T)[]) {
      const error = await validateField(name);
      if (error) {
        newErrors[name] = error;
      }
    }

    setState(prev => ({
      ...prev,
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0,
    }));

    return Object.keys(newErrors).length === 0;
  }, [validateField, validation]);

  // Set field value
  const setValue = useCallback(
    (name: keyof T, value: any) => {
      setState(prev => {
        const newValues = { ...prev.values, [name]: value };
        const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValuesRef.current);

        return {
          ...prev,
          values: newValues,
          dirty: { ...prev.dirty, [name]: value !== initialValuesRef.current[name] },
          isDirty,
        };
      });

      // Validate on change if enabled
      if (validateOnChange) {
        setTimeout(async () => {
          const error = await validateField(name);
          setState(prev => ({
            ...prev,
            errors: { ...prev.errors, [name]: error },
            isValid: error
              ? false
              : Object.values({ ...prev.errors, [name]: error }).every(e => !e),
          }));
        });
      }
    },
    [validateField, validateOnChange]
  );

  // Set multiple values
  const setValues = useCallback((values: Partial<T>) => {
    setState(prev => {
      const newValues = { ...prev.values, ...values };
      const isDirty = JSON.stringify(newValues) !== JSON.stringify(initialValuesRef.current);
      const newDirty = { ...prev.dirty };

      Object.keys(values).forEach(key => {
        newDirty[key as keyof T] =
          values[key as keyof T] !== initialValuesRef.current[key as keyof T];
      });

      return {
        ...prev,
        values: newValues,
        dirty: newDirty,
        isDirty,
      };
    });
  }, []);

  // Set field error
  const setError = useCallback((name: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
      isValid: false,
    }));
  }, []);

  // Set multiple errors
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errors },
      isValid: Object.values({ ...prev.errors, ...errors }).every(e => !e),
    }));
  }, []);

  // Set field touched
  const setTouched = useCallback(
    (name: keyof T, touched: boolean = true) => {
      setState(prev => ({
        ...prev,
        touched: { ...prev.touched, [name]: touched },
      }));

      // Validate on blur if enabled
      if (validateOnBlur && touched) {
        setTimeout(async () => {
          const error = await validateField(name);
          setState(prev => ({
            ...prev,
            errors: { ...prev.errors, [name]: error },
            isValid: error
              ? false
              : Object.values({ ...prev.errors, [name]: error }).every(e => !e),
          }));
        });
      }
    },
    [validateField, validateOnBlur]
  );

  // Set multiple touched fields
  const setFieldTouched = useCallback((touched: Partial<Record<keyof T, boolean>>) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, ...touched },
    }));
  }, []);

  // Get field props for easy integration
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: String(name),
      value: state.values[name] ?? '',
      onChange: (e: React.ChangeEvent<any>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setValue(name, value);
      },
      onBlur: () => setTouched(name, true),
    }),
    [state.values, setValue, setTouched]
  );

  // Get field state
  const getFieldState = useCallback(
    (name: keyof T): FieldState => ({
      value: state.values[name],
      error: state.errors[name] || null,
      touched: state.touched[name] || false,
      dirty: state.dirty[name] || false,
    }),
    [state]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      setState(prev => ({ ...prev, isSubmitting: true, submitCount: prev.submitCount + 1 }));

      try {
        const isValid = await validateForm();

        if (isValid && onSubmit) {
          await onSubmit(state.values);

          if (resetOnSubmit) {
            reset();
          }
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [validateForm, onSubmit, state.values, resetOnSubmit]
  );

  // Reset form
  const reset = useCallback((values?: Partial<T>) => {
    const resetValues = values
      ? { ...initialValuesRef.current, ...values }
      : initialValuesRef.current;

    setState({
      values: resetValues as T,
      errors: {},
      touched: {},
      dirty: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
      submitCount: 0,
    });
  }, []);

  // Reset single field
  const resetField = useCallback((name: keyof T) => {
    const initialValue = initialValuesRef.current[name];
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: initialValue },
      errors: { ...prev.errors, [name]: undefined },
      touched: { ...prev.touched, [name]: false },
      dirty: { ...prev.dirty, [name]: false },
    }));
  }, []);

  // Get changed values
  const getChangedValues = useCallback((): Partial<T> => {
    const changed: Partial<T> = {};

    Object.keys(state.values).forEach(key => {
      const typedKey = key as keyof T;
      if (state.dirty[typedKey]) {
        changed[typedKey] = state.values[typedKey];
      }
    });

    return changed;
  }, [state.values, state.dirty]);

  // Check if form has changes
  const hasChanges = useCallback((): boolean => {
    return state.isDirty;
  }, [state.isDirty]);

  return {
    // State
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    dirty: state.dirty,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    isDirty: state.isDirty,
    submitCount: state.submitCount,

    // Field helpers
    getFieldProps,
    getFieldState,

    // Actions
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    setFieldTouched,

    // Validation
    validateField,
    validateForm,

    // Form actions
    handleSubmit,
    reset,
    resetField,

    // Utilities
    getChangedValues,
    hasChanges,
  };
}

/**
 * Simple form hook for basic use cases
 * @param initialValues - Initial form values
 * @param onSubmit - Submit handler
 * @returns Basic form utilities
 */
export function useSimpleForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit?: (values: T) => void
) {
  const [values, setValues] = useState<T>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<any>) => {
      const { name, value, type, checked } = e.target;
      setValue(name, type === 'checkbox' ? checked : value);
    },
    [setValue]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [onSubmit, values]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  return {
    values,
    setValue,
    setValues,
    handleChange,
    handleSubmit,
    reset,
    isSubmitting,
  };
}

/**
 * Hook for form field with validation
 * @param config - Field configuration
 * @returns Field state and utilities
 */
export function useFormField<T = any>(config: FieldConfig<T> = {}) {
  const { initialValue, validation, transform, debounceMs = 0 } = config;

  const [value, setValue] = useState<T>(initialValue as T);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [dirty, setDirty] = useState(false);

  const debouncedValue = useDebounce(value, debounceMs);

  // Validate field
  const validate = useCallback(
    async (val: T): Promise<string | null> => {
      if (!validation) return null;

      // Similar validation logic as in useForm
      // ... (validation logic would be extracted to a shared function)

      return null;
    },
    [validation]
  );

  // Update value
  const updateValue = useCallback(
    (newValue: any) => {
      const transformedValue = transform ? transform(newValue) : newValue;
      setValue(transformedValue);
      setDirty(transformedValue !== initialValue);
    },
    [transform, initialValue]
  );

  // Handle change
  const handleChange = useCallback(
    (e: React.ChangeEvent<any>) => {
      const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      updateValue(newValue);
    },
    [updateValue]
  );

  // Handle blur
  const handleBlur = useCallback(async () => {
    setTouched(true);
    const validationError = await validate(value);
    setError(validationError);
  }, [validate, value]);

  // Validate on debounced value change
  useEffect(() => {
    if (touched) {
      validate(debouncedValue).then(setError);
    }
  }, [debouncedValue, touched, validate]);

  return {
    value,
    error,
    touched,
    dirty,
    setValue: updateValue,
    setError,
    setTouched,
    validate,
    handleChange,
    handleBlur,
    reset: () => {
      setValue(initialValue as T);
      setError(null);
      setTouched(false);
      setDirty(false);
    },
    fieldProps: {
      value: value ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
    },
  };
}
