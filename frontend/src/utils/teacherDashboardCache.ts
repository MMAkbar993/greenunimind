import { store } from '@/redux/store';
import { baseApi } from '@/redux/api/baseApi';

/**
 * Comprehensive cache invalidation for teacher dashboard data
 * Ensures real-time data updates for financial and analytics information
 */

export interface TeacherDashboardCacheOptions {
  teacherId: string;
  invalidateFinancials?: boolean;
  invalidateAnalytics?: boolean;
  invalidateActivities?: boolean;
  invalidatePayouts?: boolean;
  forceRefresh?: boolean;
}

/**
 * Invalidate all teacher dashboard related caches
 */
export const invalidateTeacherDashboardCache = (options: TeacherDashboardCacheOptions): void => {
  const { 
    teacherId, 
    invalidateFinancials = true, 
    invalidateAnalytics = true, 
    invalidateActivities = true,
    invalidatePayouts = true,
    forceRefresh = false 
  } = options;

  const tagsToInvalidate: string[] = [];

  // Financial data tags
  if (invalidateFinancials) {
    tagsToInvalidate.push(
      'analytics', // General analytics tag used by financial endpoints
      'revenue',
      'performance'
    );
  }

  // Analytics data tags
  if (invalidateAnalytics) {
    tagsToInvalidate.push(
      'analytics',
      'dashboard',
      'performance'
    );
  }

  // Activity data tags
  if (invalidateActivities) {
    tagsToInvalidate.push(
      'activities',
      'analytics'
    );
  }

  // Payout data tags
  if (invalidatePayouts) {
    tagsToInvalidate.push(
      'Payouts',
      'PayoutPreferences'
    );
  }

  // Remove duplicates
  const uniqueTags = [...new Set(tagsToInvalidate)];

  // Invalidate tags
  store.dispatch(baseApi.util.invalidateTags(uniqueTags));

  // Force refresh specific endpoints if requested
  if (forceRefresh) {
    // Reset specific queries to force fresh data fetch
    store.dispatch(baseApi.util.resetApiState());
  }

  console.log('🔄 Teacher dashboard cache invalidated:', {
    teacherId,
    invalidatedTags: uniqueTags,
    forceRefresh,
    timestamp: new Date().toISOString()
  });
};

/**
 * Invalidate only financial data caches
 */
export const invalidateFinancialDataCache = (teacherId: string): void => {
  invalidateTeacherDashboardCache({
    teacherId,
    invalidateFinancials: true,
    invalidateAnalytics: false,
    invalidateActivities: false,
    invalidatePayouts: true
  });
};

/**
 * Invalidate only analytics data caches
 */
export const invalidateAnalyticsDataCache = (teacherId: string): void => {
  invalidateTeacherDashboardCache({
    teacherId,
    invalidateFinancials: false,
    invalidateAnalytics: true,
    invalidateActivities: true,
    invalidatePayouts: false
  });
};

/**
 * Force refresh all teacher dashboard data
 * Use this when critical data updates need immediate reflection
 */
export const forceRefreshTeacherDashboard = (teacherId: string): void => {
  invalidateTeacherDashboardCache({
    teacherId,
    invalidateFinancials: true,
    invalidateAnalytics: true,
    invalidateActivities: true,
    invalidatePayouts: true,
    forceRefresh: true
  });
};

/**
 * Auto-refresh teacher dashboard data at intervals
 * Useful for keeping financial data current
 */
export const setupTeacherDashboardAutoRefresh = (
  teacherId: string, 
  intervalMs: number = 300000 // 5 minutes default
): (() => void) => {
  const intervalId = setInterval(() => {
    invalidateTeacherDashboardCache({
      teacherId,
      invalidateFinancials: true,
      invalidateAnalytics: true,
      invalidateActivities: false, // Activities don't need frequent refresh
      invalidatePayouts: true
    });
  }, intervalMs);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('🛑 Teacher dashboard auto-refresh stopped for:', teacherId);
  };
};

/**
 * Invalidate cache when teacher navigates to dashboard sections
 * Call this in useEffect when components mount
 */
export const invalidateOnDashboardNavigation = (teacherId: string, section: string): void => {
  const sectionCacheMap: Record<string, Partial<TeacherDashboardCacheOptions>> = {
    'earnings': { invalidateFinancials: true, invalidatePayouts: true },
    'analytics': { invalidateAnalytics: true, invalidateActivities: true },
    'students': { invalidateAnalytics: true },
    'courses': { invalidateAnalytics: true },
    'payouts': { invalidatePayouts: true, invalidateFinancials: true },
    'overview': { invalidateFinancials: true, invalidateAnalytics: true, invalidatePayouts: true }
  };

  const cacheOptions = sectionCacheMap[section] || {};
  
  invalidateTeacherDashboardCache({
    teacherId,
    invalidateFinancials: false,
    invalidateAnalytics: false,
    invalidateActivities: false,
    invalidatePayouts: false,
    ...cacheOptions
  });

  console.log(`📊 Cache invalidated for dashboard section: ${section}`);
};

/**
 * Manual refresh button handler
 * Provides immediate cache invalidation with user feedback
 */
export const handleManualRefresh = async (
  teacherId: string,
  onRefreshStart?: () => void,
  onRefreshComplete?: () => void
): Promise<void> => {
  try {
    onRefreshStart?.();
    
    // Force refresh all data
    forceRefreshTeacherDashboard(teacherId);
    
    // Wait a moment for the invalidation to process
    await new Promise(resolve => setTimeout(resolve, 100));
    
    onRefreshComplete?.();
    
    console.log('✅ Manual refresh completed for teacher:', teacherId);
  } catch (error) {
    console.error('❌ Manual refresh failed:', error);
    onRefreshComplete?.();
  }
};

/**
 * Check if data is stale and needs refresh
 * Based on last fetch timestamp
 */
export const isDataStale = (lastFetchTime: number, maxAgeMs: number = 300000): boolean => {
  return Date.now() - lastFetchTime > maxAgeMs;
};

/**
 * Get cache busting query parameter
 * Use this to ensure fresh API calls
 */
export const getCacheBustingParam = (): string => {
  return `_t=${Date.now()}`;
};
