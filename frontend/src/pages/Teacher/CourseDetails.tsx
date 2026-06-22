import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit, Plus, RefreshCw, Eye, Settings, BookOpen, Users, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useGetCourseByIdQuery } from '@/redux/features/course/courseApi';
import { useGetLectureByCourseIdQuery } from '@/redux/features/lecture/lectureApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { baseApi } from '@/redux/api/baseApi';
import { formatDuration } from '@/utils/formatDuration';
import ResponsiveLectureGrid from '@/components/Lecture/ResponsiveLectureGrid';
import { renderCourseDescription } from '@/utils/renderRichText';

interface CourseDetailsProps {
  className?: string;
}

const CourseDetails: React.FC<CourseDetailsProps> = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current user
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  // Fetch course data with aggressive cache invalidation
  const {
    data: courseData,
    isLoading: courseLoading,
    error: courseError,
    refetch: refetchCourse
  } = useGetCourseByIdQuery(courseId || '', {
    skip: !courseId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Fetch lectures data
  const {
    data: lecturesData,
    isLoading: lecturesLoading,
    refetch: refetchLectures,
    isFetching: lecturesFetching
  } = useGetLectureByCourseIdQuery({ id: courseId || '' }, {
    skip: !courseId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const course = courseData?.data;
  const lectures = React.useMemo(() => lecturesData?.data || [], [lecturesData?.data]);

  // Ensure fresh data on mount
  useEffect(() => {
    if (courseId && teacherId) {
      dispatch(baseApi.util.invalidateTags([
        'courses',
        'course',
        { type: 'course', id: courseId },
        { type: 'courses', id: 'LIST' },
        { type: 'courses', id: `creator-${teacherId}` },
        'lectures',
        { type: 'lectures', id: courseId }
      ]));
    }
  }, [courseId, teacherId, dispatch]);

  // Course statistics
  const courseStats = React.useMemo(() => {
    const totalDuration = lectures.reduce((acc: number, lecture) => acc + (lecture.duration || 0), 0);
    const publishedLectures = lectures.filter((l) => !l.isPreviewFree).length;
    const previewLectures = lectures.filter((l) => l.isPreviewFree).length;
    
    return {
      totalLectures: lectures.length,
      totalDuration,
      publishedLectures,
      previewLectures,
      enrolledStudents: course?.enrolledStudents?.length || 0,
    };
  }, [lectures, course]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force comprehensive cache invalidation
      dispatch(baseApi.util.invalidateTags([
        'courses',
        'course',
        'lectures',
        'lecture',
        { type: 'courses', id: 'LIST' },
        { type: 'courses', id: 'published' },
        { type: 'courses', id: `creator-${teacherId}` },
        { type: 'course', id: courseId },
        { type: 'lectures', id: courseId }
      ]));

      await Promise.all([refetchCourse(), refetchLectures()]);
      toast.success("Course data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh course data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditCourse = () => {
    navigate(`/teacher/courses/edit-course/${courseId}`);
  };

  const handleCreateLecture = () => {
    navigate(`/teacher/courses/${courseId}/lecture/create`);
  };

  const handleBackToCourses = () => {
    navigate('/teacher/courses');
  };

  const handlePreviewCourse = () => {
    window.open(`/courses/${courseId}`, '_blank');
  };



  if (courseLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Course not found
          </h3>
          <p className="text-gray-500 mb-6">
            The course you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={handleBackToCourses}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Modern Header with Breadcrumb */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToCourses}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={course.isPublished ? "default" : "secondary"}
                    className={course.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {course.courseLevel}
                  </Badge>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  {course.title}
                </h1>

                {course.subtitle && (
                  <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
                    {course.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewCourse}
                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>

              <Button
                size="sm"
                onClick={handleEditCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Course
              </Button>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Lectures</p>
                  <p className="text-2xl font-bold text-gray-900">{courseStats.totalLectures}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(courseStats.totalDuration)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{courseStats.enrolledStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {course.coursePrice ? `$${course.coursePrice}` : 'Free'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Main Content Tabs */}
        {/* Modern Tabs Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 px-6">
              <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-50 p-1 rounded-lg">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="lectures"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Lectures ({lectures.length})
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="p-6 space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Course Information - Takes 2 columns */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Title</h4>
                        <p className="text-gray-900 font-medium">{course.title}</p>
                      </div>

                      {course.subtitle && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Subtitle</h4>
                          <p className="text-gray-700">{course.subtitle}</p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Description</h4>
                        <div
                          className="prose prose-gray max-w-none text-gray-700 leading-relaxed bg-white rounded-lg p-4 border border-gray-200"
                          dangerouslySetInnerHTML={{
                            __html: renderCourseDescription(course.description)
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Price</h4>
                          <p className="text-2xl font-bold text-gray-900">
                            {course.coursePrice ? `$${course.coursePrice}` : 'Free'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Level</h4>
                          <Badge variant="outline" className="text-sm font-medium">
                            {course.courseLevel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Sidebar */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button
                        onClick={handleCreateLecture}
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Lecture
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleEditCourse}
                        className="w-full justify-start hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Course Details
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handlePreviewCourse}
                        className="w-full justify-start hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Course
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('settings')}
                        className="w-full justify-start hover:bg-gray-50 hover:text-gray-700"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Course Settings
                      </Button>
                    </div>
                  </div>

                  {/* Course Thumbnail */}
                  {course.courseThumbnail && (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Course Thumbnail</h4>
                      <img
                        src={course.courseThumbnail}
                        alt={course.title}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lectures" className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Course Lectures</h3>
                  <p className="text-gray-600 mt-1">
                    Manage and organize your course content
                  </p>
                </div>
                <Button
                  onClick={handleCreateLecture}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lecture
                </Button>
              </div>

              {lecturesLoading || lecturesFetching ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                      <Skeleton className="h-6 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  ))}
                </div>
              ) : lectures.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200">
                  <ResponsiveLectureGrid
                    lectures={lectures}
                    variant="teacher"
                    showActions={true}
                    onLectureEdit={(lecture) => {
                      navigate(`/teacher/courses/${courseId}/lecture/edit/${lecture._id}`);
                    }}
                    onLecturePreview={(lecture) => {
                      navigate(`/teacher/courses/${courseId}/lecture/preview/${lecture._id}`);
                    }}
                    onCreateLecture={handleCreateLecture}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No lectures yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Start building your course by adding your first lecture. Create engaging content that will help your students learn effectively.
                    </p>
                    <Button
                      onClick={handleCreateLecture}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Lecture
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="p-6">
              <div className="max-w-2xl">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Course Settings</h3>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Manage your course settings, pricing, visibility, and other preferences.
                    Make sure your course is properly configured before publishing.
                  </p>
                  <Button
                    onClick={handleEditCourse}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Edit Course Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
