import { useState, useEffect, useMemo } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { toast } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import CourseLayout from "@/components/Course/CourseLayout";
import LectureErrorBoundary from "@/components/Course/LectureErrorBoundary";
import LazyContentLoader from "@/components/Course/LazyContentLoader";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetCourseByIdQuery } from "@/redux/features/course/courseApi";
import {
  useGetLectureByCourseIdQuery,
  useGetLectureByIdQuery,
} from "@/redux/features/lecture/lectureApi";
import {
  useGetCourseProgressQuery,
  useMarkLectureCompleteMutation,
  useGetEnrolledCoursesQuery,
} from "@/redux/features/student/studentApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ICourse, ILecture } from "@/types/course";
import CourseCompletionModal from "@/components/Course/CourseCompletionModal";
import { useRetryMechanism } from "@/hooks/useRetryMechanism";
import { useOfflineSupport } from "@/hooks/useOfflineSupport";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { Logger } from "@/utils/logger";
import { config } from '@/config';
import {
  WifiOff,
  Clock,
  TrendingUp,
  Zap
} from "lucide-react";

const LecturePage = () => {
  const { courseId, lectureId } = useParams<{
    courseId: string;
    lectureId: string;
  }>();

  const navigate = useNavigate();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Enterprise features
  const retryMechanism = useRetryMechanism({
    maxRetries: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      Logger.info(`Retrying lecture data fetch (attempt ${attempt}):`, error);
      toast.info("Retrying...", {
        description: `Attempting to reload lecture data (${attempt}/3)`,
      });
    },
    onMaxRetriesReached: (error) => {
      Logger.error('Max retries reached for lecture data:', error);
      toast.error("Connection Issues", {
        description: "Unable to load lecture data. Please check your connection and refresh the page.",
      });
    }
  });

  const offlineSupport = useOfflineSupport({
    enableCaching: true,
    cachePrefix: 'lecture_',
    maxCacheSize: 100, // 100MB for video content
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    syncOnReconnect: true
  });

  const performanceMonitoring = usePerformanceMonitoring({
    enableWebVitals: true,
    enableResourceMonitoring: true,
    onThresholdExceeded: (metric, value, threshold) => {
      Logger.warn(`Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`);
    }
  });

  // Start performance monitoring
  useEffect(() => {
    const endMeasurement = performanceMonitoring.measureComponentLoad('LecturePage');
    performanceMonitoring.startMonitoring();

    return () => {
      endMeasurement();
      performanceMonitoring.stopMonitoring();
    };
  }, [performanceMonitoring]);

  // Enhanced data fetching with offline support and caching
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  // Memoized cache keys for offline support
  const cacheKeys = useMemo(() => ({
    course: `course_${courseId}`,
    lectures: `lectures_${courseId}`,
    currentLecture: `lecture_${lectureId}`,
    progress: `progress_${studentId}_${courseId}`,
    enrolledCourses: `enrolled_${studentId}`
  }), [courseId, lectureId, studentId]);

  // Get course data with offline support
  const { data: courseData, isLoading: isCourseLoading } =
    useGetCourseByIdQuery(courseId || "", {
      skip: !courseId,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true
    });

  // Cache course data for offline access
  useEffect(() => {
    if (courseData?.data && offlineSupport.isOnline) {
      offlineSupport.setCache(cacheKeys.course, courseData.data);
    }
  }, [courseData, offlineSupport, cacheKeys.course]);

  // Get all lectures for the course with offline support
  const { data: lecturesData, isLoading: isLecturesLoading } =
    useGetLectureByCourseIdQuery({ id: courseId || "" }, {
      skip: !courseId,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true
    });

  // Cache lectures data
  useEffect(() => {
    if (lecturesData?.data && offlineSupport.isOnline) {
      offlineSupport.setCache(cacheKeys.lectures, lecturesData.data);
    }
  }, [lecturesData, offlineSupport, cacheKeys.lectures]);

  // Get current lecture data with retry mechanism
  const {
    data: currentLectureData,
    isLoading: isCurrentLectureLoading,
    error: currentLectureError,
    refetch: refetchCurrentLecture,
  } = useGetLectureByIdQuery({ id: lectureId || "" }, {
    skip: !lectureId,
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true
  });

  // Cache current lecture data
  useEffect(() => {
    if (currentLectureData?.data && offlineSupport.isOnline) {
      offlineSupport.setCache(cacheKeys.currentLecture, currentLectureData.data);
    }
  }, [currentLectureData, offlineSupport, cacheKeys.currentLecture]);

  // Get course progress with offline support
  const {
    data: progressData,
    isLoading: isProgressLoading,
    refetch: refetchProgress,
  } = useGetCourseProgressQuery(
    { studentId: studentId || "", courseId: courseId || "" },
    {
      skip: !studentId || !courseId,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true
    }
  );

  // Cache progress data
  useEffect(() => {
    if (progressData?.data && offlineSupport.isOnline) {
      offlineSupport.setCache(cacheKeys.progress, progressData.data);
    }
  }, [progressData, offlineSupport, cacheKeys.progress]);

  const {
    data: enrolledCoursesData,
    isLoading: isEnrolledLoading,
    error: enrolledCoursesError,
  } = useGetEnrolledCoursesQuery(
    { studentId: studentId || "" },
    {
      skip: !studentId,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true
    }
  );

  // Cache enrolled courses data
  useEffect(() => {
    if (enrolledCoursesData?.data && offlineSupport.isOnline) {
      offlineSupport.setCache(cacheKeys.enrolledCourses, enrolledCoursesData.data);
    }
  }, [enrolledCoursesData, offlineSupport, cacheKeys.enrolledCourses]);

  const [markLectureComplete, { isLoading: isMarkingComplete }] =
    useMarkLectureCompleteMutation();

  // Enhanced status indicator component
  const StatusIndicator = () => {
    const performanceScore = performanceMonitoring.getPerformanceScore();
    const cacheSize = offlineSupport.getCacheSize();

    if (!offlineSupport.isOnline) {
      return (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <WifiOff className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">You're offline</p>
              <p className="text-xs text-amber-600">
                Using cached content • {cacheSize.toFixed(1)}MB cached
              </p>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              Offline Mode
            </Badge>
          </CardContent>
        </Card>
      );
    }

    if (retryMechanism.isRetrying) {
      return (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-blue-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Retrying connection...</p>
              <p className="text-xs text-blue-600">
                Attempt {retryMechanism.retryCount + 1} of {retryMechanism.getRemainingRetries() + retryMechanism.retryCount + 1}
              </p>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              Reconnecting
            </Badge>
          </CardContent>
        </Card>
      );
    }

    if (performanceScore < 60) {
      return (
        <Card className="mb-4 border-orange-200 bg-orange-50">
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">Performance Notice</p>
              <p className="text-xs text-orange-600">
                Page performance: {performanceScore}/100 • Consider refreshing
              </p>
            </div>
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              <Zap className="h-3 w-3 mr-1" />
              Optimizing
            </Badge>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // Reset state when lectureId changes
  useEffect(() => {
    setAccessGranted(null);

    if (lectureId && courseId && studentId) {
      refetchCurrentLecture();
      refetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId, courseId, studentId]);

  // Check if the user can access this lecture
  useEffect(() => {
    if (
      !isUserLoading &&
      !isCourseLoading &&
      !isLecturesLoading &&
      !isCurrentLectureLoading &&
      !isProgressLoading &&
      !isEnrolledLoading
    ) {
      if (!lectureId || !courseId || !studentId) {
        console.error("Missing required IDs for access check:", {
          lectureId,
          courseId,
          studentId,
        });
        setAccessGranted(false);
        return;
      }

      const currentLecture = currentLectureData?.data;
      const lectures = lecturesData?.data;
      const progress = progressData?.data;
      const enrolledCourses = enrolledCoursesData?.data;

      if (!currentLecture || !lectures || !progress || !enrolledCourses) {
        console.error("Missing required data for access check:", {
          hasCurrentLecture: !!currentLecture,
          hasLectures: !!lectures,
          hasProgress: !!progress,
          hasEnrolledCourses: !!enrolledCourses,
        });
        setAccessGranted(false);
        return;
      }

      // Check if student is enrolled in the course
      const isEnrolledInCourse = enrolledCourses.some(
        (course: ICourse) => course._id === courseId
      );

      if (!isEnrolledInCourse) {
        toast.error("Access Restricted", {
          description:
            "You need to enroll in this course to access its content.",
        });
        navigate("/courses");
        setAccessGranted(false);
        return;
      }

      // For preview lectures, always grant access
      if (currentLecture.isPreviewFree) {
        setAccessGranted(true);
        return;
      }

      // Find the index of the current lecture
      const currentLectureIndex = lectures.findIndex(
        (lecture: ILecture) => lecture._id === lectureId
      );

      if (currentLectureIndex === 0) {
        // First lecture is always accessible
        setAccessGranted(true);
        return;
      }

      // Check if the current lecture is already completed
      const completedLectures =
        progress.lectureProgress
          ?.filter((lp: { lectureId: string; isCompleted: boolean }) => lp.isCompleted)
          .map((lp: { lectureId: string; isCompleted: boolean }) => lp.lectureId) || [];

      // If the current lecture is already completed, grant access
      if (completedLectures.includes(lectureId)) {
        setAccessGranted(true);
        return;
      }

      // Check if the previous lecture is completed
      const previousLectureId = lectures[currentLectureIndex - 1]?._id;
      const isPreviousLectureCompleted =
        completedLectures.includes(previousLectureId);

      if (isPreviousLectureCompleted) {
        setAccessGranted(true);
      } else {
        setAccessGranted(false);
        toast.error("Access Restricted", {
          description: "You need to complete the previous lectures first.",
        });
      }
    }
  }, [
    lectureId,
    courseId,
    studentId,
    isUserLoading,
    isCourseLoading,
    isLecturesLoading,
    isCurrentLectureLoading,
    isProgressLoading,
    isEnrolledLoading,
    currentLectureData,
    lecturesData,
    progressData,
    enrolledCoursesData,
    toast,
    navigate,
  ]);

  // Handle marking lecture as complete
  const handleMarkComplete = async () => {
    console.log("LecturePage: handleMarkComplete called");

    if (!studentId || !courseId || !lectureId) {
      console.error("Missing required IDs:", {
        studentId,
        courseId,
        lectureId,
      });
      toast.error("Error", {
        description: "Missing required information",
      });
      return;
    }

    try {
      // Check if lecture is already completed
      const isAlreadyCompleted = progressData?.data?.lectureProgress?.some(
        (lp: { lectureId: string; isCompleted: boolean }) =>
          lp.lectureId === lectureId && lp.isCompleted
      );

      console.log("LecturePage: isAlreadyCompleted:", isAlreadyCompleted);

      if (isAlreadyCompleted) {
        console.log("LecturePage: Lecture already completed, returning");
        toast.info("Already Completed", {
          description: "This lecture is already marked as complete.",
        });
        return;
      }

      // Find the next lecture to navigate to before making the API call
      const lectures = lecturesData?.data;
      if (!lectures || !Array.isArray(lectures)) {
        console.error("Lectures data is missing or invalid:", lecturesData);
        return;
      }

      // Find the current lecture index
      const currentLectureIndex = lectures.findIndex(
        (lecture: ILecture) => lecture._id === lectureId
      );

      // Determine the next lecture ID or course page
      let nextUrl = "";
      let nextLectureId = "";

      if (
        currentLectureIndex >= 0 &&
        currentLectureIndex < lectures.length - 1
      ) {
        // Get the next lecture ID
        nextLectureId = lectures[currentLectureIndex + 1]._id;
        nextUrl = `/student/course/${courseId}/lecture/${nextLectureId}`;
      } else if (currentLectureIndex === lectures.length - 1) {
        nextUrl = `/student/course/${courseId}`;
      } else {
        console.error("Invalid lecture index:", currentLectureIndex);
        toast.error("Error", {
          description: "Could not determine the next lecture",
        });
        return;
      }

      // Check if this was the last lecture in the course
      const isLastLecture = currentLectureIndex === lectures.length - 1;
      console.log("LecturePage: isLastLecture:", isLastLecture);

      // Show loading toast
      toast.loading("Updating Progress", {
        description: "Marking lecture as complete...",
      });

      // Call the API to mark the lecture as complete
      console.log("LecturePage: Calling markLectureComplete API with:", {
        studentId,
        courseId,
        lectureId,
      });

      const result = await markLectureComplete({
        studentId,
        courseId,
        lectureId,
      }).unwrap();

      console.log("LecturePage: API call result:", result);

      // Update with success message
      if (!isLastLecture) {
        console.log("LecturePage: Navigating to next lecture:", nextUrl);
        toast.success("Success", {
          description: "Lecture completed! Moving to next lecture...",
        });

        // Use React Router navigation instead of page reload
        // This provides a smoother user experience
        setTimeout(() => {
          // Refetch progress data before navigating
          refetchProgress();
          // Navigate to the next lecture
          navigate(nextUrl);
        }, 500);
      } else {
        // This was the last lecture, show the completion modal
        console.log("LecturePage: Showing course completion modal");
        toast.success("Course Complete!", {
          description: "Congratulations! You've completed the entire course.",
        });

        // Refetch progress data before showing the modal
        await refetchProgress();

        // Show the completion modal instead of navigating
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error("Error marking lecture as complete:", error);
      toast.error("Error", {
        description: "Failed to mark lecture as complete",
      });
    }
  };

  if (
    isUserLoading ||
    isCourseLoading ||
    isLecturesLoading ||
    isCurrentLectureLoading ||
    isProgressLoading ||
    isEnrolledLoading
  ) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Back button skeleton */}
        <Skeleton className="h-10 w-40 mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar skeleton */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-md border border-gray-100 p-3 sm:p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col space-y-1 bg-gray-50/50 p-2 rounded-lg">
                    <Skeleton className="h-5 sm:h-6 w-full" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 sm:h-4 w-20" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content skeleton */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Video player skeleton with shimmer effect */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-200">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              <div className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-2">
                <Skeleton className="h-8 w-24" />
              </div>
            </div>

            {/* Navigation buttons skeleton */}
            <div className="flex justify-between">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>

            {/* Lecture content and notes skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                {/* Lecture content skeleton */}
                <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                    <div>
                      <Skeleton className="h-7 sm:h-8 w-64 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-9 w-36 rounded-lg" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Lecture Interactions skeleton */}
                <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 border-b pb-3 mb-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-32 mb-4 rounded-lg" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </div>
              </div>

              <div className="lg:col-span-1">
                {/* Notes section skeleton */}
                <div className="bg-white rounded-lg shadow-md border border-gray-100 p-4 sm:p-6 h-full">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-64 w-full mb-4 rounded-lg" />
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Handle errors
  if (enrolledCoursesError) {
    console.error("Enrolled courses error:", enrolledCoursesError);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-red-100 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-white z-0"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-100 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-50 rounded-full opacity-50 blur-xl"></div>

          <div className="relative">
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-4">
              Error Loading Enrolled Courses
            </h2>
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              We couldn't load your enrolled courses. This might be due to a network issue or a temporary server problem.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </Button>
              <Button
                onClick={() => navigate("/student/dashboard")}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle lecture error
  if (currentLectureError) {
    console.error("Lecture error:", currentLectureError);

    // Check if it's an access error (403)
    const errorStatus = (currentLectureError as { status?: number })?.status;
    if (errorStatus === 403) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white border border-amber-100 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-white z-0"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-100 rounded-full opacity-50 blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-50 rounded-full opacity-50 blur-xl"></div>

            <div className="relative">
              <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3h6a3 3 0 003-3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent mb-4">
                Access Restricted
              </h2>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                You need to be enrolled in this course to access this lecture content. Please enroll in the course to continue.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Course
                </Button>
                <Button
                  onClick={() => navigate("/courses")}
                  variant="outline"
                  className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-300 rounded-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Browse Courses
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-red-100 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl relative overflow-hidden">
          {/* Background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-white z-0"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-100 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-50 rounded-full opacity-50 blur-xl"></div>

          <div className="relative">
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent mb-4">
              Error Loading Lecture
            </h2>
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              We couldn't load the lecture content. This might be due to a network issue or the lecture may no longer be available.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </Button>
              <Button
                onClick={() => navigate(`/student/course/${courseId}`)}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 rounded-xl"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Course
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If no lectureId is provided, redirect to the first lecture
  if (!lectureId && lecturesData?.data && lecturesData.data.length > 0) {
    return (
      <Navigate
        to={`/student/course/${courseId}/lecture/${lecturesData.data[0]._id}`}
        replace
      />
    );
  }

  // If access check is still in progress, show loading state
  if (accessGranted === null) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-xl border border-purple-100 max-w-md w-full relative overflow-hidden">
          {/* Background animation */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-white z-0"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-100 rounded-full opacity-50 blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-100 rounded-full opacity-50 blur-xl"></div>

          <div className="flex flex-col items-center relative z-10">
            <div className="relative w-24 h-24 mb-8">
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border-4 border-purple-100 opacity-30 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-purple-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">Verifying Access</h3>
            <p className="text-gray-600 text-center mb-4 leading-relaxed">We're checking your access to this lecture content. This helps ensure that only enrolled students can view course materials.</p>

            <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-progress"></div>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">This will only take a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  // If access is denied, redirect to the last accessible lecture
  if (accessGranted === false && progressData?.data) {
    // Find the last completed lecture or the first lecture
    const lectures = lecturesData?.data || [];
    let lastAccessibleLectureId = lectures[0]?._id;

    // Find the last completed lecture
    const completedLectures =
      progressData.data.lectureProgress
        ?.filter(
          (lp: { lectureId: string; isCompleted: boolean }) => lp.isCompleted
        )
        ?.map(
          (lp: { lectureId: string; isCompleted: boolean }) => lp.lectureId
        ) || [];

    if (completedLectures.length > 0) {
      // Get the last completed lecture that exists in the course
      for (let i = lectures.length - 1; i >= 0; i--) {
        if (completedLectures.includes(lectures[i]._id)) {
          lastAccessibleLectureId = lectures[i]._id;
          break;
        }
      }
    }

    return (
      <Navigate
        to={`/student/course/${courseId}/lecture/${lastAccessibleLectureId}`}
        replace
      />
    );
  }

  return (
    <LectureErrorBoundary
      lectureId={lectureId}
      courseId={courseId}
      onRetry={() => {
        retryMechanism.reset();
        window.location.reload();
      }}
      onNavigateBack={() => navigate(`/student/course/${courseId}`)}
    >
      <LazyContentLoader
        enableIntersectionObserver={false}
        priority="high"
        loadingText="Loading lecture content..."
        onLoad={() => {
          Logger.info('Lecture page content loaded successfully');
          performanceMonitoring.measureComponentLoad('LectureContent')();
        }}
        onError={(error) => {
          Logger.error('Failed to load lecture content:', error);
          performanceMonitoring.recordError(error);
        }}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Status indicators */}
          <div className="container mx-auto px-4 py-2">
            <StatusIndicator />
          </div>

          {/* Main course layout */}
          <CourseLayout
            onMarkComplete={handleMarkComplete}
            isMarkingComplete={isMarkingComplete}
            isCompleted={
              progressData?.data?.lectureProgress?.some(
                (lp: { lectureId: string; isCompleted: boolean }) =>
                  lp.lectureId === lectureId && lp.isCompleted
              ) || false
            }
          />

          {/* Course Completion Modal */}
          <CourseCompletionModal
            open={showCompletionModal}
            onOpenChange={setShowCompletionModal}
            courseId={courseId || ""}
            courseTitle={courseData?.data?.title || "this course"}
            percentage={progressData?.data?.percentage || 0}
          />

          {/* Performance monitoring overlay for development */}
          {config.node_env === 'development' && (
            <div className="fixed bottom-4 right-4 z-50">
              <Card className="p-3 bg-black/80 text-white text-xs">
                <div className="space-y-1">
                  <div>Performance: {performanceMonitoring.getPerformanceScore()}/100</div>
                  <div>Cache: {offlineSupport.getCacheSize().toFixed(1)}MB</div>
                  <div>Status: {offlineSupport.isOnline ? 'Online' : 'Offline'}</div>
                  {retryMechanism.isRetrying && (
                    <div>Retrying: {retryMechanism.retryCount}/{retryMechanism.getRemainingRetries() + retryMechanism.retryCount}</div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </LazyContentLoader>
    </LectureErrorBoundary>
  );
};

export default LecturePage;
