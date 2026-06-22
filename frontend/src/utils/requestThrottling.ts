/**
 * Request throttling and debouncing utilities for Teacher Dashboard
 * Prevents rate limiting by intelligently managing API call frequency
 */

import { useCallback, useRef, useMemo } from 'react';

// Request throttling configuration
export interface ThrottleConfig {
  maxRequestsPerMinute: number;
  burstLimit: number;
  cooldownMs: number;
  retryDelayMs: number;
  maxRetries: number;
}

// Default configurations for different endpoint types
export const THROTTLE_CONFIGS: Record<string, ThrottleConfig> = {
  analytics: {
    maxRequestsPerMinute: 12, // Well below 15/min limit
    burstLimit: 3, // Allow 3 rapid requests
    cooldownMs: 5000, // 5 second cooldown between bursts
    retryDelayMs: 2000, // 2 second retry delay
    maxRetries: 3,
  },
  dashboard: {
    maxRequestsPerMinute: 20, // Well below 30/min limit
    burstLimit: 5,
    cooldownMs: 3000,
    retryDelayMs: 1500,
    maxRetries: 3,
  },
  activities: {
    maxRequestsPerMinute: 60, // Well below 100/min limit
    burstLimit: 10,
    cooldownMs: 1000,
    retryDelayMs: 1000,
    maxRetries: 2,
  },
  realtime: {
    maxRequestsPerMinute: 6, // Very conservative for real-time
    burstLimit: 2,
    cooldownMs: 10000, // 10 second cooldown
    retryDelayMs: 5000,
    maxRetries: 2,
  },
};

// Request tracking for throttling
interface RequestTracker {
  timestamps: number[];
  lastBurstTime: number;
  burstCount: number;
  isInCooldown: boolean;
}

class RequestThrottleManager {
  private trackers = new Map<string, RequestTracker>();
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Check if request is allowed based on throttling rules
   */
  private isRequestAllowed(key: string, config: ThrottleConfig): boolean {
    const now = Date.now();
    const tracker = this.getOrCreateTracker(key);

    // Remove old timestamps (older than 1 minute)
    tracker.timestamps = tracker.timestamps.filter(
      timestamp => now - timestamp < 60000
    );

    // Check if in cooldown period
    if (tracker.isInCooldown && now - tracker.lastBurstTime < config.cooldownMs) {
      return false;
    }

    // Reset cooldown if enough time has passed
    if (tracker.isInCooldown && now - tracker.lastBurstTime >= config.cooldownMs) {
      tracker.isInCooldown = false;
      tracker.burstCount = 0;
    }

    // Check rate limit
    if (tracker.timestamps.length >= config.maxRequestsPerMinute) {
      return false;
    }

    // Check burst limit
    const recentRequests = tracker.timestamps.filter(
      timestamp => now - timestamp < 10000 // Last 10 seconds
    );

    if (recentRequests.length >= config.burstLimit) {
      tracker.isInCooldown = true;
      tracker.lastBurstTime = now;
      return false;
    }

    return true;
  }

  private getOrCreateTracker(key: string): RequestTracker {
    if (!this.trackers.has(key)) {
      this.trackers.set(key, {
        timestamps: [],
        lastBurstTime: 0,
        burstCount: 0,
        isInCooldown: false,
      });
    }
    return this.trackers.get(key)!;
  }

  /**
   * Throttle a request with automatic retry logic
   */
  async throttleRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    config: ThrottleConfig
  ): Promise<T> {
    // Check for existing pending request
    if (this.pendingRequests.has(key)) {
      console.log(`🔄 Reusing pending request for: ${key}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const executeRequest = async (attempt = 1): Promise<T> => {
      if (!this.isRequestAllowed(key, config)) {
        if (attempt <= config.maxRetries) {
          console.log(`⏳ Request throttled, retrying in ${config.retryDelayMs}ms (attempt ${attempt}/${config.maxRetries}): ${key}`);
          await this.delay(config.retryDelayMs);
          return executeRequest(attempt + 1);
        } else {
          throw new Error(`Request throttled after ${config.maxRetries} attempts: ${key}`);
        }
      }

      // Record the request
      const tracker = this.getOrCreateTracker(key);
      tracker.timestamps.push(Date.now());

      try {
        const result = await requestFn();
        this.pendingRequests.delete(key);
        return result;
      } catch (error) {
        this.pendingRequests.delete(key);
        
        // Handle 429 errors with exponential backoff
        if (this.is429Error(error)) {
          if (attempt <= config.maxRetries) {
            const backoffDelay = config.retryDelayMs * Math.pow(2, attempt - 1);
            console.log(`🚫 429 error, retrying in ${backoffDelay}ms (attempt ${attempt}/${config.maxRetries}): ${key}`);
            await this.delay(backoffDelay);
            return executeRequest(attempt + 1);
          }
        }
        
        throw error;
      }
    };

    const requestPromise = executeRequest();
    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private is429Error(error: any): boolean {
    return error?.status === 429 || 
           error?.response?.status === 429 ||
           error?.message?.includes('429') ||
           error?.message?.includes('Too many requests');
  }

  /**
   * Get throttling status for debugging
   */
  getThrottleStatus(key: string): {
    requestsInLastMinute: number;
    isInCooldown: boolean;
    nextAllowedTime: number;
  } {
    const tracker = this.getOrCreateTracker(key);
    const now = Date.now();
    
    const recentRequests = tracker.timestamps.filter(
      timestamp => now - timestamp < 60000
    );

    const nextAllowedTime = tracker.isInCooldown 
      ? tracker.lastBurstTime + THROTTLE_CONFIGS.analytics.cooldownMs
      : now;

    return {
      requestsInLastMinute: recentRequests.length,
      isInCooldown: tracker.isInCooldown,
      nextAllowedTime,
    };
  }

  /**
   * Clear all throttling data (useful for testing)
   */
  clearThrottleData(): void {
    this.trackers.clear();
    this.pendingRequests.clear();
  }
}

// Global throttle manager instance
export const requestThrottleManager = new RequestThrottleManager();

/**
 * Hook for throttled API requests
 */
export const useThrottledRequest = <T>(
  key: string,
  requestFn: () => Promise<T>,
  configType: keyof typeof THROTTLE_CONFIGS = 'analytics'
) => {
  const config = THROTTLE_CONFIGS[configType];
  
  const throttledRequest = useCallback(async (): Promise<T> => {
    return requestThrottleManager.throttleRequest(key, requestFn, config);
  }, [key, requestFn, config]);

  const status = useMemo(() => {
    return requestThrottleManager.getThrottleStatus(key);
  }, [key]);

  return { throttledRequest, status };
};

/**
 * Debounced function hook with throttling
 */
export const useDebouncedThrottledRequest = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number,
  throttleKey: string,
  configType: keyof typeof THROTTLE_CONFIGS = 'analytics'
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const config = THROTTLE_CONFIGS[configType];

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await requestThrottleManager.throttleRequest(
              `${throttleKey}-${JSON.stringify(args)}`,
              () => fn(...args),
              config
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    }) as T,
    [fn, delay, throttleKey, config]
  );
};

/**
 * Smart cache key generator that reduces unnecessary requests
 */
export const generateSmartCacheKey = (
  endpoint: string,
  params: Record<string, any>,
  cacheWindow: number = 300000 // 5 minutes
): string => {
  // Round timestamp to cache window to enable caching
  const roundedTime = Math.floor(Date.now() / cacheWindow) * cacheWindow;
  
  // Sort params for consistent cache keys
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);

  return `${endpoint}-${JSON.stringify(sortedParams)}-${roundedTime}`;
};
