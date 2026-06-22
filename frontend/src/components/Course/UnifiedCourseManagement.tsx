import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  Table,
  MoreHorizontal,
  BookOpen,
  Video,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Star,
  ArrowLeft,
  Clock,
  FileText,
  SortAsc,
  SortDesc,
  Calendar,
  Rocket,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Loading States
import {
  CourseCreatorLoadingState,
  LectureManagementLoadingState,
  LectureUpdateOverlay,
  UpdateSuccessFeedback,
  PendingStateIndicator
} from "@/components/ui/LoadingStates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

// Redux
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { baseApi } from "@/redux/api/baseApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useGetCoursesQuery,
  useDeleteCourseMutation,
  useEditCourseMutation,
  Course,
} from "@/redux/features/course/courseApi";
import {
  useDeleteLectureMutation,
  useUpdateLectureOrderMutation,
  Lecture,
} from "@/redux/features/lecture/lectureApi";
import {
  setActiveTab,
  setViewMode,
  setSearch,
  setFilters,
  setSelectedCourse,
  setCreatingCourse,
  setCreatingLecture,
  setEditingCourse,
  setCourses,
  setLectures,
  removeCourse,
  removeLecture,
  updateCourse,
} from "@/redux/features/course/unifiedCourseSlice";

// Utils
import { toast } from "sonner";
import { cn } from "@/lib/utils";


// Drag and Drop
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
} from "react-beautiful-dnd";

// StrictMode-safe DragDropContext wrapper
interface StrictModeDroppableProps {
  droppableId: string;
  children: (provided: DroppableProvided) => React.ReactElement;
}

const StrictModeDroppable = ({ children, ...props }: StrictModeDroppableProps) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <Droppable {...props}>{children}</Droppable>;
};

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Types
interface UnifiedCourseManagementProps {
  className?: string;
}

interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalLectures: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
}

