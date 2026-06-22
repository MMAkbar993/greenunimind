interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  timeoutMs: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  timeoutMs: 30000 // 30 seconds
};

export class ApiRetryError extends Error {
  constructor(
    message: string,
    public originalError: Error,
    public attempt: number,
    public maxRetries: number
  ) {
    super(message);
    this.name = 'ApiRetryError';
  }
}

export async function apiWithRetry<T>(
  apiCall: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxRetries + 1; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${finalConfig.timeoutMs}ms`));
        }, finalConfig.timeoutMs);
      });

      // Race between the API call and timeout
      const result = await Promise.race([
        apiCall(),
        timeoutPromise
      ]);

      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt > finalConfig.maxRetries) {
        break;
      }

      // Check if it's a server wake-up scenario
      const isServerWakeUp = 
        lastError.message.includes('timeout') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('503') ||
        lastError.message.includes('502') ||
        lastError.message.includes('504') ||
        (lastError as any)?.response?.status >= 500;

      if (!isServerWakeUp) {
        // Don't retry for client errors (4xx) or other non-server issues
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      );

      console.log(`API retry attempt ${attempt}/${finalConfig.maxRetries} after ${delay}ms delay`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new ApiRetryError(
    `API call failed after ${finalConfig.maxRetries} retries: ${lastError.message}`,
    lastError,
    finalConfig.maxRetries,
    finalConfig.maxRetries
  );
}

// Specific retry configuration for server wake-up scenarios
export const serverWakeUpConfig: Partial<RetryConfig> = {
  maxRetries: 4,
  baseDelay: 2000, // 2 seconds
  maxDelay: 15000, // 15 seconds
  backoffFactor: 1.5,
  timeoutMs: 45000 // 45 seconds for server wake-up
};

// Helper function for common API patterns
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config?: Partial<RetryConfig>
): Promise<Response> {
  return apiWithRetry(
    () => fetch(url, options),
    config || serverWakeUpConfig
  );
}

// Helper for JSON API calls
export async function fetchJsonWithRetry<T>(
  url: string,
  options: RequestInit = {},
  config?: Partial<RetryConfig>
): Promise<T> {
  const response = await fetchWithRetry(url, options, config);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}
