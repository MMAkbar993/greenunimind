import { AnalyticsEmptyState } from '@/components/EmptyStates/TeacherEmptyStates';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useValidatedTeacherId } from '@/hooks/useValidatedTeacherId';
import { cn } from '@/lib/utils';
import {
  useGetAnalyticsInsightsQuery,
  useGetDashboardSummaryQuery,
  useGetEnrollmentStatisticsQuery,
  useGetPerformanceMetricsQuery,
  useGetRecentActivitiesQuery,
} from '@/redux/features/analytics/analyticsApi';
import { AnalyticsFilters } from '@/types/analytics';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle,
  DollarSign,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

interface AnalyticsOverviewProps {
  filters: AnalyticsFilters;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ filters }) => {
  const { teacherId, isValidTeacherId, shouldSkipQuery } = useValidatedTeacherId();

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useGetDashboardSummaryQuery(teacherId || '', {
    skip: shouldSkipQuery,
  });

  const { data: activitiesData, isLoading: isActivitiesLoading } = useGetRecentActivitiesQuery(
    { teacherId: teacherId || '', page: 1, limit: 10 },
    { skip: shouldSkipQuery }
  );

  const { data: insightsData, isLoading: isInsightsLoading } = useGetAnalyticsInsightsQuery(
    { teacherId: teacherId || '', limit: 5 },
    { skip: shouldSkipQuery }
  );

  const { data: enrollmentData, isLoading: isEnrollmentLoading } = useGetEnrollmentStatisticsQuery(
    { teacherId: teacherId || '', filters: filters },
    { skip: shouldSkipQuery }
  );

  const { data: performanceData, isLoading: isPerformanceLoading } = useGetPerformanceMetricsQuery(
    { teacherId: teacherId || '', filters: filters },
    { skip: shouldSkipQuery }
  );

  const dashboard = dashboardData?.data;
  const activities = activitiesData?.data?.data || [];
  const insights = insightsData?.data || [];
  const enrollmentStats = enrollmentData?.data;
  const performanceStats = performanceData?.data;

  // Real enrollment trend data from API
  const enrollmentTrendData = React.useMemo(() => {
    if (!enrollmentStats?.enrollmentTrend) {
      return [];
    }
    return enrollmentStats.enrollmentTrend.map(item => ({
      month: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
      enrollments: item.count,
      revenue: item.count * 50, // Approximate revenue calculation
    }));
  }, [enrollmentStats]);

  // Real course performance data from API
  const coursePerformanceData = React.useMemo(() => {
    if (!performanceStats?.coursePerformance) {
      return [];
    }
    return performanceStats.coursePerformance.map(course => ({
      name: course.courseName || course.courseId,
      students: course.totalStudents || 0,
      completion: course.completionRate || 0,
      rating: course.averageRating || 0,
    }));
  }, [performanceStats]);

  const chartConfig = {
    enrollments: {
      label: 'Enrollments',
      color: 'hsl(var(--chart-1))',
    },
    revenue: {
      label: 'Revenue',
      color: 'hsl(var(--chart-2))',
    },
    completion: {
      label: 'Completion Rate',
      color: 'hsl(var(--chart-3))',
    },
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'course_published':
        return <BookOpen className="h-4 w-4 text-green-500" />;
      case 'review_received':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'payment_received':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'achievement':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTrend = (value: number) => {
    const isPositive = value > 0;
    return (
      <div
        className={cn(
          'flex items-center gap-1 text-sm',
          isPositive ? 'text-green-600' : 'text-red-600'
        )}
      >
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        <span>{Math.abs(value)}%</span>
      </div>
    );
  };

  if (isDashboardLoading || isEnrollmentLoading || isPerformanceLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  // Check if this is a new teacher with no data (show empty state instead of error)
  const isNewTeacher =
    !dashboard?.overview?.totalCourses && !dashboard?.overview?.totalStudents && !dashboardError;

  // Only show error for real API errors, not for empty data scenarios
  const shouldShowError =
    dashboardError &&
    (dashboardError as any)?.status !== 404 &&
    (dashboardError as any)?.status !== 401 &&
    !isNewTeacher;

  if (shouldShowError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
          <p className="text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (isNewTeacher || !dashboard) {
    return (
      <div className="space-y-6">
        <AnalyticsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.overview.totalStudents.toLocaleString()}
            </div>
            {formatTrend(12)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboard.overview.totalRevenue.toLocaleString()}
            </div>
            {formatTrend(8)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.overview.totalCourses}</div>
            {formatTrend(5)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.overview.averageRating.toFixed(1)}</div>
            {formatTrend(2)}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="enrollments"
                    stroke="var(--color-enrollments)"
                    fill="var(--color-enrollments)"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coursePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completion" fill="var(--color-completion)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity._id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {activity.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs">
                        High
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Analytics Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {insights.map(insight => (
                  <div key={insight.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                      <p className="text-sm text-gray-600">{insight.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={
                            insight.impact === 'high'
                              ? 'destructive'
                              : insight.impact === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {insight.impact} impact
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {insight.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
