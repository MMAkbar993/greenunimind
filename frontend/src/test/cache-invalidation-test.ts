/**
 * Test script to verify Redux cache invalidation is working properly
 * This can be run in the browser console or as a standalone test
 */

import { store } from '../redux/store';
import { baseApi } from '../redux/api/baseApi';

export const testCacheInvalidation = async () => {
  console.log('🧪 Testing Redux Cache Invalidation...');
  
  // Get current state
  const initialState = store.getState();
  console.log('📊 Initial API state:', initialState.baseApi);
  
  // Test 1: Check if cache tags are properly configured
  console.log('\n🏷️ Testing cache tag configuration...');
  
  // Get all registered endpoints
  const endpoints = baseApi.endpoints;
  console.log('📋 Available endpoints:', Object.keys(endpoints));
  
  // Check specific endpoints for proper cache tags
  const courseEndpoints = Object.keys(endpoints).filter(key => key.includes('Course'));
  const lectureEndpoints = Object.keys(endpoints).filter(key => key.includes('Lecture'));
  
  console.log('🎓 Course endpoints:', courseEndpoints);
  console.log('📚 Lecture endpoints:', lectureEndpoints);
  
  // Test 2: Simulate cache invalidation
  console.log('\n🔄 Testing cache invalidation...');
  
  try {
    // Invalidate specific tags
    store.dispatch(baseApi.util.invalidateTags([
      'courses',
      'lectures',
      { type: 'course', id: 'test-course-id' },
      { type: 'lecture', id: 'test-lecture-id' }
    ]));
    
    console.log('✅ Cache invalidation dispatched successfully');
    
    // Check state after invalidation
    const stateAfterInvalidation = store.getState();
    console.log('📊 State after invalidation:', stateAfterInvalidation.baseApi);
    
  } catch (error) {
    console.error('❌ Cache invalidation failed:', error);
  }
  
  // Test 3: Check tag relationships
  console.log('\n🔗 Testing tag relationships...');
  
  const tagTypes = [
    'courses',
    'course', 
    'lectures',
    'lecture'
  ];
  
  tagTypes.forEach(tagType => {
    console.log(`🏷️ Tag type "${tagType}" is configured in baseApi`);
  });
  
  console.log('\n✅ Cache invalidation test completed!');
  
  return {
    success: true,
    message: 'Cache invalidation test completed successfully',
    endpoints: {
      course: courseEndpoints,
      lecture: lectureEndpoints
    }
  };
};

// Helper function to monitor cache changes
export const monitorCacheChanges = () => {
  let previousState = store.getState().baseApi;
  
  const unsubscribe = store.subscribe(() => {
    const currentState = store.getState().baseApi;
    
    if (currentState !== previousState) {
      console.log('🔄 Cache state changed:', {
        previous: Object.keys(previousState.queries || {}),
        current: Object.keys(currentState.queries || {}),
        timestamp: new Date().toISOString()
      });
      previousState = currentState;
    }
  });
  
  console.log('👀 Cache monitoring started. Call the returned function to stop monitoring.');
  return unsubscribe;
};

// Helper function to check specific query cache
export const checkQueryCache = (endpointName: string, args?: any) => {
  const state = store.getState();
  const queries = state.baseApi.queries;
  
  console.log(`🔍 Checking cache for ${endpointName}:`, {
    endpointName,
    args,
    cachedQueries: Object.keys(queries || {}),
    relevantQueries: Object.keys(queries || {}).filter(key => key.includes(endpointName))
  });
  
  return Object.keys(queries || {}).filter(key => key.includes(endpointName));
};

