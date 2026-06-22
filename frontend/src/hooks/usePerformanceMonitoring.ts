import { useEffect, useRef, useCallback, useState } from 'react';
import { Logger } from '@/utils/logger';

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  
  // Additional metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  
  // Custom metrics
  componentLoadTime: number | null;
  videoLoadTime: number | null;
  apiResponseTime: number | null;
  
  // Resource metrics
  totalResourceSize: number;
  imageCount: number;
  scriptCount: number;
  
  // User experience
  interactionCount: number;
  errorCount: number;
}

interface PerformanceConfig {
  enableWebVitals: boolean;
  enableResourceMonitoring: boolean;
  enableUserInteractionTracking: boolean;
  reportingInterval: number; // in milliseconds
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  onThresholdExceeded?: (metric: string, value: number, threshold: number) => void;
}

interface PerformanceThresholds {
  lcp: number; // 2.5s
  fid: number; // 100ms
  cls: number; // 0.1
  fcp: number; // 1.8s
  ttfb: number; // 600ms
}

const defaultConfig: PerformanceConfig = {
  enableWebVitals: true,
  enableResourceMonitoring: true,
  enableUserInteractionTracking: true,
  reportingInterval: 30000, // 30 seconds
};

const defaultThresholds: PerformanceThresholds = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  fcp: 1800,
  ttfb: 600,
};

