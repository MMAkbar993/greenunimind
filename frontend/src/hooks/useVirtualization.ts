import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  totalItems: number;
}

interface VirtualizationResult {
  startIndex: number;
  endIndex: number;
  visibleItems: number[];
  totalHeight: number;
  offsetY: number;
}

export const useVirtualization = ({
  itemHeight,
  containerHeight,
  overscan = 5,
  totalItems
}: VirtualizationOptions): VirtualizationResult => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );

    const startWithOverscan = Math.max(0, startIndex - overscan);
    const endWithOverscan = Math.min(totalItems - 1, endIndex + overscan);

    return {
      startIndex: startWithOverscan,
      endIndex: endWithOverscan,
      visibleItems: Array.from(
        { length: endWithOverscan - startWithOverscan + 1 },
        (_, i) => startWithOverscan + i
      )
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, totalItems]);

  const totalHeight = totalItems * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  return {
    ...visibleRange,
    totalHeight,
    offsetY
  };
};

// Hook for infinite scrolling
interface InfiniteScrollOptions {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number;
}

export const useInfiniteScroll = ({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 100
}: InfiniteScrollOptions) => {
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    if (
      scrollHeight - scrollTop - clientHeight < threshold &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

  return { handleScroll };
};

// Hook for debounced search
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for optimistic updates
interface OptimisticUpdateOptions<T> {
  data: T[];
  updateFn: (item: T) => Promise<T>;
  deleteFn?: (id: string) => Promise<void>;
}

export const useOptimisticUpdates = <T extends { _id: string }>({
  data,
  updateFn,
  deleteFn
}: OptimisticUpdateOptions<T>) => {
  const [optimisticData, setOptimisticData] = useState<T[]>(data);

  useEffect(() => {
    setOptimisticData(data);
  }, [data]);

  const optimisticUpdate = useCallback(async (item: T) => {
    // Optimistically update the UI
    setOptimisticData(prev => 
      prev.map(prevItem => 
        prevItem._id === item._id ? item : prevItem
      )
    );

    try {
      // Perform the actual update
      const updatedItem = await updateFn(item);
      
      // Update with the server response
      setOptimisticData(prev => 
        prev.map(prevItem => 
          prevItem._id === updatedItem._id ? updatedItem : prevItem
        )
      );
    } catch (error) {
      // Revert on error
      setOptimisticData(data);
      throw error;
    }
  }, [data, updateFn]);

  const optimisticDelete = useCallback(async (id: string) => {
    if (!deleteFn) return;

    const originalData = optimisticData;
    
    // Optimistically remove from UI
    setOptimisticData(prev => prev.filter(item => item._id !== id));

    try {
      // Perform the actual deletion
      await deleteFn(id);
    } catch (error) {
      // Revert on error
      setOptimisticData(originalData);
      throw error;
    }
  }, [optimisticData, deleteFn]);

  return {
    data: optimisticData,
    optimisticUpdate,
    optimisticDelete
  };
};

// Hook for caching with TTL
interface CacheOptions<T> {
  key: string;
  ttl?: number; // Time to live in milliseconds
  initialData?: T;
}

export const useCache = <T>({
  key,
  ttl = 5 * 60 * 1000, // 5 minutes default
  initialData
}: CacheOptions<T>) => {
  const [data, setData] = useState<T | undefined>(() => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < ttl) {
          return cachedData;
        }
      }
    } catch (error) {
      console.warn('Failed to load cached data:', error);
    }
    return initialData;
  });

  const setCache = useCallback((newData: T) => {
    setData(newData);
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data: newData,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }, [key]);

  const clearCache = useCallback(() => {
    setData(undefined);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, [key]);

  const isExpired = useCallback(() => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        return Date.now() - timestamp >= ttl;
      }
    } catch (error) {
      console.warn('Failed to check cache expiration:', error);
    }
    return true;
  }, [key, ttl]);

  return {
    data,
    setCache,
    clearCache,
    isExpired
  };
};
