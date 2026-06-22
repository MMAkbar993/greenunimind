import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Medal, Home, BookOpen, Award } from "lucide-react";
import "./styles.css";

interface CourseCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  percentage: number;
}

const CourseCompletionModal = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  percentage,
}: CourseCompletionModalProps) => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    onOpenChange(false);
    navigate("/student/dashboard");
  };

  const handleViewCourse = () => {
    onOpenChange(false);
    navigate(`/student/course/${courseId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        {/* Animated background with particles */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 z-0 overflow-hidden">
          {/* Animated particles */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-float-slow"></div>
          <div className="absolute top-40 right-10 w-16 h-16 bg-emerald-200 rounded-full opacity-30 animate-float-slow-reverse"></div>
          <div className="absolute bottom-20 left-20 w-12 h-12 bg-teal-200 rounded-full opacity-20 animate-float-medium"></div>
          <div className="absolute top-20 right-20 w-10 h-10 bg-green-300 rounded-full opacity-20 animate-float-fast"></div>
          <div className="absolute bottom-10 right-10 w-14 h-14 bg-emerald-300 rounded-full opacity-20 animate-float-medium-reverse"></div>

          {/* Top gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-green-100/70 to-transparent"></div>
        </div>

        <DialogHeader className="text-center relative z-10 pt-10 px-6">
          {/* Trophy icon with glow effect */}
          <div className="relative mx-auto mb-8">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 shadow-lg animate-bounce-slow">
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 opacity-50"></div>
              <Medal className="h-14 w-14 text-white drop-shadow-md" />
            </div>
          </div>

          <DialogTitle className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            Congratulations!
          </DialogTitle>

          <DialogDescription className="text-center pt-3 text-base sm:text-lg text-gray-700">
            You've successfully completed{" "}
            <span className="font-semibold">{courseTitle}</span>!

            {percentage >= 100 ? (
              <div className="mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm py-2.5 px-5 rounded-full mx-auto w-fit border border-green-200/50 shadow-sm">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full blur-md opacity-30"></div>
                  <Award className="h-6 w-6 text-green-600 relative z-10" />
                </div>
                <span className="font-medium text-green-700">100% Complete</span>
              </div>
            ) : (
              <div className="mt-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm py-2.5 px-5 rounded-full mx-auto w-fit border border-amber-200/50 shadow-sm">
                <span className="font-medium text-amber-700">
                  {Math.min(100, Math.max(0, percentage))}% Complete
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm p-6 mx-6 my-8 rounded-xl border border-green-100/80 shadow-inner relative z-10">
          <p className="text-center text-base text-gray-700 leading-relaxed">
            Your progress has been saved and you can now access your certificate
            from your dashboard. Continue your learning journey with more
            courses!
          </p>

          {/* Achievement badge */}
          <div className="flex items-center justify-center mt-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-full py-1.5 px-4 border border-green-100 shadow-sm">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-700">Achievement Unlocked</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-4 p-6 pt-0 relative z-10">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 transition-all duration-300 rounded-xl shadow-sm hover:shadow"
            onClick={handleViewCourse}
          >
            <BookOpen className="h-4 w-4" />
            View Course
          </Button>
          <Button
            className="flex-1 gap-2 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white transition-all duration-300 rounded-xl shadow-md hover:shadow-lg"
            onClick={handleGoToDashboard}
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCompletionModal;
