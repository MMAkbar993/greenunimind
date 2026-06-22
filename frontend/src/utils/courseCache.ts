import { Dispatch, AnyAction } from '@reduxjs/toolkit';
import { baseApi } from '@/redux/api/baseApi';
import { courseApi } from '@/redux/features/course/courseApi';
import { setCourse } from '@/redux/features/course/courseSlice';
import { toast } from 'sonner';
import type { AppDispatch } from '@/redux/store';

/**
 * Comprehensive cache invalidation utilities for course-related data
 * Ensures immediate UI updates after course modifications
 */

export interface CourseUpdateData {
  courseId: string;
  creatorId?: string;
  data?: any;
}

/**
 * Invalidate all course-related cache tags for a specific course
 */
export const invalidateCourseCache = (dispatch: AppDispatch, courseId: string, creatorId?: string) => {
  const tags = [
    'courses' as const,
    'course' as const,
    { type: 'course' as const, id: courseId },
    { type: 'courses' as const, id: 'LIST' },
    { type: 'courses' as const, id: 'published' },
    'lectures' as const,
    { type: 'lectures' as const, id: courseId },
  ];

  if (creatorId) {
    tags.push({ type: 'courses' as const, id: `creator-${creatorId}` });
  }

  dispatch(baseApi.util.invalidateTags(tags as any));
};

/**
 * Force refetch of critical course queries
 */
export const refetchCourseQueries = (dispatch: AppDispatch, courseId: string, creatorId?: string) => {
  // Force refetch course details
  dispatch(courseApi.endpoints.getCourseById.initiate(courseId, { forceRefetch: true }) as any);

  // Force refetch creator courses if creatorId is available
  if (creatorId) {
    dispatch(courseApi.endpoints.getCreatorCourse.initiate({ id: creatorId }, { forceRefetch: true }) as any);
  }
};

/**
 * Comprehensive cache invalidation for course updates
 * Handles both immediate and delayed invalidation strategies
 */
export const cascadeInvalidateCourseUpdate = (
  dispatch: AppDispatch,
  { courseId, creatorId, data }: CourseUpdateData
) => {
  console.log('🔄 Cascading course cache invalidation:', { courseId, creatorId });

  // Immediate invalidation
  invalidateCourseCache(dispatch, courseId, creatorId);

  // Secondary invalidation after a short delay to catch race conditions
  setTimeout(() => {
    invalidateCourseCache(dispatch, courseId, creatorId);
  }, 100);

  // Force refetch critical queries
  setTimeout(() => {
    refetchCourseQueries(dispatch, courseId, creatorId);
  }, 200);

  // Final invalidation to ensure consistency
  setTimeout(() => {
    invalidateCourseCache(dispatch, courseId, creatorId);
  }, 500);
};

/**
 * Sync course updates across all views for real-time UI updates
 */
export const syncCourseUpdateAcrossViews = (
  dispatch: AppDispatch,
  courseId: string,
  updatedData: any,
  creatorId?: string
) => {
  console.log('🔄 Syncing course updates across views:', { courseId, creatorId });

  // Update course details cache
  dispatch(
    courseApi.util.updateQueryData('getCourseById', courseId, (draft) => {
      if (draft?.data) {
        Object.assign(draft.data, updatedData);
      }
    }) as any
  );

  // Update creator courses cache if creatorId is available
  if (creatorId) {
    dispatch(
      courseApi.util.updateQueryData('getCreatorCourse', { id: creatorId }, (draft) => {
        if (draft?.data) {
          const courseIndex = draft.data.findIndex((course: any) => course._id === courseId);
          if (courseIndex !== -1) {
            Object.assign(draft.data[courseIndex], updatedData);
          }
        }
      }) as any
    );
  }

  // Update Redux course slice for immediate UI feedback
  dispatch(setCourse(updatedData));
};

/**
 * Enterprise-grade cache invalidation with performance monitoring
 */
