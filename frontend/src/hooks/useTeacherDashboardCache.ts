import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  invalidateTeacherDashboardCache,
  invalidateOnDashboardNavigation,
  handleManualRefresh,
  setupTeacherDashboardAutoRefresh,
  isDataStale
} from '@/utils/teacherDashboardCache';

export interface UseTeacherDashboardCacheOptions {
  teacherId: string;
  enableAutoRefresh?: boolean;
  autoRefreshInterval?: number; // in milliseconds
  invalidateOnMount?: boolean;
  invalidateOnNavigation?: boolean;
  section?: string; // dashboard section name
}

export interface TeacherDashboardCacheControls {
  invalidateCache: (options?: {
    financials?: boolean;
    analytics?: boolean;
    activities?: boolean;
    payouts?: boolean;
  }) => void;
  forceRefresh: () => void;
  manualRefresh: (
    onStart?: () => void,
    onComplete?: () => void
  ) => Promise<void>;
  isStale: (lastFetchTime: number, maxAge?: number) => boolean;
}

/**
 * Custom hook for managing teacher dashboard cache
 * Provides automatic cache invalidation and manual refresh controls
 */
export const useTeacherDashboardCache = (
  options: UseTeacherDashboardCacheOptions
): TeacherDashboardCacheControls => {
  const {
    teacherId,
    enableAutoRefresh = false,
    autoRefreshInterval = 900000, // 15 minutes (increased from 5 to reduce requests)
    invalidateOnMount = false, // Disable aggressive cache invalidation
    invalidateOnNavigation = false, // Disable navigation-based invalidation
    section = 'overview'
  } = options;

  const location = useLocation();
  const autoRefreshCleanupRef = useRef<(() => void) | null>(null);
  const lastNavigationRef = useRef<string>('');

  // Invalidate cache on component mount
  useEffect(() => {
    if (invalidateOnMount && teacherId) {
      invalidateOnDashboardNavigation(teacherId, section);
    }
  }, [teacherId, section, invalidateOnMount]);

  // Handle navigation-based cache invalidation
  useEffect(() => {
    if (invalidateOnNavigation && teacherId && location.pathname !== lastNavigationRef.current) {
      lastNavigationRef.current = location.pathname;
      
      // Determine section from pathname
      const pathSection = location.pathname.includes('/earnings') ? 'earnings'
        : location.pathname.includes('/analytics') ? 'analytics'
        : location.pathname.includes('/students') ? 'students'
        : location.pathname.includes('/courses') ? 'courses'
        : location.pathname.includes('/payouts') ? 'payouts'
        : 'overview';

      invalidateOnDashboardNavigation(teacherId, pathSection);
    }
  }, [location.pathname, teacherId, invalidateOnNavigation]);

  // Setup auto-refresh
  useEffect(() => {
    if (enableAutoRefresh && teacherId) {
      autoRefreshCleanupRef.current = setupTeacherDashboardAutoRefresh(
        teacherId,
        autoRefreshInterval
      );

      return () => {
        if (autoRefreshCleanupRef.current) {
          autoRefreshCleanupRef.current();
          autoRefreshCleanupRef.current = null;
        }
      };
    }
  }, [enableAutoRefresh, teacherId, autoRefreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshCleanupRef.current) {
        autoRefreshCleanupRef.current();
      }
    };
  }, []);

  // Cache control functions
  const invalidateCache = useCallback((cacheOptions?: {
    financials?: boolean;
    analytics?: boolean;
    activities?: boolean;
    payouts?: boolean;
  }) => {
    if (!teacherId) return;

    invalidateTeacherDashboardCache({
      teacherId,
      invalidateFinancials: cacheOptions?.financials ?? true,
      invalidateAnalytics: cacheOptions?.analytics ?? true,
      invalidateActivities: cacheOptions?.activities ?? true,
      invalidatePayouts: cacheOptions?.payouts ?? true
    });
  }, [teacherId]);

  const forceRefresh = useCallback(() => {
    if (!teacherId) return;

    invalidateTeacherDashboardCache({
      teacherId,
      invalidateFinancials: true,
      invalidateAnalytics: true,
      invalidateActivities: true,
      invalidatePayouts: true,
      forceRefresh: true
    });
  }, [teacherId]);

  const manualRefresh = useCallback(async (
    onStart?: () => void,
    onComplete?: () => void
  ) => {
    if (!teacherId) return;

    await handleManualRefresh(teacherId, onStart, onComplete);
  }, [teacherId]);

  const isStale = useCallback((lastFetchTime: number, maxAge?: number) => {
    return isDataStale(lastFetchTime, maxAge);
  }, []);

  return {
    invalidateCache,
    forceRefresh,
    manualRefresh,
    isStale
  };
};

/**
 * Simplified hook for components that only need basic cache invalidation
 */
export const useTeacherDashboardRefresh = (teacherId: string) => {
  const { invalidateCache, forceRefresh, manualRefresh } = useTeacherDashboardCache({
    teacherId,
    enableAutoRefresh: false,
    invalidateOnMount: true,
    invalidateOnNavigation: false
  });

  return { invalidateCache, forceRefresh, manualRefresh };
};

/**
 * Hook for financial data components that need frequent updates
 */
export const useFinancialDataCache = (teacherId: string) => {
  const { invalidateCache, manualRefresh, isStale } = useTeacherDashboardCache({
    teacherId,
    enableAutoRefresh: true,
    autoRefreshInterval: 180000, // 3 minutes for financial data
    invalidateOnMount: true,
    invalidateOnNavigation: true,
    section: 'earnings'
  });

  const invalidateFinancials = useCallback(() => {
    invalidateCache({
      financials: true,
      payouts: true,
      analytics: false,
      activities: false
    });
  }, [invalidateCache]);

  return { invalidateFinancials, manualRefresh, isStale };
};

/**
 * Hook for analytics components
 */
export const useAnalyticsDataCache = (teacherId: string) => {
  const { invalidateCache, manualRefresh, isStale } = useTeacherDashboardCache({
    teacherId,
    enableAutoRefresh: true,
    autoRefreshInterval: 300000, // 5 minutes for analytics
    invalidateOnMount: true,
    invalidateOnNavigation: true,
    section: 'analytics'
  });

  const invalidateAnalytics = useCallback(() => {
    invalidateCache({
      analytics: true,
      activities: true,
      financials: false,
      payouts: false
    });
  }, [invalidateCache]);

  return { invalidateAnalytics, manualRefresh, isStale };
};
