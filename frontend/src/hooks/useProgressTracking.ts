import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { config } from '@/config';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

interface ProgressData {
  lectureId: string;
  currentTime: number;
  duration: number;
  completionPercentage: number;
  lastUpdated: Date;
  isCompleted: boolean;
  watchTime: number;
}

interface ProgressTrackingOptions {
  saveInterval?: number; // milliseconds
  completionThreshold?: number; // percentage (0-100)
  enableAutoSave?: boolean;
  enableOfflineSync?: boolean;
}

interface UseProgressTrackingReturn {
  progress: ProgressData | null;
  updateProgress: (currentTime: number, duration: number) => void;
  markCompleted: () => void;
  resetProgress: () => void;
  saveProgress: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  syncStatus: 'synced' | 'pending' | 'error' | 'offline';
}

const useProgressTracking = (
  lectureId: string,
  options: ProgressTrackingOptions = {}
): UseProgressTrackingReturn => {
  const {
    saveInterval = 10000, // 10 seconds
    completionThreshold = 90, // 90%
    enableAutoSave = true,
    enableOfflineSync = true,
  } = options;

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error' | 'offline'>('synced');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<Date>(new Date());
  const pendingProgressRef = useRef<ProgressData | null>(null);

  // Initialize progress data
  useEffect(() => {
    const initializeProgress = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Try to load from localStorage first (for offline support)
        const localKey = `lecture_progress_${lectureId}`;
        const localProgress = localStorage.getItem(localKey);
        
        if (localProgress) {
          const parsedProgress = JSON.parse(localProgress);
          setProgress({
            ...parsedProgress,
            lastUpdated: new Date(parsedProgress.lastUpdated),
          });
        }

        // Try to load from server
        if (navigator.onLine) {
          try {
            const response = await fetch(`${config.apiBaseUrl}/lectures/${lectureId}/progress`, {
              headers: getAuthHeaders(),
              credentials: 'include',
            });
            
            if (response.ok) {
              const serverProgress = await response.json();
              const progressData: ProgressData = {
                lectureId,
                currentTime: serverProgress.currentTime || 0,
                duration: serverProgress.duration || 0,
                completionPercentage: serverProgress.completionPercentage || 0,
                lastUpdated: new Date(serverProgress.lastUpdated || Date.now()),
                isCompleted: serverProgress.isCompleted || false,
                watchTime: serverProgress.watchTime || 0,
              };
              
              setProgress(progressData);
              
              // Update localStorage with server data
              localStorage.setItem(localKey, JSON.stringify(progressData));
              setSyncStatus('synced');
            }
          } catch (serverError) {
            console.warn('Failed to load progress from server:', serverError);
            setSyncStatus('error');
          }
        } else {
          setSyncStatus('offline');
        }

        // If no progress exists, create initial progress
        if (!progress && !localProgress) {
          const initialProgress: ProgressData = {
            lectureId,
            currentTime: 0,
            duration: 0,
            completionPercentage: 0,
            lastUpdated: new Date(),
            isCompleted: false,
            watchTime: 0,
          };
          setProgress(initialProgress);
          localStorage.setItem(localKey, JSON.stringify(initialProgress));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize progress tracking');
        console.error('Progress tracking initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (lectureId) {
      initializeProgress();
    }
  }, [lectureId]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !progress) return;

    const scheduleAutoSave = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProgress();
      }, saveInterval);
    };

    scheduleAutoSave();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [progress, enableAutoSave, saveInterval]);

  // Online/offline sync
  useEffect(() => {
    if (!enableOfflineSync) return;

    const handleOnline = async () => {
      setSyncStatus('pending');
      
      if (pendingProgressRef.current) {
        try {
          await syncProgressToServer(pendingProgressRef.current);
          setSyncStatus('synced');
          pendingProgressRef.current = null;
          toast.success('Progress synced successfully');
        } catch (error) {
          setSyncStatus('error');
          toast.error('Failed to sync progress');
        }
      } else {
        setSyncStatus('synced');
      }
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableOfflineSync]);

  // Update progress
  const updateProgress = useCallback((currentTime: number, duration: number) => {
    if (!lectureId || duration <= 0) return;

    const completionPercentage = Math.min((currentTime / duration) * 100, 100);
    const isCompleted = completionPercentage >= completionThreshold;

    setProgress(prev => {
      if (!prev) return null;

      const now = new Date();
      const timeDiff = now.getTime() - prev.lastUpdated.getTime();
      const additionalWatchTime = timeDiff > 0 && timeDiff < 30000 ? timeDiff / 1000 : 0; // Only count if less than 30 seconds

      const updatedProgress: ProgressData = {
        ...prev,
        currentTime,
        duration,
        completionPercentage,
        lastUpdated: now,
        isCompleted,
        watchTime: prev.watchTime + additionalWatchTime,
      };

      // Save to localStorage immediately
      const localKey = `lecture_progress_${lectureId}`;
      localStorage.setItem(localKey, JSON.stringify(updatedProgress));

      // Mark for server sync if offline
      if (!navigator.onLine) {
        pendingProgressRef.current = updatedProgress;
        setSyncStatus('offline');
      }

      return updatedProgress;
    });
  }, [lectureId, completionThreshold]);

  // Mark as completed
  const markCompleted = useCallback(() => {
    setProgress(prev => {
      if (!prev) return null;

      const completedProgress: ProgressData = {
        ...prev,
        completionPercentage: 100,
        isCompleted: true,
        lastUpdated: new Date(),
      };

      // Save to localStorage
      const localKey = `lecture_progress_${lectureId}`;
      localStorage.setItem(localKey, JSON.stringify(completedProgress));

      // Trigger save to server
      saveProgress();

      return completedProgress;
    });
  }, [lectureId]);

  // Reset progress
  const resetProgress = useCallback(() => {
    const resetProgressData: ProgressData = {
      lectureId,
      currentTime: 0,
      duration: 0,
      completionPercentage: 0,
      lastUpdated: new Date(),
      isCompleted: false,
      watchTime: 0,
    };

    setProgress(resetProgressData);

    // Save to localStorage
    const localKey = `lecture_progress_${lectureId}`;
    localStorage.setItem(localKey, JSON.stringify(resetProgressData));

    // Save to server
    saveProgress();
  }, [lectureId]);

  // Save progress to server
  const syncProgressToServer = async (progressData: ProgressData): Promise<void> => {
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    try {
      const response = await fetch(`${config.apiBaseUrl}/lectures/${lectureId}/progress`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          currentTime: progressData.currentTime,
          duration: progressData.duration,
          completionPercentage: progressData.completionPercentage,
          isCompleted: progressData.isCompleted,
          watchTime: progressData.watchTime,
          lastUpdated: progressData.lastUpdated.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      lastSaveRef.current = new Date();
    } catch (error) {
      console.error('Failed to sync progress to server:', error);
      throw error;
    }
  };

  // Save progress
  const saveProgress = useCallback(async (): Promise<void> => {
    if (!progress) return;

    try {
      setSyncStatus('pending');
      
      if (navigator.onLine) {
        await syncProgressToServer(progress);
        setSyncStatus('synced');
        pendingProgressRef.current = null;
      } else {
        pendingProgressRef.current = progress;
        setSyncStatus('offline');
      }
    } catch (error) {
      setSyncStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to save progress');
      console.error('Progress save error:', error);
    }
  }, [progress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Save progress one final time before unmounting
      if (progress && enableAutoSave) {
        saveProgress();
      }
    };
  }, []);

  return {
    progress,
    updateProgress,
    markCompleted,
    resetProgress,
    saveProgress,
    isLoading,
    error,
    syncStatus,
  };
};

export default useProgressTracking;
