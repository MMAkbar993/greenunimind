import { Environment } from './environment';

/**
 * Production-safe logging utilities for frontend
 * Provides environment-aware logging that respects production security requirements
 */

// Sensitive data patterns to sanitize
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /bearer/i,
  /cookie/i,
  /session/i,
  /otp/i,
  /pin/i,
  /ssn/i,
  /credit.*card/i,
  /card.*number/i,
  /cvv/i,
  /bank.*account/i,
];

/**
 * Sanitize data to remove sensitive information
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    // Check if the string itself might be sensitive
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(data))) {
      return '[REDACTED]';
    }
    return data;
  }

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Check if key contains sensitive information
    const isSensitiveKey = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
    
    if (isSensitiveKey) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format arguments for logging
 */
function formatArgs(...args: any[]): string {
  return args
    .map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(sanitizeData(arg), null, 2);
        } catch (error) {
          return '[Circular Object]';
        }
      }
      return String(arg);
    })
    .join(' ');
}

/**
 * Main logger interface
 */
export const Logger = {
  /**
   * Debug logging - only in development
   */
  debug: (...args: any[]) => {
    if (Environment.isDevelopment()) {
      console.debug('[DEBUG]', formatArgs(...args));
    }
  },

  /**
   * Info logging - environment aware
   */
  info: (...args: any[]) => {
    if (Environment.isDevelopment()) {
      console.info('[INFO]', formatArgs(...args));
    }
    // In production, info logs are stripped by Vite plugin
  },

  /**
   * Warning logging - always enabled but sanitized
   */
  warn: (...args: any[]) => {
    if (Environment.isDevelopment()) {
      console.warn('[WARN]', formatArgs(...args));
    } else {
      // In production, only log sanitized warnings
      console.warn('[WARN]', formatArgs(...args));
    }
  },

  /**
   * Error logging - always enabled but sanitized
   */
  error: (...args: any[]) => {
    const sanitizedArgs = formatArgs(...args);
    console.error('[ERROR]', sanitizedArgs);

    // In production, also send to error tracking service
    if (Environment.isProduction()) {
      // TODO: Integrate with error tracking service (Sentry, etc.)
      // errorTrackingService.captureException(new Error(sanitizedArgs));
    }
  },

  /**
   * Performance logging
   */
  performance: (operation: string, duration: number, meta?: any) => {
    if (Environment.isDevelopment()) {
      console.info(`[PERF] ${operation} completed in ${duration}ms`, meta ? sanitizeData(meta) : '');
    }
  },

  /**
   * API request/response logging
   */
  api: (method: string, url: string, status: number, duration?: number) => {
    if (Environment.isDevelopment()) {
      const message = `[API] ${method} ${url} - ${status}${duration ? ` (${duration}ms)` : ''}`;
      if (status >= 400) {
        console.warn(message);
      } else {
        console.info(message);
      }
    }
  },

  /**
   * User action logging
   */
  userAction: (action: string, details?: any) => {
    if (Environment.isDevelopment()) {
      console.info(`[USER] ${action}`, details ? sanitizeData(details) : '');
    }
  },

  /**
   * Security event logging
   */
  security: (event: string, details?: any) => {
    const sanitizedDetails = details ? sanitizeData(details) : {};
    console.warn(`[SECURITY] ${event}`, sanitizedDetails);
  },
};

/**
 * Conditional logging utilities
 */
export const conditionalLog = {
  /**
   * Only log in development
   */
  dev: (...args: any[]) => {
    if (Environment.isDevelopment()) {
      console.log('[DEV]', formatArgs(...args));
    }
  },

  /**
   * Only log in production (for critical issues)
   */
  prod: (...args: any[]) => {
    if (Environment.isProduction()) {
      console.error('[PROD]', formatArgs(...args));
    }
  },

  /**
   * Performance timing
   */
  time: (label: string) => {
    if (Environment.isDevelopment()) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (Environment.isDevelopment()) {
      console.timeEnd(label);
    }
  },
};

/**
 * Safe console replacement for gradual migration
 */
export const safeConsole = {
  log: (...args: any[]) => {
    if (Environment.isDevelopment()) {
      console.log(formatArgs(...args));
    }
  },

  warn: (...args: any[]) => {
    console.warn(formatArgs(...args));
  },

  error: (...args: any[]) => {
    console.error(formatArgs(...args));
  },

  debug: (...args: any[]) => {
    if (Environment.isDevelopment()) {
      console.debug(formatArgs(...args));
    }
  },

  info: (...args: any[]) => {
    if (Environment.isDevelopment()) {
      console.info(formatArgs(...args));
    }
  },
};

/**
 * Debug-only utilities that are completely removed in production
 */
export const debugOnly = {
  log: (...args: any[]) => {
    if (Environment.isDevelopment()) {
      console.log('[DEBUG-ONLY]', formatArgs(...args));
    }
  },

  trace: (label: string) => {
    if (Environment.isDevelopment()) {
      console.trace(label);
    }
  },

  group: (label: string) => {
    if (Environment.isDevelopment()) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (Environment.isDevelopment()) {
      console.groupEnd();
    }
  },

  table: (data: any) => {
    if (Environment.isDevelopment()) {
      console.table(sanitizeData(data));
    }
  },
};

/**
 * Specialized logging for different application areas
 */
export const specializedLog = {
  auth: {
    success: (action: string) => {
      Logger.info(`AUTH_SUCCESS: ${action}`);
    },
    failure: (action: string, reason: string) => {
      Logger.warn(`AUTH_FAILURE: ${action} - ${reason}`);
    },
    security: (event: string, details?: any) => {
      Logger.security(`AUTH_${event}`, details);
    },
  },

  navigation: {
    route: (from: string, to: string) => {
      if (Environment.isDevelopment()) {
        Logger.info(`NAVIGATION: ${from} -> ${to}`);
      }
    },
  },

  payment: {
    initiated: (amount: number, currency: string) => {
      Logger.info(`PAYMENT_INITIATED: ${currency} ${amount}`);
    },
    completed: (transactionId: string) => {
      Logger.info(`PAYMENT_COMPLETED: ${transactionId}`);
    },
    failed: (reason: string) => {
      Logger.error(`PAYMENT_FAILED: ${reason}`);
    },
  },

  course: {
    access: (courseId: string, action: string) => {
      Logger.info(`COURSE_ACCESS: ${courseId} - ${action}`);
    },
    progress: (courseId: string, progress: number) => {
      Logger.info(`COURSE_PROGRESS: ${courseId} - ${progress}%`);
    },
  },
};

// Export default logger
export default Logger;
