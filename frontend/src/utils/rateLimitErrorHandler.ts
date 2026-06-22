/**
 * Enhanced error handling for rate limiting (429) responses
 * Provides user feedback, retry logic, and graceful degradation
 */

import { toast } from 'sonner';

export interface RateLimitError {
  status: number;
  message: string;
  retryAfter?: number;
  endpoint?: string;
  timestamp: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true,
};

class RateLimitErrorHandler {
  private errorHistory: RateLimitError[] = [];
  private userNotificationCooldown = new Map<string, number>();
  private readonly NOTIFICATION_COOLDOWN_MS = 30000; // 30 seconds

  /**
   * Handle 429 rate limit errors with user feedback and retry logic
   */
  async handleRateLimitError(
    error: any,
    endpoint: string,
    retryFn?: () => Promise<any>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<any> {
    const rateLimitError = this.parseRateLimitError(error, endpoint);
    this.recordError(rateLimitError);

    // Show user notification (with cooldown to prevent spam)
    this.showUserNotification(rateLimitError);

    // If retry function provided, attempt retry with exponential backoff
    if (retryFn) {
      return this.retryWithBackoff(retryFn, config, rateLimitError);
    }

    // Return fallback data or throw error
    return this.handleGracefulDegradation(rateLimitError);
  }

  private parseRateLimitError(error: any, endpoint: string): RateLimitError {
    const status = error?.status || error?.response?.status || 429;
    const message = error?.message || error?.response?.data?.message || 'Too many requests';
    const retryAfter = this.extractRetryAfter(error);

    return {
      status,
      message,
      retryAfter,
      endpoint,
      timestamp: Date.now(),
    };
  }

  private extractRetryAfter(error: any): number | undefined {
    // Try to extract Retry-After header
    const retryAfter = 
      error?.response?.headers?.['retry-after'] ||
      error?.response?.headers?.['Retry-After'] ||
      error?.retryAfter;

    if (retryAfter) {
      const parsed = parseInt(retryAfter);
      return isNaN(parsed) ? undefined : parsed * 1000; // Convert to milliseconds
    }

    return undefined;
  }

  private recordError(error: RateLimitError): void {
    this.errorHistory.push(error);
    
    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50);
    }

