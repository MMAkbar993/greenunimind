import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import {
  Award,
  BookOpen,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  Hourglass,
  Layers,
  PlayCircle,
  Sparkles,
  Zap
} from "lucide-react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetCourseByIdQuery } from "@/redux/features/course/courseApi";
import { useGetCourseProgressQuery, useGetEnrolledCoursesQuery } from "@/redux/features/student/studentApi";
import { useGetLectureByCourseIdQuery } from "@/redux/features/lecture/lectureApi";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/utils/toast";
import { ICourse, ILecture } from "@/types/course";
import { formatDuration } from "@/utils/formatTime";
import { renderCourseDescription } from "@/utils/renderRichText";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "./styles.css";

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();


  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  const {
    data: courseData,
    isLoading: isCourseLoading,
    isError: isCourseError
  } = useGetCourseByIdQuery(courseId || "", { skip: !courseId });

  const {
    data: lecturesData,
    isLoading: isLecturesLoading,
    isError: isLecturesError
  } = useGetLectureByCourseIdQuery({ id: courseId || "" }, { skip: !courseId });

  const {
    data: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError
  } = useGetCourseProgressQuery(
    { studentId: studentId || "", courseId: courseId || "" },
    { skip: !studentId || !courseId }
  );

  const {
    data: enrolledCoursesData,
    isLoading: isEnrolledLoading,
    error: enrolledCoursesError
  } = useGetEnrolledCoursesQuery(
    { studentId: studentId || "" },
    { skip: !studentId }
  );

  const [completedLectures, setCompletedLectures] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [totalDurationFormatted, setTotalDurationFormatted] = useState("--");
  const [lastAccessedLectureId, setLastAccessedLectureId] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (progressData?.data) {
      console.log("Progress Data:", progressData.data);

      // Check if completedLectures is an array or a number
      if (typeof progressData.data.completedLectures === 'number') {
        // If it's a number, use it directly
        setCompletedLectures(progressData.data.completedLectures);
        console.log("Completed Lectures (number):", progressData.data.completedLectures);
      } else {
        // If it's an array or something else, handle accordingly
        const completedLectures = progressData.data.completedLectures || [];
        console.log("Completed Lectures:", completedLectures);
        console.log("Is Array:", Array.isArray(completedLectures));
        setCompletedLectures(Array.isArray(completedLectures) ? completedLectures.length : 0);
      }

      // Set completion percentage
      setCompletionPercentage(progressData.data.percentage || 0);

      // Log lecture progress if available
      if (progressData.data.lectureProgress) {
        console.log("Lecture Progress:", progressData.data.lectureProgress);
      }
    }

    if (lecturesData?.data) {
      const lectures = lecturesData.data;
      setTotalLectures(lectures.length || 0);

      // Calculate total duration from actual lecture durations
      // If duration is not available, use a default of 10 minutes per lecture
      let totalDuration = 0;
      lectures.forEach((lecture: ILecture) => {
        // Use lecture.duration if available, otherwise default to 10 minutes (600 seconds)
        totalDuration += lecture.duration || 600;
      });

      setTotalDurationFormatted(formatDuration(totalDuration, 'compact'));

      // Set the last accessed lecture or the first lecture if none
      if (lectures.length > 0) {
        let firstIncompleteLectureId = lectures[0]._id;

        // If we have lecture progress data, use it to find the first incomplete lecture
        if (progressData?.data?.lectureProgress && Array.isArray(progressData.data.lectureProgress)) {
          console.log("Using lecture progress to find first incomplete lecture");
          const incompleteProgress = progressData.data.lectureProgress.find(
            (lp: { lectureId: string; isCompleted: boolean }) => !lp.isCompleted
          );
          if (incompleteProgress) {
            firstIncompleteLectureId = incompleteProgress.lectureId;
            console.log("Found incomplete lecture:", incompleteProgress);
          }
        } else {
          // Fallback to the old method
          console.log("Falling back to old method to find first incomplete lecture");
          const completedLectures = progressData?.data?.completedLectures || [];
          const isArray = Array.isArray(completedLectures);

          // Find the first incomplete lecture or use the first lecture
          const firstIncompleteLecture = lectures.find((lecture: ILecture) =>
            isArray ? !completedLectures.includes(lecture._id) : true
          );

          if (firstIncompleteLecture) {
            firstIncompleteLectureId = firstIncompleteLecture._id;
          }
        }

        console.log("Setting last accessed lecture ID:", firstIncompleteLectureId);
        setLastAccessedLectureId(firstIncompleteLectureId);
      }
    }

    // Check if student is enrolled in the course
    if (enrolledCoursesData?.data) {
      const isEnrolledInCourse = enrolledCoursesData.data.some(
        (course: ICourse) => course._id === courseId
      );
      setIsEnrolled(isEnrolledInCourse);

      if (!isEnrolledInCourse) {
        toast.error("Access Restricted", {
          description: "You need to enroll in this course to access its content.",
        });
        navigate("/courses");
      }
    }
  }, [progressData, lecturesData, enrolledCoursesData, courseId, navigate, toast]);

  // Loading state
  if (isUserLoading || isCourseLoading || isLecturesLoading || isProgressLoading || isEnrolledLoading) {
    return (
      <div className="bg-white min-h-screen">
        {/* Hero section skeleton */}
        <div className="bg-gradient-to-r from-purple-50 via-edu-light to-white py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded-full" />
              <Skeleton className="h-8 w-48 sm:h-10 sm:w-64" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4 sm:space-y-6">
                <Skeleton className="h-8 sm:h-10 w-3/4" />
                <Skeleton className="h-16 sm:h-20 w-full" />
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="pt-4">
                  <Skeleton className="h-10 sm:h-12 w-40 sm:w-48 rounded-lg" />
                </div>
              </div>
              <div className="relative">
                <Skeleton className="w-full h-56 sm:h-64 md:h-72 rounded-lg" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Skeleton className="h-24 sm:h-28 w-full rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course stats skeleton */}
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-2 border-b bg-gray-50/50 p-3 sm:p-4">
                  <Skeleton className="h-5 sm:h-6 w-24 sm:w-32 mb-1 sm:mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
                </CardHeader>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
                  <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mb-2" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                </CardContent>
                <CardFooter className="pt-2 bg-gray-50/50 p-3 sm:p-4">
                  <Skeleton className="h-4 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Course content skeleton */}
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <Skeleton className="h-6 sm:h-8 w-48 sm:w-56 mb-6 sm:mb-8" />
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="border border-gray-100 shadow-sm">
                <CardContent className="p-3 sm:p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40 sm:w-56 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 sm:mt-12 flex justify-center">
            <Skeleton className="h-10 sm:h-12 w-40 sm:w-48 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isCourseError || isLecturesError || isProgressError || enrolledCoursesError || !courseData?.data || !lecturesData?.data) {
    // Log the error for debugging
    if (enrolledCoursesError) {
      console.error("Enrolled courses error:", enrolledCoursesError);
    }

    return (
      <div className="bg-white min-h-screen flex items-center justify-center py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 sm:p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-red-700 mb-2 sm:mb-4">Error Loading Course</h2>
            <p className="text-gray-600 mb-6">We couldn't load the course data. This might be due to a network issue or the course may no longer be available.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Refresh Page
              </Button>
              <Button
                onClick={() => navigate("/courses")}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Back to Courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not enrolled, don't render the course content
  if (!isEnrolled) {
    return null;
  }

  const course = courseData.data;
  const lectures = lecturesData.data;

  // If there are no lectures, show a message
  if (lectures.length === 0) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 sm:p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Layers className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-4">
              No Lectures Available Yet
            </h2>
            <p className="text-gray-600 mb-6">
              This course is still being prepared. The instructor hasn't added any lectures yet.
              Please check back later or explore other courses in your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/student/dashboard")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => navigate("/courses")}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                Browse Courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-purple-50 via-edu-light to-white py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4">
          {/* Course title header with icon */}
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Course Details
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">{course.title}</h2>
              <div
                className="text-base sm:text-lg text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: renderCourseDescription(course.description)
                }}
              />

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                  <Clock className="w-4 h-4 mr-2 text-purple-500" />
                  <span className="text-sm font-medium">{totalDurationFormatted}</span>
                </div>
                <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                  <PlayCircle className="w-4 h-4 mr-2 text-purple-500" />
                  <span className="text-sm font-medium">{totalLectures} Lectures</span>
                </div>
                <div className="flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                  <BookOpenCheck className="w-4 h-4 mr-2 text-purple-500" />
                  <span className="text-sm font-medium">
                    {Math.min(completedLectures, totalLectures)} Completed
                  </span>
                </div>
              </div>

              <div className="pt-4 sm:pt-6">
                <Button
                  size="lg"
                  asChild
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
                >
                  <Link
                    to={`/student/course/${courseId}/lecture/${lastAccessedLectureId}`}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Continue Learning
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-xl overflow-hidden shadow-lg group">
                <img
                  src={course.courseThumbnail || "/images/default-course.jpg"}
                  alt={course.title}
                  className="w-full h-56 sm:h-64 md:h-72 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-70"></div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-purple-100">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800">Your Progress:</span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {Math.min(100, Math.max(0, completionPercentage)).toFixed(0)}% Complete
                  </Badge>
                </div>
                <ProgressBar
                  percentage={completionPercentage}
                  size="lg"
                  showPercentageInBar={true}
                />
                <div className="mt-2 text-xs text-gray-600 flex items-center justify-end">
                  <BookOpen className="h-3 w-3 mr-1 text-purple-500" />
                  <span>
                    {Math.min(completedLectures, totalLectures)} of {totalLectures} lectures completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course stats */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Progress Card */}
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="pb-2 border-b bg-purple-50/50 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-purple-700">Completion Status</h3>
                <div className="bg-purple-100 p-1 rounded">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <CardDescription className="text-xs text-purple-600">Your course progress</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {Math.min(100, Math.max(0, completionPercentage)).toFixed(0)}%
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs sm:text-sm">
                  <span className="whitespace-nowrap">
                    {Math.min(completedLectures, totalLectures)} of {totalLectures} lectures
                  </span>
                </Badge>
              </div>
              <ProgressBar
                percentage={completionPercentage}
                size="lg"
                showPercentageInBar={true}
              />
            </CardContent>
            <CardFooter className="pt-2 bg-purple-50/50 border-t p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-purple-500 flex-shrink-0" />
                <span className="line-clamp-1">
                  {completionPercentage === 100
                    ? "Congratulations! Course completed"
                    : "Keep going, you're making progress!"}
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Time Remaining Card */}
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="pb-2 border-b bg-blue-50/50 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-blue-700">Estimated Time</h3>
                <div className="bg-blue-100 p-1 rounded">
                  <Hourglass className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <CardDescription className="text-xs text-blue-600">Time to complete</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  {completionPercentage === 100
                    ? "0m"
                    : formatDuration(
                        // Calculate remaining time in seconds (assuming average 10 minutes per lecture)
                        ((totalLectures - completedLectures) * 600), // 600 seconds = 10 minutes
                        'compact'
                      )
                  }
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                  <span className="whitespace-nowrap">
                    {totalLectures - completedLectures} lectures left
                  </span>
                </Badge>
              </div>
              <div className="w-full bg-blue-100 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, completionPercentage))}%`
                  }}
                ></div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 bg-blue-50/50 border-t p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-blue-500 flex-shrink-0" />
                <span className="line-clamp-1">
                  {completionPercentage === 100
                    ? "Course completed! Well done!"
                    : "Keep learning to complete on time"}
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Achievement Card */}
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-green-50">
            <CardHeader className="pb-2 border-b bg-green-50/50 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-green-700">Achievement</h3>
                <div className="bg-green-100 p-1 rounded">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <CardDescription className="text-xs text-green-600">Your learning milestone</CardDescription>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  {completionPercentage >= 100 ? "Completed" : "In Progress"}
                </div>
                <Badge
                  variant={completionPercentage >= 100 ? "default" : "outline"}
                  className={completionPercentage >= 100
                    ? "bg-green-500 text-white"
                    : "bg-green-50 text-green-700 border-green-200"
                  }
                >
                  {completionPercentage >= 100 ? "Certificate Ready" : "Keep Learning"}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {completionPercentage >= 100
                  ? "You've completed all lectures in this course!"
                  : `Complete ${totalLectures - completedLectures} more lectures to finish the course.`
                }
              </div>
            </CardContent>
            <CardFooter className="pt-2 bg-green-50/50 border-t p-3 sm:p-4">
              <div className="text-xs sm:text-sm text-gray-600 flex items-center">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-green-500 flex-shrink-0" />
                <span className="line-clamp-1">
                  {completionPercentage >= 100
                    ? "Congratulations on your achievement!"
                    : "You're on your way to success!"}
                </span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Course content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Course Content</h2>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {lectures.map((lecture: ILecture, index: number) => {
            let isCompleted = false;

            // First check if we have lecture progress data
            if (progressData?.data?.lectureProgress && Array.isArray(progressData.data.lectureProgress)) {
              // Find this lecture in the progress data
              const lectureProgress = progressData.data.lectureProgress.find(
                (lp: { lectureId: string }) => lp.lectureId === lecture._id
              );
              isCompleted = lectureProgress?.isCompleted || false;
            } else {
              // Fall back to the old method
              const completedLectures = progressData?.data?.completedLectures || [];
              const isArray = Array.isArray(completedLectures);
              isCompleted = isArray ? completedLectures.includes(lecture._id) : false;
            }

            // Previous lecture is completed if it's the first lecture or if the previous lecture is marked as completed
            const isPreviousCompleted = index === 0 ||
              (index > 0 && lectures[index - 1] &&
                (progressData?.data?.lectureProgress?.find(
                  (lp: { lectureId: string }) => lp.lectureId === lectures[index - 1]._id
                )?.isCompleted || false));

            // Determine status for styling
            let status = "locked";
            if (isCompleted) status = "completed";
            else if (lecture.isPreviewFree) status = "preview";
            else if (isPreviousCompleted) status = "available";

            // Status-based styling
            const cardClasses = {
              completed: "border-green-100 bg-green-50/50 hover:bg-green-50",
              preview: "border-blue-100 bg-blue-50/50 hover:bg-blue-50",
              available: "border-purple-100 bg-white hover:bg-purple-50/30",
              locked: "border-gray-100 bg-gray-50/50 opacity-75"
            };

            const iconClasses = {
              completed: "bg-green-100 text-green-600",
              preview: "bg-blue-100 text-blue-600",
              available: "bg-purple-100 text-purple-600",
              locked: "bg-gray-100 text-gray-400"
            };

            const buttonClasses = {
              completed: "text-green-600 hover:text-green-700 hover:bg-green-100",
              preview: "text-blue-600 hover:text-blue-700 hover:bg-blue-100",
              available: "text-purple-600 hover:text-purple-700 hover:bg-purple-100",
              locked: "text-gray-400 pointer-events-none"
            };

            return (
              <Card
                key={lecture._id}
                className={`border shadow-sm transition-all duration-200 ${cardClasses[status]}`}
              >
                <CardContent className="p-3 sm:p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${iconClasses[status]}`}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : lecture.isPreviewFree ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm sm:text-base text-gray-800">{lecture.lectureTitle}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{formatDuration(lecture.duration || 600, 'compact')}</span>
                        </div>

                        {lecture.isPreviewFree && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                            Preview
                          </Badge>
                        )}

                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className={`rounded-full px-3 py-1 text-xs ${buttonClasses[status]}`}
                    disabled={!isCompleted && !isPreviousCompleted && !lecture.isPreviewFree}
                  >
                    <Link to={`/student/course/${courseId}/lecture/${lecture._id}`}>
                      {isCompleted
                        ? "Review"
                        : lecture.isPreviewFree
                        ? "Preview"
                        : isPreviousCompleted
                        ? "Start"
                        : "Locked"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 sm:mt-12 flex justify-center">
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md px-6"
          >
            <Link to={`/student/course/${courseId}/lecture/${lastAccessedLectureId}`}>
              <PlayCircle className="mr-2 h-5 w-5" />
              Continue Learning
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
