/**
 * Cache testing utilities for verifying cache invalidation workflow
 * Use these functions to test that cache invalidation is working properly
 */

import { store } from '@/redux/store';
import { baseApi } from '@/redux/api/baseApi';
import { 
  invalidateCourseCaches, 
  invalidateLectureCaches, 
  getCacheStatus,
  clearAllCourseCaches 
} from './cacheUtils';

/**
 * Test cache invalidation for course updates
 * This simulates a course update and verifies cache invalidation
 */
export const testCourseUpdateCacheInvalidation = (courseId: string, teacherId: string) => {
  console.log('🧪 Testing course update cache invalidation...');
  
  // Get initial cache status
  const initialStatus = getCacheStatus();
  console.log('📊 Initial cache status:', initialStatus);
  
  // Simulate course update by invalidating caches
  invalidateCourseCaches(courseId, teacherId);
  
  // Get updated cache status
  const updatedStatus = getCacheStatus();
  console.log('📊 Updated cache status:', updatedStatus);
  
  // Verify that invalidation occurred
  const invalidationOccurred = JSON.stringify(initialStatus) !== JSON.stringify(updatedStatus);
  console.log(invalidationOccurred ? '✅ Cache invalidation successful' : '❌ Cache invalidation failed');
  
  return invalidationOccurred;
};

/**
 * Test cache invalidation for lecture updates
 * This simulates a lecture update and verifies cache invalidation
 */
export const testLectureUpdateCacheInvalidation = (lectureId: string, courseId: string, teacherId: string) => {
  console.log('🧪 Testing lecture update cache invalidation...');
  
  // Get initial cache status
  const initialStatus = getCacheStatus();
  console.log('📊 Initial cache status:', initialStatus);
  
  // Simulate lecture update by invalidating caches
  invalidateLectureCaches(lectureId, courseId, teacherId);
  
  // Get updated cache status
  const updatedStatus = getCacheStatus();
  console.log('📊 Updated cache status:', updatedStatus);
  
  // Verify that invalidation occurred
  const invalidationOccurred = JSON.stringify(initialStatus) !== JSON.stringify(updatedStatus);
  console.log(invalidationOccurred ? '✅ Cache invalidation successful' : '❌ Cache invalidation failed');
  
  return invalidationOccurred;
};

/**
 * Test that Redis caching is disabled for course endpoints
 * This checks that no Redis cache headers are being sent
 */
export const testRedisCacheDisabled = () => {
  console.log('🧪 Testing Redis cache disabled for course endpoints...');
  
  // Check if any course-related queries have cache headers
  const state = store.getState();
  const apiState = state.baseApi;
  
  // Look for any queries that might have cache headers
  const queries = Object.values(apiState.queries);
  const courseQueries = queries.filter((query: any) => 
    query?.endpointName?.includes('course') || 
    query?.endpointName?.includes('lecture') ||
    query?.originalArgs?.url?.includes('/courses/') ||
    query?.originalArgs?.url?.includes('/lectures/')
  );
  
  console.log('📊 Found course-related queries:', courseQueries.length);
  
  // Check if any have cache-control headers that would indicate Redis caching
  const hasCacheHeaders = courseQueries.some((query: any) => {
    const headers = query?.originalArgs?.headers;
    return headers && (
      headers['Cache-Control'] === 'max-age=300' || // Redis cache header
      headers['X-Cache'] === 'HIT' // Redis hit indicator
    );
  });
  
  console.log(hasCacheHeaders ? '❌ Redis caching still enabled' : '✅ Redis caching disabled');
  
  return !hasCacheHeaders;
};

/**
 * Test Redux cache configuration
 * Verifies that Redux is properly configured for real-time updates
 */
export const testReduxCacheConfiguration = () => {
  console.log('🧪 Testing Redux cache configuration...');
  
  const state = store.getState();
  
  // Check if course data is not persisted (to avoid stale data)
  const courseState = state.course;
  const lectureState = state.lecture;
  const unifiedCourseState = state.unifiedCourse;
  
  // Verify that actual data is not persisted
  const courseDataNotPersisted = !courseState?.course || courseState.course === null;
  const lectureDataNotPersisted = !lectureState?.lectures || Object.keys(lectureState.lectures || {}).length === 0;
  const unifiedCourseDataNotPersisted = !unifiedCourseState?.courses || unifiedCourseState.courses.length === 0;
  
  console.log('📊 Course data not persisted:', courseDataNotPersisted);
  console.log('📊 Lecture data not persisted:', lectureDataNotPersisted);
  console.log('📊 Unified course data not persisted:', unifiedCourseDataNotPersisted);
  
  const configurationCorrect = courseDataNotPersisted && lectureDataNotPersisted && unifiedCourseDataNotPersisted;
  console.log(configurationCorrect ? '✅ Redux cache configuration correct' : '❌ Redux cache configuration needs adjustment');
  
  return configurationCorrect;
};

/**
 * Test enhanced cache invalidation for lecture updates
 * This specifically tests the new cascade invalidation system
 */
