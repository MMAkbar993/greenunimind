import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  BookOpen,
  Download,
  MessageSquare,
  RefreshCw,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

// Redux
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { useGetCreatorCourseQuery } from '@/redux/features/course/courseApi';
import {
  useGetReviewDashboardQuery,
  useGetReviewStatsQuery,
  useGetTeacherReviewsQuery,
} from '@/redux/features/review/reviewApi';

// Components
import DashboardErrorBoundary from '@/components/ErrorBoundary/DashboardErrorBoundary';

const Reviews: React.FC = () => {
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'analytics' | 'insights'>(
    'overview'
  );

  // API queries
  const {
    data: coursesData,
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useGetCreatorCourseQuery({ id: teacherId }, { skip: !teacherId });

  // Review API queries
  const {
    data: reviewStatsData,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useGetReviewStatsQuery({ teacherId: teacherId || '' }, { skip: !teacherId });

  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    refetch: refetchReviews,
  } = useGetTeacherReviewsQuery({ teacherId: teacherId || '', filters: {} }, { skip: !teacherId });

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useGetReviewDashboardQuery({ teacherId: teacherId || '', filters: {} }, { skip: !teacherId });

  // Memoized data
  const courses = useMemo(() => {
    return coursesData?.data || [];
  }, [coursesData]);

  // Real review statistics
  const reviewStats = useMemo(() => {
    if (!reviewStatsData) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentReviews: 0,
        responseRate: 0,
        sentimentScore: 0,
        monthlyGrowth: 0,
        weeklyGrowth: 0,
      };
    }
    return reviewStatsData;
  }, [reviewStatsData]);

  // Real reviews data
  const reviews = useMemo(() => {
    if (!reviewsData?.data) {
      return [];
    }
    return reviewsData.data;
  }, [reviewsData]);

  // Handlers
  const handleTabChange = (tab: 'overview' | 'reviews' | 'analytics' | 'insights') => {
    setActiveTab(tab);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchCourses(), refetchStats(), refetchReviews(), refetchDashboard()]);
      toast.success('Reviews refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh reviews');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Export functionality coming soon');
    } catch (error) {
      toast.error('Failed to export reviews');
    }
  };

  // Loading state
  const isLoading = coursesLoading || isStatsLoading || isReviewsLoading || isDashboardLoading;

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary section="reviews">
      <div className="space-y-6" role="main" aria-label="Reviews dashboard">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
            <p className="text-gray-600 mt-1">Manage and respond to student feedback</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Reviews
              {reviewStats.totalReviews > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Math.round(reviewStats.totalReviews)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isStatsLoading ? '...' : Math.round(reviewStats.totalReviews)}
                      </p>
                      <p className="text-sm text-green-600">
                        {isStatsLoading ? '...' : `+${reviewStats.monthlyGrowth}% this month`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                      <Star className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Rating</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isStatsLoading ? '...' : reviewStats.averageRating.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-500">Out of 5.0 stars</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-100 text-green-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Response Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isStatsLoading ? '...' : `${reviewStats.responseRate}%`}
                      </p>
                      <p className="text-sm text-green-600">
                        {isStatsLoading ? '...' : `+${reviewStats.weeklyGrowth}% this week`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Courses with Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                      <p className="text-sm text-gray-500">Active courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            {/* Reviews List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Once students start taking your courses, their reviews will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map(review => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {review.studentName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{review.studentName}</h4>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'w-4 h-4',
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{review.courseName}</p>
                          <p className="text-gray-800">{review.comment}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm text-gray-500">
                              {review.helpful} people found this helpful
                            </span>
                            <Button variant="outline" size="sm">
                              Respond
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
              <p>Detailed analytics features coming soon</p>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="text-center py-12 text-gray-500">
              <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI-Powered Insights</h3>
              <p>Smart insights and recommendations coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardErrorBoundary>
  );
};

export default Reviews;
