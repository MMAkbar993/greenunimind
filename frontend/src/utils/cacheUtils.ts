/**
 * Cache utilities for enhanced Redux cache management
 * Provides helper functions for cache invalidation and optimistic updates
 */

import { baseApi } from '@/redux/api/baseApi';
import { store } from '@/redux/store';

/**
 * Invalidate all course-related cache tags with enhanced cascade invalidation
 * Use this after course/lecture mutations for comprehensive cache invalidation
 */
export const invalidateCourseCaches = (courseId?: string, teacherId?: string) => {
  const tagsToInvalidate = [
    // General course tags
    'courses',
    'course',

    // Course-specific tags
    ...(courseId ? [
      { type: 'course' as const, id: courseId },
      { type: 'course-details' as const, id: courseId },
      { type: 'course-lectures' as const, id: courseId },
      { type: 'lectures' as const, id: courseId },
    ] : []),

    // Teacher-specific tags - ENHANCED for creator courses
    ...(teacherId ? [
      { type: 'courses' as const, id: `creator-${teacherId}` },
      { type: 'course-creator' as const, id: teacherId },
      { type: 'creator-courses' as const, id: teacherId },
      { type: 'creator-lectures' as const, id: teacherId },
      { type: 'course-list' as const, id: teacherId },
    ] : []),

    // Lecture-related tags
    'lectures',
    'lecture',
    'lecture-list',
    'lecture-details',
  ];

  store.dispatch(baseApi.util.invalidateTags(tagsToInvalidate));
  console.log('🔄 Invalidated course caches:', { courseId, teacherId, tagsCount: tagsToInvalidate.length });
};

/**
 * ENHANCED: Cascade invalidation specifically for lecture updates
 * This ensures that when a lecture is updated, all parent course data is refreshed
 */
export const cascadeInvalidateLectureUpdate = (lectureId: string, courseId: string, teacherId?: string) => {
  console.log('🔄 Starting cascade invalidation for lecture update:', { lectureId, courseId, teacherId });

  // Step 1: Invalidate lecture-specific caches
  const lectureInvalidationTags = [
    { type: 'lecture' as const, id: lectureId },
    { type: 'lecture-details' as const, id: lectureId },
    { type: 'lectures' as const, id: courseId },
    { type: 'lecture-list' as const, id: courseId },
    { type: 'lecture' as const, id: 'LIST' },
    'lectures',
    'lecture',
  ];

  // Step 2: Invalidate course-specific caches (parent data)
  const courseInvalidationTags = [
    { type: 'course' as const, id: courseId },
    { type: 'course-details' as const, id: courseId },
    { type: 'course-lectures' as const, id: courseId },
    { type: 'courses' as const, id: 'LIST' },
    'courses',
    'course',
  ];

  // Step 3: CRITICAL - Invalidate creator courses endpoint
  const creatorInvalidationTags = teacherId ? [
    { type: 'courses' as const, id: `creator-${teacherId}` },
    { type: 'course-creator' as const, id: teacherId },
    { type: 'creator-courses' as const, id: teacherId },
    { type: 'creator-lectures' as const, id: teacherId },
    { type: 'course-list' as const, id: teacherId },
  ] : [];

  const allTags = [...lectureInvalidationTags, ...courseInvalidationTags, ...creatorInvalidationTags];

  store.dispatch(baseApi.util.invalidateTags(allTags));
  console.log('✅ Cascade invalidation completed:', {
    lectureId,
    courseId,
    teacherId,
    totalTags: allTags.length,
    lectureTagsCount: lectureInvalidationTags.length,
    courseTagsCount: courseInvalidationTags.length,
    creatorTagsCount: creatorInvalidationTags.length
  });
};

/**
 * Invalidate lecture-specific cache tags
 * Use this after lecture mutations for targeted cache invalidation
 */
export const invalidateLectureCaches = (lectureId?: string, courseId?: string, teacherId?: string) => {
  const tagsToInvalidate = [
    // General lecture tags
    'lectures',
    'lecture',
    
    // Lecture-specific tags
    ...(lectureId ? [
      { type: 'lecture' as const, id: lectureId },
      { type: 'lecture-details' as const, id: lectureId },
    ] : []),
    
    // Course-related tags (since lectures affect course data)
    ...(courseId ? [
      { type: 'course' as const, id: courseId },
      { type: 'course-details' as const, id: courseId },
      { type: 'course-lectures' as const, id: courseId },
      { type: 'lectures' as const, id: courseId },
      { type: 'lecture-list' as const, id: courseId },
    ] : []),
    
    // Teacher-specific tags
    ...(teacherId ? [
      { type: 'courses' as const, id: `creator-${teacherId}` },
      { type: 'course-creator' as const, id: teacherId },
      { type: 'creator-courses' as const, id: teacherId },
      { type: 'creator-lectures' as const, id: teacherId },
    ] : []),
    
    // General course tags (since lecture changes affect course lists)
    'courses',
    'course',
  ];

  store.dispatch(baseApi.util.invalidateTags(tagsToInvalidate));
  console.log('🔄 Invalidated lecture caches:', { lectureId, courseId, teacherId });
};

/**
 * Force refetch of course creator data
 * Use this when you need to ensure the latest data is fetched
 */
export const refetchCreatorCourses = (teacherId: string) => {
  store.dispatch(baseApi.util.invalidateTags([
    { type: 'courses', id: `creator-${teacherId}` },
    { type: 'course-creator', id: teacherId },
    'courses',
    'lectures'
  ]));
  console.log('🔄 Force refetching creator courses for teacher:', teacherId);
};