    console.warn('🚫 Rate limit error recorded:', {
      endpoint: error.endpoint,
      message: error.message,
      retryAfter: error.retryAfter,
      timestamp: new Date(error.timestamp).toISOString(),
    });
  }

  private showUserNotification(error: RateLimitError): void {
    const now = Date.now();
    const lastNotification = this.userNotificationCooldown.get(error.endpoint || 'general');

    // Check cooldown to prevent notification spam
    if (lastNotification && now - lastNotification < this.NOTIFICATION_COOLDOWN_MS) {
      return;
    }

    this.userNotificationCooldown.set(error.endpoint || 'general', now);

    const retryMessage = error.retryAfter 
      ? ` Please wait ${Math.ceil(error.retryAfter / 1000)} seconds before trying again.`
      : ' Please wait a moment before trying again.';

    toast.warning('Rate Limit Reached', {
      description: `Too many requests to ${this.getEndpointDisplayName(error.endpoint)}.${retryMessage}`,
      duration: 5000,
      action: {
        label: 'Dismiss',
        onClick: () => {},
      },
    });
  }

  private getEndpointDisplayName(endpoint?: string): string {
    if (!endpoint) return 'the server';
    
    const endpointNames: Record<string, string> = {
      'dashboard': 'Dashboard Analytics',
      'enrollment-statistics': 'Enrollment Data',
      'engagement-metrics': 'Engagement Metrics',
      'activities': 'Recent Activities',
      'revenue': 'Revenue Analytics',
      'performance': 'Performance Metrics',
    };

    for (const [key, name] of Object.entries(endpointNames)) {
      if (endpoint.includes(key)) {
        return name;
      }
    }

    return 'Analytics';
  }

  private async retryWithBackoff(
    retryFn: () => Promise<any>,
    config: RetryConfig,
    error: RateLimitError
  ): Promise<any> {
    let attempt = 0;
    let lastError = error;

    while (attempt < config.maxRetries) {
      attempt++;
      
      // Calculate delay with exponential backoff
      let delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      // Add jitter to prevent thundering herd
      if (config.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      // Use server-provided retry-after if available and longer
      if (error.retryAfter && error.retryAfter > delay) {
        delay = error.retryAfter;
      }

      console.log(`⏳ Retrying request in ${Math.round(delay)}ms (attempt ${attempt}/${config.maxRetries})`);
      
      // Show retry notification for longer delays
      if (delay > 5000) {
        toast.info('Retrying Request', {
          description: `Waiting ${Math.round(delay / 1000)} seconds before retry...`,
          duration: Math.min(delay, 10000),
        });
      }

      await this.delay(delay);

      try {
        const result = await retryFn();
        
        // Success notification for recovered requests
        if (attempt > 1) {
          toast.success('Request Successful', {
            description: 'Connection restored successfully.',
            duration: 3000,
          });
        }
        
        return result;
      } catch (retryError) {
        lastError = this.parseRateLimitError(retryError, error.endpoint || '');
        
        // If still rate limited, continue retrying
        if (this.isRateLimitError(retryError)) {
          this.recordError(lastError);
          continue;
        }
        
        // If different error, throw immediately
        throw retryError;
      }
    }

    // All retries exhausted
    toast.error('Request Failed', {
      description: `Unable to complete request after ${config.maxRetries} attempts. Please try again later.`,
      duration: 8000,
    });

    throw new Error(`Rate limit retry exhausted after ${config.maxRetries} attempts`);
  }

  private isRateLimitError(error: any): boolean {
    const status = error?.status || error?.response?.status;
    return status === 429 || 
           error?.message?.includes('429') ||
           error?.message?.toLowerCase().includes('too many requests');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Provide fallback data when rate limited
   */
  private handleGracefulDegradation(error: RateLimitError): any {
    console.log('🔄 Providing fallback data due to rate limiting');

    // Return appropriate fallback based on endpoint
    if (error.endpoint?.includes('dashboard')) {
      return this.getDashboardFallback();
    }
    
    if (error.endpoint?.includes('activities')) {
      return this.getActivitiesFallback();
    }

    if (error.endpoint?.includes('analytics')) {
      return this.getAnalyticsFallback();
    }

    // Generic fallback
    return {
      success: false,
      message: 'Data temporarily unavailable due to high traffic',
      data: null,
      fallback: true,
    };
  }

  private getDashboardFallback() {
    return {
      success: true,
      message: 'Using cached dashboard data',
      data: {
        overview: {
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
          averageRating: 0,
        },
        trends: {
          coursesGrowth: 0,
          studentsGrowth: 0,
          revenueGrowth: 0,
        },
      },
      fallback: true,
    };
  }

  private getActivitiesFallback() {
    return {
      success: true,
      message: 'Activities temporarily unavailable',
      data: {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      },
      fallback: true,
    };
  }

  private getAnalyticsFallback() {
    return {
      success: true,
      message: 'Analytics data temporarily unavailable',
      data: {
        metrics: {},
        trends: {},
        insights: [],
      },
      fallback: true,
    };
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByEndpoint: Record<string, number>;
    recentErrors: RateLimitError[];
    averageRetryAfter: number;
  } {
    const errorsByEndpoint: Record<string, number> = {};
    let totalRetryAfter = 0;
    let retryAfterCount = 0;

    this.errorHistory.forEach(error => {
      const endpoint = error.endpoint || 'unknown';
      errorsByEndpoint[endpoint] = (errorsByEndpoint[endpoint] || 0) + 1;
      
      if (error.retryAfter) {
        totalRetryAfter += error.retryAfter;
        retryAfterCount++;
      }
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByEndpoint,
      recentErrors: this.errorHistory.slice(-10),
      averageRetryAfter: retryAfterCount > 0 ? totalRetryAfter / retryAfterCount : 0,
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.userNotificationCooldown.clear();
  }
}

// Global error handler instance
export const rateLimitErrorHandler = new RateLimitErrorHandler();

/**
 * Utility function to wrap API calls with rate limit handling
 */
export const withRateLimitHandling = async <T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  config?: Partial<RetryConfig>
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    if (rateLimitErrorHandler['isRateLimitError'](error)) {
      return rateLimitErrorHandler.handleRateLimitError(
        error,
        endpoint,
        apiCall,
        { ...DEFAULT_RETRY_CONFIG, ...config }
      );
    }
    throw error;
  }
};
