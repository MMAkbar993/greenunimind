import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  ReactNode,
  Suspense,
  lazy
} from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  Eye, 
  AlertTriangle, 
  RefreshCw,
  Zap,
  Clock
} from 'lucide-react';
import { Logger } from '@/utils/logger';

interface LazyContentLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  placeholder?: ReactNode;
  loadingText?: string;
  enableIntersectionObserver?: boolean;
  enablePreload?: boolean;
  priority?: 'high' | 'medium' | 'low';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onVisible?: () => void;
  className?: string;
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Intersection Observer hook
const useIntersectionObserver = (
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { isVisible, elementRef };
};

// Main lazy content loader component
const LazyContentLoader: React.FC<LazyContentLoaderProps> = ({
  children,
  fallback,
  errorFallback,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  placeholder,
  loadingText = 'Loading content...',
  enableIntersectionObserver = true,
  enablePreload = false,
  priority = 'medium',
  onLoad,
  onError,
  onVisible,
  className
}) => {
  const [isLoaded, setIsLoaded] = useState(!enableIntersectionObserver);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  
  const { isVisible, elementRef } = useIntersectionObserver(
    threshold,
    rootMargin,
    triggerOnce
  );

  // Handle visibility change
  useEffect(() => {
    if (isVisible && !isLoaded && !isLoading) {
      onVisible?.();
      handleLoad();
    }
  }, [isVisible, isLoaded, isLoading, onVisible]);

  // Preload content if enabled
  useEffect(() => {
    if (enablePreload && priority === 'high' && !isLoaded) {
      handleLoad();
    }
  }, [enablePreload, priority, isLoaded]);

  const handleLoad = useCallback(async () => {
    if (isLoading || isLoaded) return;

    setIsLoading(true);
    setLoadStartTime(Date.now());
    setError(null);

    try {
      // Simulate loading delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setIsLoaded(true);
      onLoad?.();
      
      const loadTime = Date.now() - (loadStartTime || 0);
      Logger.info(`Content loaded in ${loadTime}ms`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load content');
      setError(error);
      onError?.(error);
      Logger.error('Content loading failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isLoaded, loadStartTime, onLoad, onError]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleLoad();
  }, [handleLoad]);

  // Default loading fallback
  const defaultFallback = (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-gray-600">{loadingText}</p>
          {loadStartTime && (
            <p className="text-xs text-gray-400">
              <Clock className="h-3 w-3 inline mr-1" />
              {Math.round((Date.now() - loadStartTime) / 1000)}s
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Default error fallback
  const defaultErrorFallback = (
    <Card className="w-full border-red-200">
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-700">Failed to load content</p>
            <p className="text-xs text-red-600 mt-1">{error?.message}</p>
          </div>
          <Button onClick={handleRetry} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Default placeholder
  const defaultPlaceholder = (
    <Card className="w-full">
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">Content will load when visible</p>
          {priority === 'high' && (
            <div className="flex items-center justify-center gap-1 text-xs text-primary">
              <Zap className="h-3 w-3" />
              High Priority
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div ref={elementRef} className={cn('w-full', className)}>
      {error ? (
        errorFallback || defaultErrorFallback
      ) : isLoading ? (
        fallback || defaultFallback
      ) : isLoaded ? (
        <Suspense fallback={fallback || defaultFallback}>
          {children}
        </Suspense>
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  );
};

// Lazy image component
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { isVisible, elementRef } = useIntersectionObserver();

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div ref={elementRef} className={cn('relative overflow-hidden', className)}>
      {!isVisible ? (
        <Skeleton className="w-full h-full" />
      ) : hasError ? (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <AlertTriangle className="h-8 w-8 text-gray-400" />
        </div>
      ) : (
        <>
          {!isLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

// Lazy video component
export const LazyVideo: React.FC<LazyVideoProps> = ({
  src,
  poster,
  className,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { isVisible, elementRef } = useIntersectionObserver();

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div ref={elementRef} className={cn('relative', className)}>
      {!isVisible ? (
        <Skeleton className="w-full aspect-video" />
      ) : hasError ? (
        <div className="flex items-center justify-center aspect-video bg-gray-100">
          <AlertTriangle className="h-8 w-8 text-gray-400" />
        </div>
      ) : (
        <>
          {!isLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          <video
            src={src}
            poster={poster}
            onLoadedData={handleLoad}
            onError={handleError}
            className={cn(
              'w-full transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0',
              className
            )}
            preload="metadata"
          />
        </>
      )}
    </div>
  );
};

// HOC for lazy loading components
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  loaderProps?: Partial<LazyContentLoaderProps>
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <LazyContentLoader {...loaderProps}>
      {/* @ts-expect-error: ref may not be assignable to all components */}
      <Component {...props} ref={ref} />
    </LazyContentLoader>
  ));
};

export default LazyContentLoader;
