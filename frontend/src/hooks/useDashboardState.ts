import { useState, useEffect, useMemo } from 'react';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { useGetCoursesQuery } from '@/redux/features/course/courseApi';
import { useDashboardAnalytics } from './useDashboardAnalytics';

interface DashboardState {
  isInitialLoading: boolean;
  isNewTeacher: boolean;
  shouldShowError: boolean;
  hasMinimumLoadTime: boolean;
  isReady: boolean;
}

/**
 * Custom hook to manage dashboard loading states and prevent error flashes
 * Ensures smooth transitions and professional onboarding experience for new teachers
 */
export const useDashboardState = () => {
  const [hasMinimumLoadTime, setHasMinimumLoadTime] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    isFetching: isCoursesFetching,
    error: coursesError,
    refetch: refetchCourses
  } = useGetCoursesQuery(
    { teacherId: teacherId || '', page: 1, limit: 10 },
    { skip: !teacherId }
  );

  const {
    dashboardStats,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useDashboardAnalytics();

  const courses = coursesData?.data?.data || [];

  // Ensure minimum loading time to prevent flashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasMinimumLoadTime(true);
    }, 800); // Minimum 800ms loading time

    return () => clearTimeout(timer);
  }, []);

  // Track when initial load is complete
  useEffect(() => {
    if (!isCoursesLoading && !isAnalyticsLoading && hasMinimumLoadTime) {
      const timer = setTimeout(() => {
        setInitialLoadComplete(true);
      }, 200); // Small delay to ensure smooth transition

      return () => clearTimeout(timer);
    }
  }, [isCoursesLoading, isAnalyticsLoading, hasMinimumLoadTime]);

  // Determine dashboard state
  const dashboardState: DashboardState = useMemo(() => {
    const isInitialLoading = !hasMinimumLoadTime || isCoursesLoading || isAnalyticsLoading;
    
    // Check if this is a new teacher with no data
    const isNewTeacher = initialLoadComplete &&
      courses.length === 0 &&
      (dashboardStats?.totalCourses ?? 0) === 0 &&
      (dashboardStats?.totalStudents ?? 0) === 0 &&
      !coursesError &&
      !analyticsError;

    // Only show error for real API errors after initial load, not for empty data scenarios
    const shouldShowError = initialLoadComplete &&
      !isNewTeacher &&
      (
        (coursesError && (coursesError as any)?.status !== 404 && (coursesError as any)?.status !== 401) ||
        (analyticsError && (analyticsError as any)?.status !== 404 && (analyticsError as any)?.status !== 401)
      );

    const isReady = initialLoadComplete && !shouldShowError;

    return {
      isInitialLoading,
      isNewTeacher,
      shouldShowError,
      hasMinimumLoadTime,
      isReady
    };
  }, [
    hasMinimumLoadTime,
    isCoursesLoading,
    isAnalyticsLoading,
    initialLoadComplete,
    courses.length,
    dashboardStats?.totalCourses,
    dashboardStats?.totalStudents,
    coursesError,
    analyticsError
  ]);

  // Refetch function that handles both courses and analytics
  const refetch = () => {
    refetchCourses();
    refetchAnalytics();
  };

  return {
    // State
    ...dashboardState,
    
    // Data
    courses,
    dashboardStats,
    userData,
    teacherId,
    
    // Loading states
    isCoursesLoading,
    isCoursesFetching,
    isAnalyticsLoading,
    
    // Errors
    coursesError,
    analyticsError,
    
    // Actions
    refetch
  };
};

export default useDashboardState;