export const enterpriseCourseInvalidation = (
  dispatch: AppDispatch,
  { courseId, creatorId, data }: CourseUpdateData,
  options: {
    enableToast?: boolean;
    enableLogging?: boolean;
    retryCount?: number;
  } = {}
) => {
  const { enableToast = false, enableLogging = true, retryCount = 3 } = options;

  if (enableLogging) {
    console.log('🚀 Enterprise course cache invalidation started:', { courseId, creatorId });
  }

  const startTime = performance.now();

  try {
    // Sync updates first for immediate UI feedback
    if (data) {
      syncCourseUpdateAcrossViews(dispatch, courseId, data, creatorId);
    }

    // Cascade invalidation with retry logic
    let attempts = 0;
    const attemptInvalidation = () => {
      attempts++;
      try {
        cascadeInvalidateCourseUpdate(dispatch, { courseId, creatorId, data });
        
        if (enableLogging) {
          const duration = performance.now() - startTime;
          console.log(`✅ Course cache invalidation completed in ${duration.toFixed(2)}ms (attempt ${attempts})`);
        }

        if (enableToast) {
          toast.success('Course updated successfully!');
        }
      } catch (error) {
        console.error(`❌ Cache invalidation attempt ${attempts} failed:`, error);
        
        if (attempts < retryCount) {
          setTimeout(attemptInvalidation, 100 * attempts); // Exponential backoff
        } else {
          console.error('❌ All cache invalidation attempts failed');
          if (enableToast) {
            toast.error('Failed to refresh course data. Please refresh the page.');
          }
        }
      }
    };

    attemptInvalidation();

  } catch (error) {
    console.error('❌ Enterprise course invalidation failed:', error);
    if (enableToast) {
      toast.error('Failed to update course cache. Please refresh the page.');
    }
  }
};

/**
 * Optimistic update with rollback capability
 */
export const optimisticCourseUpdate = (
  dispatch: AppDispatch,
  courseId: string,
  updateData: any,
  creatorId?: string
) => {
  const rollbackActions: Array<() => void> = [];

  try {
    // Optimistic update for course details
    const patchResult1 = dispatch(
      courseApi.util.updateQueryData('getCourseById', courseId, (draft) => {
        if (draft?.data) {
          Object.assign(draft.data, updateData);
        }
      }) as any
    );
    rollbackActions.push(() => patchResult1.undo());

    // Optimistic update for creator courses
    if (creatorId) {
      const patchResult2 = dispatch(
        courseApi.util.updateQueryData('getCreatorCourse', { id: creatorId }, (draft) => {
          if (draft?.data) {
            const courseIndex = draft.data.findIndex((course: any) => course._id === courseId);
            if (courseIndex !== -1) {
              Object.assign(draft.data[courseIndex], updateData);
            }
          }
        }) as any
      );
      rollbackActions.push(() => patchResult2.undo());
    }

    return {
      rollback: () => {
        rollbackActions.forEach(action => action());
      }
    };

  } catch (error) {
    console.error('❌ Optimistic update failed:', error);
    return {
      rollback: () => {
        rollbackActions.forEach(action => action());
      }
    };
  }
};

/**
 * Timestamp-based cache busting for critical course data
 */
export const timestampCacheBust = (dispatch: AppDispatch, courseId: string, creatorId?: string) => {
  const timestamp = Date.now();
  
  // Add timestamp to force cache invalidation
  const bustingTags = [
    { type: 'course', id: `${courseId}_${timestamp}` },
    { type: 'courses', id: `LIST_${timestamp}` },
  ];

  if (creatorId) {
    bustingTags.push({ type: 'courses', id: `creator-${creatorId}_${timestamp}` });
  }

  dispatch(baseApi.util.invalidateTags(bustingTags));
};

/**
 * Performance monitoring for cache operations
 */
export const monitorCachePerformance = (
  operation: string,
  fn: () => void | Promise<void>
) => {
  const startTime = performance.now();
  
  try {
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        console.log(`📊 Cache operation "${operation}" completed in ${duration.toFixed(2)}ms`);
      });
    } else {
      const duration = performance.now() - startTime;
      console.log(`📊 Cache operation "${operation}" completed in ${duration.toFixed(2)}ms`);
      return result;
    }
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ Cache operation "${operation}" failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

/**
 * All-in-one course cache management function
 * Use this for comprehensive course update handling
 */
export const manageCourseCache = {
  invalidate: invalidateCourseCache,
  refetch: refetchCourseQueries,
  cascade: cascadeInvalidateCourseUpdate,
  sync: syncCourseUpdateAcrossViews,
  enterprise: enterpriseCourseInvalidation,
  optimistic: optimisticCourseUpdate,
  timestampBust: timestampCacheBust,
  monitor: monitorCachePerformance,
};

export default manageCourseCache;
