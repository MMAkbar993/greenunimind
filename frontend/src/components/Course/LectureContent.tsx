import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, User, Calendar, Tag } from "lucide-react";
import { toast } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";
import { formatTimeDisplay } from "@/utils/formatTime";
import { ILecture } from "@/types/course";
import UnifiedContentViewer from "./UnifiedContentViewer";

interface LectureContentProps {
  lecture: ILecture;
  isCompleted?: boolean;
  onMarkComplete?: () => void;
  enableDownload?: boolean;
  showMetadata?: boolean;
  onDownload?: (url: string, filename: string) => void;
}

const LectureContent = ({
  lecture,
  isCompleted = false,
  onMarkComplete,
  enableDownload = true,
  showMetadata = true,
  onDownload,
}: LectureContentProps) => {


  const handleMarkComplete = () => {
    if (onMarkComplete) {
      try {
        // Show toast before calling the function
        toast.loading("Marking lecture as complete", {
          description: "Your progress is being updated...",
        });

        // Call the onMarkComplete function
        onMarkComplete();
      } catch (error) {
        console.error("Error in LectureContent handleMarkComplete:", error);
        toast.error("Error", {
          description: "Failed to mark lecture as complete",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Lecture Header */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{lecture.lectureTitle}</h1>

            {/* Lecture badges */}
            <div className="flex items-center gap-2 mb-3">
              {lecture.isPreviewFree && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Preview Lecture
                </Badge>
              )}

              {lecture.duration && showMetadata && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeDisplay(lecture.duration)}
                </Badge>
              )}

              {isCompleted && (
                <Badge variant="outline" className="border-green-500 text-green-600 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Completed
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant={isCompleted ? "outline" : "default"}
            size="sm"
            onClick={handleMarkComplete}
            disabled={isCompleted}
            className={isCompleted ? "border-green-500 text-green-600" : ""}
          >
            <CheckCircle
              className={`h-4 w-4 mr-1 ${isCompleted ? "text-green-500" : ""}`}
            />
            {isCompleted ? "Completed" : "Mark as Complete"}
          </Button>
        </div>

        {/* Lecture description */}
        {lecture.instruction && (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600 leading-relaxed">
              {lecture.instruction}
            </p>
          </div>
        )}
      </Card>

      {/* Unified Content Viewer */}
      <UnifiedContentViewer
        lecture={lecture}
        enableDownload={enableDownload}
        onDownload={onDownload}
      />
    </div>
  );
};

export default LectureContent;
