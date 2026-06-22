/**
 * Comprehensive test utility for course editing workflow
 * Tests the complete end-to-end flow: frontend → backend → database → cache invalidation
 */

import { AppDispatch } from '@/redux/store';
import { courseApi } from '@/redux/features/course/courseApi';
import { baseApi } from '@/redux/api/baseApi';
import { toast } from 'sonner';

export interface CourseEditTestData {
  courseId: string;
  originalTitle: string;
  newTitle: string;
  creatorId?: string;
}

export interface CourseEditTestResult {
  success: boolean;
  steps: {
    frontendSubmission: boolean;
    backendProcessing: boolean;
    databasePersistence: boolean;
    cacheInvalidation: boolean;
    uiUpdate: boolean;
  };
  errors: string[];
  timings: {
    totalTime: number;
    apiCallTime: number;
    cacheInvalidationTime: number;
    uiUpdateTime: number;
  };
  data: {
    originalCourse?: any;
    updatedCourse?: any;
    finalCourse?: any;
  };
}

/**
 * Test the complete course editing workflow
 */
export const testCourseEditingWorkflow = async (
  dispatch: AppDispatch,
  testData: CourseEditTestData
): Promise<CourseEditTestResult> => {
  const startTime = performance.now();
  const result: CourseEditTestResult = {
    success: false,
    steps: {
      frontendSubmission: false,
      backendProcessing: false,
      databasePersistence: false,
      cacheInvalidation: false,
      uiUpdate: false,
    },
    errors: [],
    timings: {
      totalTime: 0,
      apiCallTime: 0,
      cacheInvalidationTime: 0,
      uiUpdateTime: 0,
    },
    data: {},
  };

  try {
    console.log('🧪 Starting course editing workflow test:', testData);

    // Step 1: Get original course data
    console.log('📋 Step 1: Fetching original course data...');
    try {
      const originalCourseResponse = await dispatch(
        courseApi.endpoints.getCourseById.initiate(testData.courseId, { forceRefetch: true })
      ).unwrap();
      
      result.data.originalCourse = originalCourseResponse.data;
      console.log('✅ Original course title:', result.data.originalCourse?.title);
    } catch (error) {
      result.errors.push(`Failed to fetch original course: ${error}`);
      return result;
    }

    // Step 2: Simulate frontend form submission
    console.log('📤 Step 2: Simulating frontend form submission...');
    const apiCallStartTime = performance.now();
    
    try {
      // Create FormData similar to the frontend
      const formData = new FormData();
      formData.append('title', testData.newTitle);
      formData.append('subtitle', result.data.originalCourse?.subtitle || '');
      formData.append('description', result.data.originalCourse?.description || '');
      formData.append('categoryId', result.data.originalCourse?.categoryId || '');
      formData.append('subcategoryId', result.data.originalCourse?.subcategoryId || '');
      formData.append('courseLevel', result.data.originalCourse?.courseLevel || 'Beginner');
      formData.append('status', result.data.originalCourse?.status || 'draft');
      formData.append('isPublished', JSON.stringify(result.data.originalCourse?.isPublished || false));

      console.log('📝 Test FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      // Call the edit course mutation
      const editResponse = await dispatch(
        courseApi.endpoints.editCourse.initiate({
          id: testData.courseId,
          data: formData,
          creatorId: testData.creatorId,
        })
      ).unwrap();

      result.data.updatedCourse = editResponse.data;
      result.steps.frontendSubmission = true;
      result.steps.backendProcessing = true;
      
      const apiCallEndTime = performance.now();
      result.timings.apiCallTime = apiCallEndTime - apiCallStartTime;
      
      console.log('✅ API call completed in', result.timings.apiCallTime.toFixed(2), 'ms');
      console.log('✅ Updated course title from API:', result.data.updatedCourse?.title);

    } catch (error) {
      result.errors.push(`Frontend submission failed: ${error}`);
      return result;
    }

    // Step 3: Verify database persistence
    console.log('🗄️ Step 3: Verifying database persistence...');
    const cacheInvalidationStartTime = performance.now();
    
    try {
      // Force cache invalidation
      dispatch(baseApi.util.invalidateTags([
        'courses',
        'course',
        { type: 'course', id: testData.courseId },
        { type: 'courses', id: 'LIST' },
        ...(testData.creatorId ? [{ type: 'courses', id: `creator-${testData.creatorId}` }] : []),
      ]));

      // Wait a moment for cache invalidation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch fresh data from database
      const freshCourseResponse = await dispatch(
        courseApi.endpoints.getCourseById.initiate(testData.courseId, { forceRefetch: true })
      ).unwrap();

      result.data.finalCourse = freshCourseResponse.data;
      result.steps.databasePersistence = result.data.finalCourse?.title === testData.newTitle;
      result.steps.cacheInvalidation = true;

      const cacheInvalidationEndTime = performance.now();
      result.timings.cacheInvalidationTime = cacheInvalidationEndTime - cacheInvalidationStartTime;

      console.log('✅ Cache invalidation completed in', result.timings.cacheInvalidationTime.toFixed(2), 'ms');
      console.log('✅ Fresh course title from database:', result.data.finalCourse?.title);

    } catch (error) {
      result.errors.push(`Database verification failed: ${error}`);
      return result;
    }

    // Step 4: Verify UI update
    console.log('🖥️ Step 4: Verifying UI update...');
    const uiUpdateStartTime = performance.now();
    
    try {
      // Check if the course data in the cache matches the expected title
      const cacheState = dispatch(courseApi.endpoints.getCourseById.select(testData.courseId))({
        api: {} as any,
      });

      result.steps.uiUpdate = cacheState.data?.data?.title === testData.newTitle;

      const uiUpdateEndTime = performance.now();
      result.timings.uiUpdateTime = uiUpdateEndTime - uiUpdateStartTime;

      console.log('✅ UI update verification completed in', result.timings.uiUpdateTime.toFixed(2), 'ms');
      console.log('✅ UI cache title:', cacheState.data?.data?.title);

    } catch (error) {
      result.errors.push(`UI update verification failed: ${error}`);
    }

    // Calculate total time
    const endTime = performance.now();
    result.timings.totalTime = endTime - startTime;

    // Determine overall success
    result.success = Object.values(result.steps).every(step => step === true) && result.errors.length === 0;

    console.log('🏁 Course editing workflow test completed:', {
      success: result.success,
      totalTime: result.timings.totalTime.toFixed(2) + 'ms',
      steps: result.steps,
      errors: result.errors,
    });

    return result;

  } catch (error) {
    result.errors.push(`Unexpected error: ${error}`);
    result.timings.totalTime = performance.now() - startTime;
    return result;
  }
};

/**
 * Quick test function for manual testing
 */
export const quickCourseEditTest = async (
  dispatch: AppDispatch,
  courseId: string,
  newTitle: string,
  creatorId?: string
) => {
  const testData: CourseEditTestData = {
    courseId,
    originalTitle: '', // Will be fetched
    newTitle,
    creatorId,
  };

  const result = await testCourseEditingWorkflow(dispatch, testData);

  // Show toast with results
  if (result.success) {
    toast.success(`Course editing test passed! (${result.timings.totalTime.toFixed(2)}ms)`, {
      description: `Title successfully updated to: "${newTitle}"`,
    });
  } else {
    toast.error('Course editing test failed!', {
      description: result.errors.join(', '),
    });
  }

  return result;
};

/**
 * Performance benchmark for course editing
 */
export const benchmarkCourseEditing = async (
  dispatch: AppDispatch,
  courseId: string,
  iterations: number = 5
) => {
  const results: CourseEditTestResult[] = [];
  const baseTitles = [
    'Test Course Alpha',
    'Test Course Beta', 
    'Test Course Gamma',
    'Test Course Delta',
    'Test Course Epsilon',
  ];

  console.log(`🏃‍♂️ Starting course editing benchmark with ${iterations} iterations...`);

  for (let i = 0; i < iterations; i++) {
    const testTitle = `${baseTitles[i % baseTitles.length]} - Iteration ${i + 1}`;
    
    const testData: CourseEditTestData = {
      courseId,
      originalTitle: '',
      newTitle: testTitle,
    };

    const result = await testCourseEditingWorkflow(dispatch, testData);
    results.push(result);

    // Wait between iterations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Calculate statistics
  const successfulResults = results.filter(r => r.success);
  const avgTotalTime = successfulResults.reduce((sum, r) => sum + r.timings.totalTime, 0) / successfulResults.length;
  const avgApiTime = successfulResults.reduce((sum, r) => sum + r.timings.apiCallTime, 0) / successfulResults.length;
  const avgCacheTime = successfulResults.reduce((sum, r) => sum + r.timings.cacheInvalidationTime, 0) / successfulResults.length;

  const benchmarkResult = {
    totalIterations: iterations,
    successfulIterations: successfulResults.length,
    successRate: (successfulResults.length / iterations) * 100,
    averageTimes: {
      total: avgTotalTime,
      apiCall: avgApiTime,
      cacheInvalidation: avgCacheTime,
    },
    allResults: results,
  };

  console.log('📊 Course editing benchmark results:', benchmarkResult);

  toast.info(`Benchmark completed: ${benchmarkResult.successRate.toFixed(1)}% success rate`, {
    description: `Avg time: ${avgTotalTime.toFixed(2)}ms (${successfulResults.length}/${iterations} successful)`,
  });

  return benchmarkResult;
};

export default {
  testCourseEditingWorkflow,
  quickCourseEditTest,
  benchmarkCourseEditing,
};