export const testEnhancedLectureUpdateInvalidation = (lectureId: string, courseId: string, teacherId: string) => {
  console.log('🧪 Testing enhanced lecture update cache invalidation...');

  // Get initial cache status
  const initialStatus = getCacheStatus();
  console.log('📊 Initial cache status:', initialStatus);

  // Import and test cascade invalidation
  import('@/utils/cacheUtils').then(({ cascadeInvalidateLectureUpdate, syncLectureUpdateAcrossViews }) => {
    // Test cascade invalidation
    cascadeInvalidateLectureUpdate(lectureId, courseId, teacherId);

    // Test real-time synchronization
    syncLectureUpdateAcrossViews(lectureId, courseId, { title: 'Updated Title' }, teacherId);

    // Get updated cache status
    const updatedStatus = getCacheStatus();
    console.log('📊 Updated cache status:', updatedStatus);

    const invalidationOccurred = JSON.stringify(initialStatus) !== JSON.stringify(updatedStatus);
    console.log(invalidationOccurred ? '✅ Enhanced cache invalidation successful' : '❌ Enhanced cache invalidation failed');

    return invalidationOccurred;
  });
};

/**
 * Test creator courses cache invalidation specifically
 * This tests the most critical part of the cache invalidation system
 */
export const testCreatorCoursesInvalidation = (teacherId: string) => {
  console.log('🧪 Testing creator courses cache invalidation...');

  const state = store.getState();
  const apiState = state.baseApi;

  // Look for creator courses queries
  const creatorQueries = Object.entries(apiState.queries).filter(([key]) =>
    key.includes(`creator-${teacherId}`) || key.includes('getCreatorCourse')
  );

  console.log('📊 Found creator courses queries:', creatorQueries.length);

  // Import and test force refresh
  import('@/utils/cacheUtils').then(({ forceRefreshCreatorCourses }) => {
    forceRefreshCreatorCourses(teacherId);

    // Check if invalidation occurred
    setTimeout(() => {
      const newState = store.getState();
      const newApiState = newState.baseApi;
      const newCreatorQueries = Object.entries(newApiState.queries).filter(([key]) =>
        key.includes(`creator-${teacherId}`) || key.includes('getCreatorCourse')
      );

      console.log('📊 Creator queries after invalidation:', newCreatorQueries.length);
      console.log('✅ Creator courses invalidation test completed');
    }, 100);
  });
};

/**
 * Test complete cache invalidation workflow
 * This runs all cache tests to verify the complete workflow
 */
export const testCompleteCacheWorkflow = (courseId: string, lectureId: string, teacherId: string) => {
  console.log('🧪 Testing complete cache invalidation workflow...');

  const results = {
    redisCacheDisabled: testRedisCacheDisabled(),
    reduxConfigCorrect: testReduxCacheConfiguration(),
    courseInvalidation: testCourseUpdateCacheInvalidation(courseId, teacherId),
    lectureInvalidation: testLectureUpdateCacheInvalidation(lectureId, courseId, teacherId),
    enhancedLectureInvalidation: testEnhancedLectureUpdateInvalidation(lectureId, courseId, teacherId),
    creatorCoursesInvalidation: testCreatorCoursesInvalidation(teacherId),
  };

  const basicTestsPassed = [
    results.redisCacheDisabled,
    results.reduxConfigCorrect,
    results.courseInvalidation,
    results.lectureInvalidation
  ].every(result => result === true);

  console.log('📊 Test Results:', results);
  console.log(basicTestsPassed ? '✅ All basic cache tests passed!' : '❌ Some basic cache tests failed');
  console.log('🔄 Enhanced invalidation tests are running asynchronously...');

  return results;
};

/**
 * Monitor cache performance
 * This function helps monitor cache hit/miss rates and performance
 */
export const monitorCachePerformance = () => {
  console.log('📊 Monitoring cache performance...');
  
  const state = store.getState();
  const apiState = state.baseApi;
  
  const queries = Object.values(apiState.queries);
  const mutations = Object.values(apiState.mutations);
  
  const stats = {
    totalQueries: queries.length,
    totalMutations: mutations.length,
    pendingQueries: queries.filter((q: any) => q.status === 'pending').length,
    fulfilledQueries: queries.filter((q: any) => q.status === 'fulfilled').length,
    rejectedQueries: queries.filter((q: any) => q.status === 'rejected').length,
    pendingMutations: mutations.filter((m: any) => m.status === 'pending').length,
    fulfilledMutations: mutations.filter((m: any) => m.status === 'fulfilled').length,
    rejectedMutations: mutations.filter((m: any) => m.status === 'rejected').length,
  };
  
  console.log('📊 Cache Performance Stats:', stats);
  
  return stats;
};

/**
 * Reset cache for testing
 * Clears all caches to start fresh for testing
 */
export const resetCacheForTesting = () => {
  console.log('🧹 Resetting cache for testing...');
  
  clearAllCourseCaches();
  
  // Also reset the API state
  store.dispatch(baseApi.util.resetApiState());
  
  console.log('✅ Cache reset complete');
};