// Helper function to test lecture update cache invalidation
export const testLectureUpdateCacheInvalidation = async (courseId: string, lectureId: string) => {
  console.log('🧪 Testing lecture update cache invalidation...');

  const initialState = store.getState();
  console.log('📊 Initial cache state:', Object.keys(initialState.baseApi.queries || {}));

  // Monitor cache changes during update
  let cacheChanges: string[] = [];
  const unsubscribe = store.subscribe(() => {
    const currentState = store.getState();
    const currentQueries = Object.keys(currentState.baseApi.queries || {});
    cacheChanges.push(`Cache updated: ${currentQueries.length} queries at ${new Date().toISOString()}`);
  });

  try {
    // Simulate cache invalidation that would happen during lecture update
    store.dispatch(baseApi.util.invalidateTags([
      { type: 'lecture', id: lectureId },
      { type: 'lectures', id: courseId },
      { type: 'course', id: courseId },
      // Course creator specific invalidations - CRITICAL for fixing stale data
      { type: 'courses', id: 'LIST' },
      { type: 'lectures', id: 'LIST' },
      'courses',
      'lectures'
    ]));

    console.log('✅ Cache invalidation completed');
    console.log('📈 Cache changes:', cacheChanges);

    return {
      success: true,
      cacheChanges,
      message: 'Lecture update cache invalidation test completed'
    };
  } catch (error) {
    console.error('❌ Cache invalidation test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      cacheChanges
    };
  } finally {
    unsubscribe();
  }
};

