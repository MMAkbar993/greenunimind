import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import CourseNavigation from "@/components/Course/CourseNavigation";
import CloudinaryVideoPlayer from "@/components/Course/CloudinaryVideoPlayer";
import LectureNotes from "@/components/Course/LectureNotes";
import LectureInteractions from "@/components/Course/LectureInteraction";
import LectureContent from "@/components/Course/LectureContent";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Check, ChevronLeft, ChevronRight, Clock, PlayCircle } from "lucide-react";
import { formatTimeDisplay } from "@/utils/formatTime";

import {
  useGetLectureByIdQuery,
  useGetLectureByCourseIdQuery,
} from "@/redux/features/lecture/lectureApi";
import { useGetCourseByIdQuery } from "@/redux/features/course/courseApi";
import { useGetCourseProgressQuery } from "@/redux/features/student/studentApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ICourse, ILecture } from "@/types/course";
import { toast } from "@/utils/toast";
import { useAppSelector } from "@/redux/hooks";
import { selectLastPosition } from "@/redux/features/player/playerSlice";
import { debugOnly } from "@/utils/logger";

interface CourseLayoutProps {
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
  isCompleted?: boolean;
}

const CourseLayout = ({
  onMarkComplete,
  isMarkingComplete = false,
  isCompleted = false,
}: CourseLayoutProps) => {
  const { courseId, lectureId } = useParams<{
    lectureId: string;
    courseId: string;
  }>();

  const navigate = useNavigate();


  // State for video player
  const [currentTime, setCurrentTime] = useState(0);

  // Get user data
  const { data: userData } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  // Get the last position from Redux store for the current lecture
  const currentLectureId = lectureId || "";
  const lastPosition = useAppSelector((state) =>
    selectLastPosition(state, currentLectureId)
  );

  // Fetch course data
  const { data: courseData } = useGetCourseByIdQuery(courseId || "", {
    skip: !courseId,
  });

  // Fetch all lectures for the course
  const { data: lecturesData, isLoading: isLecturesLoading } =
    useGetLectureByCourseIdQuery({ id: courseId || "" }, { skip: !courseId });

  // Fetch current lecture data
  const {
    data: currentLectureData,
    error,
    isLoading,
  } = useGetLectureByIdQuery({ id: lectureId || "" }, { skip: !lectureId });

  const { data: progressData } = useGetCourseProgressQuery(
    { studentId: studentId || "", courseId: courseId || "" },
    { skip: !studentId || !courseId }
  );

  const lectures: ILecture[] = lecturesData?.data || [];

  const currentLectureIndex = lectures.findIndex(
    (lecture: ILecture) => lecture._id === currentLectureId
  );

  const nextLectureId =
    currentLectureIndex < lectures.length - 1
      ? lectures[currentLectureIndex + 1]?._id
      : null;

  const prevLectureId =
    currentLectureIndex > 0 ? lectures[currentLectureIndex - 1]?._id : null;

  if (isLoading || isLecturesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Top navigation bar skeleton */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4 py-3 max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-24 rounded-full" />
                <div className="hidden md:flex items-center">
                  <span className="text-xs text-gray-400 mx-2">|</span>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Skeleton className="h-2 w-32 rounded-full" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
          <div className="flex flex-col">
            {/* Course title for mobile skeleton */}
            <div className="md:hidden mb-4">
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="flex-1 h-1.5 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-7">
              {/* Main content skeleton - Reordered for mobile first */}
              <div className="lg:col-span-3 space-y-5 sm:space-y-7 order-1">
                {/* Video player skeleton with enhanced shimmer effect */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-100 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>

                  {/* Video title overlay skeleton */}
                  <div className="absolute top-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-5 w-48" />
                    </div>
                  </div>

                  {/* Video controls overlay skeleton */}
                  <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10 bg-gradient-to-t from-black/30 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                  </div>

                  {/* Play button skeleton */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Navigation buttons skeleton */}
                <div className="flex justify-between gap-4">
                  <Skeleton className="h-10 w-28 sm:w-36 rounded-xl flex-1 sm:flex-none" />
                  <Skeleton className="h-10 w-28 sm:w-36 rounded-xl flex-1 sm:flex-none" />
                </div>

                {/* Lecture content and notes skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-7">
                  <div className="lg:col-span-2 space-y-5 sm:space-y-7">
                    {/* Lecture content skeleton */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-5 gap-3">
                        <div>
                          <Skeleton className="h-7 sm:h-8 w-64 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-9 w-36 rounded-xl" />
                      </div>
                      <Skeleton className="h-4 w-full mb-3" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Lecture Interactions skeleton */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6">
                      <Skeleton className="h-6 w-48 mb-4" />
                      <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 border-b pb-4 mb-4">
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                      </div>
                      <Skeleton className="h-8 w-32 mb-4 rounded-xl" />
                      <Skeleton className="h-4 w-full mb-3" />
                      <Skeleton className="h-4 w-full mb-3" />
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    {/* Notes section skeleton */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6 h-full">
                      <Skeleton className="h-6 w-32 mb-4" />
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <Skeleton className="h-64 w-full rounded-lg" />
                      </div>
                      <div className="flex justify-end">
                        <Skeleton className="h-9 w-24 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar skeleton - Reordered for mobile first */}
              <div className="lg:col-span-1 order-2 mt-6 lg:mt-0">
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 h-full">
                  <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex flex-col space-y-2 bg-gray-50/80 p-3 rounded-lg hover:bg-gray-100/80 transition-colors duration-200">
                        <Skeleton className="h-5 sm:h-6 w-full" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-3 sm:h-4 w-20" />
                          </div>
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-red-100 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl">
          <div className="relative">
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
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

  if (!currentLectureData?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl">
          <div className="relative">
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent mb-4">
              Lecture Not Found
            </h2>
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              The lecture you're looking for doesn't exist or has been removed. Please return to the course page to view available lectures.
            </p>

            <div className="flex justify-center">
              <Button
                onClick={() => navigate(`/student/course/${courseId}`)}
                className="bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl px-6"
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

  const currentLecture = currentLectureData.data;

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleVideoComplete = () => {
    debugOnly.log('CourseLayout: handleVideoComplete called, isCompleted:', isCompleted);

    if (onMarkComplete && !isCompleted) {
      debugOnly.log('CourseLayout: Calling onMarkComplete');
      // Call the onMarkComplete function which will handle navigation
      onMarkComplete();
    } else if (isCompleted && nextLectureId) {
      debugOnly.log('CourseLayout: Lecture already completed, navigating to next lecture');
      toast.info("Moving to Next Lecture", {
        description: "You've already completed this lecture. Moving to the next one...",
      });

      // Use React Router navigation for a smoother experience
      navigate(`/student/course/${courseId}/lecture/${nextLectureId}`);
    } else {
      debugOnly.log('CourseLayout: No action taken on video completion');
    }
  };

  const handleSeek = (time: number) => {
    // Find the video element and seek to the specified time
    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoElement.currentTime = time;
    }
  };

  const handleNavigate = async (lectureId: string | null) => {
    if (!lectureId) return;

    if (nextLectureId === lectureId && !isCompleted) {
      const videoElement = document.querySelector("video");
      const currentProgress = videoElement
        ? videoElement.currentTime / videoElement.duration
        : 0;

      debugOnly.log("Current video progress:", currentProgress);

      if (currentProgress < 0.5) {
        toast.error("Watch More to Continue", {
          description:
            "Please watch at least 50% of this lecture before moving to the next one.",
        });
        return;
      } else if (onMarkComplete) {
        toast.loading("Marking Lecture Complete", {
          description: "Marking lecture as complete...",
        });

        try {
          // Call onMarkComplete which will handle navigation
          onMarkComplete();
          return;
        } catch (error) {
          debugOnly.log(
            "Error in handleNavigate while marking complete:",
            error
          );
        }
      }
    } else if (isCompleted || prevLectureId === lectureId) {
      if (prevLectureId === lectureId) {
        toast.info("Going to Previous Lecture", {
          description: "Navigating to the previous lecture...",
        });
      } else {
        toast.info("Navigating", {
          description: "Moving to the selected lecture...",
        });
      }

      navigate(`/student/course/${courseId}/lecture/${lectureId}`);
    } else {
      toast.info("Navigating", {
        description: "Moving to the selected lecture...",
      });

      navigate(`/student/course/${courseId}/lecture/${lectureId}`);
    }
  };

  const formatTime = (time: number) => {
    return formatTimeDisplay(time);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Top navigation bar with course info */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mt-5">
              <Link to={"/student/dashboard"}>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-purple-50 text-purple-700 rounded-full h-9 px-3">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Dashboard</span>
                </Button>
              </Link>

              {courseData?.data && (
                <div className="hidden md:flex items-center">
                  <span className="text-xs text-gray-400 mx-2">|</span>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <BookOpen className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-800 truncate max-w-[300px]">
                      {courseData.data.title}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Progress indicator */}
            {progressData?.data && (
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, progressData.data.percentage || 0))}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {Math.min(100, Math.max(0, progressData.data.percentage || 0))}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-7xl">
        <div className="flex flex-col">
          {/* Course title for mobile */}
          {courseData?.data && (
            <div className="md:hidden mb-4">
              <h1 className="text-lg font-bold text-gray-800 line-clamp-2">
                {courseData.data.title}
              </h1>

              {/* Mobile progress bar */}
              {progressData?.data && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, progressData.data.percentage || 0))}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                    {Math.min(100, Math.max(0, progressData.data.percentage || 0))}% Complete
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-7">
            {/* Main content area - Reordered for mobile first */}
            <div className="lg:col-span-3 space-y-5 sm:space-y-7 order-1">
              {/* Video player with enhanced container */}
              <div className="relative rounded-xl overflow-hidden shadow-xl bg-black group">
                <CloudinaryVideoPlayer
                  key={currentLectureId}
                  src={currentLecture.videoUrl}
                  initialPosition={lastPosition || 0}
                  onTimeUpdate={handleTimeUpdate}
                  onComplete={handleVideoComplete}
                  className="w-full"
                  poster={currentLecture.thumbnailUrl}
                  videoId={currentLectureId}
                  onReady={() => debugOnly.log('Cloudinary player ready')}
                />

                {/* Video title overlay */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 text-white transform transition-opacity duration-300 opacity-100 group-hover:opacity-0">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <PlayCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-medium line-clamp-1">{currentLecture.lectureTitle}</h3>
                  </div>
                </div>

                {/* Video controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10 transform transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatTimeDisplay(currentLecture.duration || 600)}</span>
                      </div>

                      {isCompleted && (
                        <div className="flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                          <Check className="h-3 w-3 text-green-400" />
                          <span className="text-green-300">Completed</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-300">Lecture {currentLectureIndex + 1} of {lectures.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation buttons with enhanced styling */}
              <div className="flex justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleNavigate(prevLectureId)}
                  disabled={!prevLectureId}
                  className="flex-1 sm:flex-none border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Previous Lecture</span>
                  <span className="sm:hidden">Previous</span>
                </Button>

                <Button
                  onClick={() => handleNavigate(nextLectureId)}
                  disabled={!nextLectureId || isMarkingComplete}
                  className={`flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white transition-all duration-300 rounded-xl shadow-md hover:shadow-lg ${
                    isMarkingComplete ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isMarkingComplete ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Marking Complete...</span>
                      <span className="sm:hidden">Marking...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Next Lecture</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="ml-1 sm:ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Lecture content and notes with improved layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-7">
                <div className="lg:col-span-2 space-y-5 sm:space-y-7">
                  <LectureContent
                    lecture={currentLecture}
                    isCompleted={isCompleted}
                    onMarkComplete={onMarkComplete}
                  />

                  {/* Lecture Interactions (Bookmarks and Questions) */}
                  <LectureInteractions
                    lectureId={currentLectureId}
                    currentTime={currentTime}
                    formatTime={formatTime}
                    onSeek={handleSeek}
                  />
                </div>

                <div className="lg:col-span-1">
                  <LectureNotes
                    lectureId={currentLectureId}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar with course navigation - Reordered for mobile first */}
            <div className="lg:col-span-1 order-2 mt-6 lg:mt-0">
              <div className="sticky top-20">
                <CourseNavigation
                  course={
                    (courseData?.data
                      ? {
                          ...courseData.data,
                          lectures: lectures,
                        }
                      : {
                          _id: "",
                          title: "Loading...",
                          category: "",
                          courseLevel: "",
                          creator: "",
                          isPublished: false,
                          status: "",
                        }) as ICourse
                  }
                  currentLectureId={currentLectureId}
                  completedLectures={progressData?.data?.lectureProgress || []}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLayout;
