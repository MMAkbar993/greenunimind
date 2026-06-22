import { useMemo } from 'react';

interface ErrorHandlingOptions {
  isLoading?: boolean;
  error?: any;
  data?: any;
  hasData?: boolean;
  isNewUser?: boolean;
}

interface ErrorHandlingResult {
  shouldShowError: boolean;
  shouldShowEmptyState: boolean;
  shouldShowLoading: boolean;
  shouldShowContent: boolean;
  isNewUser: boolean;
  errorMessage?: string;
}

/**
 * Custom hook for comprehensive error handling in dashboard components
 * Distinguishes between real API errors and empty data scenarios for new users
 */
export const useErrorHandling = ({
  isLoading = false,
  error,
  data,
  hasData,
  isNewUser = false
}: ErrorHandlingOptions): ErrorHandlingResult => {
  
  return useMemo(() => {
    // Show loading state
    if (isLoading) {
      return {
        shouldShowError: false,
        shouldShowEmptyState: false,
        shouldShowLoading: true,
        shouldShowContent: false,
        isNewUser: false
      };
    }

    // Determine if we have actual data
    const actuallyHasData = hasData !== undefined 
      ? hasData 
      : (Array.isArray(data) ? data.length > 0 : !!data);

    // Check if this is a real API error (not just empty data)
    const isRealError = error && 
      (error as any)?.status !== 404 && 
      (error as any)?.status !== 401 &&
      (error as any)?.status !== 204; // No content

    // Determine if this is a new user scenario
    const isNewUserScenario = isNewUser || (!actuallyHasData && !isRealError);

    // Show error only for real API errors, not for empty data scenarios
    if (isRealError && !isNewUserScenario) {
      return {
        shouldShowError: true,
        shouldShowEmptyState: false,
        shouldShowLoading: false,
        shouldShowContent: false,
        isNewUser: false,
        errorMessage: getErrorMessage(error)
      };
    }

    // Show empty state for new users or when there's no data (but no real error)
    if (isNewUserScenario || (!actuallyHasData && !isRealError)) {
      return {
        shouldShowError: false,
        shouldShowEmptyState: true,
        shouldShowLoading: false,
        shouldShowContent: false,
        isNewUser: isNewUserScenario
      };
    }

    // Show content when we have data and no errors
    return {
      shouldShowError: false,
      shouldShowEmptyState: false,
      shouldShowLoading: false,
      shouldShowContent: true,
      isNewUser: false
    };
  }, [isLoading, error, data, hasData, isNewUser]);
};

/**
 * Extract user-friendly error message from error object
 */
const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  // Default error messages based on status codes
  switch (error?.status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Hook specifically for dashboard analytics error handling
 */
export const useAnalyticsErrorHandling = (
  isLoading: boolean,
  error: any,
  dashboardStats: any
) => {
  const isNewTeacher = !isLoading &&
    dashboardStats?.totalCourses === 0 &&
    dashboardStats?.totalStudents === 0;

  return useErrorHandling({
    isLoading,
    error,
    data: dashboardStats,
    hasData: dashboardStats?.totalCourses > 0 || dashboardStats?.totalStudents > 0,
    isNewUser: isNewTeacher
  });
};

/**
 * Hook specifically for activity feed error handling
 */
export const useActivityErrorHandling = (
  isLoading: boolean,
  error: any,
  activities: any[]
) => {
  return useErrorHandling({
    isLoading,
    error,
    data: activities,
    hasData: activities?.length > 0,
    isNewUser: !isLoading && activities?.length === 0 && !error
  });
};

/**
 * Hook specifically for messages error handling
 */
export const useMessagesErrorHandling = (
  isLoading: boolean,
  error: any,
  messages: any[]
) => {
  return useErrorHandling({
    isLoading,
    error,
    data: messages,
    hasData: messages?.length > 0,
    isNewUser: !isLoading && messages?.length === 0 && !error
  });
};

/**
 * Hook specifically for courses error handling
 */
export const useCoursesErrorHandling = (
  isLoading: boolean,
  error: any,
  courses: any[]
) => {
  return useErrorHandling({
    isLoading,
    error,
    data: courses,
    hasData: courses?.length > 0,
    isNewUser: !isLoading && courses?.length === 0 && !error
  });
};

export default useErrorHandling;
