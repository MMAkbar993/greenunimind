import { useState, useCallback, useRef, useEffect } from 'react';
import { Logger } from '@/utils/logger';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
  onMaxRetriesReached?: (error: any) => void;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: any;
  canRetry: boolean;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Default: retry on network errors, timeouts, and 5xx server errors
    if (typeof error === 'object' && error !== null) {
      const message = error.message?.toLowerCase() || '';
      const status = error.status || error.code;
      
      // Network errors
      if (message.includes('network') || 
          message.includes('fetch') || 
          message.includes('timeout') ||
          message.includes('connection')) {
        return true;
      }
      
      // Server errors (5xx)
      if (status >= 500 && status < 600) {
        return true;
      }
      
      // Rate limiting
      if (status === 429) {
        return true;
      }
    }
    
    return false;
  }
};

export const useRetryMechanism = (config: Partial<RetryConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    canRetry: true
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Calculate delay with exponential backoff
  const calculateDelay = useCallback((attempt: number): number => {
    const delay = Math.min(
      finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
      finalConfig.maxDelay
    );
    
    // Add jitter to prevent thundering herd
    const jitter = delay * 0.1 * Math.random();
    return delay + jitter;
  }, [finalConfig]);

  // Reset retry state
  const reset = useCallback(() => {
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      canRetry: true
    });
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Execute function with retry logic
  const executeWithRetry = useCallback(async <T>(
    fn: (abortSignal?: AbortSignal) => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> => {
    const config = { ...finalConfig, ...customConfig };
    let lastError: any;
    
    // Reset state
    setState(prev => ({
      ...prev,
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      canRetry: true
    }));

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        // Create new abort controller for this attempt
        abortControllerRef.current = new AbortController();
        
        // Update state
        setState(prev => ({
          ...prev,
          isRetrying: attempt > 1,
          retryCount: attempt - 1
        }));

        const result = await fn(abortControllerRef.current.signal);
        
        // Success - reset state
        setState(prev => ({
          ...prev,
          isRetrying: false,
          lastError: null
        }));
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Update state with error
        setState(prev => ({
          ...prev,
          lastError: error,
          canRetry: attempt <= config.maxRetries && (config.retryCondition?.(error) ?? true)
        }));

        Logger.error(`Attempt ${attempt} failed:`, error);

        // Check if we should retry
        const shouldRetry = attempt <= config.maxRetries && 
                           (config.retryCondition?.(error) ?? true);

        if (!shouldRetry) {
          // No more retries
          setState(prev => ({
            ...prev,
            isRetrying: false,
            canRetry: false
          }));
          
          if (attempt > config.maxRetries) {
            config.onMaxRetriesReached?.(error);
          }
          
          throw error;
        }

        // Calculate delay and wait
        const delay = calculateDelay(attempt);
        config.onRetry?.(attempt, error);
        
        Logger.info(`Retrying in ${delay}ms (attempt ${attempt}/${config.maxRetries})`);

        await new Promise((resolve, reject) => {
          timeoutRef.current = setTimeout(resolve, delay);
          
          // Handle abort
          if (abortControllerRef.current) {
            abortControllerRef.current.signal.addEventListener('abort', () => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              reject(new Error('Retry aborted'));
            });
          }
        });
      }
    }

    throw lastError;
  }, [finalConfig, calculateDelay]);

  // Manual retry function
  const retry = useCallback(async <T>(
    fn: (abortSignal?: AbortSignal) => Promise<T>
  ): Promise<T> => {
    if (!state.canRetry) {
      throw new Error('Cannot retry: maximum retries reached or error is not retryable');
    }

    return executeWithRetry(fn);
  }, [state.canRetry, executeWithRetry]);

  // Abort current operation
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isRetrying: false
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Functions
    executeWithRetry,
    retry,
    reset,
    abort,
    
    // Utilities
    isNetworkError: (error: any) => finalConfig.retryCondition?.(error) ?? false,
    getNextRetryDelay: () => calculateDelay(state.retryCount + 1),
    getRemainingRetries: () => Math.max(0, finalConfig.maxRetries - state.retryCount)
  };
};

// Hook for API calls with retry
export const useApiWithRetry = () => {
  const retryMechanism = useRetryMechanism({
    maxRetries: 3,
    baseDelay: 1000,
    retryCondition: (error) => {
      // Retry on network errors and 5xx server errors
      const status = error?.status || error?.response?.status;
      return !status || status >= 500 || status === 429;
    }
  });

  const apiCall = useCallback(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    return retryMechanism.executeWithRetry(async (abortSignal) => {
      const response = await fetch(url, {
        ...options,
        signal: abortSignal
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).response = response;
        throw error;
      }

      return response.json();
    });
  }, [retryMechanism]);

  return {
    ...retryMechanism,
    apiCall
  };
};

export default useRetryMechanism;
