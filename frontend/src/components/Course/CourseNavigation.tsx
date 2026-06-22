import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICourse, ILecture } from "@/types/course";
import { formatDuration } from "@/utils/formatDuration";

type CompletedLectureType =
  | string[]
  | { lectureId: string; isCompleted: boolean }[];

interface CourseNavigationProps {
  course: ICourse;
  currentLectureId: string;
  completedLectures: CompletedLectureType;
}

const CourseNavigation = ({
  course,
  currentLectureId,
  completedLectures = [],
}: CourseNavigationProps) => {
  const completedLectureIds =
    Array.isArray(completedLectures) &&
    completedLectures.length > 0 &&
    typeof completedLectures[0] === "object"
      ? (completedLectures as { lectureId: string; isCompleted: boolean }[])
          .filter((lp) => lp.isCompleted)
          .map((lp) => lp.lectureId)
      : completedLectures;
  const { courseId } = useParams<{ courseId: string }>();
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => setExpanded(!expanded);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Course Content</h2>
        <Button variant="ghost" size="sm" onClick={toggleExpanded}>
          {expanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {course.lectures &&
            course.lectures.map((lecture: ILecture, index: number) => {
              const isActive = lecture._id === currentLectureId;
              const isCompleted =
                Array.isArray(completedLectureIds) &&
                (typeof completedLectureIds[0] === "string"
                  ? completedLectureIds.includes(lecture._id as any)
                  : completedLectureIds.some((item) => item === lecture._id));

              // First lecture is always accessible
              // Other lectures are accessible if the previous one is completed
              const canAccess =
                index === 0 ||
                lecture.isPreviewFree ||
                (index > 0 &&
                  (typeof completedLectureIds[0] === "string"
                    ? completedLectureIds.includes(course.lectures[index - 1]._id as any)
                    : completedLectureIds.some(
                        (item) =>
                          item.lectureId === course.lectures[index - 1]._id &&
                          item.isCompleted
                      )));

              return (
                <Link
                  key={lecture._id}
                  to={
                    canAccess
                      ? `/student/course/${courseId}/lecture/${lecture._id}`
                      : "#"
                  }
                  className={cn(
                    "block p-3 rounded-md transition-colors",
                    isActive
                      ? "bg-muted border-l-4 border-edu-purple"
                      : "hover:bg-gray-50",
                    !canAccess && "opacity-60 cursor-not-allowed"
                  )}
                  onClick={(e) => !canAccess && e.preventDefault()}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : canAccess ? (
                        <PlayCircle className="h-5 w-5 text-edu-purple" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {lecture.lectureTitle}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {lecture.duration
                            ? formatDuration(lecture.duration)
                            : "10m"}
                        </span>
                      </div>

                      {lecture.isPreviewFree && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default CourseNavigation;
