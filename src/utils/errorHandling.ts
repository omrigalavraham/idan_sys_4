/**
 * Error handling utilities
 * Provides consistent error handling patterns across the application
 */

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export class CustomError extends Error {
  public code: string;
  public details?: Record<string, unknown>;
  public timestamp: string;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Create a standardized error object
 */
export const createError = (
  code: string, 
  message: string, 
  details?: Record<string, unknown>
): AppError => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString()
});

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: unknown): AppError => {
  if (error instanceof CustomError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp
    };
  }

  if (error instanceof Error) {
    return createError('UNKNOWN_ERROR', error.message);
  }

  return createError('UNKNOWN_ERROR', 'An unknown error occurred');
};

/**
 * Log errors consistently
 */
export const logError = (error: AppError, context?: string): void => {
  const logData = {
    ...error,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  };

  console.error('Application Error:', logData);
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
  }
};

/**
 * Common error codes
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_EMAIL: 'INVALID_EMAIL',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Permission errors
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

/**
 * Get user-friendly error messages
 */
export const getErrorMessage = (error: AppError): string => {
  const messages: Record<string, string> = {
    [ERROR_CODES.AUTH_REQUIRED]: 'נדרשת התחברות',
    [ERROR_CODES.AUTH_INVALID]: 'פרטי התחברות לא תקינים',
    [ERROR_CODES.AUTH_EXPIRED]: 'התחברות פגה, אנא התחבר שוב',
    [ERROR_CODES.VALIDATION_ERROR]: 'שגיאה בנתונים שהוזנו',
    [ERROR_CODES.INVALID_PHONE]: 'מספר טלפון לא תקין',
    [ERROR_CODES.INVALID_EMAIL]: 'כתובת אימייל לא תקינה',
    [ERROR_CODES.DATABASE_ERROR]: 'שגיאה במסד הנתונים',
    [ERROR_CODES.RECORD_NOT_FOUND]: 'הרשומה לא נמצאה',
    [ERROR_CODES.DUPLICATE_RECORD]: 'הרשומה כבר קיימת',
    [ERROR_CODES.NETWORK_ERROR]: 'שגיאת רשת',
    [ERROR_CODES.TIMEOUT_ERROR]: 'פג הזמן הקצוב',
    [ERROR_CODES.PERMISSION_DENIED]: 'אין הרשאה לבצע פעולה זו',
    [ERROR_CODES.INSUFFICIENT_PERMISSIONS]: 'הרשאות לא מספיקות',
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'יותר מדי בקשות, נסה שוב מאוחר יותר',
    [ERROR_CODES.UNKNOWN_ERROR]: 'שגיאה לא ידועה',
    [ERROR_CODES.INTERNAL_ERROR]: 'שגיאה פנימית במערכת'
  };

  return messages[error.code] || error.message || 'שגיאה לא ידועה';
};


