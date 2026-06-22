/**
 * Environment detection and configuration utilities for frontend
 * Provides consistent environment handling across the React application
 */

import { config } from '@/config';

// Environment types
export type Environment = 'development' | 'production' | 'test' | 'staging';

/**
 * Get the current environment
 */
export const getEnvironment = (): Environment => {
  const env = (config.node_env || 'development').toLowerCase();
  
  switch (env) {
    case 'production':
    case 'prod':
      return 'production';
    case 'test':
    case 'testing':
      return 'test';
    case 'staging':
    case 'stage':
      return 'staging';
    case 'development':
    case 'dev':
    default:
      return 'development';
  }
};

/**
 * Environment detection utilities
 */
export const Environment = {
  /**
   * Check if running in development environment
   */
  isDevelopment: (): boolean => getEnvironment() === 'development',

  /**
   * Check if running in production environment
   */
  isProduction: (): boolean => getEnvironment() === 'production',

  /**
   * Check if running in test environment
   */
  isTest: (): boolean => getEnvironment() === 'test',

  /**
   * Check if running in staging environment
   */
  isStaging: (): boolean => getEnvironment() === 'staging',

  /**
   * Check if running in any non-production environment
   */
  isNonProduction: (): boolean => getEnvironment() !== 'production',

  /**
   * Get current environment string
   */
  current: (): Environment => getEnvironment(),

  /**
   * Get current environment string (alias for current)
   */
  getEnvironment: (): Environment => getEnvironment(),

  /**
   * Check if debugging should be enabled
   */
  isDebuggingEnabled: (): boolean => {
    const env = getEnvironment();
    return env === 'development' || env === 'test' || import.meta.env.VITE_ENABLE_DEBUG === 'true';
  },

  /**
   * Check if console logging should be enabled
   */
  isConsoleLoggingEnabled: (): boolean => {
    return Environment.isDevelopment() || import.meta.env.VITE_ENABLE_CONSOLE_LOGGING === 'true';
  },

  /**
   * Check if Redux DevTools should be enabled
   */
  isReduxDevToolsEnabled: (): boolean => {
    return Environment.isDevelopment() || import.meta.env.VITE_ENABLE_REDUX_DEVTOOLS === 'true';
  },

  /**
   * Check if performance monitoring should be enabled
   */
  isPerformanceMonitoringEnabled: (): boolean => {
    return Environment.isProduction() || import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true';
  },

  /**
   * Check if error tracking should be enabled
   */
  isErrorTrackingEnabled: (): boolean => {
    return Environment.isProduction() || import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true';
  },

  /**
   * Check if analytics should be enabled
   */
  isAnalyticsEnabled: (): boolean => {
    return Environment.isProduction() || import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  },

  /**
   * Check if service worker should be enabled
   */
  isServiceWorkerEnabled: (): boolean => {
    return Environment.isProduction() || import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true';
  },

  /**
   * Check if strict mode should be enabled
   */
  isStrictModeEnabled: (): boolean => {
    return Environment.isDevelopment() || import.meta.env.VITE_ENABLE_STRICT_MODE === 'true';
  },
};

/**
 * Configuration values based on environment
 */
export const EnvironmentConfig = {
  /**
   * Get API timeout based on environment
   */
  getApiTimeout: (): number => {
    switch (getEnvironment()) {
      case 'production':
        return 30000; // 30 seconds
      case 'staging':
        return 20000; // 20 seconds
      case 'test':
        return 5000; // 5 seconds
      case 'development':
      default:
        return 10000; // 10 seconds
    }
  },

  /**
   * Get retry configuration for API calls
   */
  getRetryConfig: () => {
    switch (getEnvironment()) {
      case 'production':
        return {
          retries: 3,
          retryDelay: 1000,
          retryCondition: (error: any) => {
            return error.response?.status >= 500 || error.code === 'NETWORK_ERROR';
          },
        };
      case 'staging':
        return {
          retries: 2,
          retryDelay: 800,
          retryCondition: (error: any) => {
            return error.response?.status >= 500 || error.code === 'NETWORK_ERROR';
          },
        };
      case 'test':
        return {
          retries: 0, // No retries in test environment
          retryDelay: 0,
          retryCondition: () => false,
        };
      case 'development':
      default:
        return {
          retries: 1,
          retryDelay: 500,
          retryCondition: (error: any) => {
            return error.response?.status >= 500;
          },
        };
    }
  },

  /**
   * Get cache configuration
   */
  getCacheConfig: () => {
    switch (getEnvironment()) {
      case 'production':
        return {
          defaultStaleTime: 5 * 60 * 1000, // 5 minutes
          defaultCacheTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
        };
      case 'staging':
        return {
          defaultStaleTime: 2 * 60 * 1000, // 2 minutes
          defaultCacheTime: 5 * 60 * 1000, // 5 minutes
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
        };
      case 'test':
        return {
          defaultStaleTime: 0, // No caching in tests
          defaultCacheTime: 0,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        };
      case 'development':
      default:
        return {
          defaultStaleTime: 30 * 1000, // 30 seconds
          defaultCacheTime: 2 * 60 * 1000, // 2 minutes
          refetchOnWindowFocus: true,
          refetchOnReconnect: true,
        };
    }
  },

  /**
   * Get toast configuration
   */
  getToastConfig: () => {
    switch (getEnvironment()) {
      case 'production':
        return {
          duration: 4000,
          position: 'top-right' as const,
          closeButton: true,
          pauseOnHover: true,
        };
      case 'staging':
        return {
          duration: 5000,
          position: 'top-right' as const,
          closeButton: true,
          pauseOnHover: true,
        };
      case 'test':
        return {
          duration: 1000, // Short duration for tests
          position: 'top-right' as const,
          closeButton: false,
          pauseOnHover: false,
        };
      case 'development':
      default:
        return {
          duration: 6000,
          position: 'top-right' as const,
          closeButton: true,
          pauseOnHover: true,
        };
    }
  },

  /**
   * Get error boundary configuration
   */
  getErrorBoundaryConfig: () => {
    return {
      fallbackComponent: Environment.isProduction() ? 'ProductionErrorFallback' : 'DevelopmentErrorFallback',
      logErrors: Environment.isErrorTrackingEnabled(),
      showErrorDetails: Environment.isNonProduction(),
      enableErrorReporting: Environment.isProduction(),
    };
  },

  /**
   * Get build optimization settings
   */
  getBuildConfig: () => {
    return {
      minify: Environment.isProduction(),
      sourcemap: Environment.isNonProduction(),
      removeConsole: Environment.isProduction(),
      removeDebugger: Environment.isProduction(),
      treeShaking: Environment.isProduction(),
      splitChunks: Environment.isProduction(),
    };
  },
};