export const usePerformanceMonitoring = (
  config: Partial<PerformanceConfig> = {},
  thresholds: Partial<PerformanceThresholds> = {}
) => {
  const finalConfig = { ...defaultConfig, ...config };
  const finalThresholds = { ...defaultThresholds, ...thresholds };
  
  const metricsRef = useRef<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    componentLoadTime: null,
    videoLoadTime: null,
    apiResponseTime: null,
    totalResourceSize: 0,
    imageCount: 0,
    scriptCount: 0,
    interactionCount: 0,
    errorCount: 0,
  });

  const observersRef = useRef<{
    lcp?: PerformanceObserver;
    fid?: PerformanceObserver;
    cls?: PerformanceObserver;
    fcp?: PerformanceObserver;
    resource?: PerformanceObserver;
  }>({});

  const [metrics, setMetrics] = useState<PerformanceMetrics>(metricsRef.current);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Update metrics and trigger callbacks
  const updateMetrics = useCallback((updates: Partial<PerformanceMetrics>) => {
    const hasChanges = Object.entries(updates).some(([key, value]) =>
      metricsRef.current[key as keyof PerformanceMetrics] !== value
    );

    if (!hasChanges) return; // Prevent unnecessary updates

    metricsRef.current = { ...metricsRef.current, ...updates };

    // Use functional update to prevent stale closures
    setMetrics(prev => {
      const newMetrics = { ...metricsRef.current };
      // Only update if there are actual changes
      if (JSON.stringify(prev) === JSON.stringify(newMetrics)) {
        return prev;
      }
      return newMetrics;
    });

    finalConfig.onMetricsUpdate?.(metricsRef.current);

    // Check thresholds
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== null && key in finalThresholds) {
        const threshold = finalThresholds[key as keyof PerformanceThresholds];
        if (value > threshold) {
          finalConfig.onThresholdExceeded?.(key, value, threshold);
        }
      }
    });
  }, [finalConfig.onMetricsUpdate, finalConfig.onThresholdExceeded, finalThresholds]);

  // Initialize Web Vitals monitoring
  useEffect(() => {
    if (!finalConfig.enableWebVitals || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        updateMetrics({ lcp: lastEntry.startTime });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observersRef.current.lcp = lcpObserver;

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          updateMetrics({ fid: entry.processingStart - entry.startTime });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observersRef.current.fid = fidObserver;

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        updateMetrics({ cls: clsValue });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observersRef.current.cls = clsObserver;

      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            updateMetrics({ fcp: entry.startTime });
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      observersRef.current.fcp = fcpObserver;

    } catch (error) {
      Logger.error('Failed to initialize Web Vitals monitoring:', error);
    }

    return () => {
      Object.values(observersRef.current).forEach(observer => {
        observer?.disconnect();
      });
    };
  }, [finalConfig.enableWebVitals]); // Removed updateMetrics to prevent infinite re-renders

  // Initialize resource monitoring
  useEffect(() => {
    if (!finalConfig.enableResourceMonitoring || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalSize = metricsRef.current.totalResourceSize;
        let imageCount = metricsRef.current.imageCount;
        let scriptCount = metricsRef.current.scriptCount;

        entries.forEach((entry: any) => {
          if (entry.transferSize) {
            totalSize += entry.transferSize;
          }

          if (entry.initiatorType === 'img') {
            imageCount++;
          } else if (entry.initiatorType === 'script') {
            scriptCount++;
          }
        });

        updateMetrics({ totalResourceSize: totalSize, imageCount, scriptCount });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      observersRef.current.resource = resourceObserver;

    } catch (error) {
      Logger.error('Failed to initialize resource monitoring:', error);
    }
  }, [finalConfig.enableResourceMonitoring, updateMetrics]);

  // Get navigation timing
  useEffect(() => {
    const getNavigationTiming = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          updateMetrics({ ttfb });
        }
      }
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      getNavigationTiming();
    } else {
      window.addEventListener('load', getNavigationTiming);
      return () => window.removeEventListener('load', getNavigationTiming);
    }
  }, [updateMetrics]);

  // Track user interactions
  useEffect(() => {
    if (!finalConfig.enableUserInteractionTracking) return;

    let interactionCount = 0;

    const handleInteraction = () => {
      interactionCount++;
      updateMetrics({ interactionCount });
    };

    const events = ['click', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [finalConfig.enableUserInteractionTracking, updateMetrics]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    Logger.info('Performance monitoring started');
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    Object.values(observersRef.current).forEach(observer => {
      observer?.disconnect();
    });
    Logger.info('Performance monitoring stopped');
  }, []);

  // Measure component load time
  const measureComponentLoad = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      updateMetrics({ componentLoadTime: loadTime });
      Logger.info(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    };
  }, [updateMetrics]);

  // Measure video load time
  const measureVideoLoad = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      updateMetrics({ videoLoadTime: loadTime });
      Logger.info(`Video loaded in ${loadTime.toFixed(2)}ms`);
    };
  }, [updateMetrics]);

  // Measure API response time
  const measureApiCall = useCallback((apiName: string) => {
    const startTime = performance.now();
    
    return () => {
      const responseTime = performance.now() - startTime;
      updateMetrics({ apiResponseTime: responseTime });
      Logger.info(`API ${apiName} responded in ${responseTime.toFixed(2)}ms`);
    };
  }, [updateMetrics]);

  // Record error
  const recordError = useCallback((error: Error) => {
    const errorCount = metricsRef.current.errorCount + 1;
    updateMetrics({ errorCount });
    Logger.error('Performance monitoring recorded error:', error);
  }, [updateMetrics]);

  // Get performance score
  const getPerformanceScore = useCallback((): number => {
    const { lcp, fid, cls, fcp, ttfb } = metricsRef.current;
    let score = 100;
    
    // Deduct points for poor metrics
    if (lcp && lcp > finalThresholds.lcp) score -= 20;
    if (fid && fid > finalThresholds.fid) score -= 20;
    if (cls && cls > finalThresholds.cls) score -= 20;
    if (fcp && fcp > finalThresholds.fcp) score -= 20;
    if (ttfb && ttfb > finalThresholds.ttfb) score -= 20;
    
    return Math.max(0, score);
  }, [finalThresholds]);

  // Get recommendations
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    const { lcp, fid, cls, fcp, ttfb, totalResourceSize } = metricsRef.current;
    
    if (lcp && lcp > finalThresholds.lcp) {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and improving server response times');
    }
    
    if (fid && fid > finalThresholds.fid) {
      recommendations.push('Reduce First Input Delay by minimizing JavaScript execution time');
    }
    
    if (cls && cls > finalThresholds.cls) {
      recommendations.push('Improve Cumulative Layout Shift by setting dimensions for images and videos');
    }
    
    if (fcp && fcp > finalThresholds.fcp) {
      recommendations.push('Optimize First Contentful Paint by reducing render-blocking resources');
    }
    
    if (ttfb && ttfb > finalThresholds.ttfb) {
      recommendations.push('Improve Time to First Byte by optimizing server response times');
    }
    
    if (totalResourceSize > 5 * 1024 * 1024) { // 5MB
      recommendations.push('Reduce total resource size by compressing images and minifying assets');
    }
    
    return recommendations;
  }, [finalThresholds]);

  // Export metrics
  const exportMetrics = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: metricsRef.current,
      score: getPerformanceScore(),
      recommendations: getRecommendations(),
    };
    
    return report;
  }, [getPerformanceScore, getRecommendations]);

  return {
    // State
    metrics,
    isMonitoring,
    
    // Control functions
    startMonitoring,
    stopMonitoring,
    
    // Measurement functions
    measureComponentLoad,
    measureVideoLoad,
    measureApiCall,
    recordError,
    
    // Analysis functions
    getPerformanceScore,
    getRecommendations,
    exportMetrics,
    
    // Utilities
    isGoodPerformance: () => getPerformanceScore() >= 80,
    hasWebVitalsSupport: () => 'PerformanceObserver' in window,
  };
};

export default usePerformanceMonitoring;
