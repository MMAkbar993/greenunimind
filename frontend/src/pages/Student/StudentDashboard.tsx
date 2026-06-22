import { Link } from "react-router-dom";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useGetEnrolledCoursesQuery,
  useGetCourseProgressQuery,
} from "@/redux/features/student/studentApi";
import { useGetRecommendationsQuery } from "@/redux/features/course/courseApi";
import { useGetMyAchievementsQuery } from "@/redux/features/achievement/achievementApi";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Medal,
  Layers,
  Sparkles,
  Trophy,
  Activity,
  BookOpenCheck,
  Hourglass,
  Zap,
  PlayCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ICourse } from "@/types/course";
import { formatDuration } from "@/utils/formatTime";

// Extended course interface with progress properties
interface IEnrolledCourse extends ICourse {
  progress?: number;
  completedLectures?: number;
  totalLectures?: number;
  certificateGenerated?: boolean;
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import "./styles.css";

// Define a type for the creator object
interface ICreator {
  _id: string;
  name: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  // Allow additional properties with specific types
  [key: string]: string | number | boolean | object | undefined;
}

// Extended course interface with progress properties
interface IEnrolledCourse extends ICourse {
  progress?: number;
  completedLectures?: number;
  totalLectures?: number;
  certificateGenerated?: boolean;
}

const Dashboard = () => {
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: recommendationsData } = useGetRecommendationsQuery(
    { limit: 6 },
    { skip: !studentId }
  );
  const recommendations = recommendationsData?.data?.recommendations || [];

  const { data: achievementsData } = useGetMyAchievementsQuery(undefined, {
    skip: !studentId,
  });
  const achievements = achievementsData?.data || [];

  const {
    data: enrolledCoursesData,
    isLoading: isCoursesLoading,
    isFetching,
  } = useGetEnrolledCoursesQuery(
    {
      studentId: studentId || "",
    },
    {
      skip: !studentId,
    }
  );

  // Get enrolled courses data with progress
  const enrolledCourses = enrolledCoursesData?.data || [] as IEnrolledCourse[];

  // Get the most recently accessed course (first course for now)
  const recentCourse = enrolledCourses.length > 0 ? enrolledCourses[0] : null;

  // Set the selected course ID when recent course is available
  useEffect(() => {
    if (recentCourse) {
      setSelectedCourseId(recentCourse._id);
    }
  }, [recentCourse]);

  // Get detailed course progress for the selected course
  const { data: courseProgressData, isLoading: isProgressLoading } =
    useGetCourseProgressQuery(
      {
        studentId: studentId || "",
        courseId: selectedCourseId,
      },
      {
        skip: !studentId || !selectedCourseId,
      }
    );

  // Combine loading states to ensure we show loading state during initial load
  const isLoading = isUserLoading || isCoursesLoading || isProgressLoading;

  // Calculate overall progress across all courses
  const calculateOverallProgress = () => {
    if (!enrolledCourses.length) return 0;

    const totalProgress = enrolledCourses.reduce(
      (sum: number, course: IEnrolledCourse) => sum + (course.progress || 0),
      0
    );

    return totalProgress / enrolledCourses.length;
  };

  // Get total completed lectures across all courses
  const getTotalCompletedLectures = () => {
    return enrolledCourses.reduce(
      (sum: number, course: IEnrolledCourse) => sum + (course.completedLectures || 0),
      0
    );
  };

