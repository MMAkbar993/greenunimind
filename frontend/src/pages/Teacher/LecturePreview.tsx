import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  Eye,
  Edit,
  BookOpen,
  PlayCircle,
  FileText,
  Share2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Video,
  TrendingUp,
  Globe,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useGetLectureByIdQuery } from '@/redux/features/lecture/lectureApi';
import { useGetCourseByIdQuery } from '@/redux/features/course/courseApi';
import { useGetMeQuery } from '@/redux/features/auth/authApi';
import { formatTimeDisplay, formatDuration } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Helper function to render rich text content
const renderRichText = (content: string | undefined | null): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content
    // Convert line breaks to <br> tags
    .replace(/\n/g, '<br />')
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert ### to h3
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mb-2 mt-4">$1</h3>')
    // Convert ## to h2
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mb-3 mt-5">$1</h2>')
    // Convert # to h1
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-4 mt-6">$1</h1>')
    // Convert `code` to inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    // Convert [link](url) to anchor tags
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-green-600 hover:text-green-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
};

interface LecturePreviewProps {
  className?: string;
}

const LecturePreview: React.FC<LecturePreviewProps> = ({ className }) => {
  const { courseId, lectureId } = useParams<{
    courseId: string;
    lectureId: string;
  }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // API queries
  const { data: userData } = useGetMeQuery(undefined);
  const {
    data: lectureData,
    isLoading: isLectureLoading,
    error: lectureError,
  } = useGetLectureByIdQuery(
    { id: lectureId || '' },
    { skip: !lectureId }
  );

  const {
    data: courseData,
    isLoading: isCourseLoading,
  } = useGetCourseByIdQuery(
    courseId || '',
    { skip: !courseId }
  );

  const lecture = lectureData?.data;
  const course = courseData?.data;
  const isLoading = isLectureLoading || isCourseLoading;

  // Handle navigation
  const handleBackToCourse = () => {
    navigate('/teacher/courses');
  };

  const handleEditLecture = () => {
    navigate(`/teacher/courses/${courseId}/lecture/edit/${lectureId}`);
  };

  const handleShareLecture = () => {
    const url = `${window.location.origin}/courses/${courseId}/lecture/${lectureId}`;
    navigator.clipboard.writeText(url);
    toast.success('Lecture URL copied to clipboard');
  };

  // Format creation date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get creator info with robust object handling
  const getCreatorInfo = () => {
    if (typeof course?.creator === 'object' && course.creator) {
      const creator = course.creator as any;

      // Handle case where creator.name might be an object or other non-string type
      let creatorName = 'Unknown';
      if (creator.name) {
        if (typeof creator.name === 'string') {
          creatorName = creator.name;
        } else if (typeof creator.name === 'object' && creator.name.name) {
          // Handle nested name object
          creatorName = String(creator.name.name);
        } else {
          creatorName = String(creator.name);
        }
      }

      return {
        name: creatorName,
        image: creator.profileImg || creator.image,
        id: creator._id || creator.id,
      };
    }

    // Fallback to current user data
    let userName = 'Unknown';
    if (userData?.data?.name) {
      if (typeof userData.data.name === 'string') {
        userName = userData.data.name;
      } else {
        userName = String(userData.data.name);
      }
    }

    return {
      name: userName,
      image: userData?.data?.profileImg,
      id: userData?.data?._id,
    };
  };

  const creatorInfo = getCreatorInfo();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-6 w-px" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-12 w-3/4 mb-4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lectureError || !lecture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Lecture Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The lecture you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={handleBackToCourse} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          {/* Header Content */}
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToCourse}
                  className="shrink-0 border-green-200 text-green-700 hover:bg-green-50 w-fit"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>

                {lecture.isPreviewFree && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <Globe className="h-3 w-3 mr-1" />
                    Public Preview
                  </Badge>
                )}

                {!lecture.videoUrl && (
                  <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Draft
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {lecture.lectureTitle}
              </h1>

              {/* Lecture Metadata */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 text-sm">
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{lecture.duration ? formatTimeDisplay(lecture.duration) : 'Duration not set'}</span>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Created {formatDate(lecture.createdAt || new Date())}</span>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">
                    {(course as any)?.categoryId?.name || course?.category || 'Uncategorized'}
                    {(course as any)?.subcategoryId?.name && ` > ${(course as any).subcategoryId.name}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">{course?.courseLevel || 'All Levels'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row xl:flex-col gap-3 xl:w-auto w-full">
              <Button
                onClick={handleEditLecture}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 shrink-0"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Lecture
              </Button>

              <Button
                variant="outline"
                onClick={handleShareLecture}
                className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200 shrink-0"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-200 hover:border-gray-300">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => window.open(`/student/course/${courseId}/lecture/${lectureId}`, '_blank')}>
                    <Eye className="h-4 w-4 mr-2" />
                    View as Student
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/teacher/courses/${courseId}/details`)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Course
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Video Preview Card */}
            <Card className="overflow-hidden shadow-xl border-0 bg-white backdrop-blur-sm">
              <CardContent className="p-0">
                {lecture.videoUrl ? (
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      src={lecture.videoUrl}
                      poster={lecture.thumbnailUrl}
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>

                    {/* Video Overlay Info */}
                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white shadow-lg">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <PlayCircle className="h-4 w-4" />
                          <span>{formatTimeDisplay(lecture.duration || 0)}</span>
                        </div>
                      </div>

                      {lecture.isPreviewFree && (
                        <Badge className="bg-green-500/90 text-white shadow-lg">
                          <Globe className="h-3 w-3 mr-1" />
                          Free Preview
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center border-2 border-dashed border-green-200">
                    <div className="text-center p-8">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        No Video Uploaded
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-sm">
                        Upload a video to preview your lecture content and provide students with engaging visual learning
                      </p>
                      <Button onClick={handleEditLecture} className="bg-green-600 hover:bg-green-700 text-white">
                        <Edit className="h-4 w-4 mr-2" />
                        Add Video
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lecture Details Tabs */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-4">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100/80">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white">
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="content" className="data-[state=active]:bg-white">
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="data-[state=active]:bg-white">
                      Analytics
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent>
                  <TabsContent value="overview" className="space-y-6">
                    {/* Description Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Description
                      </h3>
                      {lecture.instruction ? (
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <div className="prose prose-gray max-w-none">
                            <div
                              className="text-gray-700 leading-relaxed text-base prose prose-gray max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: renderRichText(lecture.instruction) || 'No instruction content available.'
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <AlertCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-green-900 mb-1">No description provided</h4>
                              <p className="text-green-700 text-sm">
                                Add a description to help students understand what they'll learn in this lecture and improve engagement.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Course Lectures Navigation */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-green-600" />
                        Course Structure
                      </h3>
                      {course?.lectures && course.lectures.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">
                                {course.title}
                              </h4>
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                {course.lectures.length} lectures
                              </Badge>
                            </div>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {[...course.lectures]
                              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                              .map((courseLecture: any, index: number) => (
                              <div
                                key={courseLecture._id}
                                className={cn(
                                  "flex items-center gap-3 p-4 border-b border-gray-100 last:border-b-0 transition-colors",
                                  courseLecture._id === lectureId
                                    ? "bg-green-50 border-l-4 border-l-green-500"
                                    : "hover:bg-gray-50"
                                )}
                              >
                                <div className="flex-shrink-0">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                    courseLecture._id === lectureId
                                      ? "bg-green-600 text-white"
                                      : "bg-gray-100 text-gray-600"
                                  )}>
                                    {index + 1}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className={cn(
                                    "font-medium truncate",
                                    courseLecture._id === lectureId
                                      ? "text-green-900"
                                      : "text-gray-900"
                                  )}>
                                    {courseLecture.lectureTitle}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-500">
                                      {courseLecture.duration ? formatTimeDisplay(courseLecture.duration) : 'Duration not set'}
                                    </span>
                                    {courseLecture.videoUrl && (
                                      <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                                        Published
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {courseLecture._id === lectureId && (
                                  <div className="flex-shrink-0">
                                    <Badge className="bg-green-600 text-white text-xs">
                                      Current
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                          <Video className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h4 className="font-medium text-gray-600 mb-1">No lectures found</h4>
                          <p className="text-sm text-gray-500">
                            This course doesn't have any lectures yet.
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Lecture Properties */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Lecture Properties</h4>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Duration</span>
                            <span className="font-medium">
                              {lecture.duration ? formatDuration(lecture.duration) : 'Not set'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Access Type</span>
                            <Badge variant={lecture.isPreviewFree ? "default" : "secondary"}>
                              {lecture.isPreviewFree ? (
                                <>
                                  <Globe className="h-3 w-3 mr-1" />
                                  Public Preview
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  Enrolled Only
                                </>
                              )}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Status</span>
                            <Badge variant={lecture.videoUrl ? "default" : "secondary"}>
                              {lecture.videoUrl ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Draft
                                </>
                              )}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Order</span>
                            <span className="font-medium">#{lecture.order || 'Not set'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Course Information</h4>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Category</span>
                            <Badge variant="outline">
                              <Tag className="h-3 w-3 mr-1" />
                              {(course as any)?.categoryId?.name || course?.category || 'Uncategorized'}
                              {(course as any)?.subcategoryId?.name && ` > ${(course as any).subcategoryId.name}`}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Level</span>
                            <span className="font-medium">{course?.courseLevel || 'All Levels'}</span>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Total Lectures</span>
                            <span className="font-medium">{course?.lectures?.length || 0}</span>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-gray-600">Enrolled Students</span>
                            <span className="font-medium">{course?.enrolledStudents?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-6">
                    {/* Content Resources */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Lecture Resources
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Video Resource */}
                        <Card className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Video className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">Video Content</h4>
                              <p className="text-sm text-gray-600">
                                {lecture.videoUrl ? 'Video uploaded' : 'No video uploaded'}
                              </p>
                            </div>
                            {lecture.videoUrl && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                Available
                              </Badge>
                            )}
                          </div>
                        </Card>

                        {/* PDF Resource */}
                        <Card className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <FileText className="h-5 w-5 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">PDF Materials</h4>
                              <p className="text-sm text-gray-600">
                                {lecture.pdfUrl ? 'PDF uploaded' : 'No PDF uploaded'}
                              </p>
                            </div>
                            {lecture.pdfUrl && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                Available
                              </Badge>
                            )}
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Additional Content Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Content Guidelines
                      </h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-1 bg-green-100 rounded-full">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-green-900">Best Practices</h4>
                            <ul className="text-sm text-green-800 space-y-1">
                              <li>• Keep lectures focused and under 15 minutes when possible</li>
                              <li>• Provide clear learning objectives in the description</li>
                              <li>• Use high-quality video and audio</li>
                              <li>• Include downloadable resources when relevant</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-6">
                    {/* Analytics Placeholder */}
                    <div className="text-center py-12">
                      <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Analytics Coming Soon
                      </h3>
                      <p className="text-gray-500">
                        View detailed analytics about lecture performance, student engagement, and completion rates.
                      </p>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* Course Info Card */}
            <Card className="shadow-xl border-0 bg-white backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Course Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {course?.courseThumbnail && (
                  <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={course.courseThumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {course?.title || 'Course Title'}
                  </h3>
                  <div
                    className="text-sm text-gray-600 line-clamp-3 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderRichText(course?.description) || 'No course description available.'
                    }}
                  />
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <Avatar className="h-10 w-10 border-2 border-green-200">
                    <AvatarImage src={creatorInfo.image} alt={creatorInfo.name} />
                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                      {creatorInfo?.name && typeof creatorInfo.name === 'string' && creatorInfo.name.length > 0
                        ? creatorInfo.name.charAt(0).toUpperCase()
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {creatorInfo?.name || 'Unknown Instructor'}
                    </p>
                    <p className="text-xs text-green-600 font-medium">Course Instructor</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-600 font-medium">Students Enrolled</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {course?.enrolledStudents?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-600 font-medium">Total Lectures</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {course?.lectures?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg">
                    <span className="text-gray-600 font-medium">Course Level</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      {course?.courseLevel || 'All Levels'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="shadow-xl border-0 bg-white backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                <Button
                  onClick={handleEditLecture}
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lecture
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open(`/student/course/${courseId}/lecture/${lectureId}`, '_blank')}
                  className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View as Student
                </Button>

                <Button
                  variant="outline"
                  onClick={handleShareLecture}
                  className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Lecture
                </Button>

                <Button
                  variant="outline"
                  onClick={handleBackToCourse}
                  className="w-full justify-start border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Course
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturePreview;