/**
 * Clear all course and lecture caches
 * Use this for complete cache reset (e.g., after logout or major data changes)
 */
export const clearAllCourseCaches = () => {
  store.dispatch(baseApi.util.invalidateTags([
    'courses',
    'course',
    'lectures',
    'lecture',
    'course-creator',
    'course-list',
    'course-details',
    'lecture-list',
    'lecture-details',
    'course-lectures',
    'creator-courses',
    'creator-lectures'
  ]));
  console.log('🗑️ Cleared all course and lecture caches');
};

/**
 * Optimistic update helper for course data
 * Updates the cache immediately before the API call completes
 */
export const optimisticCourseUpdate = (courseId: string, updates: Partial<any>) => {
  // This would be implemented with RTK Query's optimistic updates
  // For now, we'll just invalidate the cache to trigger a refetch
  invalidateCourseCaches(courseId);
  console.log('⚡ Optimistic course update:', { courseId, updates });
};

/**
 * Optimistic update helper for lecture data
 * Updates the cache immediately before the API call completes
 */
export const optimisticLectureUpdate = (lectureId: string, courseId: string, updates: Partial<any>) => {
  // This would be implemented with RTK Query's optimistic updates
  // For now, we'll just invalidate the cache to trigger a refetch
  invalidateLectureCaches(lectureId, courseId);
  console.log('⚡ Optimistic lecture update:', { lectureId, courseId, updates });
};

/**
 * Check if cache data is stale
 * Returns true if data should be refetched
 */
export const isCacheStale = (lastFetched: string | null, maxAgeSeconds: number = 30): boolean => {
  if (!lastFetched) return true;
  
  const now = Date.now();
  const fetchTime = new Date(lastFetched).getTime();
  const ageSeconds = (now - fetchTime) / 1000;
  
  return ageSeconds > maxAgeSeconds;
};

/**
 * ENHANCED: Real-time cache synchronization for lecture updates
 * Ensures immediate UI updates when lecture data changes within course objects
 */
export const syncLectureUpdateAcrossViews = (
  lectureId: string,
  courseId: string,
  lectureUpdates: Partial<any>,
  teacherId?: string
) => {
  console.log('🔄 Starting real-time cache synchronization:', { lectureId, courseId, teacherId });

  // Force immediate cache invalidation for all related endpoints
  const tagsToInvalidate = [
    // Lecture-specific tags
    { type: 'lecture' as const, id: lectureId },
    { type: 'lecture-details' as const, id: lectureId },
    { type: 'lectures' as const, id: courseId },
    { type: 'lecture-list' as const, id: courseId },

    // Course-specific tags
    { type: 'course' as const, id: courseId },
    { type: 'course-details' as const, id: courseId },
    { type: 'course-lectures' as const, id: courseId },

    // Creator-specific tags
    ...(teacherId ? [
      { type: 'courses' as const, id: `creator-${teacherId}` },
      { type: 'course-creator' as const, id: teacherId },
      { type: 'creator-courses' as const, id: teacherId },
      { type: 'creator-lectures' as const, id: teacherId },
    ] : []),

    // General tags
    'courses' as const,
    'lectures' as const,
    'course' as const,
    'lecture' as const,
  ];

  store.dispatch(baseApi.util.invalidateTags(tagsToInvalidate));
  console.log('✅ Real-time cache synchronization completed');
};

/**
 * Force refresh creator courses data
 * Use when you need to ensure the latest data is displayed
 */
export const forceRefreshCreatorCourses = (teacherId: string) => {
  console.log('🔄 Force refreshing creator courses for teacher:', teacherId);

  // Invalidate and refetch creator courses
  store.dispatch(baseApi.util.invalidateTags([
    { type: 'courses' as const, id: `creator-${teacherId}` },
    { type: 'course-creator' as const, id: teacherId },
    { type: 'creator-courses' as const, id: teacherId },
    'courses' as const,
    'course' as const,
  ]));

  console.log('✅ Creator courses cache invalidated for refresh');
};

/**
 * Monitor cache changes for debugging
 * Logs when specific cache entries are updated
 */
export const monitorCacheChanges = (entityType: 'course' | 'lecture', entityId: string) => {
  const state = store.getState();
  const apiState = state.baseApi;

  // Find relevant queries
  const relevantQueries = Object.entries(apiState.queries).filter(([key]) => {
    return key.includes(entityId) || key.includes(entityType);
  });

  console.log(`📊 Cache monitor for ${entityType} ${entityId}:`, {
    relevantQueries: relevantQueries.length,
    queries: relevantQueries.map(([key, query]) => ({
      key,
      status: (query as any).status,
      endpointName: (query as any).endpointName,
      fulfilledTimeStamp: (query as any).fulfilledTimeStamp,
    }))
  });

  return relevantQueries;
};

/**
 * Get cache status for debugging
 * Returns information about current cache state
 */
export const getCacheStatus = () => {
  const state = store.getState();
  const apiState = state.baseApi;

  return {
    queries: Object.keys(apiState.queries).length,
    mutations: Object.keys(apiState.mutations).length,
    subscriptions: Object.keys(apiState.subscriptions).length,
    provided: apiState.provided,
    // Note: invalidated property may not be available in all RTK Query versions
  };
};
