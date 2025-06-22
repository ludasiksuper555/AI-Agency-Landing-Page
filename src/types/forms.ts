/**
 * Типы для форм и валидации
 */

import React from 'react';

// Базовые типы для форм
export interface FormField {
  name: string;
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  submitCount: number;
}

// Типы валидации
export interface ValidationRule<T = any> {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  email?: boolean | string;
  url?: boolean | string;
  custom?: (value: T, formValues: any) => boolean | string | Promise<boolean | string>;
}

export type ValidationSchema<T = Record<string, any>> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Хуки для форм
export interface UseFormOptions<T = Record<string, any>> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T, helpers: FormHelpers<T>) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  enableReinitialize?: boolean;
}

export interface FormHelpers<T = Record<string, any>> {
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  setTouched: (touched: Partial<Record<keyof T, boolean>>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  resetForm: (nextState?: Partial<FormState<T>>) => void;
  validateForm: () => Promise<Record<keyof T, string>>;
  validateField: (field: keyof T) => Promise<string | undefined>;
}

export interface UseFormReturn<T = Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  submitCount: number;
  handleChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleBlur: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  resetForm: () => void;
  validateForm: () => Promise<boolean>;
  validateField: (field: keyof T) => Promise<boolean>;
}

// Специфичные типы форм
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  company?: string;
  subject?: string;
  consent: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  newsletter: boolean;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  bio?: string;
  avatar?: File;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

export interface SettingsFormData {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    marketing: boolean;
  };
  privacy: {
    analytics: boolean;
    cookies: boolean;
    tracking: boolean;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: number;
    loginNotifications: boolean;
  };
}

// Типы для динамических форм
export interface FormFieldConfig {
  name: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'url'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'date'
    | 'time'
    | 'datetime-local';
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: ValidationRule;
  defaultValue?: any;
  helperText?: string;
  grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  conditional?: {
    field: string;
    value: any;
    operator?: 'equals' | 'not-equals' | 'contains' | 'not-contains';
  };
}

export interface DynamicFormConfig {
  title?: string;
  description?: string;
  fields: FormFieldConfig[];
  submitButton?: {
    text: string;
    variant?: 'default' | 'primary' | 'secondary';
  };
  resetButton?: {
    text: string;
    variant?: 'default' | 'outline';
  };
  layout?: 'vertical' | 'horizontal' | 'grid';
  validation?: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    showErrorsOnSubmit?: boolean;
  };
}

// Типы для мультишаговых форм
export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  validation?: ValidationSchema;
  optional?: boolean;
}

export interface MultiStepFormConfig {
  steps: FormStep[];
  currentStep: number;
  canGoBack?: boolean;
  canSkipSteps?: boolean;
  showProgress?: boolean;
  onStepChange?: (step: number) => void;
  onComplete?: (data: any) => void;
}

export interface MultiStepFormState {
  currentStep: number;
  completedSteps: number[];
  stepData: Record<string, any>;
  isValid: boolean;
  canProceed: boolean;
  canGoBack: boolean;
}
