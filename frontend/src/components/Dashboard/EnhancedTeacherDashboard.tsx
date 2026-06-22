import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';
import { useAnalyticsErrorHandling } from '@/hooks/useErrorHandling';
import { useTeacherDashboardCache } from '@/hooks/useTeacherDashboardCache';
import { cn } from '@/lib/utils';
import { useGetRecentActivitiesQuery } from '@/redux/features/analytics/analyticsApi';
import { useGetCreatorCourseQuery } from '@/redux/features/course/courseApi';
import {
  useCheckStripeAccountStatusQuery,
  useCreateAccountLinkMutation,
  useCreatePayoutRequestMutation,
  useCreateStripeAccountMutation,
  useGetTeacherEarningsQuery,
  useGetUpcomingPayoutQuery,
} from '@/redux/features/payment/payment.api';
import { toast } from '@/utils/toast';
import {
  AlertCircle,
  Award,
  BookOpen,
  DollarSign,
  PlayCircle,
  Plus,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { RecentActivityCard, RecentCoursesCard } from '@/components/Dashboard/ModernContentCards';
import { TeacherQuickActions } from '@/components/Dashboard/ModernQuickActions';
import { ModernStatsGrid } from '@/components/Dashboard/ModernStatsGrid';
import { DashboardWelcomeState } from '@/components/EmptyStates/TeacherEmptyStates';
import DashboardErrorBoundary from '@/components/ErrorBoundary/DashboardErrorBoundary';
import RealTimeErrorBoundary from '@/components/ErrorBoundary/RealTimeErrorBoundary';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useValidatedTeacherId } from '@/hooks/useValidatedTeacherId';

// Lazy load heavy components for better navigation performance
const RecentActivity = lazy(() => import('@/components/Dashboard/RecentActivity'));
const StripeConnectStatus = lazy(() => import('@/components/Dashboard/StripeConnectStatus'));
const FinancialSummary = lazy(() => import('@/components/Dashboard/FinancialSummary'));
const StripeOnboardingModal = lazy(() => import('@/components/Stripe/StripeOnboardingModal'));

