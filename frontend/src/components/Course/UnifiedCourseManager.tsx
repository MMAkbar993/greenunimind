import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  Users,
  Clock,
  DollarSign,
  Eye,
  Edit,
  Plus,
  Video,
  BarChart3,
  Settings,
  Star,
  TrendingUp,
  Calendar,
  FileText,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
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

interface UnifiedCourseManagerProps {
  courseId: string;
  defaultTab?: string;
}

const UnifiedCourseManager: React.FC<UnifiedCourseManagerProps> = ({
  courseId,
  defaultTab = "overview"
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch course data
  const { 
    data: courseData, 
    isLoading: courseLoading, 
    error: courseError 
  } = useGetCourseByIdQuery(courseId, {
    skip: !courseId
  });

  // Fetch lectures data with real-time polling
  const {
    data: lecturesData,
    isLoading: lecturesLoading,
    error: lecturesError,
    refetch: refetchLectures
  } = useGetLectureByCourseIdQuery({ id: courseId }, {
    skip: !courseId,
    pollingInterval: activeTab === "lectures" ? 30000 : 0, // Poll every 30s when on lectures tab
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const course = courseData?.data;
  const lectures = lecturesData?.data || [];

  // Calculate course statistics
  const totalDuration = lectures.reduce((acc: number, lecture) => acc + (lecture.duration || 0), 0);
  const publishedLectures = lectures.filter(l => !l.isPreviewFree).length;
  const previewLectures = lectures.filter(l => l.isPreviewFree).length;
  const completionRate = lectures.length > 0 ? (publishedLectures / lectures.length) * 100 : 0;

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
    setIsRefreshing(true);
    try {
      await refetchLectures();
      toast.success("Lectures refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh lectures");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (courseLoading) {
    return <UnifiedCourseManagerSkeleton />;
  }

  if (courseError || !course) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load course data. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{course.title}</h1>
                  <p className="text-muted-foreground">{course.subtitle}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
                <Badge variant="outline">
                  {course.courseLevel}
                </Badge>
                <Badge variant="outline">
                  {course.isFree === "free" ? "Free" : `$${course.coursePrice}`}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Video className="h-4 w-4" />
                  {lectures.length} lectures
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatDuration(totalDuration)}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("add-lecture")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Lecture
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction("edit-course")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Course
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/courses/${courseId}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Lectures</p>
                <p className="text-2xl font-bold">{lectures.length}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Duration</p>
                <p className="text-2xl font-bold">{formatDuration(totalDuration)}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enrolled Students</p>
                <p className="text-2xl font-bold">{course.enrolledStudents?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lectures">Lectures</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Course Overview Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {course.description || "No description available."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                {(course as any).learningObjectives && (course as any).learningObjectives.length > 0 ? (
                  <ul className="space-y-2">
                    {(course as any).learningObjectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{objective}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No learning objectives defined.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lectures" className="space-y-6">
          {/* Lectures Management Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Course Lectures</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshLectures}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
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
              {lecturesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : lectures.length > 0 ? (
                <div className="space-y-4">
                  {lectures.map((lecture: any, index: number) => (
                    <div key={lecture._id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <PlayCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{index + 1}. {lecture.lectureTitle}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatDuration(lecture.duration || 0)}</span>
                          {lecture.isPreviewFree && (
                            <Badge variant="outline" className="text-xs">Preview</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/teacher/courses/${courseId}/lecture/edit/${lecture._id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No lectures yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start building your course by adding your first lecture.
                  </p>
                  <Button onClick={() => handleQuickAction("add-lecture")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Lecture
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Settings panel coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Skeleton component for loading state
const UnifiedCourseManagerSkeleton: React.FC = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardHeader>
    </Card>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default UnifiedCourseManager;
