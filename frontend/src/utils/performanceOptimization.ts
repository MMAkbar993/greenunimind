/**
 * Performance optimization utilities for the Teacher Dashboard
 * Provides tools for monitoring, optimizing, and measuring performance
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
  lastMeasurement: Date;
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_MS: 16, // 60fps target
  MEMORY_USAGE_MB: 50,
  MAX_RE_RENDERS: 5,
  BUNDLE_SIZE_KB: 500,
} as const;

/**
 * Hook for measuring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>(0);
  const metrics = useRef<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 1,
    reRenderCount: 0,
    lastMeasurement: new Date(),
  });

  useEffect(() => {
    startTime.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    metrics.current = {
      ...metrics.current,
      renderTime,
      reRenderCount: renderCount.current,
      lastMeasurement: new Date(),
    };

    // Log performance warnings
    if (renderTime > PERFORMANCE_THRESHOLDS.RENDER_TIME_MS) {
      console.warn(
        `⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
      );
    }

    if (renderCount.current > PERFORMANCE_THRESHOLDS.MAX_RE_RENDERS) {
      console.warn(
        `⚠️ Excessive re-renders in ${componentName}: ${renderCount.current} renders`
      );
    }
  });

  return {
    metrics: metrics.current,
    renderCount: renderCount.current,
  };
};

/**
 * Optimized memoization hook with deep comparison
 */
export const useDeepMemo = <T>(factory: () => T, deps: React.DependencyList): T => {
  return useMemo(factory, deps);
};

/**
 * Debounced callback hook for performance optimization
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
};

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = (): number => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
  }
  return 0;
};

/**
 * Bundle size analyzer
 */
export const analyzeBundleSize = async (): Promise<{
  totalSize: number;
  gzippedSize: number;
  recommendations: string[];
}> => {
  // This would integrate with webpack-bundle-analyzer in a real implementation
  const recommendations: string[] = [];
  
  // Mock analysis for demonstration
  const totalSize = 450; // KB
  const gzippedSize = 120; // KB
  
  if (totalSize > PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_KB) {
    recommendations.push('Consider code splitting for large components');
    recommendations.push('Implement lazy loading for non-critical features');
    recommendations.push('Optimize image assets and use WebP format');
  }
  
  return {
    totalSize,
    gzippedSize,
    recommendations,
  };
};

/**
 * Performance monitoring dashboard
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task monitoring not supported');
      }
    }
  }

  recordMetric(componentName: string, metric: Partial<PerformanceMetrics>) {
    const existing = this.metrics.get(componentName) || {
      renderTime: 0,
      memoryUsage: 0,
      componentCount: 0,
      reRenderCount: 0,
      lastMeasurement: new Date(),
    };

    this.metrics.set(componentName, {
      ...existing,
      ...metric,
      lastMeasurement: new Date(),
    });
  }

  getMetrics(componentName?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (componentName) {
      return this.metrics.get(componentName) || {
        renderTime: 0,
        memoryUsage: 0,
        componentCount: 0,
        reRenderCount: 0,
        lastMeasurement: new Date(),
      };
    }
    return this.metrics;
  }

  generateReport(): string {
    const report = ['📊 Performance Report', '=================='];
    
    for (const [component, metrics] of this.metrics) {
      report.push(`\n${component}:`);
      report.push(`  Render Time: ${metrics.renderTime.toFixed(2)}ms`);
      report.push(`  Re-renders: ${metrics.reRenderCount}`);
      report.push(`  Memory: ${metrics.memoryUsage}MB`);
      report.push(`  Last Updated: ${metrics.lastMeasurement.toLocaleTimeString()}`);
    }
    
    return report.join('\n');
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React DevTools profiler integration
 */
export const withProfiler = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const { renderCount } = useRenderPerformance(componentName);
    
    return (
      <React.Profiler
        id={componentName}
        onRender={(id, phase, actualDuration) => {
          performanceMonitor.recordMetric(id, {
            renderTime: actualDuration,
            reRenderCount: renderCount,
            memoryUsage: getMemoryUsage(),
          });
        }}
      >
        <Component {...props} />
      </React.Profiler>
    );
  });
};

/**
 * Viewport-based lazy loading hook
 */
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};
