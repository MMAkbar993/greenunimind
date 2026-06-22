import { useCallback, useEffect, useRef, useState } from 'react';
import { config } from '@/config';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentMounts: number;
  reRenders: number;
  lastUpdate: number;
}

interface UsePerformanceOptimizationOptions {
  enableMetrics?: boolean;
  enableVirtualization?: boolean;
  enableLazyLoading?: boolean;
  debounceMs?: number;
  throttleMs?: number;
}

export const usePerformanceOptimization = (options: UsePerformanceOptimizationOptions = {}) => {
  const {
    enableMetrics = config.node_env === 'development',
    enableVirtualization = true,
    enableLazyLoading = true,
    debounceMs = 300,
    throttleMs = 100
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentMounts: 0,
    reRenders: 0,
    lastUpdate: Date.now()
  });

  const renderStartTime = useRef<number>(0);
  const mountCount = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Performance measurement
  useEffect(() => {
    if (!enableMetrics) return;

    renderStartTime.current = performance.now();
    mountCount.current += 1;
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

      setMetrics(prev => ({
        renderTime,
        memoryUsage,
        componentMounts: mountCount.current,
        reRenders: renderCount.current,
        lastUpdate: Date.now()
      }));
    };
  });

  // Debounce function
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number = debounceMs
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, [debounceMs]);

  // Throttle function
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    delay: number = throttleMs
  ): ((...args: Parameters<T>) => void) => {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }, [throttleMs]);

  // Lazy loading with Intersection Observer
  const useLazyLoading = useCallback((
    callback: () => void,
    options: IntersectionObserverInit = {}
  ) => {
    const elementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (!enableLazyLoading || !elementRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              callback();
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1,
          ...options
        }
      );

      observer.observe(elementRef.current);
      observerRef.current = observer;

      return () => {
        observer.disconnect();
      };
    }, [callback, options]);

    return elementRef;
  }, [enableLazyLoading]);

  // Virtual scrolling helper
  const useVirtualization = useCallback((
    items: any[],
    itemHeight: number,
    containerHeight: number,
    overscan: number = 5
  ) => {
    const [scrollTop, setScrollTop] = useState(0);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;

    const handleScroll = throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    });

    return {
      visibleItems,
      totalHeight,
      offsetY,
      startIndex,
      endIndex,
      handleScroll
    };
  }, [throttle, enableVirtualization]);

  // Memoization helper
  const useMemoizedValue = useCallback(<T>(
    factory: () => T,
    deps: React.DependencyList
  ): T => {
    const memoRef = useRef<{ value: T; deps: React.DependencyList } | null>(null);

    if (!memoRef.current || !depsEqual(memoRef.current.deps, deps)) {
      memoRef.current = {
        value: factory(),
        deps: [...deps]
      };
    }

    return memoRef.current.value;
  }, []);

  // Deep equality check for dependencies
  const depsEqual = (a: React.DependencyList, b: React.DependencyList): boolean => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => Object.is(item, b[index]));
  };

  // Image lazy loading
  const useLazyImage = useCallback((src: string, placeholder?: string) => {
    const [imageSrc, setImageSrc] = useState(placeholder || '');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    const imageRef = useLazyLoading(() => {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setIsError(true);
      };
      img.src = src;
    });

    return {
      imageRef,
      imageSrc,
      isLoaded,
      isError
    };
  }, [useLazyLoading]);

  // Component lazy loading
  const useLazyComponent = useCallback(<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: React.ComponentType
  ) => {
    const [Component, setComponent] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadComponent = useCallback(async () => {
      if (Component || isLoading) return;

      setIsLoading(true);
      try {
        const module = await importFunc();
        setComponent(() => module.default);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }, [Component, isLoading, importFunc]);

    const componentRef = useLazyLoading(loadComponent);

    return {
      componentRef,
      Component,
      isLoading,
      error,
      Fallback: fallback
    };
  }, [useLazyLoading]);

  // Bundle size optimization
  const useCodeSplitting = useCallback((
    condition: boolean,
    importFunc: () => Promise<any>
  ) => {
    const [module, setModule] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!condition || module || isLoading) return;

      setIsLoading(true);
      importFunc()
        .then(setModule)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }, [condition, importFunc, module, isLoading]);

    return { module, isLoading };
  }, []);

  // Memory leak prevention
  const useCleanup = useCallback((cleanupFn: () => void) => {
    const cleanupRef = useRef(cleanupFn);
    cleanupRef.current = cleanupFn;

    useEffect(() => {
      return () => {
        cleanupRef.current();
      };
    }, []);
  }, []);

  // Performance monitoring
  const measurePerformance = useCallback((name: string, fn: () => void) => {
    if (!enableMetrics) {
      fn();
      return;
    }

    const start = performance.now();
    fn();
    const end = performance.now();
    
    console.log(`Performance: ${name} took ${end - start} milliseconds`);
  }, [enableMetrics]);

  // Resource preloading
  const preloadResource = useCallback((
    href: string,
    as: 'script' | 'style' | 'image' | 'font' = 'script'
  ) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (as === 'font') {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Critical resource hints
  const addResourceHints = useCallback((resources: Array<{
    href: string;
    rel: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch';
    as?: string;
    crossorigin?: boolean;
  }>) => {
    const links: HTMLLinkElement[] = [];

    resources.forEach(({ href, rel, as, crossorigin }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (as) link.as = as;
      if (crossorigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      links.push(link);
    });

    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, []);

  return {
    // Metrics
    metrics,
    
    // Optimization functions
    debounce,
    throttle,
    useLazyLoading,
    useVirtualization,
    useMemoizedValue,
    useLazyImage,
    useLazyComponent,
    useCodeSplitting,
    useCleanup,
    measurePerformance,
    preloadResource,
    addResourceHints,
    
    // Configuration
    enableMetrics,
    enableVirtualization,
    enableLazyLoading
  };
};

export default usePerformanceOptimization;