const EnhancedTeacherDashboard = () => {
  const { teacherId, isValidTeacherId, shouldSkipQuery, isUserLoading, userData } =
    useValidatedTeacherId();

  // Modal state
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshingFinancials, setIsRefreshingFinancials] = useState(false);

  // Standard dashboard state management
  const [dashboardState, setDashboardState] = useState({
    courses: [],
    lectures: {},
    stats: {
      totalCourses: 0,
      totalLectures: 0,
      totalStudents: 0,
      totalEarnings: 0,
      lastUpdated: new Date(),
    },
    isLoading: false,
    error: null,
  });

  // Optimized queries with better caching and stale time - MOVED BEFORE CALLBACKS
  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    isFetching: isCoursesFetching,
    refetch: refetchCourses,
  } = useGetCreatorCourseQuery(
    { id: teacherId },
    {
      skip: shouldSkipQuery,
      refetchOnFocus: false,
    }
  );

  // Use the analytics hook for real-time dashboard data - MOVED BEFORE CALLBACKS
  const {
    dashboardStats,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useDashboardAnalytics();

  // Recent activities query for real data
  const {
    data: recentActivitiesData,
    isLoading: isActivitiesLoading,
    refetch: refetchActivities,
  } = useGetRecentActivitiesQuery(
    { teacherId: teacherId || '', page: 1, limit: 5 },
    {
      skip: shouldSkipQuery,
      refetchOnFocus: false,
    }
  );

  // Manual refresh function - MOVED AFTER ALL QUERY DECLARATIONS
  const refreshDashboard = useCallback(async () => {
    try {
      // Trigger refetch of all queries
      await Promise.all([refetchCourses(), refetchAnalytics(), refetchActivities()]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }, [refetchCourses, refetchAnalytics, refetchActivities]);

  // Initialize dashboard on mount
  const initializeDashboard = useCallback((data?: any) => {
    if (data) {
      setDashboardState(prevState => ({
        ...prevState,
        courses: data.courses || [],
        stats: data.stats || prevState.stats,
        isLoading: false,
        error: null,
      }));
    }
    setIsInitialLoad(false);
  }, []);

  // Cache management for real-time data updates
  const { invalidateCache, forceRefresh, manualRefresh } = useTeacherDashboardCache({
    teacherId: teacherId || '',
    enableAutoRefresh: true,
    autoRefreshInterval: 300000, // 5 minutes
    invalidateOnMount: true,
    invalidateOnNavigation: true,
    section: 'overview',
  });

  // Stripe-related queries with optimized settings
  const {
    data: stripeStatus,
    isLoading: isStripeStatusLoading,
    refetch: refetchStripeStatus,
  } = useCheckStripeAccountStatusQuery(undefined, {
    skip: shouldSkipQuery,
    refetchOnFocus: false,
  });

  const {
    data: upcomingPayout,
    isLoading: isUpcomingPayoutLoading,
    refetch: refetchUpcomingPayout,
  } = useGetUpcomingPayoutQuery(teacherId, {
    skip: shouldSkipQuery,
    refetchOnFocus: false,
  });

  const {
    data: teacherEarnings,
    isLoading: isEarningsLoading,
    refetch: refetchEarnings,
  } = useGetTeacherEarningsQuery(teacherId, {
    skip: shouldSkipQuery,
    refetchOnFocus: false,
  });

  // Stripe mutations
  const [createAccountLink, { isLoading: isCreatingOnboardingLink }] =
    useCreateAccountLinkMutation();
  const [createStripeAccount, { isLoading: isCreatingStripeAccount }] =
    useCreateStripeAccountMutation();
  const [createPayoutRequest, { isLoading: isCreatingPayout }] = useCreatePayoutRequestMutation();

  // Analytics hook moved above - this is a duplicate that needs to be removed

  // Use comprehensive error handling for analytics
  const { isNewUser: isNewTeacher } = useAnalyticsErrorHandling(
    isAnalyticsLoading,
    analyticsError,
    dashboardStats
  );

  // Performance monitoring
  const { measureApiCall, recordError } = usePerformanceMonitoring({
    enableWebVitals: true,
    enableResourceMonitoring: true,
    onThresholdExceeded: (metric, value, threshold) => {
      console.warn(
        `Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`
      );
    },
  });

  const courses = useMemo(() => coursesData?.data || [], [coursesData?.data]);

  // Initialize dashboard with fetched data
  useEffect(() => {
    if (coursesData?.data && dashboardStats) {
      // Calculate actual total lectures from courses data
      const totalLectures = coursesData.data.reduce((total, course) => {
        return total + (course.lectures?.length || 0);
      }, 0);

      const dashboardData = {
        courses: coursesData.data,
        stats: {
          totalCourses: coursesData.data.length,
          totalLectures: totalLectures, // Use actual calculated lectures count
          totalStudents: dashboardStats.totalStudents || 0,
          totalEarnings: dashboardStats.totalEarnings || 0,
          lastUpdated: new Date(),
        },
      };
      initializeDashboard(dashboardData);
    }
  }, [
    coursesData?.data,
    dashboardStats?.totalStudents,
    dashboardStats?.totalEarnings,
    initializeDashboard,
  ]);

  // Handle initial load completion for better navigation performance
  useEffect(() => {
    if (!isUserLoading && !isCoursesLoading && !isAnalyticsLoading && isInitialLoad) {
      // Mark initial load as complete after a short delay to ensure smooth rendering
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
        // Removed automatic toast notification for cleaner UX
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isUserLoading, isCoursesLoading, isAnalyticsLoading, isInitialLoad]);

  // Combine loading states
  const isLoading = isCoursesLoading || isAnalyticsLoading || isStripeStatusLoading;
  const isConnectingStripe = isCreatingOnboardingLink || isCreatingStripeAccount;

  // Determine if user is truly new
  const isTrulyNewTeacher = useMemo(() => {
    return (
      !isLoading &&
      courses.length === 0 &&
      (dashboardStats?.totalStudents ?? 0) === 0 &&
      (dashboardStats?.totalEarnings ?? 0) === 0 &&
      !stripeStatus?.data?.isConnected
    );
  }, [
    isLoading,
    courses.length,
    dashboardStats?.totalStudents,
    dashboardStats?.totalEarnings,
    stripeStatus?.data?.isConnected,
  ]);

  const isError = isCoursesError || analyticsError;
  const isFetching = isCoursesFetching;

  // Combined refetch function with performance monitoring and cache invalidation
  const refetch = async () => {
    // Use the new cache management for real-time data updates
    await manualRefresh(
      () => {
        // Silent refresh - no loading toast to reduce visual clutter
      },
      () => {
        // Silent success - no success toast to reduce visual clutter
      }
    );

    // Also refetch other non-cached data
    const endMeasurement = measureApiCall('dashboard-refresh');
    try {
      await Promise.all([refetchCourses(), refetchAnalytics(), refetchStripeStatus()]);
      await refreshDashboard();
      endMeasurement();
    } catch (error) {
      recordError(error as Error);
      endMeasurement();
      // Only show error toasts for critical failures, not routine refreshes
      console.error('Dashboard refresh failed:', error);
    }
  };

  // Enhanced statistics cards with real-time data and performance optimization
  const statsCards = useMemo(
    () => [
      {
        title: 'Total Courses',
        value: (dashboardState.stats?.totalCourses ?? 0).toString(),
        icon: <BookOpen className="w-6 h-6" />,
        change: `${dashboardStats?.publishedCourses ?? 0} published, ${dashboardStats?.draftCourses ?? 0} drafts`,
        trend: (dashboardStats?.coursesGrowth ?? 0) >= 0 ? 'up' : 'down',
        percentage: `${(dashboardStats?.coursesGrowth ?? 0) >= 0 ? '+' : ''}${
          dashboardStats?.coursesGrowth ?? 0
        }%`,
        color: 'bg-brand-primary',
        lightColor: 'bg-brand-accent',
        textColor: 'text-brand-primary',
        realTimeValue: dashboardState.stats?.totalCourses ?? 0,
      },
      {
        title: 'Total Students',
        value: (dashboardState.stats?.totalStudents ?? 0).toLocaleString(),
        icon: <Users className="w-6 h-6" />,
        change: `+${dashboardStats?.newStudentsThisMonth ?? 0} this month`,
        trend: (dashboardStats?.studentsGrowth ?? 0) >= 0 ? 'up' : 'down',
        percentage: `${
          (dashboardStats?.studentsGrowth ?? 0) >= 0 ? '+' : ''
        }${(dashboardStats?.studentsGrowth ?? 0).toFixed(1)}%`,
        color: 'bg-brand-secondary',
        lightColor: 'bg-green-50',
        textColor: 'text-brand-secondary',
        realTimeValue: dashboardState.stats?.totalStudents ?? 0,
      },
      {
        title: 'Total Earnings',
        value: `$${(dashboardState.stats?.totalEarnings ?? 0).toLocaleString()}`,
        icon: <DollarSign className="w-6 h-6" />,
        change: `$${(dashboardStats?.monthlyEarnings ?? 0).toLocaleString()} this month`,
        trend: (dashboardStats?.earningsGrowth ?? 0) >= 0 ? 'up' : 'down',
        percentage: `${
          (dashboardStats?.earningsGrowth ?? 0) >= 0 ? '+' : ''
        }${(dashboardStats?.earningsGrowth ?? 0).toFixed(1)}%`,
        color: 'bg-yellow-500',
        lightColor: 'bg-yellow-50',
        textColor: 'text-yellow-600',
        realTimeValue: dashboardState.stats?.totalEarnings ?? 0,
      },
      {
        title: 'Course Rating',
        value: `${(dashboardStats?.avgRating ?? 0).toFixed(1)}/5`,
        icon: <Star className="w-6 h-6" />,
        change: `${dashboardStats?.totalReviews ?? 0} total reviews`,
        trend: (dashboardStats?.ratingGrowth ?? 0) >= 0 ? 'up' : 'down',
        percentage: `${(dashboardStats?.ratingGrowth ?? 0) >= 0 ? '+' : ''}${dashboardStats?.ratingGrowth ?? 0}%`,
        color: 'bg-purple-500',
        lightColor: 'bg-purple-50',
        textColor: 'text-purple-600',
      },
      {
        title: 'Total Lectures',
        value: (dashboardState.stats?.totalLectures ?? 0).toString(),
        icon: <PlayCircle className="w-6 h-6" />,
        change: 'Across all courses',
        trend: (dashboardStats?.coursesGrowth ?? 0) >= 0 ? 'up' : 'down',
        percentage: `${
          (dashboardStats?.coursesGrowth ?? 0) >= 0 ? '+' : ''
        }${(dashboardStats?.coursesGrowth ?? 0).toFixed(1)}%`,
        color: 'bg-indigo-500',
        lightColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
        realTimeValue: dashboardState.stats?.totalLectures ?? 0,
      },
      {
        title: 'Performance Score',
        value: dashboardStats?.performanceScore ?? 'N/A',
        icon: <Award className="w-6 h-6" />,
        change: 'Based on student feedback',
        trend:
          dashboardStats?.performanceScore === 'Excellent' ||
          dashboardStats?.performanceScore === 'Good'
            ? 'up'
            : 'down',
        percentage:
          dashboardStats?.performanceScore === 'Excellent'
            ? '+5%'
            : dashboardStats?.performanceScore === 'Good'
            ? '+2%'
            : '0%',
        color: 'bg-emerald-500',
        lightColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
      },
    ],
    [dashboardStats, dashboardState.stats]
  );

  // Enhanced loading state with better UX
  if (
    isInitialLoad &&
    (isUserLoading || (isLoading && !coursesData && !(dashboardStats?.totalCourses ?? 0)))
  ) {
    return <EnhancedDashboardSkeleton />;
  }

  // Enhanced error handling with retry mechanism
  if (isError && !isNewTeacher) {
    return (
      <DashboardErrorBoundary section="dashboard">
        <div className="flex justify-center items-center min-h-[50vh] p-4">
          <div className="text-center space-y-4 max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">Unable to Load Dashboard</h3>
            <p className="text-red-500 font-medium">
              {analyticsError ? 'Analytics service unavailable' : 'Course data service unavailable'}
            </p>
            <p className="text-gray-600 text-sm">
              {analyticsError
                ? "We're having trouble loading your analytics data. This might be a temporary issue."
                : "We're having trouble loading your course data. Please check your connection and try again."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={refetch} className="flex items-center gap-2" disabled={isFetching}>
                <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
                {isFetching ? 'Retrying...' : 'Try Again'}
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary section="dashboard">
      <RealTimeErrorBoundary
        enableRetry={true}
        maxRetries={3}
        onError={(error, errorInfo) => {
          recordError(error);
          console.error('Real-time dashboard error:', error, errorInfo);
        }}
      >
        <main
          className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 transition-all duration-300 ease-in-out"
          role="main"
          aria-label="Teacher Dashboard"
        >
          <div className="max-w-7xl mx-auto space-y-4 xs:space-y-5 sm:space-y-6 md:space-y-7 lg:space-y-8 focus-within:outline-none">
            {/* Show welcome state only for truly new teachers */}
            {isTrulyNewTeacher && <DashboardWelcomeState className="mb-6 sm:mb-8" />}

            {/* Enhanced Responsive Header Section */}
            <header
              className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 lg:gap-6"
              role="banner"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                  Welcome back, {userData?.data?.name?.firstName || 'Teacher'}! 👋
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <p className="text-gray-600 text-xs xs:text-sm sm:text-base lg:text-lg">
                    {isTrulyNewTeacher
                      ? "Ready to start your teaching journey? Let's create your first course!"
                      : "Here's what's happening with your courses today."}
                  </p>
                  {/* Real-time connection indicator */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={cn('w-2 h-2 rounded-full animate-pulse', 'bg-green-500')} />
                    <span className="text-xs text-gray-500 font-medium">Live Updates</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      • Updated {dashboardState.stats?.lastUpdated?.toLocaleTimeString() ?? '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 w-full xs:w-auto lg:w-auto">
                {/* Refresh Button - Enhanced with accessibility and touch targets */}
                <Button
                  variant="outline"
                  onClick={refetch}
                  disabled={isFetching || isAnalyticsLoading}
                  className="flex items-center justify-center gap-2 hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-all duration-200 text-xs xs:text-sm min-h-[44px] px-4"
                  aria-label={
                    isFetching || isAnalyticsLoading
                      ? 'Refreshing dashboard data'
                      : 'Refresh dashboard data'
                  }
                >
                  <RefreshCw
                    className={cn(
                      'w-3 h-3 xs:w-4 xs:h-4',
                      (isFetching || isAnalyticsLoading) && 'animate-spin'
                    )}
                    aria-hidden="true"
                  />
                  <span className="hidden xs:inline">
                    {isFetching || isAnalyticsLoading ? 'Refreshing...' : 'Refresh'}
                  </span>
                  <span className="xs:hidden">Refresh</span>
                </Button>
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium text-xs xs:text-sm min-h-[44px] px-4"
                >
                  <Link
                    to="/teacher/courses/create"
                    className="flex items-center justify-center gap-2"
                    aria-label="Create a new course"
                  >
                    <Plus className="w-3 h-3 xs:w-4 xs:h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Create New Course</span>
                    <span className="sm:hidden">Create Course</span>
                  </Link>
                </Button>
              </div>
            </header>

            {/* Modern Statistics Grid with Enterprise Design */}
            <section
              aria-labelledby="stats-heading"
              className="space-y-4 animate-in fade-in-50 duration-500"
            >
              <h2 id="stats-heading" className="sr-only">
                Dashboard Statistics
              </h2>
              <DashboardErrorBoundary section="analytics">
                <ModernStatsGrid
                  stats={{
                    totalCourses: dashboardState.stats?.totalCourses ?? 0,
                    totalStudents: dashboardState.stats?.totalStudents ?? 0,
                    totalEarnings: dashboardState.stats?.totalEarnings ?? 0,
                    totalLectures: dashboardState.stats?.totalLectures ?? 0,
                    avgRating: dashboardStats?.avgRating || 0,
                    totalReviews: dashboardStats?.totalReviews || 0,
                    publishedCourses: dashboardStats?.publishedCourses || 0,
                    draftCourses: dashboardStats?.draftCourses || 0,
                    newStudentsThisMonth: dashboardStats?.newStudentsThisMonth || 0,
                    monthlyEarnings: dashboardStats?.monthlyEarnings || 0,
                    coursesGrowth: dashboardStats?.coursesGrowth || 0,
                    studentsGrowth: dashboardStats?.studentsGrowth || 0,
                    earningsGrowth: dashboardStats?.earningsGrowth || 0,
                    ratingGrowth: dashboardStats?.ratingGrowth || 0,
                    performanceScore: dashboardStats?.performanceScore || 'N/A',
                  }}
                  isLoading={isAnalyticsLoading}
                  onStatClick={statId => {
                    // Navigate to relevant section based on stat clicked
                    switch (statId) {
                      case 'courses':
                        window.location.href = '/teacher/courses';
                        break;
                      case 'students':
                        window.location.href = '/teacher/students';
                        break;
                      case 'earnings':
                        window.location.href = '/teacher/earnings';
                        break;
                      case 'reviews':
                        window.location.href = '/teacher/analytics';
                        break;
                      case 'lectures':
                        window.location.href = '/teacher/courses';
                        break;
                      case 'performance':
                        window.location.href = '/teacher/analytics';
                        break;
                    }
                  }}
                />
              </DashboardErrorBoundary>
            </section>

            {/* Stripe Connect Status with Suspense */}
            <Suspense
              fallback={
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-64 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <StripeConnectStatus
                stripeStatus={{
                  isConnected: !!stripeStatus?.data?.isConnected,
                  isVerified: !!stripeStatus?.data?.isVerified,
                  onboardingComplete: !!stripeStatus?.data?.onboardingComplete,
                  requirements: stripeStatus?.data?.requirements || [],
                  accountId: stripeStatus?.data?.accountId,
                }}
                isLoading={isStripeStatusLoading}
                onConnectStripe={() => setIsOnboardingModalOpen(true)}
                onCompleteOnboarding={() => setIsOnboardingModalOpen(true)}
                isConnecting={isConnectingStripe}
              />
            </Suspense>

            {/* Financial Summary with Suspense */}
            {stripeStatus?.data?.isConnected && (
              <Suspense
                fallback={
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </CardContent>
                  </Card>
                }
              >
                <FinancialSummary
                  earnings={teacherEarnings?.data}
                  upcomingPayout={upcomingPayout?.data}
                  isLoading={isEarningsLoading || isUpcomingPayoutLoading}
                  onRefresh={async () => {
                    setIsRefreshingFinancials(true);
                    await manualRefresh();
                    setIsRefreshingFinancials(false);
                  }}
                  isRefreshing={isRefreshingFinancials}
                  onRequestPayout={async () => {
                    if (!teacherId || !upcomingPayout?.data?.amount) return;
                    try {
                      await createPayoutRequest({
                        teacherId,
                        amount: upcomingPayout.data.amount,
                      }).unwrap();
                      // Invalidate financial cache for real-time updates
                      invalidateCache({ financials: true, payouts: true });
                    } catch (error) {
                      console.error('Failed to request payout:', error);
                    }
                  }}
                  isRequestingPayout={isCreatingPayout}
                  stripeConnected={!!stripeStatus?.data?.isConnected}
                />
              </Suspense>
            )}

            {/* Modern Quick Actions & Content Cards */}
            <section
              aria-labelledby="actions-heading"
              className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-200"
            >
              <h2 id="actions-heading" className="sr-only">
                Quick Actions and Recent Activity
              </h2>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Modern Quick Actions */}
                <div className="md:col-span-1 lg:col-span-1">
                  <TeacherQuickActions
                    isStripeConnected={!!stripeStatus?.data?.isConnected}
                    isConnectingStripe={isConnectingStripe}
                    upcomingPayoutAmount={upcomingPayout?.data?.amount}
                    onRequestPayout={async () => {
                      if (!teacherId || !upcomingPayout?.data?.amount) return;
                      try {
                        await createPayoutRequest({
                          teacherId,
                          amount: upcomingPayout.data.amount,
                        }).unwrap();
                        // Invalidate financial cache for real-time updates
                        invalidateCache({ financials: true, payouts: true });
                      } catch (error) {
                        console.error('Failed to request payout:', error);
                      }
                    }}
                    onConnectStripe={() => setIsOnboardingModalOpen(true)}
                  />
                </div>

                {/* Modern Recent Activity Card */}
                <RecentActivityCard
                  activities={
                    recentActivitiesData?.data?.data?.map(activity => ({
                      id: activity._id,
                      type: activity.type,
                      title: activity.title,
                      description: activity.description,
                      timestamp: activity.createdAt,
                      metadata: activity.metadata,
                    })) || []
                  }
                  isLoading={isActivitiesLoading}
                  className="md:col-span-1 lg:col-span-2"
                  maxItems={5}
                />
              </div>
            </section>

            {/* Recent Courses Overview */}
            <section
              aria-labelledby="courses-heading"
              className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-300"
            >
              <h2 id="courses-heading" className="sr-only">
                Recent Courses
              </h2>
              <RecentCoursesCard
                courses={courses.slice(0, 5).map(course => ({
                  _id: course._id,
                  title: course.title,
                  status: course.status as 'published' | 'draft',
                  updatedAt: course.updatedAt,
                  createdAt: course.createdAt,
                  enrollmentCount: course.enrollmentCount || 0,
                  rating: course.rating || 0,
                  lectureCount: course.lectures?.length || 0,
                  thumbnail: course.thumbnail,
                }))}
                isLoading={isCoursesLoading}
                maxItems={5}
              />
            </section>

            {/* Stripe Onboarding Modal with Suspense */}
            {isOnboardingModalOpen && (
              <Suspense fallback={null}>
                <StripeOnboardingModal
                  isOpen={isOnboardingModalOpen}
                  onClose={() => setIsOnboardingModalOpen(false)}
                  onStartOnboarding={async () => {
                    if (!teacherId || !userData?.data?.email) return;

                    try {
                      const hasStripeAccount = stripeStatus?.data?.accountId;

                      if (!hasStripeAccount) {
                        await createStripeAccount({
                          type: 'express',
                          country: 'US',
                          email: userData.data.email,
                          business_type: 'individual',
                        }).unwrap();

                        await refetchStripeStatus();
                      }

                      const currentUrl = window.location.origin;
                      const result = await createAccountLink({
                        type: 'account_onboarding',
                        refreshUrl: `${currentUrl}/teacher/stripe-connect-status?success=false&reason=refresh`,
                        returnUrl: `${currentUrl}/teacher/stripe-connect-status?success=true`,
                      }).unwrap();

                      if (result.data?.url) {
                        toast.success('Redirecting to Stripe onboarding...', {
                          duration: 2000,
                        });
                        setTimeout(() => {
                          window.location.href = result.data.url;
                        }, 500);
                        setIsOnboardingModalOpen(false);
                      } else {
                        throw new Error('No onboarding URL received from Stripe');
                      }
                    } catch (error: any) {
                      console.error('Failed to start Stripe onboarding:', error);
                      let errorMessage = 'Failed to start onboarding process';
                      if (error?.status === 400) {
                        errorMessage =
                          error?.data?.message ||
                          'Invalid request. Please check your account details.';
                      } else if (error?.status === 401) {
                        errorMessage = 'Authentication required. Please log in again.';
                      } else if (error?.status === 409) {
                        errorMessage = 'You already have a Stripe account connected.';
                      } else if (error?.status >= 500) {
                        errorMessage = 'Server error. Please try again in a few moments.';
                      } else if (error?.data?.message) {
                        errorMessage = error.data.message;
                      }
                      toast.error(errorMessage, {
                        duration: 5000,
                      });
                    }
                  }}
                  isLoading={isConnectingStripe}
                  stripeStatus={{
                    isConnected: !!stripeStatus?.data?.isConnected,
                    isVerified: !!stripeStatus?.data?.isVerified,
                    onboardingComplete: !!stripeStatus?.data?.onboardingComplete,
                    requirements: stripeStatus?.data?.requirements || [],
                  }}
                />
              </Suspense>
            )}
          </div>
        </main>
      </RealTimeErrorBoundary>
    </DashboardErrorBoundary>
  );
};

// Enhanced skeleton components
const EnhancedCourseTableSkeleton = () => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(index => (
          <div key={index} className="dashboard-card border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-full max-w-[200px] mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-18" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EnhancedDashboardSkeleton = () => {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-10 w-80 mb-2" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-64" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Enhanced Stats Cards Skeleton */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(index => (
            <Card key={index} className="dashboard-stat-card border-0 shadow-md">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stripe Connect Skeleton */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-5 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Analytics Skeleton */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1 border-0 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map(index => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(index => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Course Management Skeleton */}
        <Card className="dashboard-card border-0 shadow-lg">
          <CardHeader className="dashboard-card-header border-b bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EnhancedCourseTableSkeleton />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default EnhancedTeacherDashboard;