  // Get total lectures across all courses
  const getTotalLectures = () => {
    return enrolledCourses.reduce(
      (sum: number, course: IEnrolledCourse) => sum + (course.totalLectures || 0),
      0
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter className="pt-2">
                <Skeleton className="h-4 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>

        <Skeleton className="h-8 w-48 mb-4" />
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row">
            <Skeleton className="w-full md:w-1/3 h-48" />
            <div className="p-6 md:w-2/3">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <Skeleton className="h-4 w-full mb-6" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (studentId && !isLoading && !isFetching && enrolledCourses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
            <GraduationCap className="absolute inset-0 m-auto h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Welcome to Your Dashboard</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You haven't enrolled in any courses yet. Explore our catalog to begin your learning journey.
          </p>
          <Button className="px-6 py-6 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-md transition-all" asChild>
            <Link to="/courses" className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              <span className="text-base">Browse Courses</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show main content when data is available or still loading/fetching
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Modern Header with Gradient Background */}
      <div className="relative mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-4 sm:p-6 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2 w-full">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Student Dashboard
              </h1>
            </div>
            <p className="text-gray-600 max-w-md text-sm sm:text-base">
              Track your learning journey and progress with detailed insights and analytics
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 sm:mt-4">
              <div className="flex items-center gap-1 sm:gap-2 bg-white/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
                <BookOpenCheck className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                  {getTotalCompletedLectures()} / {getTotalLectures()} Lectures
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 bg-white/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                  {calculateOverallProgress().toFixed(0)}% Overall Progress
                </span>
              </div>
            </div>
          </div>

          {/* Only show continue learning button when we have course data */}
          {!isFetching && recentCourse && (
            <Button
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all shadow-md w-full md:w-auto mt-2 md:mt-0"
              size="default"
              asChild
            >
              <Link to={`/student/course/${recentCourse._id}`} className="flex items-center justify-center">
                <PlayCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Continue Learning</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="mb-6 bg-white p-1 shadow-sm border w-full flex overflow-x-auto no-scrollbar">
          <TabsTrigger
            value="overview"
            className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/10 data-[state=active]:to-blue-500/10 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
          >
            <Layers className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="whitespace-nowrap">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="courses"
            className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/10 data-[state=active]:to-blue-500/10 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
          >
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="whitespace-nowrap">My Courses</span>
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="flex-1 min-w-[100px] text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/10 data-[state=active]:to-blue-500/10 data-[state=active]:text-purple-700 data-[state=active]:shadow-sm"
          >
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="whitespace-nowrap">Learning Progress</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Course progress summary - only show if we have enrolled courses */}
      {(isFetching || enrolledCourses.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {isFetching ? (
            // Loading state for progress cards
            <>
              <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-2 border-b bg-gray-50/50 p-3 sm:p-4">
                  <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mb-1 sm:mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                  <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                </CardContent>
                <CardFooter className="pt-2 bg-gray-50/50 p-3 sm:p-4">
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                </CardFooter>
              </Card>
              <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50 sm:block hidden">
                <CardHeader className="pb-2 border-b bg-gray-50/50 p-3 sm:p-4">
                  <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mb-1 sm:mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                  <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                </CardContent>
                <CardFooter className="pt-2 bg-gray-50/50 p-3 sm:p-4">
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                </CardFooter>
              </Card>
              <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50 lg:block hidden">
                <CardHeader className="pb-2 border-b bg-gray-50/50 p-3 sm:p-4">
                  <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mb-1 sm:mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                  <Skeleton className="h-12 sm:h-16 w-full" />
                </CardContent>
                <CardFooter className="pt-2 bg-gray-50/50 p-3 sm:p-4">
                  <Skeleton className="h-8 sm:h-10 w-full" />
                </CardFooter>
              </Card>
            </>
          ) : recentCourse ? (
            // Actual progress cards when data is loaded and we have a recent course
            <>
              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50">
                <CardHeader className="pb-2 border-b bg-purple-50/50 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-1 sm:gap-2">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                        <span className="whitespace-nowrap">Course Progress</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Your learning journey</CardDescription>
                    </div>
                    <div className="bg-purple-100 p-1.5 sm:p-2 rounded-full">
                      <BookOpenCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                  {/* Ensure percentage is clamped between 0-100 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {Math.min(100, Math.max(0,
                        courseProgressData?.data?.percentage ||
                        recentCourse?.progress ||
                        0
                      )).toFixed(0)}%
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs sm:text-sm">
                      <span className="whitespace-nowrap">
                        {courseProgressData?.data?.completedLectures !== undefined
                          ? courseProgressData?.data?.completedLectures
                          : recentCourse?.completedLectures || 0}{" "}
                        of{" "}
                        {courseProgressData?.data?.totalLectures !== undefined
                          ? courseProgressData?.data?.totalLectures
                          : recentCourse?.totalLectures || 0}{" "}
                        lectures
                      </span>
                    </Badge>
                  </div>
                  <ProgressBar
                    percentage={
                      courseProgressData?.data?.percentage ||
                      recentCourse?.progress ||
                      0
                    }
                    size="lg"
                    showPercentageInBar={true}
                  />
                </CardContent>
                <CardFooter className="pt-2 bg-purple-50/50 border-t p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-purple-500 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {Math.min(100, Math.max(0,
                        courseProgressData?.data?.percentage ||
                        recentCourse?.progress ||
                        0
                      )).toFixed(0) === "100"
                        ? "Congratulations! Course completed"
                        : "Keep going, you're making progress!"}
                    </span>
                  </div>
                </CardFooter>
              </Card>

              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50">
                <CardHeader className="pb-2 border-b bg-blue-50/50 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-1 sm:gap-2">
                        <Hourglass className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                        <span className="whitespace-nowrap">Time Remaining</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Estimated study time</CardDescription>
                    </div>
                    <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                      {courseProgressData?.data?.percentage === 100 || recentCourse?.progress === 100
                        ? "0m"
                        : formatDuration(
                            // Calculate remaining time in seconds (assuming average 10 minutes per lecture)
                            ((courseProgressData?.data?.remainingLectures ||
                              Math.max(0, (recentCourse?.totalLectures || 0) -
                                (recentCourse?.completedLectures || 0))) *
                              600), // 600 seconds = 10 minutes
                            'compact'
                          )
                      }
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                      <span className="whitespace-nowrap">
                        {courseProgressData?.data?.remainingLectures ||
                          Math.max(0, (recentCourse?.totalLectures || 0) -
                            (recentCourse?.completedLectures || 0))}{" "}
                        lectures left
                      </span>
                    </Badge>
                  </div>

                  <div className="w-full bg-blue-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0,
                          courseProgressData?.data?.percentage ||
                          recentCourse?.progress ||
                          0
                        ))}%`
                      }}
                    ></div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 bg-blue-50/50 border-t p-3 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-blue-500 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {courseProgressData?.data?.percentage === 100 || recentCourse?.progress === 100
                        ? "Course completed! Well done!"
                        : "Keep learning to complete on time"}
                    </span>
                  </div>
                </CardFooter>
              </Card>

              <Card
                className={`overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-green-50 ${
                  // Only show active styling if percentage is EXACTLY 100%
                  (courseProgressData?.data?.percentage === 100) ||
                  (recentCourse?.progress === 100)
                    ? ""
                    : "opacity-80"
                }`}
              >
                <CardHeader className="pb-2 border-b bg-green-50/50 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg flex items-center gap-1 sm:gap-2">
                        <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                        <span className="whitespace-nowrap">Course Certificate</span>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Your achievement</CardDescription>
                    </div>
                    <div className="bg-green-100 p-1.5 sm:p-2 rounded-full">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                  <div
                    className={`flex flex-col justify-center items-center h-20 sm:h-24 ${
                      // Only show active styling if percentage is EXACTLY 100%
                      (courseProgressData?.data?.percentage === 100) ||
                      (recentCourse?.progress === 100)
                        ? ""
                        : "opacity-50"
                    }`}
                  >
                    {(courseProgressData?.data?.percentage === 100) ||
                     (recentCourse?.progress === 100) ? (
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 animate-pulse bg-green-200 rounded-full blur-md"></div>
                          <Medal className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 relative z-10" />
                        </div>
                        <p className="text-green-700 font-medium mt-2 text-xs sm:text-sm">Certificate Available!</p>
                      </>
                    ) : (
                      <>
                        <Medal className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
                        <p className="text-gray-500 mt-2 text-xs sm:text-sm text-center">Complete the course to earn certificate</p>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 bg-green-50/50 border-t p-3 sm:p-4">
                  <Button
                    className={`w-full text-xs sm:text-sm ${
                      // Only show active styling if percentage is EXACTLY 100%
                      (courseProgressData?.data?.percentage === 100) ||
                      (recentCourse?.progress === 100)
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    disabled={
                      // Only enable if percentage is EXACTLY 100%
                      !(
                        (courseProgressData?.data?.percentage === 100) ||
                        (recentCourse?.progress === 100)
                      )
                    }
                    size="sm"
                  >
                    {(courseProgressData?.data?.percentage === 100) ||
                     (recentCourse?.progress === 100)
                      ? "Download Certificate"
                      : "Complete the course first"}
                  </Button>
                </CardFooter>
              </Card>
            </>
          ) : (
            // Fallback if somehow we have enrolled courses but no recent course
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-6 sm:py-8 bg-white rounded-xl shadow-md">
              <div className="flex flex-col items-center">
                <div className="bg-gray-100 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2 text-sm sm:text-base">
                  Course progress information is not available
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  Please select a course to view progress details
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enrolled courses - only show if we have enrolled courses or are fetching */}
      {(isFetching || enrolledCourses.length > 0) && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-1.5 rounded-md">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Your Enrolled Courses
              </h2>
            </div>

            {enrolledCourses.length > 0 && !isFetching && (
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 text-xs sm:text-sm self-start sm:self-auto">
                {enrolledCourses.length} {enrolledCourses.length === 1 ? 'Course' : 'Courses'}
              </Badge>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Show loading indicators if still fetching data */}
            {isFetching
              ? // Loading state for course cards
                [1, 2].map((i) => (
                  <Card key={`loading-${i}`} className="mb-4 sm:mb-8 overflow-hidden border-0 shadow-lg bg-white">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 bg-gray-50">
                        <Skeleton className="w-full h-40 sm:h-48 md:h-full" />
                      </div>
                      <div className="p-4 sm:p-6 md:w-2/3">
                        <Skeleton className="h-5 sm:h-6 w-3/4 mb-2" />
                        <Skeleton className="h-3 sm:h-4 w-full mb-3 sm:mb-4" />
                        <Skeleton className="h-3 sm:h-4 w-1/2 mb-4 sm:mb-6" />
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <Skeleton className="h-8 sm:h-10 w-full sm:w-32" />
                          <Skeleton className="h-8 sm:h-10 w-full sm:w-32" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              : // Actual course cards when data is loaded
                enrolledCourses.map((course: IEnrolledCourse) => (
                  <Card key={course._id} className="mb-4 sm:mb-8 overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 relative group">
                        <img
                          src={course.courseThumbnail}
                          alt={course.title}
                          className="w-full h-40 sm:h-48 md:h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                          <div className="p-3 sm:p-4 w-full">
                            <Button
                              className="w-full bg-white/90 text-purple-700 hover:bg-white text-xs sm:text-sm"
                              size="sm"
                              asChild
                            >
                              <Link to={`/student/course/${course._id}`}>
                                <PlayCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                <span className="whitespace-nowrap">Start Learning</span>
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                          <div className="relative h-10 w-10 sm:h-12 sm:w-12">
                            <svg className="h-10 w-10 sm:h-12 sm:w-12" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                className="stroke-gray-200"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="16"
                                fill="none"
                                className="stroke-purple-500"
                                strokeWidth="3"
                                strokeDasharray="100"
                                strokeDashoffset={100 - (course.progress ?? 0)}
                                strokeLinecap="round"
                                transform="rotate(-90 18 18)"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold bg-white rounded-full m-1">
                              {Math.min(100, Math.max(0, course.progress ?? 0)).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 md:w-2/3">
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-lg sm:text-xl">{course.title}</CardTitle>
                          {course.progress === 100 && (
                            <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="whitespace-nowrap">Completed</span>
                            </Badge>
                          )}
                        </div>

                        <CardDescription className="mb-3 sm:mb-4 line-clamp-2 text-xs sm:text-sm">
                          {course.description}
                        </CardDescription>

                        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                          <Badge variant="outline" className="bg-gray-50 flex items-center gap-1 text-xs">
                            <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">{course.lectures?.length || 0} lectures</span>
                          </Badge>

                          {typeof course.creator === "object" &&
                          course.creator &&
                          "name" in course.creator && (
                            <Badge variant="outline" className="bg-gray-50 flex items-center gap-1 text-xs">
                              <GraduationCap className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {`${
                                  (course.creator as unknown as ICreator).name?.firstName || ''
                                } ${
                                  (course.creator as unknown as ICreator).name?.lastName || ''
                                }`.trim() || 'Instructor'}
                              </span>
                            </Badge>
                          )}

                          {course.completedLectures > 0 && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1 text-xs">
                              <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">{course.completedLectures} completed</span>
                            </Badge>
                          )}
                        </div>

                        <div className="mb-4 sm:mb-6">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs sm:text-sm font-medium">Your Progress</span>
                            <span className="text-xs sm:text-sm font-semibold text-purple-600">
                              {Math.min(100, Math.max(0, course.progress ?? 0)).toFixed(0)}%
                            </span>
                          </div>
                          <ProgressBar
                            percentage={course.progress ?? 0}
                            size="md"
                          />
                          <div className="mt-1 text-xs text-gray-500">
                            {course.completedLectures || 0} of {course.totalLectures || course.lectures?.length || 0} lectures completed
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                          <Button
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm w-full sm:w-auto text-xs sm:text-sm"
                            size="sm"
                            asChild
                          >
                            <Link to={`/student/course/${course._id}`} className="flex items-center justify-center">
                              <PlayCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">Continue Learning</span>
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            className="border-purple-200 text-purple-700 hover:bg-purple-50 w-full sm:w-auto text-xs sm:text-sm"
                            size="sm"
                            asChild
                          >
                            <Link to={`/student/course/${course._id}`} className="flex items-center justify-center">
                              <Layers className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">Course Details</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
          </div>
        </>
      )}

      {/* Achievements & Badges - Gamification */}
      {studentId && achievements.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-100 p-1.5 rounded-md">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Your Achievements
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a: { _id: string; name: string; description: string; icon?: string; points?: number }) => (
              <Badge
                key={a._id}
                className="px-4 py-2 bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 flex items-center gap-2"
                title={a.description}
              >
                <Medal className="h-4 w-4" />
                {a.name}
                {a.points ? ` (+${a.points})` : ''}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recommended for you - personalized learning paths */}
      {studentId && recommendations.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-green-100 p-1.5 rounded-md">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Recommended for You
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Based on your learning history and interests
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 6).map((course: ICourse) => (
              <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link to={`/courses/${course._id}`}>
                  <div className="aspect-video bg-gray-100 relative">
                    <img
                      src={course.courseThumbnail || "/images/default-course.jpg"}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-green-600/90 text-white">
                      {course.courseLevel}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                    <span className="text-xs text-green-600 font-medium mt-2 inline-block">
                      Explore course →
                    </span>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-1 sm:gap-2">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              <span>All Enrolled Courses</span>
            </h3>

            {isFetching ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 sm:h-16 w-full" />
                ))}
              </div>
            ) : enrolledCourses.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {enrolledCourses.map((course: IEnrolledCourse) => (
                  <Link
                    key={course._id}
                    to={`/student/course/${course._id}`}
                    className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border border-gray-100 hover:bg-purple-50/50 hover:border-purple-200 transition-all"
                  >
                    <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                      <img
                        src={course.courseThumbnail}
                        alt={course.title}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-md object-cover"
                      />
                      <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-white rounded-full flex items-center justify-center border border-gray-200">
                        <div
                          className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"
                          style={{
                            backgroundColor: course.progress === 100
                              ? '#10b981' // green-500
                              : course.progress > 50
                                ? '#8b5cf6' // purple-500
                                : '#6366f1' // indigo-500
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex-grow min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{course.title}</h4>
                      <div className="flex flex-wrap items-center text-xs text-gray-500 gap-1 sm:gap-0">
                        <span className="whitespace-nowrap">{Math.min(100, Math.max(0, course.progress ?? 0)).toFixed(0)}% complete</span>
                        <span className="mx-1 sm:mx-2 hidden sm:inline">•</span>
                        <span className="whitespace-nowrap">{course.completedLectures || 0} of {course.totalLectures || course.lectures?.length || 0} lectures</span>
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-3">
                      <PlayCircle className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline text-xs sm:text-sm">Continue</span>
                    </Button>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="bg-gray-100 p-3 sm:p-4 rounded-full inline-block mb-3 sm:mb-4">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">You haven't enrolled in any courses yet</p>
                <Button size="sm" className="text-xs sm:text-sm" asChild>
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-1 sm:gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
              <span>Learning Progress Overview</span>
            </h3>

            {isFetching ? (
              <div className="space-y-4 sm:space-y-6">
                <Skeleton className="h-32 sm:h-40 w-full" />
                <Skeleton className="h-16 sm:h-20 w-full" />
              </div>
            ) : enrolledCourses.length > 0 ? (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <h4 className="text-xs sm:text-sm font-medium text-purple-700">Overall Progress</h4>
                      <div className="bg-purple-100 p-1 rounded">
                        <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-700 mb-1">
                      {calculateOverallProgress().toFixed(0)}%
                    </div>
                    <Progress
                      value={calculateOverallProgress()}
                      className="h-1.5 sm:h-2 mb-1 sm:mb-2"
                      indicatorClassName="bg-purple-500"
                    />
                    <p className="text-xs text-purple-600">
                      Across all {enrolledCourses.length} courses
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <h4 className="text-xs sm:text-sm font-medium text-blue-700">Completed Lectures</h4>
                      <div className="bg-blue-100 p-1 rounded">
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-700 mb-1">
                      {getTotalCompletedLectures()} / {getTotalLectures()}
                    </div>
                    <Progress
                      value={(getTotalCompletedLectures() / Math.max(1, getTotalLectures())) * 100}
                      className="h-1.5 sm:h-2 mb-1 sm:mb-2"
                      indicatorClassName="bg-blue-500"
                    />
                    <p className="text-xs text-blue-600">
                      {((getTotalCompletedLectures() / Math.max(1, getTotalLectures())) * 100).toFixed(0)}% of total lectures completed
                    </p>
                  </div>

                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-100">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <h4 className="text-xs sm:text-sm font-medium text-green-700">Completed Courses</h4>
                      <div className="bg-green-100 p-1 rounded">
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-green-700 mb-1">
                      {enrolledCourses.filter((c: IEnrolledCourse) => c.progress === 100).length} / {enrolledCourses.length}
                    </div>
                    <Progress
                      value={(enrolledCourses.filter((c: IEnrolledCourse) => c.progress === 100).length / Math.max(1, enrolledCourses.length)) * 100}
                      className="h-1.5 sm:h-2 mb-1 sm:mb-2"
                      indicatorClassName="bg-green-500"
                    />
                    <p className="text-xs text-green-600">
                      {((enrolledCourses.filter((c: IEnrolledCourse) => c.progress === 100).length / Math.max(1, enrolledCourses.length)) * 100).toFixed(0)}% courses fully completed
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Course Completion Status</h4>
                  <div className="space-y-3 sm:space-y-4">
                    {enrolledCourses.map((course: IEnrolledCourse) => (
                      <div key={course._id} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <div className="flex justify-between mb-1 sm:mb-2">
                          <h5 className="font-medium text-sm sm:text-base truncate max-w-[70%]">{course.title}</h5>
                          <span className="text-xs sm:text-sm font-semibold text-purple-600">
                            {Math.min(100, Math.max(0, course.progress ?? 0)).toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar
                          percentage={course.progress ?? 0}
                          size="md"
                          className="mb-1 sm:mb-2"
                        />
                        <div className="flex flex-wrap sm:flex-nowrap justify-between text-xs text-gray-500 gap-1">
                          <span className="whitespace-nowrap">{course.completedLectures || 0} of {course.totalLectures || course.lectures?.length || 0} lectures</span>
                          {course.progress === 100 ? (
                            <span className="text-green-600 font-medium flex items-center whitespace-nowrap">
                              <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                              Completed
                            </span>
                          ) : (
                            <span className="whitespace-nowrap">In progress</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="bg-gray-100 p-3 sm:p-4 rounded-full inline-block mb-3 sm:mb-4">
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No progress data available yet</p>
                <Button size="sm" className="text-xs sm:text-sm" asChild>
                  <Link to="/courses">Start Learning</Link>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