/**
 * Feature flags based on environment
 */
export const FeatureFlags = {
  /**
   * Check if a feature should be enabled
   */
  isFeatureEnabled: (featureName: string): boolean => {
    const envVar = `VITE_FEATURE_${featureName.toUpperCase()}`;
    const envValue = import.meta.env[envVar];
    
    if (envValue !== undefined) {
      return envValue === 'true';
    }
    
    // Default feature flags based on environment
    switch (getEnvironment()) {
      case 'production':
        return getProductionFeatureDefaults(featureName);
      case 'staging':
        return getStagingFeatureDefaults(featureName);
      case 'test':
        return getTestFeatureDefaults(featureName);
      case 'development':
      default:
        return getDevelopmentFeatureDefaults(featureName);
    }
  },
};

// Helper functions for feature defaults
function getProductionFeatureDefaults(featureName: string): boolean {
  const productionFeatures = [
    'analytics',
    'error_tracking',
    'performance_monitoring',
    'service_worker',
  ];
  return productionFeatures.includes(featureName.toLowerCase());
}

function getStagingFeatureDefaults(featureName: string): boolean {
  const stagingFeatures = [
    'analytics',
    'error_tracking',
    'performance_monitoring',
    'debug_panel',
  ];
  return stagingFeatures.includes(featureName.toLowerCase());
}

function getTestFeatureDefaults(featureName: string): boolean {
  const testFeatures = [
    'mock_api',
    'test_helpers',
  ];
  return testFeatures.includes(featureName.toLowerCase());
}

function getDevelopmentFeatureDefaults(featureName: string): boolean {
  const developmentFeatures = [
    'debug_panel',
    'redux_devtools',
    'console_logging',
    'hot_reload',
    'mock_api',
  ];
  return developmentFeatures.includes(featureName.toLowerCase());
}

/**
 * Validation utilities for environment configuration
 */
export const EnvironmentValidation = {
  /**
   * Validate that all required environment variables are set
   */
  validateRequiredEnvVars: (): { isValid: boolean; missing: string[] } => {
    const required = [
      'VITE_API_BASE_URL',
      'VITE_NODE_ENV',
    ];

    const productionRequired = [
      'VITE_GOOGLE_CLIENT_ID',
      'VITE_GOOGLE_REDIRECT_URI',
    ];

    const allRequired = Environment.isProduction() 
      ? [...required, ...productionRequired]
      : required;

    const missing = allRequired.filter(envVar => !import.meta.env[envVar]);

    return {
      isValid: missing.length === 0,
      missing,
    };
  },

  /**
   * Validate environment configuration and log warnings
   */
  validateAndWarn: (): void => {
    const { isValid, missing } = EnvironmentValidation.validateRequiredEnvVars();

    if (!isValid && Environment.isDevelopment()) {
      console.warn('⚠️ Missing required environment variables:', missing.join(', '));
    }

    // Additional warnings for development
    if (Environment.isDevelopment()) {
      if (config.apiBaseUrl.includes('localhost')) {
        console.info('ℹ️ Using local API server');
      }
      
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        console.warn('⚠️ Google OAuth client ID is not configured');
      }
    }
  },
};

// Export default environment utilities
export default Environment;