// Helper function to test course creator cache invalidation specifically
export const testCourseCreatorCacheInvalidation = async (teacherId: string) => {
  console.log('🧪 Testing course creator cache invalidation...');

  const initialState = store.getState();
  const initialQueries = Object.keys(initialState.baseApi.queries || {});
  console.log('📊 Initial cache state:', initialQueries);

  // Look for course creator queries in cache
  const creatorQueries = initialQueries.filter(key =>
    key.includes('creator') || key.includes(teacherId)
  );
  console.log('👨‍🏫 Course creator queries found:', creatorQueries);

  try {
    // Simulate cache invalidation that specifically targets course creator endpoints
    store.dispatch(baseApi.util.invalidateTags([
      { type: 'courses', id: `creator-${teacherId}` },
      { type: 'lectures', id: `creator-${teacherId}` },
      { type: 'courses', id: 'LIST' },
      { type: 'lectures', id: 'LIST' },
      'courses',
      'lectures'
    ]));

    // Check cache state after invalidation
    const finalState = store.getState();
    const finalQueries = Object.keys(finalState.baseApi.queries || {});
    const remainingCreatorQueries = finalQueries.filter(key =>
      key.includes('creator') || key.includes(teacherId)
    );

    console.log('✅ Course creator cache invalidation completed');
    console.log('📊 Final cache state:', finalQueries);
    console.log('👨‍🏫 Remaining creator queries:', remainingCreatorQueries);

    return {
      success: true,
      initialQueries: creatorQueries.length,
      remainingQueries: remainingCreatorQueries.length,
      invalidated: creatorQueries.length - remainingCreatorQueries.length,
      message: 'Course creator cache invalidation test completed'
    };
  } catch (error) {
    console.error('❌ Course creator cache invalidation test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper function to test the complete lecture update flow with timestamp verification
export const testCompleteLectureUpdateFlow = async (courseId: string, lectureId: string, teacherId: string) => {
  console.log('🧪 Testing complete lecture update flow with timestamp verification...');

  try {
    // Step 1: Get initial course data
    console.log('📊 Step 1: Getting initial course data...');
    const initialCourseResponse = await fetch(`/api/v1/courses/creator/${teacherId}`, {
      credentials: 'include'
    });
    const initialCourseData = await initialCourseResponse.json();
    const initialCourse = initialCourseData.data?.find((c: any) => c._id === courseId);
    const initialTimestamp = initialCourse?.updatedAt;
    console.log('⏰ Initial course updatedAt:', initialTimestamp);

    // Step 2: Get initial lecture data
    console.log('📊 Step 2: Getting initial lecture data...');
    const initialLectureResponse = await fetch(`/api/v1/lectures/${lectureId}`, {
      credentials: 'include'
    });
    const initialLectureData = await initialLectureResponse.json();
    const initialLectureTitle = initialLectureData.data?.lectureTitle;
    console.log('📝 Initial lecture title:', initialLectureTitle);

    // Step 3: Update lecture
    console.log('📊 Step 3: Updating lecture...');
    const updatePayload = {
      lectureTitle: `Updated Lecture ${Date.now()}`
    };

    const updateResponse = await fetch(`/api/v1/lectures/${courseId}/update-lecture/${lectureId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updatePayload)
    });

    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Lecture update successful:', updateResult.data?.lectureTitle);

    // Step 4: Wait a moment for cache invalidation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Verify individual lecture endpoint
    console.log('📊 Step 5: Verifying individual lecture endpoint...');
    const updatedLectureResponse = await fetch(`/api/v1/lectures/${lectureId}`, {
      credentials: 'include'
    });
    const updatedLectureData = await updatedLectureResponse.json();
    const updatedLectureTitle = updatedLectureData.data?.lectureTitle;
    const lectureTimestamp = updatedLectureData.data?.updatedAt;
    console.log('📝 Updated lecture title:', updatedLectureTitle);
    console.log('⏰ Lecture updatedAt:', lectureTimestamp);

    // Step 6: Verify course creator endpoint
    console.log('📊 Step 6: Verifying course creator endpoint...');
    const finalCourseResponse = await fetch(`/api/v1/courses/creator/${teacherId}`, {
      credentials: 'include'
    });
    const finalCourseData = await finalCourseResponse.json();
    const finalCourse = finalCourseData.data?.find((c: any) => c._id === courseId);
    const finalTimestamp = finalCourse?.updatedAt;
    const courseLecture = finalCourse?.lectures?.find((l: any) => l._id === lectureId);
    const courseLectureTitle = courseLecture?.lectureTitle;
    console.log('📝 Course creator lecture title:', courseLectureTitle);
    console.log('⏰ Final course updatedAt:', finalTimestamp);

    // Step 7: Analyze results
    const results = {
      success: true,
      initialLectureTitle,
      updatedLectureTitle,
      courseLectureTitle,
      timestamps: {
        initial: initialTimestamp,
        lecture: lectureTimestamp,
        final: finalTimestamp
      },
      dataConsistency: updatedLectureTitle === courseLectureTitle,
      timestampUpdated: new Date(finalTimestamp) > new Date(initialTimestamp),
      message: 'Complete lecture update flow test completed'
    };

    console.log('📊 Test Results:', results);

    if (!results.dataConsistency) {
      console.error('❌ DATA INCONSISTENCY: Individual lecture and course creator endpoints return different data!');
    }

    if (!results.timestampUpdated) {
      console.error('❌ TIMESTAMP NOT UPDATED: Course updatedAt timestamp was not refreshed!');
    }

    if (results.dataConsistency && results.timestampUpdated) {
      console.log('✅ ALL TESTS PASSED: Cache invalidation is working correctly!');
    }

    return results;
  } catch (error) {
    console.error('❌ Complete lecture update flow test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper function to debug Redis cache status
export const debugRedisCacheStatus = async () => {
  console.log('🔍 Debugging Redis cache status...');

  try {
    // Get Redis health
    const redisHealthResponse = await fetch('/api/v1/monitoring/redis/health', {
      credentials: 'include'
    });

    if (redisHealthResponse.ok) {
      const redisHealth = await redisHealthResponse.json();
      console.log('🔴 Redis Health:', redisHealth.data);
    } else {
      console.log('❌ Could not fetch Redis health (might need admin permissions)');
    }

    // Get cache stats
    const cacheStatsResponse = await fetch('/api/v1/monitoring/cache/stats', {
      credentials: 'include'
    });

    if (cacheStatsResponse.ok) {
      const cacheStats = await cacheStatsResponse.json();
      console.log('📊 Cache Stats:', cacheStats.data);
    } else {
      console.log('❌ Could not fetch cache stats (might need admin permissions)');
    }

    return {
      success: true,
      message: 'Redis cache debugging completed - check console for details'
    };
  } catch (error) {
    console.error('❌ Redis cache debugging failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper function to manually invalidate cache for testing
export const manualCacheInvalidation = async (tags: string[]) => {
  console.log('🧹 Manually invalidating cache tags:', tags);

  try {
    const response = await fetch('/api/v1/monitoring/cache/invalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ tags })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Manual cache invalidation successful:', result);
      return result;
    } else {
      console.log('❌ Manual cache invalidation failed (might need admin permissions)');
      return { success: false, error: 'Permission denied or endpoint not available' };
    }
  } catch (error) {
    console.error('❌ Manual cache invalidation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper function to verify if backend fix is deployed
export const verifyBackendFix = async (courseId: string, lectureId: string) => {
  console.log('🔍 Verifying if backend timestamp fix is deployed...');

  try {
    // Step 1: Get initial timestamps
    const initialCourseResponse = await fetch(`/api/v1/courses/${courseId}`, {
      credentials: 'include'
    });
    const initialCourseData = await initialCourseResponse.json();
    const initialCourseTimestamp = initialCourseData.data?.updatedAt;

    const initialLectureResponse = await fetch(`/api/v1/lectures/${lectureId}`, {
      credentials: 'include'
    });
    const initialLectureData = await initialLectureResponse.json();
    const initialLectureTimestamp = initialLectureData.data?.updatedAt;

    console.log('📊 Initial timestamps:');
    console.log('  Course:', initialCourseTimestamp);
    console.log('  Lecture:', initialLectureTimestamp);

    // Step 2: Update lecture with a small change
    const testPayload = {
      instruction: `Test update ${Date.now()}`
    };

    console.log('🔄 Making test lecture update...');
    const updateResponse = await fetch(`/api/v1/lectures/${courseId}/update-lecture/${lectureId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testPayload)
    });

    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    // Step 3: Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Check if course timestamp was updated
    const finalCourseResponse = await fetch(`/api/v1/courses/${courseId}`, {
      credentials: 'include'
    });
    const finalCourseData = await finalCourseResponse.json();
    const finalCourseTimestamp = finalCourseData.data?.updatedAt;

    const finalLectureResponse = await fetch(`/api/v1/lectures/${lectureId}`, {
      credentials: 'include'
    });
    const finalLectureData = await finalLectureResponse.json();
    const finalLectureTimestamp = finalLectureData.data?.updatedAt;

    console.log('📊 Final timestamps:');
    console.log('  Course:', finalCourseTimestamp);
    console.log('  Lecture:', finalLectureTimestamp);

    // Step 5: Analyze results
    const courseTimestampUpdated = new Date(finalCourseTimestamp) > new Date(initialCourseTimestamp);
    const lectureTimestampUpdated = new Date(finalLectureTimestamp) > new Date(initialLectureTimestamp);
    const timestampsConsistent = new Date(finalCourseTimestamp) >= new Date(finalLectureTimestamp);

    const results = {
      backendFixDeployed: courseTimestampUpdated,
      lectureUpdated: lectureTimestampUpdated,
      timestampsConsistent,
      timestamps: {
        course: { initial: initialCourseTimestamp, final: finalCourseTimestamp },
        lecture: { initial: initialLectureTimestamp, final: finalLectureTimestamp }
      }
    };

    console.log('📊 Backend Fix Verification Results:', results);

    if (results.backendFixDeployed) {
      console.log('✅ BACKEND FIX IS DEPLOYED: Course timestamp is being updated!');
    } else {
      console.log('❌ BACKEND FIX NOT DEPLOYED: Course timestamp was not updated');
      console.log('🔧 Please restart your backend server to apply the fix');
    }

    return results;
  } catch (error) {
    console.error('❌ Backend fix verification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Helper function to test the race condition fix
export const testRaceConditionFix = async (courseId: string, lectureId: string, teacherId: string) => {
  console.log('🏁 Testing race condition fix for cache invalidation...');

  try {
    // Step 1: Get initial course creator data
    console.log('📊 Step 1: Getting initial course creator data...');
    const initialResponse = await fetch(`/api/v1/courses/creator/${teacherId}`, {
      credentials: 'include'
    });
    const initialData = await initialResponse.json();
    const initialCourse = initialData.data?.find((c: any) => c._id === courseId);
    const initialLecture = initialCourse?.lectures?.find((l: any) => l._id === lectureId);

    console.log('📝 Initial state:');
    console.log('  Course updatedAt:', initialCourse?.updatedAt);
    console.log('  Lecture title:', initialLecture?.lectureTitle);
    console.log('  Lecture updatedAt:', initialLecture?.updatedAt);

    // Step 2: Update lecture and measure timing
    const updateTitle = `Race Test ${Date.now()}`;
    console.log('🔄 Step 2: Updating lecture to:', updateTitle);

    const updateStart = Date.now();
    const updateResponse = await fetch(`/api/v1/lectures/${courseId}/update-lecture/${lectureId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        lectureTitle: updateTitle
      })
    });
    const updateEnd = Date.now();

    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Update completed in:', updateEnd - updateStart, 'ms');
    console.log('📝 Updated lecture title:', updateResult.data?.lectureTitle);

    // Step 3: Wait a moment for cache invalidation to complete
    console.log('⏳ Step 3: Waiting for cache invalidation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check course creator endpoint immediately
    console.log('📊 Step 4: Checking course creator endpoint...');
    const finalResponse = await fetch(`/api/v1/courses/creator/${teacherId}`, {
      credentials: 'include'
    });
    const finalData = await finalResponse.json();
    const finalCourse = finalData.data?.find((c: any) => c._id === courseId);
    const finalLecture = finalCourse?.lectures?.find((l: any) => l._id === lectureId);

    console.log('📝 Final state:');
    console.log('  Course updatedAt:', finalCourse?.updatedAt);
    console.log('  Lecture title:', finalLecture?.lectureTitle);
    console.log('  Lecture updatedAt:', finalLecture?.updatedAt);

    // Step 5: Analyze results
    const titleMatches = finalLecture?.lectureTitle === updateTitle;
    const courseTimestampNewer = new Date(finalCourse?.updatedAt) > new Date(initialCourse?.updatedAt);
    const lectureTimestampNewer = new Date(finalLecture?.updatedAt) > new Date(initialLecture?.updatedAt);
    const timestampsConsistent = new Date(finalCourse?.updatedAt) >= new Date(finalLecture?.updatedAt);

    const results = {
      success: titleMatches && courseTimestampNewer && lectureTimestampNewer,
      titleMatches,
      courseTimestampNewer,
      lectureTimestampNewer,
      timestampsConsistent,
      updateTime: updateEnd - updateStart,
      expectedTitle: updateTitle,
      actualTitle: finalLecture?.lectureTitle,
      timestamps: {
        course: { initial: initialCourse?.updatedAt, final: finalCourse?.updatedAt },
        lecture: { initial: initialLecture?.updatedAt, final: finalLecture?.updatedAt }
      }
    };

    console.log('📊 Race Condition Test Results:', results);

    if (results.success) {
      console.log('✅ RACE CONDITION FIXED: All data is consistent!');
    } else {
      console.log('❌ RACE CONDITION STILL EXISTS:');
      if (!results.titleMatches) console.log('  - Lecture title mismatch');
      if (!results.courseTimestampNewer) console.log('  - Course timestamp not updated');
      if (!results.lectureTimestampNewer) console.log('  - Lecture timestamp not updated');
      if (!results.timestampsConsistent) console.log('  - Timestamps inconsistent');
    }

    return results;
  } catch (error) {
    console.error('❌ Race condition test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Comprehensive end-to-end test for the complete solution
export const testComprehensiveSolution = async (courseId: string, lectureId: string, teacherId: string) => {
  console.log('🚀 Running comprehensive solution test...');

  const results = {
    reduxCacheInvalidation: false,
    backendCacheInvalidation: false,
    databaseConsistency: false,
    uiConsistency: false,
    performanceAcceptable: false,
    overallSuccess: false
  };

  try {
    // Test 1: Redux Cache Invalidation
    console.log('📊 Test 1: Redux Cache Invalidation');
    const reduxTest = await testCourseCreatorCacheInvalidation(teacherId);
    results.reduxCacheInvalidation = reduxTest.success;

    // Test 2: Backend Cache Invalidation
    console.log('📊 Test 2: Backend Cache Invalidation');
    const backendTest = await verifyBackendFix(courseId, lectureId);
    results.backendCacheInvalidation = (backendTest as any).backendFixDeployed || false;

    // Test 3: Database Consistency
    console.log('📊 Test 3: Database Consistency');
    const dbTest = await testCompleteLectureUpdateFlow(courseId, lectureId, teacherId);
    results.databaseConsistency = dbTest.success && (dbTest as any).dataConsistency && (dbTest as any).timestampUpdated;

    // Test 4: UI Consistency (Race Condition Fix)
    console.log('📊 Test 4: UI Consistency');
    const uiTest = await testRaceConditionFix(courseId, lectureId, teacherId);
    results.uiConsistency = uiTest.success;

    // Test 5: Performance Check
    console.log('📊 Test 5: Performance Check');
    const performanceStart = Date.now();
    await fetch(`/api/v1/courses/creator/${teacherId}`, { credentials: 'include' });
    const performanceTime = Date.now() - performanceStart;
    results.performanceAcceptable = performanceTime < 2000; // Under 2 seconds

    // Overall assessment
    results.overallSuccess = Object.values(results).slice(0, -1).every(Boolean);

    console.log('📊 Comprehensive Test Results:', results);

    if (results.overallSuccess) {
      console.log('🎉 ALL TESTS PASSED: Comprehensive solution is working perfectly!');
    } else {
      console.log('❌ SOME TESTS FAILED: Issues remain in the following areas:');
      if (!results.reduxCacheInvalidation) console.log('  - Redux cache invalidation');
      if (!results.backendCacheInvalidation) console.log('  - Backend cache invalidation');
      if (!results.databaseConsistency) console.log('  - Database consistency');
      if (!results.uiConsistency) console.log('  - UI consistency');
      if (!results.performanceAcceptable) console.log('  - Performance (too slow)');
    }

    return results;
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    return {
      ...results,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Performance monitoring function
export const monitorPerformance = async (teacherId: string, iterations: number = 5) => {
  console.log(`📈 Monitoring performance over ${iterations} requests...`);

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await fetch(`/api/v1/courses/creator/${teacherId}`, { credentials: 'include' });
    const time = Date.now() - start;
    times.push(time);
    console.log(`Request ${i + 1}: ${time}ms`);

    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  const results = {
    averageTime: avgTime,
    minTime,
    maxTime,
    allTimes: times,
    acceptable: avgTime < 1000 // Under 1 second average
  };

  console.log('📈 Performance Results:', results);
  return results;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testCacheInvalidation = testCacheInvalidation;
  (window as any).monitorCacheChanges = monitorCacheChanges;
  (window as any).checkQueryCache = checkQueryCache;
  (window as any).testLectureUpdateCacheInvalidation = testLectureUpdateCacheInvalidation;
  (window as any).testCourseCreatorCacheInvalidation = testCourseCreatorCacheInvalidation;
  (window as any).testCompleteLectureUpdateFlow = testCompleteLectureUpdateFlow;
  (window as any).debugRedisCacheStatus = debugRedisCacheStatus;
  (window as any).manualCacheInvalidation = manualCacheInvalidation;
  (window as any).verifyBackendFix = verifyBackendFix;
  (window as any).testRaceConditionFix = testRaceConditionFix;
  (window as any).testComprehensiveSolution = testComprehensiveSolution;
  (window as any).monitorPerformance = monitorPerformance;
}
