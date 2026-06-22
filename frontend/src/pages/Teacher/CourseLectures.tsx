import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Video,
  Clock,
  Eye,
  Edit,
  File,
  GripVertical,
  AlertTriangle,
  RefreshCcw,
  Info,
  MoveVertical
} from "lucide-react";
import QuickLectureActions from "@/components/Lecture/QuickLectureActions";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/utils/formatDuration";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
  DraggableProvidedDragHandleProps
} from "react-beautiful-dnd";
import {
  useGetLectureByCourseIdQuery,
  useUpdateLectureOrderMutation,
} from "@/redux/features/lecture/lectureApi";
import { toast } from "sonner";
import { useAppSelector } from "@/redux/hooks";


import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMediaQuery } from "@/hooks/use-media-query.ts";

interface Lecture {
  _id: string;
  lectureTitle: string;
  duration?: number;
  views?: number;
  pdfUrl?: string;
  isPreviewFree?: boolean;
  order: number;
  videoUrl?: string;
}

interface LectureOrderItem {
  lectureId: string;
  order: number;
}

// This needs to be outside the component to ensure it's only called once
// Fix for react-beautiful-dnd on mobile devices
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const CourseLectures: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams<{ courseId: string }>();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTouch = useRef(isTouchDevice()).current;

  // Check if this is a newly created course
  const { showLecturePrompt, justCreated } = location.state || {};
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false);



  const { data, isLoading, isError, error, refetch } = useGetLectureByCourseIdQuery(
    { id: courseId! },
    {
      skip: !courseId,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false, // Disable aggressive refetching
      refetchOnReconnect: true,
      // Remove polling - rely on cache invalidation instead
    }
  );





  const [updateOrder, { isLoading: isUpdating }] = useUpdateLectureOrderMutation();

  // Local state for UI reordering
  const [orderedLectures, setOrderedLectures] = useState<Lecture[]>([]);




  const [isDragging, setIsDragging] = useState(false);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [pendingOrderUpdate, setPendingOrderUpdate] = useState<LectureOrderItem[] | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);

  // Get user role from auth
  const authState = useAppSelector((state) => state.auth);
  const { role } = authState.user || { role: "" };
  const isTeacher = role === "teacher";
  


  // When data arrives, initialize local state
  useEffect(() => {
    if (data?.data && Array.isArray(data.data)) {
      // Sort by order just in case
      const sorted = [...data.data].sort((a, b) => a.order - b.order);
      setOrderedLectures(sorted);

      // Show welcome prompt for newly created courses with no lectures
      if (justCreated && sorted.length === 0) {
        setShowWelcomePrompt(true);
      }
    }
  }, [data?.data, justCreated]);

  // Show welcome prompt effect
  useEffect(() => {
    if (showLecturePrompt && orderedLectures.length === 0) {
      setShowWelcomePrompt(true);
    }
  }, [showLecturePrompt, orderedLectures.length]);

  // Redirect if not a teacher
  useEffect(() => {
    if (role && role !== "teacher") {
      toast.error("You don't have permission to access this page");
      navigate("/dashboard");
    }
  }, [role, navigate]);

  // Fix for react-beautiful-dnd on mobile
  useEffect(() => {
    // This is a workaround for a known issue with react-beautiful-dnd on mobile devices
    // https://github.com/atlassian/react-beautiful-dnd/issues/1797
    if (isTouch) {
      const originalStyles = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = isDragging ? 'hidden' : originalStyles;

      // Add a class to prevent scrolling on the entire page while dragging
      if (isDragging) {
        document.body.classList.add('touch-none');
      } else {
        document.body.classList.remove('touch-none');
      }

      return () => {
        document.body.style.overflow = originalStyles;
        document.body.classList.remove('touch-none');
      };
    }
  }, [isDragging, isTouch]);

  const handleDragStart = (start: { draggableId: string }) => {
    setIsDragging(true);
    // Set the selected lecture for visual feedback
    setSelectedLecture(start.draggableId);

    // On mobile, show a toast to indicate drag has started
    if (isMobile) {
      toast.info("Drag to reorder lecture", {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    setSelectedLecture(null);

    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const items = Array.from(orderedLectures);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    // Recalculate order
    const updated = items.map((lec, idx) => ({
      ...lec,
      order: idx + 1,
    }));

    // Update UI immediately
    setOrderedLectures(updated);

    // Prepare data for API
    const orderData = updated.map((lec) => ({
      lectureId: lec._id,
      order: lec.order,
    }));

    if (isMobile) {
      // On mobile, show confirmation dialog
      setPendingOrderUpdate(orderData);
      setShowOrderConfirm(true);
    } else {
      // On desktop, update immediately
      await updateLectureOrder(orderData);
    }
  };

  const updateLectureOrder = async (orderData: LectureOrderItem[]) => {
    try {
      await updateOrder({
        id: courseId!,
        data: {
          lectures: orderData,
        },
      }).unwrap();
      toast.success("Lecture order updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order, reverting changes");
      refetch();
    } finally {
      setPendingOrderUpdate(null);
      setShowOrderConfirm(false);
    }
  };

  const confirmOrderUpdate = () => {
    if (pendingOrderUpdate) {
      updateLectureOrder(pendingOrderUpdate);
    }
  };

  const cancelOrderUpdate = () => {
    // Revert to original order
    refetch();
    setPendingOrderUpdate(null);
    setShowOrderConfirm(false);
  };

  // Render helper for lecture items
  const renderLectureItem = (lecture: Lecture, index: number, dragHandleProps: DraggableProvidedDragHandleProps | null = null) => (
    <div className={`flex items-center justify-between flex-wrap gap-2 py-4 px-2 md:px-4 border-b last:border-b-0 ${selectedLecture === lecture._id ? 'bg-blue-50' : ''}`}>
      <div className="flex items-center flex-1 min-w-0">
        {isTeacher && (
          <>
            {/* Desktop drag handle */}
            <div
              {...dragHandleProps}
              className="mr-2 cursor-grab active:cursor-grabbing touch-none hidden md:flex"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Mobile drag indicator */}
            {isMobile && (
              <div className="mr-2 flex md:hidden">
                <MoveVertical className="h-5 w-5 text-gray-400" />
              </div>
            )}
          </>
        )}
        <div className="h-10 w-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mr-3 flex-shrink-0">
          <Video className="h-5 w-5 text-[#4483e7]" />
        </div>
        <div className="min-w-0">
          <h3 className="font-medium truncate">
            {index + 1}. {lecture.lectureTitle}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
              {lecture.duration != null
                ? formatDuration(lecture.duration)
                : "N/A"}
            </span>
            <span className="flex items-center">
              <Eye className="h-3 w-3 mr-1 flex-shrink-0" />
              {lecture.views ?? 0} views
            </span>
            {lecture.pdfUrl && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded flex-shrink-0">
                PDF
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-auto">
        {lecture.isPreviewFree && (
          <Badge
            variant="outline"
            className="border-green-200 text-green-700 bg-green-50"
          >
            Preview
          </Badge>
        )}
        {isTeacher && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to={`/teacher/courses/${courseId}/lecture/edit/${lecture._id}`}
                  className="inline-flex"
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Lecture</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  if (!courseId) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>Invalid course ID. Please go back and try again.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/teacher/courses')}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get course data for breadcrumb
  const courseTitle = data?.data?.[0]?.courseId ? 'Course Lectures' : 'Course Lectures';

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Courses', href: '/teacher/courses' },
    { label: courseTitle, current: true },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">


      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center mb-2">
            {isLoading ? (
              <Skeleton className="h-8 w-48 md:h-10 md:w-64 rounded-md" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
                Course Lectures
              </h1>
            )}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-24 rounded-md" />
            ) : (
              <>
                <span>
                  {(() => {
                    const lectureCount = orderedLectures.length > 0 ? orderedLectures.length : (data?.data?.length || 0);
                    return `${lectureCount} ${lectureCount === 1 ? "Lecture" : "Lectures"}`;
                  })()}
                </span>
                {isDragging && (
                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                    Reordering...
                  </Badge>
                )}
                {isUpdating && (
                  <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                    Saving order...
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
        {isTeacher && (
          isLoading ? (
            <Skeleton className="h-10 w-32 md:w-40 rounded-md self-start md:self-center" />
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/teacher/courses`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Courses</span>
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  toast.loading('Refreshing lectures...');
                  try {
                    await refetch();
                    toast.success('Lectures refreshed successfully!');
                  } catch (error) {
                    toast.error('Failed to refresh lectures');
                  }
                }}
                className="flex items-center gap-2"
                disabled={isUpdating}
              >
                <RefreshCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button
                onClick={() => navigate(`/teacher/courses/${courseId}/lecture/create`)}
                className="flex items-center gap-2 whitespace-nowrap bg-brand-primary hover:bg-brand-primary-dark text-white"
                disabled={isUpdating}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add New Lecture</span>
                <span className="sm:hidden">Add Lecture</span>
              </Button>
            </div>
          )
        )}
      </div>

      {/* Main content */}
      <Card>
        <CardHeader className="pb-3">
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-40 rounded-md mb-2" />
              <Skeleton className="h-4 w-64 rounded-md" />
            </>
          ) : (
            <>
              <CardTitle>Course Lectures</CardTitle>
              {isTeacher && (orderedLectures.length > 1 || (data?.data?.length || 0) > 1) && (
                <CardDescription>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="hidden md:inline">Drag and drop to reorder lectures</span>
                    <span className="md:hidden">Tap, hold, and drag to reorder</span>
                  </div>
                </CardDescription>
              )}
            </>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between flex-wrap gap-2 py-4 px-2 md:px-4 border-b last:border-b-0 animate-pulse">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="hidden md:block mr-2 h-5 w-5 bg-gray-200 rounded-md"></div>
                    <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-5 w-full max-w-[250px] md:max-w-[350px] rounded-md mb-2" />
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Skeleton className="h-3 w-16 rounded-md" />
                        <Skeleton className="h-3 w-14 rounded-md" />
                        {i % 2 === 0 && <Skeleton className="h-3 w-8 rounded-md" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-auto">
                    {i % 3 === 0 && <Skeleton className="h-5 w-16 rounded-full" />}
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-8 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Failed to load lectures</h3>
              <p className="mt-1 text-muted-foreground mb-4">
                There was an error loading the lecture data
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : (orderedLectures.length > 0 || (data?.data && Array.isArray(data.data) && data.data.length > 0)) ? (
            <DragDropContext
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              enableDefaultSensors={true}
            >
              <Droppable droppableId="lectures">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="rounded-md overflow-hidden"
                  >
                    {(orderedLectures.length > 0 ? orderedLectures : (data?.data || [])).map((lecture, index) => (
                      <Draggable
                        key={lecture._id}
                        draggableId={lecture._id}
                        index={index}
                        isDragDisabled={!isTeacher}
                      >
                        {(prov: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            style={{
                              ...prov.draggableProps.style,
                              boxShadow: snapshot.isDragging ? '0 5px 15px rgba(0, 0, 0, 0.1)' : 'none',
                            }}
                            className={`${
                              snapshot.isDragging
                                ? "bg-blue-50 z-10 opacity-90"
                                : "bg-white"
                            } rounded-md transition touch-manipulation`}
                          >
                            {renderLectureItem(lecture, index, prov.dragHandleProps)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No lectures yet</h3>
              <p className="mt-1 text-muted-foreground">
                Start adding lectures to your course
              </p>
              {isTeacher && (
                <Button
                  onClick={() => navigate(`/teacher/courses/${courseId}/lecture/create`)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Lecture
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome prompt for newly created courses */}
      <AlertDialog open={showWelcomePrompt} onOpenChange={setShowWelcomePrompt}>
        <AlertDialogContent className="max-w-[90%] w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              🎉 Course Created Successfully!
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Great! Your course has been created. Now it's time to add some engaging lectures
                to help your students learn effectively.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  💡 Pro Tip: Start with an introduction lecture to welcome your students!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => setShowWelcomePrompt(false)}
              className="mt-0"
            >
              I'll add lectures later
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowWelcomePrompt(false);
                navigate(`/teacher/courses/${courseId}/lecture/create`);
              }}
              className="sm:mt-0 bg-brand-primary hover:bg-brand-primary-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Lecture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation dialog for mobile reordering */}
      <AlertDialog open={showOrderConfirm} onOpenChange={setShowOrderConfirm}>
        <AlertDialogContent className="max-w-[90%] w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Save new lecture order?</AlertDialogTitle>
            <AlertDialogDescription>
              You've changed the order of your lectures. Would you like to save these changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={cancelOrderUpdate} className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOrderUpdate} className="sm:mt-0">Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseLectures;