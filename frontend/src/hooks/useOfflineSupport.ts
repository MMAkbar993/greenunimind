import { useState, useEffect, useCallback, useRef } from 'react';
import { Logger } from '@/utils/logger';

interface OfflineData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

interface OfflineState {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: Date | null;
  connectionType: string | null;
  effectiveType: string | null;
}

interface OfflineConfig {
  enableCaching: boolean;
  cachePrefix: string;
  maxCacheSize: number; // in MB
  defaultTTL: number; // in milliseconds
  syncOnReconnect: boolean;
  showOfflineIndicator: boolean;
}

const defaultConfig: OfflineConfig = {
  enableCaching: true,
  cachePrefix: 'lecture_cache_',
  maxCacheSize: 50, // 50MB
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  syncOnReconnect: true,
  showOfflineIndicator: true
};

export const useOfflineSupport = (config: Partial<OfflineConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const syncQueueRef = useRef<Array<() => Promise<void>>>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    connectionType: null,
    effectiveType: null
  });

  // Initialize connection info
  useEffect(() => {
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setState(prev => ({
          ...prev,
          connectionType: connection.type || null,
          effectiveType: connection.effectiveType || null
        }));
      }
    };

    updateConnectionInfo();

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
      return () => connection.removeEventListener('change', updateConnectionInfo);
    }
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOnline: true,
        isConnecting: false,
        lastOnline: new Date()
      }));

      Logger.info('Connection restored');

      // Sync queued operations
      if (finalConfig.syncOnReconnect) {
        syncQueuedOperations();
      }
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false
      }));

      Logger.warn('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [finalConfig.syncOnReconnect]);

  // Cache management
  const getCacheKey = useCallback((key: string): string => {
    return `${finalConfig.cachePrefix}${key}`;
  }, [finalConfig.cachePrefix]);

  const setCache = useCallback((key: string, data: any, ttl?: number): void => {
    if (!finalConfig.enableCaching) return;

    try {
      const cacheKey = getCacheKey(key);
      const expiresAt = ttl ? Date.now() + ttl : Date.now() + finalConfig.defaultTTL;
      
      const cacheData: OfflineData = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt
      };

      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Clean up old cache entries
      cleanupCache();
    } catch (error) {
      Logger.error('Failed to set cache:', error);
    }
  }, [finalConfig.enableCaching, finalConfig.defaultTTL, getCacheKey]);

  const getCache = useCallback((key: string): any | null => {
    if (!finalConfig.enableCaching) return null;

    try {
      const cacheKey = getCacheKey(key);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheData: OfflineData = JSON.parse(cached);
      
      // Check if expired
      if (cacheData.expiresAt && Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      Logger.error('Failed to get cache:', error);
      return null;
    }
  }, [finalConfig.enableCaching, getCacheKey]);

  const clearCache = useCallback((pattern?: string): void => {
    try {
      const keys = Object.keys(localStorage);
      const prefix = finalConfig.cachePrefix;
      
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          if (!pattern || key.includes(pattern)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      Logger.error('Failed to clear cache:', error);
    }
  }, [finalConfig.cachePrefix]);

  const cleanupCache = useCallback((): void => {
    try {
      const keys = Object.keys(localStorage);
      const prefix = finalConfig.cachePrefix;
      let totalSize = 0;
      const cacheEntries: Array<{ key: string; size: number; timestamp: number }> = [];

      // Calculate cache size and collect entries
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;
            
            try {
              const cacheData: OfflineData = JSON.parse(value);
              cacheEntries.push({
                key,
                size,
                timestamp: cacheData.timestamp
              });
            } catch {
              // Invalid cache entry, remove it
              localStorage.removeItem(key);
            }
          }
        }
      });

      // Convert to MB
      const totalSizeMB = totalSize / (1024 * 1024);

      // If cache is too large, remove oldest entries
      if (totalSizeMB > finalConfig.maxCacheSize) {
        cacheEntries
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, Math.ceil(cacheEntries.length * 0.3)) // Remove oldest 30%
          .forEach(entry => {
            localStorage.removeItem(entry.key);
          });
      }

      // Remove expired entries
      const now = Date.now();
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const cacheData: OfflineData = JSON.parse(value);
              if (cacheData.expiresAt && now > cacheData.expiresAt) {
                localStorage.removeItem(key);
              }
            } catch {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      Logger.error('Failed to cleanup cache:', error);
    }
  }, [finalConfig.cachePrefix, finalConfig.maxCacheSize]);

  // Queue operations for when connection is restored
  const queueOperation = useCallback((operation: () => Promise<void>): void => {
    syncQueueRef.current.push(operation);
  }, []);

  const syncQueuedOperations = useCallback(async (): Promise<void> => {
    const queue = [...syncQueueRef.current];
    syncQueueRef.current = [];

    for (const operation of queue) {
      try {
        await operation();
      } catch (error) {
        Logger.error('Failed to sync queued operation:', error);
        // Re-queue failed operations
        syncQueueRef.current.push(operation);
      }
    }
  }, []);

  // Check connection with ping
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;

    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      // Try to fetch a small resource
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      const isConnected = response.ok;
      
      setState(prev => ({
        ...prev,
        isOnline: isConnected,
        isConnecting: false,
        lastOnline: isConnected ? new Date() : prev.lastOnline
      }));

      return isConnected;
    } catch {
      setState(prev => ({
        ...prev,
        isOnline: false,
        isConnecting: false
      }));
      return false;
    }
  }, []);

  // Get cached data or fetch with fallback
  const getDataWithFallback = useCallback(async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    // Try cache first if offline
    if (!state.isOnline) {
      const cached = getCache(key);
      if (cached) {
        return cached;
      }
      throw new Error('No cached data available and device is offline');
    }

    try {
      // Try to fetch fresh data
      const data = await fetchFn();
      
      // Cache the result
      setCache(key, data, ttl);
      
      return data;
    } catch (error) {
      // Fallback to cache if fetch fails
      const cached = getCache(key);
      if (cached) {
        Logger.warn('Using cached data due to fetch failure:', error);
        return cached;
      }
      
      throw error;
    }
  }, [state.isOnline, getCache, setCache]);

  // Get connection quality
  const getConnectionQuality = useCallback((): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!state.isOnline) return 'offline';
    
    const effectiveType = state.effectiveType;
    switch (effectiveType) {
      case '4g':
        return 'excellent';
      case '3g':
        return 'good';
      case '2g':
      case 'slow-2g':
        return 'poor';
      default:
        return 'good';
    }
  }, [state.isOnline, state.effectiveType]);

  return {
    // State
    ...state,
    connectionQuality: getConnectionQuality(),
    queuedOperationsCount: syncQueueRef.current.length,
    
    // Cache functions
    setCache,
    getCache,
    clearCache,
    cleanupCache,
    
    // Offline functions
    queueOperation,
    syncQueuedOperations,
    checkConnection,
    getDataWithFallback,
    
    // Utilities
    isSlowConnection: () => ['2g', 'slow-2g'].includes(state.effectiveType || ''),
    getCacheSize: () => {
      try {
        let size = 0;
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith(finalConfig.cachePrefix)) {
            const value = localStorage.getItem(key);
            if (value) {
              size += new Blob([value]).size;
            }
          }
        });
        return Math.round(size / (1024 * 1024) * 100) / 100; // MB
      } catch {
        return 0;
      }
    }
  };
};

export default useOfflineSupport;
