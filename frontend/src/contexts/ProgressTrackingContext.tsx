import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { config } from '@/config';
// import { toast } from 'sonner'; // Reserved for future notifications

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

interface LectureProgress {
  lectureId: string;
  currentTime: number;
  duration: number;
  completionPercentage: number;
  lastUpdated: Date;
  isCompleted: boolean;
  watchTime: number;
  courseId: string;
}

interface CourseProgress {
  courseId: string;
  totalLectures: number;
  completedLectures: number;
  totalDuration: number;
  watchedDuration: number;
  overallProgress: number;
  lastAccessed: Date;
  lectures: Record<string, LectureProgress>;
}

interface ProgressState {
  courses: Record<string, CourseProgress>;
  isLoading: boolean;
  error: string | null;
  syncStatus: 'synced' | 'pending' | 'error' | 'offline';
  lastSyncTime: Date | null;
}

type ProgressAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYNC_STATUS'; payload: ProgressState['syncStatus'] }
  | { type: 'UPDATE_LECTURE_PROGRESS'; payload: LectureProgress }
  | { type: 'LOAD_COURSE_PROGRESS'; payload: CourseProgress }
  | { type: 'RESET_LECTURE_PROGRESS'; payload: { lectureId: string; courseId: string } }
  | { type: 'SYNC_COMPLETED'; payload: Date }
  | { type: 'BULK_UPDATE_PROGRESS'; payload: CourseProgress[] };

interface ProgressContextType {
  state: ProgressState;
  updateLectureProgress: (progress: LectureProgress) => void;
  getLectureProgress: (lectureId: string) => LectureProgress | null;
  getCourseProgress: (courseId: string) => CourseProgress | null;
  resetLectureProgress: (lectureId: string, courseId: string) => void;
  syncProgress: () => Promise<void>;
  loadCourseProgress: (courseId: string) => Promise<void>;
  getOverallStats: () => {
    totalCourses: number;
    completedCourses: number;
    totalWatchTime: number;
    averageProgress: number;
  };
}

const initialState: ProgressState = {
  courses: {},
  isLoading: false,
  error: null,
  syncStatus: 'synced',
  lastSyncTime: null,
};

const progressReducer = (state: ProgressState, action: ProgressAction): ProgressState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };

    case 'UPDATE_LECTURE_PROGRESS': {
      const { lectureId, courseId } = action.payload;
      const course = state.courses[courseId] || {
        courseId,
        totalLectures: 0,
        completedLectures: 0,
        totalDuration: 0,
        watchedDuration: 0,
        overallProgress: 0,
        lastAccessed: new Date(),
        lectures: {},
      };

      const updatedLectures = {
        ...course.lectures,
        [lectureId]: action.payload,
      };

      // Recalculate course progress
      const lectureProgresses = Object.values(updatedLectures);
      const completedLectures = lectureProgresses.filter(l => l.isCompleted).length;
      const totalWatchTime = lectureProgresses.reduce((sum, l) => sum + l.watchTime, 0);
      const totalDuration = lectureProgresses.reduce((sum, l) => sum + l.duration, 0);
      const overallProgress = lectureProgresses.length > 0
        ? lectureProgresses.reduce((sum, l) => sum + l.completionPercentage, 0) / lectureProgresses.length
        : 0;

      const updatedCourse: CourseProgress = {
        ...course,
        lectures: updatedLectures,
        totalLectures: lectureProgresses.length,
        completedLectures,
        watchedDuration: totalWatchTime,
        totalDuration,
        overallProgress,
        lastAccessed: new Date(),
      };

      return {
        ...state,
        courses: {
          ...state.courses,
          [courseId]: updatedCourse,
        },
      };
    }

    case 'LOAD_COURSE_PROGRESS':
      return {
        ...state,
        courses: {
          ...state.courses,
          [action.payload.courseId]: action.payload,
        },
      };

    case 'RESET_LECTURE_PROGRESS': {
      const { lectureId, courseId } = action.payload;
      const course = state.courses[courseId];
      
      if (!course) return state;

      const updatedLectures = { ...course.lectures };
      if (updatedLectures[lectureId]) {
        updatedLectures[lectureId] = {
          ...updatedLectures[lectureId],
          currentTime: 0,
          completionPercentage: 0,
          isCompleted: false,
          lastUpdated: new Date(),
        };
      }

      // Recalculate course progress
      const lectureProgresses = Object.values(updatedLectures);
      const completedLectures = lectureProgresses.filter(l => l.isCompleted).length;
      const overallProgress = lectureProgresses.length > 0
        ? lectureProgresses.reduce((sum, l) => sum + l.completionPercentage, 0) / lectureProgresses.length
        : 0;

      return {
        ...state,
        courses: {
          ...state.courses,
          [courseId]: {
            ...course,
            lectures: updatedLectures,
            completedLectures,
            overallProgress,
          },
        },
      };
    }

    case 'SYNC_COMPLETED':
      return {
        ...state,
        syncStatus: 'synced',
        lastSyncTime: action.payload,
        error: null,
      };

    case 'BULK_UPDATE_PROGRESS':
      const updatedCourses = { ...state.courses };
      action.payload.forEach(course => {
        updatedCourses[course.courseId] = course;
      });
      
      return {
        ...state,
        courses: updatedCourses,
      };

    default:
      return state;
  }
};

const ProgressTrackingContext = createContext<ProgressContextType | null>(null);

interface ProgressTrackingProviderProps {
  children: ReactNode;
}

