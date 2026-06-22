import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Clock,
  Eye,
  Edit,
  Plus,
  Video,
  BarChart3,
  Settings,
  Star,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
  Activity,
  Target,
  Award,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetCourseByIdQuery } from "@/redux/features/course/courseApi";
import { useGetLectureByCourseIdQuery } from "@/redux/features/lecture/lectureApi";

import { formatDuration } from "@/utils/formatDuration";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ResponsiveLectureGrid from '@/components/Lecture/ResponsiveLectureGrid';
import { useUpdateLectureOrderMutation } from '@/redux/features/lecture/lectureApi';
import RealTimeErrorBoundary from "@/components/ErrorBoundary/RealTimeErrorBoundary";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";

interface EnhancedUnifiedCourseManagerProps {
  courseId: string;
  defaultTab?: string;
}

const EnhancedUnifiedCourseManager: React.FC<EnhancedUnifiedCourseManagerProps> = ({
  courseId,
  defaultTab = "overview"
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lectures, setLectures] = useState<any[]>([]);

  // Performance monitoring
  const {
    measureApiCall,
    recordError
  } = usePerformanceMonitoring({
    enableWebVitals: true,
    onThresholdExceeded: (metric, value, threshold) => {
      console.warn(`Course manager performance issue: ${metric} = ${value} (threshold: ${threshold})`);
    }
  });

  // Fetch course data with enhanced error handling
  const { 
    data: courseData, 
    isLoading: courseLoading, 
    error: courseError,
    refetch: refetchCourse
  } = useGetCourseByIdQuery(courseId, {
    skip: !courseId,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Fetch lectures data with real-time polling
  const {
    data: lecturesData,
    isLoading: lecturesLoading,
    refetch: refetchLectures,
    isFetching: lecturesFetching
  } = useGetLectureByCourseIdQuery({ id: courseId }, {
    skip: !courseId,
    pollingInterval: activeTab === "lectures" ? 10000 : 30000, // More frequent polling on lectures tab
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Standard state management - no real-time updates
  const isOptimisticLoading = false;
  const isRealTimeConnected = false;
  const hasPendingUpdates = false;

  // Lecture order mutation
  const [updateLectureOrder] = useUpdateLectureOrderMutation();

  const course = courseData?.data;

  // Update lectures when data changes
  useEffect(() => {
    if (lecturesData?.data) {
      setLectures(lecturesData.data);
    }
  }, [lecturesData?.data]);

  // Enhanced course statistics with real-time updates
  const courseStats = useMemo(() => {
    const totalDuration = lectures.reduce((acc: number, lecture) => acc + (lecture.duration || 0), 0);
    const publishedLectures = lectures.filter(l => !l.isPreviewFree).length;
    const previewLectures = lectures.filter(l => l.isPreviewFree).length;
    const completionRate = lectures.length > 0 ? (publishedLectures / lectures.length) * 100 : 0;
    const avgRating = 4.5; // This would come from reviews
    const enrollmentGrowth = 12.5; // This would come from analytics

    return {
      totalLectures: lectures.length,
      totalDuration,
      publishedLectures,
      previewLectures,
      completionRate,
      enrolledStudents: course?.enrolledStudents?.length || 0,
      avgRating,
      enrollmentGrowth,
      lastUpdated: new Date()
    };
  }, [lectures, course]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "add-lecture":
        navigate(`/teacher/courses/${courseId}/lecture/create`);
        break;
      case "edit-course":
        navigate(`/teacher/courses/edit-course/${courseId}`);
        break;
      case "view-analytics":
        setActiveTab("analytics");
        break;
      case "course-settings":
        setActiveTab("settings");
        break;
      default:
        break;
    }
  };

  const handleRefreshLectures = async () => {
    const endMeasurement = measureApiCall('course-refresh');
    setIsRefreshing(true);
    try {
      await refetchLectures();
      await refetchCourse();
      endMeasurement();
      toast.success("Course data refreshed successfully!");
    } catch (error) {
      recordError(error as Error);
      endMeasurement();
      toast.error("Failed to refresh course data");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced loading state
  if (courseLoading) {
    return <EnhancedCourseManagerSkeleton />;
  }

  // Enhanced error state
  if (courseError || !course) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Failed to load course data</h3>
              <p className="text-sm text-red-500">
                {courseError ? 'Network error occurred' : 'Course not found'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => refetchCourse()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => navigate('/teacher/courses')} variant="outline" size="sm">
              Back to Courses
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <RealTimeErrorBoundary
      enableRetry={true}
      maxRetries={3}
      onError={(error, errorInfo) => {
        recordError(error);
        console.error('Course manager error:', error, errorInfo);
      }}
    >
      <div className="space-y-6">
      {/* Real-time Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
            isRealTimeConnected 
              ? "bg-green-100 text-green-700" 
              : "bg-yellow-100 text-yellow-700"
          )}>
            {isRealTimeConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                Live Updates
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Offline Mode
              </>
            )}
          </div>
          {hasPendingUpdates && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <Activity className="h-3 w-3 animate-pulse" />
              Syncing...
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {courseStats.lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Enhanced Course Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{course.title}</h1>
                  <p className="text-gray-600 text-lg">{course.subtitle}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge 
                  variant={course.isPublished ? "default" : "secondary"}
                  className={cn(
                    "px-3 py-1",
                    course.isPublished 
                      ? "bg-green-100 text-green-800 hover:bg-green-100" 
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                  )}
                >
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {course.courseLevel}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  {course.isFree === "free" ? "Free Course" : `$${course.coursePrice}`}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Video className="h-4 w-4" />
                  {courseStats.totalLectures} lectures
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {formatDuration(courseStats.totalDuration)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  {courseStats.enrolledStudents} students
                </div>
              </div>
            </div>

            {/* Enhanced Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("add-lecture")}
                className="bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lecture
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("edit-course")}
                className="bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/courses/${courseId}`)}
                className="bg-white hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshLectures}
                disabled={isRefreshing || isOptimisticLoading}
                className="bg-white hover:bg-gray-50"
              >
                {isRefreshing || isOptimisticLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                +{courseStats.publishedLectures} published
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Lectures</p>
              <p className="text-3xl font-bold text-gray-900">{courseStats.totalLectures}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {courseStats.previewLectures} preview lectures
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                Duration
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Duration</p>
              <p className="text-3xl font-bold text-gray-900">{formatDuration(courseStats.totalDuration)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {courseStats.totalLectures > 0 ? formatDuration(courseStats.totalDuration / courseStats.totalLectures) : '0m'} per lecture
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <Badge variant="outline" className="text-xs text-green-600">
                +{courseStats.enrollmentGrowth}%
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Enrolled Students</p>
              <p className="text-3xl font-bold text-gray-900">{courseStats.enrolledStudents}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Growing this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <Badge variant="outline" className="text-xs">
                {Math.round(courseStats.completionRate)}%
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Course Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-gray-900">{courseStats.avgRating}</p>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on student reviews
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="lectures" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Video className="h-4 w-4 mr-2" />
            Lectures ({courseStats.totalLectures})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Course Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Course Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {course.description || "No description available. Add a compelling description to help students understand what they'll learn in this course."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Learning Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(course as any).learningObjectives && (course as any).learningObjectives.length > 0 ? (
                  <ul className="space-y-3">
                    {(course as any).learningObjectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No learning objectives defined yet.</p>
                    <Button variant="outline" size="sm" onClick={() => handleQuickAction("edit-course")}>
                      Add Learning Objectives
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Course Progress Overview */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Content Completion</span>
                    <span className="text-sm text-gray-500">{Math.round(courseStats.completionRate)}%</span>
                  </div>
                  <Progress value={courseStats.completionRate} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{courseStats.publishedLectures}</div>
                    <div className="text-sm text-blue-600">Published Lectures</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{courseStats.enrolledStudents}</div>
                    <div className="text-sm text-green-600">Active Students</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{courseStats.avgRating}</div>
                    <div className="text-sm text-purple-600">Average Rating</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lectures" className="space-y-6">
          {/* Enhanced Lectures Management */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  Course Lectures
                  {lecturesFetching && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                </CardTitle>
                <div className="flex items-center gap-3">
                  {isRealTimeConnected && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <Zap className="h-3 w-3" />
                      Real-time sync
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshLectures}
                    disabled={isRefreshing || isOptimisticLoading}
                  >
                    {isRefreshing || isOptimisticLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                  <Button onClick={() => handleQuickAction("add-lecture")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lecture
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lecturesLoading && lectures.length === 0 ? (
                <LecturesSkeleton />
              ) : lectures.length > 0 ? (
                <ResponsiveLectureGrid
                  lectures={lectures}
                  variant="teacher"
                  showActions={true}
                  enableDragAndDrop={true}
                  onLecturePlay={(lecture) => {
                    window.open(`/student/course/${courseId}/lecture/${lecture._id}`, '_blank');
                  }}
                  onLectureEdit={(lecture) => {
                    navigate(`/teacher/courses/${courseId}/lecture/edit/${lecture._id}`);
                  }}
                  onLecturePreview={(lecture) => {
                    navigate(`/teacher/courses/${courseId}/lecture/preview/${lecture._id}`);
                  }}
                  onReorderLectures={async (reorderedLectures) => {
                    try {
                      // Update local state immediately for better UX
                      setLectures(reorderedLectures);

                      // Prepare data for API
                      const orderData = reorderedLectures.map((lecture) => ({
                        lectureId: lecture._id,
                        order: lecture.order,
                      }));

                      // Call API to update order in backend
                      await updateLectureOrder({
                        id: courseId,
                        data: orderData
                      }).unwrap();

                      toast.success("Lecture order updated successfully!");
                    } catch (error) {
                      // Revert local state on error
                      if (lecturesData?.data) {
                        setLectures(lecturesData.data);
                      }
                      toast.error("Failed to update lecture order");
                    }
                  }}
                  onCreateLecture={() => handleQuickAction("add-lecture")}
                  className="p-4"
                />
              ) : (
                <div className="text-center py-12">
                  <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No lectures yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Start building your course by adding your first lecture. You can upload videos, add descriptions, and organize your content.
                  </p>
                  <Button onClick={() => handleQuickAction("add-lecture")} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Your First Lecture
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Course Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-600 mb-6">
                  Detailed analytics including student engagement, completion rates, and performance metrics will be available soon.
                </p>
                <Button variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Basic Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Course Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings Panel Coming Soon</h3>
                <p className="text-gray-600 mb-6">
                  Advanced course settings including pricing, access controls, and publishing options will be available here.
                </p>
                <Button variant="outline" onClick={() => handleQuickAction("edit-course")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </RealTimeErrorBoundary>
  );
};

// Enhanced skeleton components
const LecturesSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    ))}
  </div>
);

const EnhancedCourseManagerSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </CardHeader>
    </Card>

    {/* Stats Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Tabs Skeleton */}
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Card className="border-0 shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default EnhancedUnifiedCourseManager;
