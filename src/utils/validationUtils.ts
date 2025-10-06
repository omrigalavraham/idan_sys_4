/**
 * Validation utilities
 * Provides consistent validation patterns across the application
 */

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone number validation (Israeli format)
 */
export const isValidPhone = (phone: string): boolean => {
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Israeli phone numbers: 10 digits starting with 0, or 9 digits starting with 5
  const israeliPhoneRegex = /^(0[2-9]\d{7,8}|5\d{8})$/;
  return israeliPhoneRegex.test(cleanPhone);
};

/**
 * Israeli ID validation
 */
export const isValidIsraeliId = (id: string): boolean => {
  // Remove all non-digits
  const cleanId = id.replace(/\D/g, '');
  
  // Israeli ID must be 9 digits
  if (cleanId.length !== 9) {
    return false;
  }
  
  // Check digit validation
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let digit = parseInt(cleanId[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleanId[8]);
};

/**
 * VAT number validation (Israeli format)
 */
export const isValidVatNumber = (vat: string): boolean => {
  // Remove all non-digits
  const cleanVat = vat.replace(/\D/g, '');
  
  // Israeli VAT number must be 9 digits
  if (cleanVat.length !== 9) {
    return false;
  }
  
  // Use the same validation as Israeli ID
  return isValidIsraeliId(cleanVat);
};

/**
 * Required field validation
 */
export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
};

/**
 * Minimum length validation
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Maximum length validation
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Number range validation
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Positive number validation
 */
export const isPositive = (value: number): boolean => {
  return value > 0;
};

/**
 * Non-negative number validation
 */
export const isNonNegative = (value: number): boolean => {
  return value >= 0;
};

/**
 * URL validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Date validation
 */
export const isValidDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
};

/**
 * Future date validation
 */
export const isFutureDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Past date validation
 */
export const isPastDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate form data
 */
export const validateFormData = (data: Record<string, unknown>, rules: Record<string, (value: unknown) => boolean | string>): ValidationResult => {
  const errors: string[] = [];
  
  for (const [field, value] of Object.entries(data)) {
    const rule = rules[field];
    if (rule) {
      const result = rule(value);
      if (typeof result === 'string') {
        errors.push(result);
      } else if (!result) {
        errors.push(`שדה ${field} לא תקין`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Common validation rules
 */
export const validationRules = {
  required: (message: string = 'שדה זה נדרש') => (value: unknown) => 
    isRequired(value) || message,
  
  email: (message: string = 'כתובת אימייל לא תקינה') => (value: unknown) => 
    typeof value === 'string' && isValidEmail(value) || message,
  
  phone: (message: string = 'מספר טלפון לא תקין') => (value: unknown) => 
    typeof value === 'string' && isValidPhone(value) || message,
  
  minLength: (min: number, message?: string) => (value: unknown) => 
    typeof value === 'string' && hasMinLength(value, min) || 
    message || `מינימום ${min} תווים נדרש`,
  
  maxLength: (max: number, message?: string) => (value: unknown) => 
    typeof value === 'string' && hasMaxLength(value, max) || 
    message || `מקסימום ${max} תווים מותר`,
  
  positive: (message: string = 'הערך חייב להיות חיובי') => (value: unknown) => 
    typeof value === 'number' && isPositive(value) || message,
  
  futureDate: (message: string = 'התאריך חייב להיות בעתיד') => (value: unknown) => 
    (typeof value === 'string' || value instanceof Date) && isFutureDate(value) || message
};