const UnifiedCourseManagement: React.FC<UnifiedCourseManagementProps> = ({
  className,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current user
  const { data: userData } = useGetMeQuery(undefined);
  const teacherId = userData?.data?._id;

  // Redux state
  const unifiedState = useAppSelector((state) => state.unifiedCourse);
  const { courses, lectures, selectedCourse, ui, filters } = unifiedState;

  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "course" | "lecture";
    id: string;
    name: string;
  } | null>(null);

  // Loading and feedback states
  const [lectureUpdateInProgress, setLectureUpdateInProgress] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState<string | null>(null);
  const [pendingLectureId, setPendingLectureId] = useState<string | null>(null);
  const [publishingCourseId, setPublishingCourseId] = useState<string | null>(null);

  // Clear success message after delay
  useEffect(() => {
    if (updateSuccessMessage) {
      const timer = setTimeout(() => {
        setUpdateSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccessMessage]);

  // API queries
  const {
    data: coursesData,
    isLoading: coursesLoading,
    refetch: refetchCourses,
  } = useGetCoursesQuery(
    {
      teacherId: teacherId || "",
      page: filters.page,
      limit: filters.limit,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
    { skip: !teacherId }
  );

  // Mutations
  const [deleteCourse] = useDeleteCourseMutation();
  const [editCourse] = useEditCourseMutation();
  const [deleteLecture] = useDeleteLectureMutation();
  const [updateLectureOrder] = useUpdateLectureOrderMutation();

  // Computed values
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchLower) ||
          course.description?.toLowerCase().includes(searchLower) ||
          course.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(
        (course) =>
          course.category && filters.category.includes(course.category)
      );
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((course) => {
        const courseStatus = course.isPublished ? "published" : "draft";
        return filters.status.includes(courseStatus);
      });
    }

    return filtered;
  }, [courses, filters]);

  const courseStats: CourseStats = useMemo(() => {
    const totalCourses = courses.length;
    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const draftCourses = courses.filter((c) => !c.isPublished).length;

    const totalLectures = Object.values(lectures).reduce(
      (sum, courseLectures) => sum + courseLectures.length,
      0
    );

    const totalStudents = courses.reduce(
      (sum, course) => sum + (course.enrolledStudents?.length || 0),
      0
    );

    const totalRevenue = courses.reduce(
      (sum, course) =>
        sum +
        (course.coursePrice || 0) * (course.enrolledStudents?.length || 0),
      0
    );

    const averageRating =
      courses.length > 0
        ? courses.reduce(
            (sum, course) => sum + (course.averageRating || 0),
            0
          ) / courses.length
        : 0;

    const completionRate =
      courses.length > 0
        ? courses.reduce(
            (sum, course) => sum + (course.isPublished ? 100 : 50),
            0
          ) / courses.length
        : 0;

    return {
      totalCourses,
      publishedCourses,
      draftCourses,
      totalLectures,
      totalStudents,
      totalRevenue,
      averageRating,
      completionRate,
    };
  }, [courses, lectures]);

  // Effects
  useEffect(() => {
    if (coursesData?.data) {
      // Set courses in unified state (replace entire array)
      dispatch(setCourses(coursesData.data));

      // Handle populated lectures from backend
      coursesData.data.forEach((course) => {
        if (
          course.lectures &&
          Array.isArray(course.lectures) &&
          course.lectures.length > 0
        ) {
          // Check if lectures are populated objects (not just IDs)
          const firstLecture = course.lectures[0];
          if (typeof firstLecture === "object" && firstLecture._id) {
            // Lectures are populated, store them in the lectures state
            dispatch(
              setLectures({
                courseId: course._id,
                lectures: course.lectures as Lecture[],
              })
            );
          }
        }
      });
    }
  }, [coursesData, dispatch]);

  // Handle URL parameters for automatic course selection and tab switching
  useEffect(() => {
    const courseId = searchParams.get('courseId');
    const tab = searchParams.get('tab');

    if (courseId && coursesData?.data) {
      const course = coursesData.data.find(c => c._id === courseId);
      if (course) {
        dispatch(setSelectedCourse(course));
        if (tab === 'lectures') {
          dispatch(setActiveTab('lectures'));
        }
        // Clear URL parameters after processing
        setSearchParams({});
      }
    }
  }, [coursesData?.data, searchParams, dispatch, setSearchParams]);

  // Helper function to get lecture count for a course
  const getLectureCount = (course: Course): number => {
    // First check if lectures are stored separately in Redux state
    const separateLectures = lectures[course._id];
    if (separateLectures && separateLectures.length > 0) {
      return separateLectures.length;
    }

    // Then check if lectures are populated in the course object
    if (course.lectures && Array.isArray(course.lectures)) {
      return course.lectures.length;
    }

    return 0;
  };

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force refetch by invalidating all relevant cache tags
      dispatch(baseApi.util.invalidateTags([
        'courses',
        'course',
        'lectures',
        'lecture',
        { type: 'courses', id: 'LIST' },
        { type: 'courses', id: 'published' },
        { type: 'courses', id: `creator-${teacherId}` },
        { type: 'lecture', id: 'LIST' }
      ]));

      await refetchCourses();
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateCourse = () => {
    dispatch(setCreatingCourse(true));
    navigate("/teacher/courses/create");
  };

  const handleCreateLecture = (courseId: string) => {
    dispatch(setCreatingLecture(true));
    navigate(`/teacher/courses/${courseId}/lecture/create`);
  };

  const handleEditCourse = (course: Course) => {
    dispatch(setEditingCourse(course));
    navigate(`/teacher/courses/edit-course/${course._id}`);
  };

  const handlePublishCourse = async (course: Course) => {
    if (course.isPublished || course.status === "published") {
      return;
    }
    if (getLectureCount(course) < 1) {
      toast.error("Add at least one lecture before publishing.");
      return;
    }
    setPublishingCourseId(course._id);
    try {
      const fd = new FormData();
      fd.append("status", "published");
      const result = await editCourse({
        id: course._id,
        data: fd,
        creatorId: teacherId || undefined,
      }).unwrap();
      const updated = result.data;
      dispatch(updateCourse(updated));
      if (selectedCourse?._id === course._id) {
        dispatch(setSelectedCourse(updated));
      }
      toast.success("Course published. Students can now find and enroll in it.");
    } catch (error: unknown) {
      const msg =
        error &&
        typeof error === "object" &&
        "data" in error &&
        (error as { data?: { message?: string } }).data?.message
          ? (error as { data: { message: string } }).data.message
          : error instanceof Error
            ? error.message
            : "Failed to publish course";
      toast.error(msg);
    } finally {
      setPublishingCourseId(null);
    }
  };

  const handleEditLecture = (lecture: Lecture) => {
    navigate(
      `/teacher/courses/${lecture.courseId}/lecture/edit/${lecture._id}`
    );
  };

  const handleDeleteLecture = (lecture: Lecture) => {
    handleDeleteItem("lecture", lecture._id, lecture.lectureTitle);
  };

  const handleDeleteItem = (
    type: "course" | "lecture",
    id: string,
    name: string
  ) => {
    setItemToDelete({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "course") {
        await deleteCourse({
          id: itemToDelete.id,
          creatorId: teacherId || "",
        }).unwrap();
        dispatch(removeCourse(itemToDelete.id));
        toast.success("Course deleted successfully");
      } else {
        const courseId = selectedCourse?._id;
        if (courseId) {
          await deleteLecture({
            courseId,
            lectureId: itemToDelete.id,
          }).unwrap();
          dispatch(removeLecture({ courseId, lectureId: itemToDelete.id }));
          toast.success("Lecture deleted successfully");
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : (error as { data?: { message?: string } })?.data?.message || `Failed to delete ${itemToDelete.type}`;
      toast.error(errorMessage);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSearchChange = (value: string) => {
    dispatch(setSearch(value));
  };

  const handleFilterChange = (key: keyof typeof filters, value: string | boolean | string[]) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleViewModeChange = (mode: "grid" | "list" | "table") => {
    dispatch(setViewMode(mode));
  };

  const handleTabChange = (tab: "courses" | "lectures") => {
    dispatch(setActiveTab(tab));
  };

  const handleCourseSelect = (course: Course) => {
    dispatch(setSelectedCourse(course));
    dispatch(setActiveTab("lectures"));
  };

  const handleReorderLectures = async (reorderedLectures: Lecture[], courseId: string) => {
    try {
      // Update local state immediately for better UX
      dispatch(setLectures({
        courseId,
        lectures: reorderedLectures,
      }));

      // Prepare data for API
      const orderData = reorderedLectures.map((lecture) => ({
        lectureId: lecture._id,
        order: lecture.order,
      }));

      // Call API to update order in backend
      await updateLectureOrder({
        id: courseId,
        data: { lectures: orderData },
      }).unwrap();

      toast.success("Lecture order updated successfully!");
    } catch (error) {
      console.error("Failed to update lecture order:", error);
      toast.error("Failed to update lecture order");

      // Revert local state on error by refetching
      if (coursesData?.data) {
        const course = coursesData.data.find(c => c._id === courseId);
        if (course?.lectures) {
          dispatch(setLectures({
            courseId,
            lectures: course.lectures as Lecture[],
          }));
        }
      }
    }
  };

  if (coursesLoading && courses.length === 0) {
    return <CourseCreatorLoadingState />;
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* Loading Overlays and Feedback */}
        <LectureUpdateOverlay
          isVisible={lectureUpdateInProgress}
          message="Updating lecture data..."
        />
        <UpdateSuccessFeedback
          isVisible={!!updateSuccessMessage}
          message={updateSuccessMessage || ""}
        />
        {/* Enhanced Header with Prominent Actions */}
        <div className="bg-white rounded-lg border p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Course Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your courses and lectures in one unified interface
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
                title="Refresh course data"
              >
                <RefreshCw
                  className={cn("w-4 h-4", isRefreshing && "animate-spin")}
                />
                Refresh
              </Button>

              {/* Enhanced Create Course Button - More Prominent */}
              <Button
                onClick={handleCreateCourse}
                size="lg"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
              >
                <Plus className="w-5 h-5" />
                Create New Course
              </Button>
            </div>
          </div>

          {/* Quick Action Hints */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Click "Add Lecture" on any course card to add content
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-600" />
                Use "View" to manage course details and lectures
              </span>
              <span className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-orange-600" />
                "Edit" to modify course information
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courseStats.totalCourses}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">
                  {courseStats.publishedCourses} published
                </span>
                <span className="text-gray-500 ml-2">
                  • {courseStats.draftCourses} drafts
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Lectures
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courseStats.totalLectures}
                  </p>
                </div>
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">
                  Across {courseStats.totalCourses} courses
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courseStats.totalStudents}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600 font-medium">
                  +12% this month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(courseStats.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-gray-600">
                  {courseStats.averageRating.toFixed(1)} avg rating
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={ui.activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="lectures">Lectures</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {/* Courses Header with Search and Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
                    value={filters.search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Filters */}
                <Select
                  value={
                    filters.category.length > 0 ? filters.category[0] : "all"
                  }
                  onValueChange={(value) =>
                    handleFilterChange(
                      "category",
                      value === "all" ? [] : [value]
                    )
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="programming">Programming</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status.length > 0 ? filters.status[0] : "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? [] : [value])
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode Toggle */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={ui.viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("grid")}
                    className="px-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={ui.viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("list")}
                    className="px-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={ui.viewMode === "table" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleViewModeChange("table")}
                    className="px-2"
                  >
                    <Table className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Courses Content */}
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No courses found
                </h3>
                <p className="text-gray-500 mb-6">
                  {filters.search ||
                  filters.category.length > 0 ||
                  filters.status.length > 0
                    ? "Try adjusting your search or filters"
                    : "Start by creating your first course"}
                </p>
                <Button
                  onClick={handleCreateCourse}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            ) : (
              <>
                {ui.viewMode === "grid" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        onEdit={() => handleEditCourse(course)}
                        onDelete={() =>
                          handleDeleteItem("course", course._id, course.title)
                        }
                        onSelect={() => handleCourseSelect(course)}
                        onCreateLecture={() => handleCreateLecture(course._id)}
                        onPublish={() => handlePublishCourse(course)}
                        isPublishing={publishingCourseId === course._id}
                        lectureCount={getLectureCount(course)}
                      />
                    ))}
                  </div>
                )}

                {ui.viewMode === "list" && (
                  <div className="space-y-4">
                    {filteredCourses.map((course) => (
                      <CourseListItem
                        key={course._id}
                        course={course}
                        onEdit={() => handleEditCourse(course)}
                        onDelete={() =>
                          handleDeleteItem("course", course._id, course.title)
                        }
                        onSelect={() => handleCourseSelect(course)}
                        onCreateLecture={() => handleCreateLecture(course._id)}
                        onPublish={() => handlePublishCourse(course)}
                        isPublishing={publishingCourseId === course._id}
                        lectureCount={getLectureCount(course)}
                      />
                    ))}
                  </div>
                )}

                {ui.viewMode === "table" && (
                  <CourseTable
                    courses={filteredCourses}
                    lectures={lectures}
                    onEdit={handleEditCourse}
                    onDelete={(course) =>
                      handleDeleteItem("course", course._id, course.title)
                    }
                    onSelect={handleCourseSelect}
                    onCreateLecture={handleCreateLecture}
                    onPublish={handlePublishCourse}
                    publishingCourseId={publishingCourseId}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="lectures" className="space-y-6">
            {selectedCourse ? (
              <LectureManagement
                course={selectedCourse}
                lectures={lectures[selectedCourse._id] || []}
                onBack={() => {
                  dispatch(setSelectedCourse(null));
                  dispatch(setActiveTab("courses"));
                }}
                onCreateLecture={handleCreateLecture}
                onEditLecture={handleEditLecture}
                onDeleteLecture={handleDeleteLecture}
                onReorderLectures={handleReorderLectures}
              />
            ) : (
              <div className="space-y-6">
                {/* Course Selection for Lectures */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Lecture Management
                    </CardTitle>
                    <p className="text-gray-600">
                      Select a course to manage its lectures
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredCourses.map((course) => (
                        <div
                          key={course._id}
                          className="group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white cursor-pointer"
                          onClick={() => handleCourseSelect(course)}
                        >
                          <div className="flex items-center justify-between">
                            {/* Left Section - Course Info */}
                            <div className="flex items-center space-x-4 flex-1">
                              {/* Course Thumbnail */}
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                {course.courseThumbnail ? (
                                  <img
                                    src={course.courseThumbnail}
                                    alt={course.title}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <BookOpen className="w-6 h-6 text-white" />
                                )}
                              </div>

                              {/* Course Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                    {course.title}
                                  </h3>
                                  <Badge variant="outline" className="text-xs">
                                    {course.isPublished ? "Published" : "Draft"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Video className="w-4 h-4" />
                                    {getLectureCount(course)} lectures
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {course.enrolledStudents?.length || 0}{" "}
                                    students
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />$
                                    {course.coursePrice || 0}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right Section - Action */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Manage
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {itemToDelete?.type === "course" ? "Course" : "Lecture"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{itemToDelete?.name}"?
                {itemToDelete?.type === "course" &&
                  " This will also delete all associated lectures."}{" "}
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Simple Floating Action Button for Quick Course Creation */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleCreateCourse}
            size="lg"
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            title="Create New Course"
          >
            <Plus className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Course Card Component
interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onCreateLecture: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
  lectureCount: number;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onEdit,
  onDelete,
  onSelect,
  onCreateLecture,
  onPublish,
  isPublishing = false,
  lectureCount,
}) => {
  const isDraft = !course.isPublished && course.status !== "published";
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-0">
        {/* Course Image */}
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-lg">
          {course.courseThumbnail ? (
            <img
              src={course.courseThumbnail}
              alt={course.title}
              className="w-full h-full object-cover rounded-t-lg"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="w-12 h-12 text-white/80" />
            </div>
          )}

          {/* Status Badge */}
          <Badge
            className={cn(
              "absolute top-3 left-3",
              getStatusColor(course.isPublished ? "published" : "draft")
            )}
          >
            {course.isPublished ? "published" : "draft"}
          </Badge>

          {/* Enhanced Actions - Always visible with better UX */}
          <div className="absolute top-3 right-3 flex gap-2">
            {/* Primary Action - Add Lecture (always visible) */}
            <Button
              variant="secondary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                onCreateLecture();
              }}
              title="Add Lecture"
            >
              <Plus className="w-4 h-4" />
            </Button>

            {isDraft && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish();
                }}
                disabled={isPublishing}
                title="Publish course for students"
              >
                <Rocket className="w-4 h-4" />
              </Button>
            )}

            {/* Secondary Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white shadow-md"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSelect}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Course
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateLecture}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lecture
                </DropdownMenuItem>
                {isDraft && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublish();
                    }}
                    disabled={isPublishing}
                    className="text-emerald-700 focus:text-emerald-800"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Publish for students
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h3>
          </div>

          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {course.description || "No description available"}
          </p>

          {/* Course Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Video className="w-4 h-4 mr-2" />
              {lectureCount} lectures
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              {course.enrolledStudents?.length || 0} students
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="w-4 h-4 mr-2" />
              {formatCurrency(course.coursePrice || 0)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Star className="w-4 h-4 mr-2" />
              {(course.averageRating || 0).toFixed(1)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">
                {course.isPublished ? "100" : "50"}%
              </span>
            </div>
            <Progress value={course.isPublished ? 100 : 50} className="h-2" />
          </div>

          {/* Enhanced Action Buttons - Always visible at bottom */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Course List Item Component
interface CourseListItemProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onCreateLecture: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
  lectureCount: number;
}

const CourseListItem: React.FC<CourseListItemProps> = ({
  course,
  onEdit,
  onDelete,
  onSelect,
  onCreateLecture,
  onPublish,
  isPublishing = false,
  lectureCount,
}) => {
  const isDraft = !course.isPublished && course.status !== "published";
  const getStatusColor = (isPublished: boolean) => {
    return isPublished
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Course Thumbnail */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              {course.courseThumbnail ? (
                <img
                  src={course.courseThumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookOpen className="w-8 h-8 text-white" />
              )}
            </div>

            {/* Course Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {course.title}
                </h3>
                <Badge className={getStatusColor(course.isPublished)}>
                  {course.isPublished ? "published" : "draft"}
                </Badge>
              </div>

              <p className="text-gray-600 text-sm line-clamp-1 mb-3">
                {course.description || "No description available"}
              </p>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Video className="w-4 h-4 mr-1" />
                  {lectureCount} lectures
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {course.enrolledStudents?.length || 0} students
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {formatCurrency(course.coursePrice || 0)}
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  {(course.averageRating || 0).toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Actions - More visible and intuitive */}
          <div className="flex items-center gap-2">
            {/* Primary Action - Add Lecture */}
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={onCreateLecture}
              title="Add Lecture to this course"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Lecture
            </Button>

            {/* Secondary Actions */}
            <Button variant="outline" size="sm" onClick={onSelect}>
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>

            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>

            {isDraft && (
              <Button
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={onPublish}
                disabled={isPublishing}
                title="Publish for students"
              >
                <Rocket className="w-4 h-4 mr-1" />
                Publish
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onCreateLecture}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lecture
                </DropdownMenuItem>
                {isDraft && (
                  <DropdownMenuItem
                    onClick={onPublish}
                    disabled={isPublishing}
                    className="text-emerald-700"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Publish for students
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Course Table Component
interface CourseTableProps {
  courses: Course[];
  lectures: { [courseId: string]: Lecture[] };
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onSelect: (course: Course) => void;
  onCreateLecture: (courseId: string) => void;
  onPublish: (course: Course) => void;
  publishingCourseId: string | null;
}

const CourseTable: React.FC<CourseTableProps> = ({
  courses,
  lectures,
  onEdit,
  onDelete,
  onSelect,
  onCreateLecture,
  onPublish,
  publishingCourseId,
}) => {
  // Helper function to get lecture count for a course
  const getLectureCount = (course: Course): number => {
    // First check if lectures are stored separately in Redux state
    const separateLectures = lectures[course._id];
    if (separateLectures && separateLectures.length > 0) {
      return separateLectures.length;
    }

    // Then check if lectures are populated in the course object
    if (course.lectures && Array.isArray(course.lectures)) {
      return course.lectures.length;
    }

    return 0;
  };
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lectures
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {course.courseThumbnail ? (
                        <img
                          src={course.courseThumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">
                        {course.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {course.category}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    className={
                      course.isPublished
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getLectureCount(course)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {course.enrolledStudents?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(course.coursePrice || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-900">
                      {(course.averageRating || 0).toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(course.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {/* Primary Action - Add Lecture */}
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => onCreateLecture(course._id)}
                      title="Add Lecture"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>

                    {/* Secondary Actions */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelect(course)}
                      title="View Course"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(course)}
                      title="Edit Course"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    {!course.isPublished && course.status !== "published" && (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onPublish(course)}
                        disabled={publishingCourseId === course._id}
                        title="Publish for students"
                      >
                        <Rocket className="w-4 h-4" />
                      </Button>
                    )}

                    {/* More Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onCreateLecture(course._id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Lecture
                        </DropdownMenuItem>
                        {!course.isPublished && course.status !== "published" && (
                          <DropdownMenuItem
                            onClick={() => onPublish(course)}
                            disabled={publishingCourseId === course._id}
                            className="text-emerald-700"
                          >
                            <Rocket className="w-4 h-4 mr-2" />
                            Publish for students
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(course)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Lecture Management Component
interface LectureManagementProps {
  course: Course;
  lectures: Lecture[];
  onBack: () => void;
  onCreateLecture: (courseId: string) => void;
  onEditLecture: (lecture: Lecture) => void;
  onDeleteLecture: (lecture: Lecture) => void;
  onReorderLectures: (reorderedLectures: Lecture[], courseId: string) => Promise<void>;
}

const LectureManagement: React.FC<LectureManagementProps> = ({
  course,
  lectures,
  onBack,
  onCreateLecture,
  onEditLecture,
  onDeleteLecture,
  onReorderLectures,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "title" | "order" | "duration" | "createdAt"
  >("order");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredLectures = useMemo(() => {
    // Create a copy of the lectures array to avoid mutating the original
    let filtered = [...lectures];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lecture) =>
          lecture.lectureTitle.toLowerCase().includes(searchLower) ||
          lecture.instruction?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting (now safe to mutate since we have a copy)
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case "title":
          aValue = a.lectureTitle.toLowerCase();
          bValue = b.lectureTitle.toLowerCase();
          break;
        case "order":
          aValue = a.order || 0;
          bValue = b.order || 0;
          break;
        case "duration":
          aValue = a.duration || 0;
          bValue = b.duration || 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [lectures, searchTerm, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Better Navigation Context */}
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Button>
            <div className="border-l border-gray-300 pl-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {course.title}
                </h2>
                <Badge
                  className={
                    course.isPublished
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {course.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  {lectures.length} lectures
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.enrolledStudents?.length || 0} students
                </span>
              </div>
            </div>
          </div>
          <Button
            onClick={() => onCreateLecture(course._id)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Lecture
          </Button>
        </div>
      </div>

      {/* Search and Sort */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search lectures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={sortBy}
                onValueChange={(value: string) => setSortBy(value as "createdAt" | "title" | "duration" | "order")}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="createdAt">Created</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lectures List */}
      <Card>
        <CardContent className="p-0">
          {filteredLectures.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No lectures found
              </h3>
              <p className="mb-4">
                {searchTerm
                  ? "No lectures match your search criteria."
                  : "This course has no lectures yet."}
              </p>
              <Button onClick={() => onCreateLecture(course._id)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Lecture
              </Button>
            </div>
          ) : (
            <LectureTableList
              lectures={filteredLectures}
              onLectureEdit={(lecture) => onEditLecture(lecture)}
              onLectureDelete={(lecture) => onDeleteLecture(lecture)}
              onLecturePreview={(lecture) => {
                navigate(`/teacher/courses/${course._id}/lecture/preview/${lecture._id}`);
              }}
              onReorderLectures={(reorderedLectures) => onReorderLectures(reorderedLectures, course._id)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};



// Lecture Table List Component
interface LectureTableListProps {
  lectures: Lecture[];
  onLectureEdit: (lecture: Lecture) => void;
  onLectureDelete: (lecture: Lecture) => void;
  onLecturePreview: (lecture: Lecture) => void;
  onReorderLectures?: (reorderedLectures: Lecture[]) => void;
}

const LectureTableList: React.FC<LectureTableListProps> = ({
  lectures,
  onLectureEdit,
  onLectureDelete,
  onLecturePreview,
  onReorderLectures,
}) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDragEnd = (result: DropResult) => {
    // Check if drag was cancelled or dropped outside droppable area
    if (!result.destination || !onReorderLectures) {
      return;
    }

    // Check if item was dropped in the same position
    if (result.source.index === result.destination.index) {
      return;
    }

    try {
      const items = Array.from(lectures);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      // Update the order property for each lecture
      const reorderedLectures = items.map((lecture, index) => ({
        ...lecture,
        order: index + 1,
      }));

      onReorderLectures(reorderedLectures);
    } catch (error) {
      console.error("Error in handleDragEnd:", error);
      toast.error("Failed to reorder lectures");
    }
  };

  // Sort lectures by order before rendering
  const sortedLectures = [...lectures].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  return (
    <DragDropContext
      onDragEnd={handleDragEnd}
      onBeforeCapture={() => {
        // Prevent scroll container warnings by ensuring proper scroll detection
        // (No-op: removed redundant assignment)
      }}
    >
      <StrictModeDroppable droppableId="lectures">
        {(provided: DroppableProvided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
            data-rbd-scroll-container="true"
          >
            {sortedLectures.map((lecture, index) => (
              <Draggable
                key={lecture._id}
                draggableId={lecture._id}
                index={index}
                isDragDisabled={!onReorderLectures}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                      ...provided.draggableProps.style,
                    } as React.CSSProperties}
                    className={cn(
                      "group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white",
                      snapshot.isDragging &&
                        "shadow-lg rotate-2 bg-blue-50 border-blue-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left Section - Lecture Info */}
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Drag Handle */}
                        {onReorderLectures && (
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                          >
                            <div className="w-2 h-4 flex flex-col justify-center space-y-0.5">
                              <div className="w-full h-0.5 bg-gray-400 rounded"></div>
                              <div className="w-full h-0.5 bg-gray-400 rounded"></div>
                              <div className="w-full h-0.5 bg-gray-400 rounded"></div>
                            </div>
                          </div>
                        )}

                        {/* Order Number */}
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-600">
                            {lecture.order || index + 1}
                          </span>
                        </div>

                        {/* Lecture Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">
                              {lecture.lectureTitle}
                            </h3>
                            <span
                              className={cn(
                                "px-2 py-1 text-xs font-medium rounded-full border",
                                lecture.isPreviewFree
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-blue-100 text-blue-800 border-blue-200"
                              )}
                            >
                              {lecture.isPreviewFree ? "Preview" : "Premium"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDuration(lecture.duration)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(lecture.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {lecture.videoUrl
                                ? "Video"
                                : lecture.pdfUrl
                                ? "PDF"
                                : "No Content"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onLecturePreview(lecture)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onLectureEdit(lecture)}
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onLectureDelete(lecture)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </StrictModeDroppable>
    </DragDropContext>
  );
};

export default UnifiedCourseManagement;
