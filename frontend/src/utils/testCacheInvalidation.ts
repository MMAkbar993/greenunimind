/**
 * Test utility to verify cache invalidation fixes
 * This script tests the complete course editing workflow
 */

import { AppDispatch } from '@/redux/store';
import { courseApi } from '@/redux/features/course/courseApi';
import { baseApi } from '@/redux/api/baseApi';
import { toast } from 'sonner';

export interface CacheTestResult {
  success: boolean;
  steps: {
    initialFetch: boolean;
    editSubmission: boolean;
    cacheInvalidation: boolean;
    dataConsistency: boolean;
  };
  timings: {
    totalTime: number;
    editTime: number;
    invalidationTime: number;
  };
  data: {
    originalTitle?: string;
    updatedTitle?: string;
    finalTitle?: string;
  };
  errors: string[];
}

/**
 * Test the cache invalidation workflow
 */
export const testCacheInvalidationWorkflow = async (
  dispatch: AppDispatch,
  courseId: string,
  newTitle: string,
  creatorId?: string
): Promise<CacheTestResult> => {
  const startTime = performance.now();
  const result: CacheTestResult = {
    success: false,
    steps: {
      initialFetch: false,
      editSubmission: false,
      cacheInvalidation: false,
      dataConsistency: false,
    },
    timings: {
      totalTime: 0,
      editTime: 0,
      invalidationTime: 0,
    },
    data: {},
    errors: [],
  };

  try {
    console.log('🧪 Starting cache invalidation test:', { courseId, newTitle, creatorId });

    // Step 1: Initial fetch to get baseline data
    console.log('📋 Step 1: Fetching initial course data...');
    try {
      const initialResponse = await dispatch(
        courseApi.endpoints.getCourseById.initiate(courseId, { forceRefetch: true })
      ).unwrap();
      
      result.data.originalTitle = initialResponse.data?.title;
      result.steps.initialFetch = true;
      console.log('✅ Initial title:', result.data.originalTitle);
    } catch (error) {
      result.errors.push(`Initial fetch failed: ${error}`);
      return result;
    }

    // Step 2: Submit course edit
    console.log('📤 Step 2: Submitting course edit...');
    const editStartTime = performance.now();
    
    try {
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('subtitle', result.data.originalTitle || '');
      formData.append('description', 'Test description');
      formData.append('categoryId', '507f1f77bcf86cd799439011'); // Mock category ID
      formData.append('subcategoryId', '507f1f77bcf86cd799439012'); // Mock subcategory ID
      formData.append('courseLevel', 'Beginner');
      formData.append('status', 'draft');
      formData.append('isPublished', 'false');

      const editResponse = await dispatch(
        courseApi.endpoints.editCourse.initiate({
          id: courseId,
          data: formData,
          creatorId,
        })
      ).unwrap();

      result.data.updatedTitle = editResponse.data?.title;
      result.steps.editSubmission = true;
      
      const editEndTime = performance.now();
      result.timings.editTime = editEndTime - editStartTime;
      
      console.log('✅ Edit completed in', result.timings.editTime.toFixed(2), 'ms');
      console.log('✅ Updated title from API:', result.data.updatedTitle);

    } catch (error) {
      result.errors.push(`Edit submission failed: ${error}`);
      return result;
    }

    // Step 3: Test cache invalidation
    console.log('🔄 Step 3: Testing cache invalidation...');
    const invalidationStartTime = performance.now();
    
    try {
      // Force cache invalidation
      dispatch(baseApi.util.invalidateTags([
        'courses',
        'course',
        { type: 'course', id: courseId },
        { type: 'courses', id: 'LIST' },
        ...(creatorId ? [{ type: 'courses', id: `creator-${creatorId}` }] : []),
      ]));

      // Wait for invalidation to propagate
      await new Promise(resolve => setTimeout(resolve, 200));

      result.steps.cacheInvalidation = true;
      
      const invalidationEndTime = performance.now();
      result.timings.invalidationTime = invalidationEndTime - invalidationStartTime;
      
      console.log('✅ Cache invalidation completed in', result.timings.invalidationTime.toFixed(2), 'ms');

    } catch (error) {
      result.errors.push(`Cache invalidation failed: ${error}`);
      return result;
    }

    // Step 4: Verify data consistency
    console.log('🔍 Step 4: Verifying data consistency...');
    
    try {
      // Fetch fresh data to verify persistence
      const finalResponse = await dispatch(
        courseApi.endpoints.getCourseById.initiate(courseId, { forceRefetch: true })
      ).unwrap();

      result.data.finalTitle = finalResponse.data?.title;
      result.steps.dataConsistency = result.data.finalTitle === newTitle;
      
      console.log('✅ Final title from fresh fetch:', result.data.finalTitle);
      console.log('✅ Data consistency check:', result.steps.dataConsistency ? 'PASS' : 'FAIL');

    } catch (error) {
      result.errors.push(`Data consistency check failed: ${error}`);
      return result;
    }

    // Calculate total time
    const endTime = performance.now();
    result.timings.totalTime = endTime - startTime;

    // Determine overall success
    result.success = Object.values(result.steps).every(step => step === true) && result.errors.length === 0;

    console.log('🏁 Cache invalidation test completed:', {
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
 * Quick test function for browser console
 */
export const quickCacheTest = async (
  dispatch: AppDispatch,
  courseId: string,
  newTitle?: string,
  creatorId?: string
) => {
  const testTitle = newTitle || `Cache Test ${Date.now()}`;
  const result = await testCacheInvalidationWorkflow(dispatch, courseId, testTitle, creatorId);

  if (result.success) {
    toast.success(`Cache invalidation test PASSED! (${result.timings.totalTime.toFixed(2)}ms)`, {
      description: `Title successfully updated to: "${testTitle}"`,
    });
  } else {
    toast.error('Cache invalidation test FAILED!', {
      description: result.errors.join(', '),
    });
  }

  return result;
};

/**
 * Make test functions available globally for browser console debugging
 */
if (typeof window !== 'undefined') {
  (window as any).testCacheInvalidation = {
    testCacheInvalidationWorkflow,
    quickCacheTest,
  };
}

export default {
  testCacheInvalidationWorkflow,
  quickCacheTest,
};
