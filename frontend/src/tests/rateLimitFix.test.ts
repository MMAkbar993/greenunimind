/**
 * Test suite for rate limiting fixes
 * Verifies that the dashboard no longer triggers 429 errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requestThrottleManager, THROTTLE_CONFIGS } from '@/utils/requestThrottling';
import { rateLimitErrorHandler } from '@/utils/rateLimitErrorHandler';

// Mock fetch for testing
global.fetch = vi.fn();

describe('Rate Limiting Fixes', () => {
  beforeEach(() => {
    requestThrottleManager.clearThrottleData();
    rateLimitErrorHandler.clearErrorHistory();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Request Throttling', () => {
    it('should throttle requests within rate limits', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
      const config = THROTTLE_CONFIGS.analytics;

      // Make requests up to the burst limit
      const promises = Array(config.burstLimit).fill(null).map((_, i) =>
        requestThrottleManager.throttleRequest(
          `test-${i}`,
          mockApiCall,
          config
        )
      );

      await Promise.all(promises);

      // Should have called the API for each request
      expect(mockApiCall).toHaveBeenCalledTimes(config.burstLimit);
    });

    it('should delay requests when burst limit exceeded', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
      const config = THROTTLE_CONFIGS.analytics;

      // Make requests exceeding burst limit
      const promises = Array(config.burstLimit + 2).fill(null).map((_, i) =>
        requestThrottleManager.throttleRequest(
          'test-burst',
          mockApiCall,
          config
        )
      );

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      // Should have taken some time due to throttling
      expect(endTime - startTime).toBeGreaterThan(config.cooldownMs - 1000);
      expect(mockApiCall).toHaveBeenCalledTimes(config.burstLimit + 2);
    });

    it('should reuse pending requests', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
      const config = THROTTLE_CONFIGS.analytics;

      // Make multiple requests with same key simultaneously
      const promises = Array(3).fill(null).map(() =>
        requestThrottleManager.throttleRequest(
          'same-key',
          mockApiCall,
          config
        )
      );

      await Promise.all(promises);

      // Should only call API once due to request deduplication
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('should respect rate limits per minute', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
      const config = THROTTLE_CONFIGS.analytics;

      // Make requests up to the per-minute limit
      const promises = Array(config.maxRequestsPerMinute).fill(null).map((_, i) =>
        requestThrottleManager.throttleRequest(
          `test-minute-${i}`,
          mockApiCall,
          config
        )
      );

      await Promise.all(promises);
      expect(mockApiCall).toHaveBeenCalledTimes(config.maxRequestsPerMinute);

      // Next request should be throttled
      const throttledPromise = requestThrottleManager.throttleRequest(
        'test-minute-overflow',
        mockApiCall,
        config
      );

      await expect(throttledPromise).rejects.toThrow('Request throttled');
    });
  });

  describe('429 Error Handling', () => {
    it('should handle 429 errors with retry logic', async () => {
      const mockApiCall = vi.fn()
        .mockRejectedValueOnce({ status: 429, message: 'Too many requests' })
        .mockRejectedValueOnce({ status: 429, message: 'Too many requests' })
        .mockResolvedValueOnce({ data: 'success' });

      const result = await rateLimitErrorHandler.handleRateLimitError(
        { status: 429, message: 'Too many requests' },
        'test-endpoint',
        mockApiCall
      );

      expect(result.data).toBe('success');
      expect(mockApiCall).toHaveBeenCalledTimes(3);
    });

    it('should provide fallback data when retries exhausted', async () => {
      const mockApiCall = vi.fn()
        .mockRejectedValue({ status: 429, message: 'Too many requests' });

      const result = await rateLimitErrorHandler.handleRateLimitError(
        { status: 429, message: 'Too many requests' },
        'dashboard',
        mockApiCall,
        { maxRetries: 1, baseDelay: 100, maxDelay: 1000, backoffMultiplier: 2, jitter: false }
      );

      expect(result.fallback).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should track error statistics', async () => {
      const error = { status: 429, message: 'Too many requests' };
      
      await rateLimitErrorHandler.handleRateLimitError(error, 'endpoint1');
      await rateLimitErrorHandler.handleRateLimitError(error, 'endpoint2');
      await rateLimitErrorHandler.handleRateLimitError(error, 'endpoint1');

      const stats = rateLimitErrorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByEndpoint['endpoint1']).toBe(2);
      expect(stats.errorsByEndpoint['endpoint2']).toBe(1);
    });
  });

  describe('Smart Cache Keys', () => {
    it('should generate consistent cache keys within time window', () => {
      const { generateSmartCacheKey } = require('@/utils/requestThrottling');
      
      const key1 = generateSmartCacheKey('test', { param: 'value' }, 300000);
      const key2 = generateSmartCacheKey('test', { param: 'value' }, 300000);
      
      expect(key1).toBe(key2);
    });

    it('should generate different cache keys for different parameters', () => {
      const { generateSmartCacheKey } = require('@/utils/requestThrottling');
      
      const key1 = generateSmartCacheKey('test', { param: 'value1' }, 300000);
      const key2 = generateSmartCacheKey('test', { param: 'value2' }, 300000);
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Integration Test - Dashboard Analytics', () => {
    it('should handle multiple simultaneous analytics requests without rate limiting', async () => {
      const mockResponses = [
        { data: { dashboard: 'data' } },
        { data: { enrollment: 'data' } },
        { data: { engagement: 'data' } },
        { data: { activities: 'data' } }
      ];

      const mockApiCalls = mockResponses.map(response => 
        vi.fn().mockResolvedValue(response)
      );

      const config = THROTTLE_CONFIGS.analytics;

      // Simulate dashboard loading multiple analytics endpoints
      const promises = mockApiCalls.map((apiCall, index) =>
        requestThrottleManager.throttleRequest(
          `analytics-${index}`,
          apiCall,
          config
        )
      );

      const results = await Promise.all(promises);

      // All requests should succeed
      expect(results).toHaveLength(4);
      results.forEach((result, index) => {
        expect(result).toEqual(mockResponses[index]);
      });

      // All API calls should have been made
      mockApiCalls.forEach(apiCall => {
        expect(apiCall).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle dashboard refresh without triggering rate limits', async () => {
      const mockDashboardCall = vi.fn().mockResolvedValue({ data: 'dashboard' });
      const mockActivitiesCall = vi.fn().mockResolvedValue({ data: 'activities' });
      
      const config = THROTTLE_CONFIGS.dashboard;

      // Simulate rapid dashboard refreshes (user clicking refresh multiple times)
      const refreshPromises = Array(5).fill(null).map(async (_, i) => {
        const dashboardPromise = requestThrottleManager.throttleRequest(
          'dashboard-refresh',
          mockDashboardCall,
          config
        );
        
        const activitiesPromise = requestThrottleManager.throttleRequest(
          'activities-refresh',
          mockActivitiesCall,
          config
        );

        return Promise.all([dashboardPromise, activitiesPromise]);
      });

      const results = await Promise.all(refreshPromises);

      // Should have results for all refreshes
      expect(results).toHaveLength(5);
      
      // But API calls should be deduplicated/throttled
      expect(mockDashboardCall).toHaveBeenCalledTimes(1);
      expect(mockActivitiesCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Optimization', () => {
    it('should maintain acceptable response times under throttling', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ data: 'test' });
      const config = THROTTLE_CONFIGS.analytics;

      const startTime = Date.now();
      
      // Make requests within burst limit
      const promises = Array(config.burstLimit).fill(null).map((_, i) =>
        requestThrottleManager.throttleRequest(
          `perf-test-${i}`,
          mockApiCall,
          config
        )
      );

      await Promise.all(promises);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should complete quickly when within limits
      expect(responseTime).toBeLessThan(1000); // Less than 1 second
      expect(mockApiCall).toHaveBeenCalledTimes(config.burstLimit);
    });
  });
});

describe('Rate Limiting Configuration Validation', () => {
  it('should have appropriate rate limits for each endpoint type', () => {
    // Analytics endpoints should be conservative
    expect(THROTTLE_CONFIGS.analytics.maxRequestsPerMinute).toBeLessThanOrEqual(15);
    
    // Dashboard endpoints should allow more requests
    expect(THROTTLE_CONFIGS.dashboard.maxRequestsPerMinute).toBeLessThanOrEqual(30);
    
    // Activities should allow high frequency
    expect(THROTTLE_CONFIGS.activities.maxRequestsPerMinute).toBeLessThanOrEqual(100);
    
    // Real-time should be very conservative
    expect(THROTTLE_CONFIGS.realtime.maxRequestsPerMinute).toBeLessThanOrEqual(10);
  });

  it('should have reasonable retry configurations', () => {
    Object.values(THROTTLE_CONFIGS).forEach(config => {
      expect(config.maxRetries).toBeGreaterThan(0);
      expect(config.maxRetries).toBeLessThanOrEqual(5);
      expect(config.retryDelayMs).toBeGreaterThan(0);
      expect(config.cooldownMs).toBeGreaterThan(0);
    });
  });
});