export const ProgressTrackingProvider: React.FC<ProgressTrackingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(progressReducer, initialState);

  // Initialize progress tracking
  useEffect(() => {
    const initializeProgress = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Load from localStorage
        const localProgress = localStorage.getItem('course_progress');
        if (localProgress) {
          const parsedProgress = JSON.parse(localProgress);
          const courses = Object.values(parsedProgress).map((course: any) => ({
            ...course,
            lastAccessed: new Date(course.lastAccessed),
            lectures: Object.fromEntries(
              Object.entries(course.lectures).map(([id, lecture]: [string, any]) => [
                id,
                { ...lecture, lastUpdated: new Date(lecture.lastUpdated) }
              ])
            ),
          }));
          dispatch({ type: 'BULK_UPDATE_PROGRESS', payload: courses });
        }

        // Sync with server if online
        if (navigator.onLine) {
          await syncWithServer();
        } else {
          dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize progress tracking' });
        console.error('Progress initialization error:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeProgress();
  }, []);

  // Auto-sync functionality
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (navigator.onLine && state.syncStatus !== 'pending') {
        syncWithServer();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [state.syncStatus]);

  // Online/offline handling
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'pending' });
      syncWithServer();
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (Object.keys(state.courses).length > 0) {
      localStorage.setItem('course_progress', JSON.stringify(state.courses));
    }
  }, [state.courses]);

  const syncWithServer = async () => {
    try {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'pending' });

      const coursesMap = state.courses;
      const courseIds = Object.keys(coursesMap);

      for (const courseId of courseIds) {
        const course = coursesMap[courseId];
        if (!course?.lectures) continue;

        for (const [lectureId, lectureProgress] of Object.entries(course.lectures)) {
          try {
            await fetch(`${config.apiBaseUrl}/lectures/${lectureId}/progress`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                currentTime: lectureProgress.currentTime,
                duration: lectureProgress.duration,
                completionPercentage: lectureProgress.completionPercentage,
                isCompleted: lectureProgress.isCompleted,
                watchTime: lectureProgress.watchTime,
                lastUpdated: lectureProgress.lastUpdated instanceof Date
                  ? lectureProgress.lastUpdated.toISOString()
                  : lectureProgress.lastUpdated,
              }),
            });
          } catch {
            // Individual lecture sync failure is non-critical
          }
        }
      }

      dispatch({ type: 'SYNC_COMPLETED', payload: new Date() });
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
      console.error('Sync error:', error);
    }
  };

  const updateLectureProgress = (progress: LectureProgress) => {
    dispatch({ type: 'UPDATE_LECTURE_PROGRESS', payload: progress });
  };

  const getLectureProgress = (lectureId: string): LectureProgress | null => {
    for (const course of Object.values(state.courses)) {
      if (course.lectures[lectureId]) {
        return course.lectures[lectureId];
      }
    }
    return null;
  };

  const getCourseProgress = (courseId: string): CourseProgress | null => {
    return state.courses[courseId] || null;
  };

  const resetLectureProgress = (lectureId: string, courseId: string) => {
    dispatch({ type: 'RESET_LECTURE_PROGRESS', payload: { lectureId, courseId } });
  };

  const syncProgress = async (): Promise<void> => {
    await syncWithServer();
  };

  const loadCourseProgress = async (courseId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const userId = (() => {
        try {
          const userData = localStorage.getItem('userData');
          if (userData) return JSON.parse(userData)?._id;
          return null;
        } catch { return null; }
      })();

      if (!userId) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const response = await fetch(
        `${config.apiBaseUrl}/students/${userId}/course-progress/${courseId}`,
        { headers: getAuthHeaders(), credentials: 'include' }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const serverData = result.data;
          const courseProgress: CourseProgress = {
            courseId,
            totalLectures: serverData.totalLectures || 0,
            completedLectures: (serverData.completedLectures || []).length,
            totalDuration: serverData.totalDuration || 0,
            watchedDuration: serverData.watchedDuration || 0,
            overallProgress: serverData.progress || 0,
            lastAccessed: new Date(serverData.lastAccessed || Date.now()),
            lectures: (serverData.lectureProgress || []).reduce(
              (acc: Record<string, LectureProgress>, lp: any) => {
                acc[lp.lectureId] = {
                  lectureId: lp.lectureId,
                  courseId,
                  currentTime: lp.currentTime || 0,
                  duration: lp.duration || 0,
                  completionPercentage: lp.completionPercentage || 0,
                  lastUpdated: new Date(lp.lastUpdated || Date.now()),
                  isCompleted: lp.isCompleted || false,
                  watchTime: lp.watchTime || 0,
                };
                return acc;
              },
              {} as Record<string, LectureProgress>
            ),
          };
          dispatch({ type: 'LOAD_COURSE_PROGRESS', payload: courseProgress });
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load course progress' });
      console.error('Load course progress error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getOverallStats = () => {
    const courses = Object.values(state.courses);
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.overallProgress >= 90).length;
    const totalWatchTime = courses.reduce((sum, c) => sum + c.watchedDuration, 0);
    const averageProgress = courses.length > 0
      ? courses.reduce((sum, c) => sum + c.overallProgress, 0) / courses.length
      : 0;

    return {
      totalCourses,
      completedCourses,
      totalWatchTime,
      averageProgress,
    };
  };

  const contextValue: ProgressContextType = {
    state,
    updateLectureProgress,
    getLectureProgress,
    getCourseProgress,
    resetLectureProgress,
    syncProgress,
    loadCourseProgress,
    getOverallStats,
  };

  return (
    <ProgressTrackingContext.Provider value={contextValue}>
      {children}
    </ProgressTrackingContext.Provider>
  );
};

export const useProgressTracking = (): ProgressContextType => {
  const context = useContext(ProgressTrackingContext);
  if (!context) {
    throw new Error('useProgressTracking must be used within a ProgressTrackingProvider');
  }
  return context;
};

export default ProgressTrackingContext;
